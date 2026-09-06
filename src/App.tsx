import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SidebarControls } from './components/SidebarControls';
import { CanvasViewer } from './components/CanvasViewer';
import { EducationalModal } from './components/EducationalModal';
import { ColorFilterSettings } from './types';
import { createDefaultSampleImage } from './utils/imageProcessing';

const DEFAULT_SETTINGS: ColorFilterSettings = {
  // WhatsApp green highlighter color
  targetColor: { r: 0, g: 230, b: 118, hex: '#00E676' },
  colorRemovalEnabled: true,
  tolerance: 35,
  feather: 6,
  targetMode: 'transparent',
  fillColor: '#1f2c34', // Dark WhatsApp chat background

  // Forensic / Channel
  channel: 'all',
  brightness: 0,
  contrast: 0,
  threshold: 128,
  thresholdEnabled: false,
  invert: false,
  edgeDetect: false,
  sharpen: false,
};

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [settings, setSettings] = useState<ColorFilterSettings>(DEFAULT_SETTINGS);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with sample screenshot simulating WhatsApp chat with marker
  useEffect(() => {
    const sample = createDefaultSampleImage();
    if (sample) {
      setImageSrc(sample);
    }
  }, []);

  // Listen for clipboard paste (Ctrl+V / Cmd+V) to easily paste screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setImageSrc(event.target.result as string);
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDropFiles = (files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickColor = (r: number, g: number, b: number, hex: string) => {
    setSettings((prev) => ({
      ...prev,
      targetColor: { r, g, b, hex },
      colorRemovalEnabled: true,
    }));
    setIsPickingColor(false);
  };

  const handleResetFilters = () => {
    setSettings(DEFAULT_SETTINGS);
    setSplitView(false);
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'color-removed-inspection.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 font-sans antialiased">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="file-upload-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <Header
        onUploadClick={() => fileInputRef.current?.click()}
        onReset={handleResetFilters}
        onDownload={handleDownload}
        onCopy={handleCopy}
        onShowInfo={() => setShowInfoModal(true)}
        copied={copied}
        hasImage={!!imageSrc}
      />

      {/* Main Workspace: Left Controls + Center Canvas */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <SidebarControls
          settings={settings}
          onChange={setSettings}
          isPickingColor={isPickingColor}
          onTogglePickColor={() => setIsPickingColor(!isPickingColor)}
          onResetSettings={handleResetFilters}
        />

        <CanvasViewer
          imageSrc={imageSrc}
          settings={settings}
          isPickingColor={isPickingColor}
          onPickColor={handlePickColor}
          onLoadSample={() => {
            const sample = createDefaultSampleImage();
            setImageSrc(sample);
          }}
          onDropFiles={handleDropFiles}
          splitView={splitView}
          onToggleSplitView={() => setSplitView(!splitView)}
        />
      </div>

      {/* Educational & Technical Info Modal */}
      <EducationalModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
}
