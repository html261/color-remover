import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  MousePointer,
  Pipette,
  Search,
  Upload,
  Layers,
  Sparkles,
  RotateCw
} from 'lucide-react';
import { ColorFilterSettings } from '../types';
import { applyImageFilters, rgbToHex } from '../utils/imageProcessing';

interface CanvasViewerProps {
  imageSrc: string | null;
  settings: ColorFilterSettings;
  isPickingColor: boolean;
  onPickColor: (r: number, g: number, b: number, hex: string) => void;
  onLoadSample: () => void;
  onDropFiles: (files: FileList) => void;
  splitView: boolean;
  onToggleSplitView: () => void;
}

export const CanvasViewer: React.FC<CanvasViewerProps> = ({
  imageSrc,
  settings,
  isPickingColor,
  onPickColor,
  onLoadSample,
  onDropFiles,
  splitView,
  onToggleSplitView,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Loupe / Hover pixel info
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number; r: number; g: number; b: number; hex: string } | null>(null);
  const [showLoupe, setShowLoupe] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Load and cache original image data
  useEffect(() => {
    if (!imageSrc) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Create offscreen canvas for original pixels
      const origCanvas = document.createElement('canvas');
      origCanvas.width = img.naturalWidth;
      origCanvas.height = img.naturalHeight;
      const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
      if (!origCtx) return;

      origCtx.drawImage(img, 0, 0);
      originalCanvasRef.current = origCanvas;

      if (canvasRef.current) {
        canvasRef.current.width = img.naturalWidth;
        canvasRef.current.height = img.naturalHeight;
      }

      setImageLoaded(true);

      // Fit zoom nicely
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 80;
        const containerHeight = containerRef.current.clientHeight - 80;
        const scaleX = containerWidth / img.naturalWidth;
        const scaleY = containerHeight / img.naturalHeight;
        const initialScale = Math.min(1, Math.max(0.2, Math.min(scaleX, scaleY)));
        setZoom(initialScale);
        setPan({ x: 0, y: 0 });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Re-run image processing whenever settings change
  const renderProcessedCanvas = useCallback(() => {
    if (!imageLoaded || !originalCanvasRef.current || !canvasRef.current) return;

    const origCanvas = originalCanvasRef.current;
    const origCtx = origCanvas.getContext('2d');
    const targetCanvas = canvasRef.current;
    const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });

    if (!origCtx || !targetCtx) return;

    const width = origCanvas.width;
    const height = origCanvas.height;

    // Get original un-mutated pixels
    const sourceData = origCtx.getImageData(0, 0, width, height);

    // Apply color removal & forensic enhancements
    applyImageFilters(targetCtx, sourceData, settings);

    // If split view is enabled, draw the original on the left side
    if (splitView) {
      const splitPx = Math.round((width * splitPos) / 100);
      if (splitPx > 0) {
        // Draw slice of original
        targetCtx.drawImage(
          origCanvas,
          0, 0, splitPx, height,
          0, 0, splitPx, height
        );
        // Draw divider line
        targetCtx.save();
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 2;
        targetCtx.beginPath();
        targetCtx.moveTo(splitPx, 0);
        targetCtx.lineTo(splitPx, height);
        targetCtx.stroke();
        targetCtx.restore();
      }
    }
  }, [imageLoaded, settings, splitView, splitPos]);

  useEffect(() => {
    renderProcessedCanvas();
  }, [renderProcessedCanvas]);

  // Handle canvas click / eyedropper
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!originalCanvasRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const pixelX = Math.floor(clientX * scaleX);
    const pixelY = Math.floor(clientY * scaleY);

    if (
      pixelX >= 0 &&
      pixelX < originalCanvasRef.current.width &&
      pixelY >= 0 &&
      pixelY < originalCanvasRef.current.height
    ) {
      const origCtx = originalCanvasRef.current.getContext('2d');
      if (origCtx) {
        const pixel = origCtx.getImageData(pixelX, pixelY, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        onPickColor(pixel[0], pixel[1], pixel[2], hex);
      }
    }
  };

  // Handle mouse move for pixel sampler & loupe
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!originalCanvasRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const pixelX = Math.floor(clientX * scaleX);
    const pixelY = Math.floor(clientY * scaleY);

    if (
      pixelX >= 0 &&
      pixelX < originalCanvasRef.current.width &&
      pixelY >= 0 &&
      pixelY < originalCanvasRef.current.height
    ) {
      const origCtx = originalCanvasRef.current.getContext('2d');
      if (origCtx) {
        const pixel = origCtx.getImageData(pixelX, pixelY, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        setHoverPixel({
          x: pixelX,
          y: pixelY,
          r: pixel[0],
          g: pixel[1],
          b: pixel[2],
          hex,
        });
      }
    }
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPickingColor) return;
    if (e.button === 0 && !isDraggingSplit) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingSplit(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(6, Math.max(0.1, prev * zoomFactor)));
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  const fitToScreen = () => {
    if (!originalCanvasRef.current || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 80;
    const containerHeight = containerRef.current.clientHeight - 80;
    const scaleX = containerWidth / originalCanvasRef.current.width;
    const scaleY = containerHeight / originalCanvasRef.current.height;
    setZoom(Math.min(1, Math.max(0.2, Math.min(scaleX, scaleY))));
    setPan({ x: 0, y: 0 });
  };

  return (
    <main
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 relative overflow-hidden bg-zinc-950 select-none flex items-center justify-center ${
        isPickingColor ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Background checkerboard for transparency visualization */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #27272a 25%, transparent 25%),
            linear-gradient(-45deg, #27272a 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #27272a 75%),
            linear-gradient(-45deg, transparent 75%, #27272a 75%)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
        }}
      />

      {/* Main Canvas View */}
      {imageLoaded ? (
        <div
          className="relative transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="shadow-2xl rounded-sm ring-1 ring-white/10"
            style={{ imageRendering: zoom > 2 ? 'pixelated' : 'auto' }}
          />

          {/* Split Mode Labels */}
          {splitView && (
            <>
              <div
                className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider uppercase pointer-events-none border border-white/20"
              >
                Original Image
              </div>
              <div
                className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md text-emerald-300 px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider uppercase pointer-events-none border border-emerald-500/30"
              >
                Color Removed
              </div>
            </>
          )}
        </div>
      ) : (
        /* Empty State / Upload Prompt */
        <div className="text-center p-8 max-w-md border border-dashed border-zinc-700 bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-xl z-10">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
            <Upload className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1.5">
            Drop your screenshot here
          </h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Drag & drop any chat screenshot, photo, or image. You can also paste directly from your clipboard (<kbd className="px-1 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono border border-zinc-700">Ctrl+V</kbd>).
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => {
                const input = document.getElementById('file-upload-input');
                input?.click();
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Select File</span>
            </button>
            <button
              onClick={onLoadSample}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Load Sample Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* Drag Over Overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-sm border-4 border-dashed border-emerald-500 flex flex-col items-center justify-center z-50 pointer-events-none">
          <Upload className="w-12 h-12 text-emerald-300 animate-bounce mb-2" />
          <div className="text-lg font-semibold text-white">Drop image to inspect and remove color</div>
        </div>
      )}

      {/* Floating Canvas Control Toolbar */}
      {imageLoaded && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 z-20 text-zinc-300">
          <button
            onClick={() => setZoom((z) => Math.max(0.1, z / 1.25))}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-12 text-center text-zinc-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(6, z * 1.25))}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          <button
            onClick={fitToScreen}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Fit to view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-2 py-1 text-xs hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer font-medium"
            title="Reset 100%"
          >
            100%
          </button>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          <button
            id="toggle-split-view-button"
            onClick={onToggleSplitView}
            className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              splitView
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'hover:text-white hover:bg-zinc-800 text-zinc-300'
            }`}
            title="Compare Before and After split view"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>

          <button
            onClick={() => setShowLoupe(!showLoupe)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              showLoupe
                ? 'bg-zinc-800 text-emerald-400'
                : 'hover:text-white hover:bg-zinc-800 text-zinc-300'
            }`}
            title="Toggle Pixel Inspector Loupe"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Split Slider Controller Bar */}
      {imageLoaded && splitView && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 z-20">
          <span className="text-xs text-zinc-400 font-medium">Original</span>
          <input
            type="range"
            min="5"
            max="95"
            value={splitPos}
            onChange={(e) => setSplitPos(Number(e.target.value))}
            className="w-36 accent-emerald-500 cursor-pointer"
          />
          <span className="text-xs text-emerald-400 font-medium">Processed</span>
        </div>
      )}

      {/* Floating Pixel Inspector / Eyedropper Card */}
      {hoverPixel && (isPickingColor || showLoupe) && (
        <div className="absolute top-6 right-6 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 p-3 rounded-xl shadow-2xl z-30 text-white min-w-[200px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Pipette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pixel Inspector</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {hoverPixel.x}, {hoverPixel.y}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md border border-white/20 shadow-inner shrink-0"
              style={{ backgroundColor: hoverPixel.hex }}
            />
            <div className="text-xs space-y-0.5">
              <div className="font-mono font-bold text-emerald-400">{hoverPixel.hex.toUpperCase()}</div>
              <div className="text-[11px] text-zinc-400 font-mono">
                RGB({hoverPixel.r}, {hoverPixel.g}, {hoverPixel.b})
              </div>
            </div>
          </div>

          {isPickingColor && (
            <div className="mt-2.5 text-[11px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded text-center font-medium">
              Click anywhere to set target color
            </div>
          )}
        </div>
      )}

      {/* Eyedropper Active Banner */}
      {isPickingColor && (
        <div className="absolute top-6 left-6 bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium z-30 animate-pulse">
          <Pipette className="w-4 h-4" />
          <span>Sampling mode active — click on the green marker to select it</span>
        </div>
      )}
    </main>
  );
};
