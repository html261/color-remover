import React from 'react';
import { Pipette, Eye, Sliders, Layers, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ColorFilterSettings, ChannelMode, RemovalTargetMode } from '../types';
import { rgbToHex, hexToRgb } from '../utils/imageProcessing';

interface SidebarControlsProps {
  settings: ColorFilterSettings;
  onChange: (newSettings: ColorFilterSettings) => void;
  isPickingColor: boolean;
  onTogglePickColor: () => void;
  onResetSettings: () => void;
}

const PRESET_COLORS = [
  { name: 'WhatsApp Green', hex: '#00E676' },
  { name: 'Vibrant Lime', hex: '#00FF44' },
  { name: 'Fluorescent Yellow', hex: '#FFFF00' },
  { name: 'Red Marker', hex: '#FF2A2A' },
  { name: 'Chat Background', hex: '#1f2c34' },
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  settings,
  onChange,
  isPickingColor,
  onTogglePickColor,
  onResetSettings,
}) => {
  const update = (partial: Partial<ColorFilterSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const handleColorHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const rgb = hexToRgb(hex);
    update({
      targetColor: { ...rgb, hex },
    });
  };

  const setPresetColor = (hex: string) => {
    const rgb = hexToRgb(hex);
    update({
      targetColor: { ...rgb, hex },
      colorRemovalEnabled: true,
    });
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 border-r border-zinc-200 bg-zinc-50/50 flex flex-col h-full overflow-y-auto shrink-0 select-none text-zinc-900">
      <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-700" />
          <span className="text-sm font-semibold text-zinc-900">Adjustment Controls</span>
        </div>
        <button
          onClick={onResetSettings}
          className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer transition-colors"
          title="Reset adjustments"
        >
          <RefreshCw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* SECTION 1: TARGET COLOR SELECTION */}
        <section className="space-y-3 bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Pipette className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Target Color To Remove
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-zinc-500 font-medium">Enabled</span>
              <input
                id="enable-color-removal-checkbox"
                type="checkbox"
                checked={settings.colorRemovalEnabled}
                onChange={(e) => update({ colorRemovalEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border border-zinc-300 shadow-inner shrink-0 relative overflow-hidden"
              style={{ backgroundColor: settings.targetColor.hex }}
            >
              <input
                id="color-picker-input"
                type="color"
                value={settings.targetColor.hex}
                onChange={handleColorHexChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Choose custom color"
              />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-zinc-800">
                  {settings.targetColor.hex.toUpperCase()}
                </span>
                <span className="text-zinc-500 text-[11px]">
                  rgb({settings.targetColor.r}, {settings.targetColor.g}, {settings.targetColor.b})
                </span>
              </div>

              <button
                id="eyedropper-tool-button"
                onClick={onTogglePickColor}
                className={`w-full py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isPickingColor
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
                }`}
              >
                <Pipette className="w-3.5 h-3.5" />
                <span>{isPickingColor ? 'Click image to sample color...' : 'Sample Color from Image'}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-[11px] font-medium text-zinc-500 mb-1.5">Common Scribble Presets</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => setPresetColor(preset.hex)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    settings.targetColor.hex.toLowerCase() === preset.hex.toLowerCase()
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Removal Mode */}
          <div className="pt-2 border-t border-zinc-100">
            <label className="text-[11px] font-medium text-zinc-500 mb-1.5 block">Action Mode</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'transparent', label: 'Erase to Alpha' },
                { id: 'fill', label: 'Replace with Fill' },
                { id: 'invert', label: 'Invert Color' },
                { id: 'isolate', label: 'Isolate Ink' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => update({ targetMode: m.id as RemovalTargetMode })}
                  className={`py-1.5 px-2 text-xs rounded border text-center transition-colors cursor-pointer ${
                    settings.targetMode === m.id
                      ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {settings.targetMode === 'fill' && (
              <div className="mt-2.5 flex items-center gap-2 bg-zinc-50 p-2 rounded border border-zinc-200">
                <span className="text-xs text-zinc-600">Fill Color:</span>
                <input
                  id="fill-color-input"
                  type="color"
                  value={settings.fillColor}
                  onChange={(e) => update({ fillColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-300 cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-700">{settings.fillColor}</span>
              </div>
            )}
          </div>

          {/* Tolerance & Feather */}
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-zinc-700">Tolerance Range</span>
                <span className="font-mono text-zinc-500">{settings.tolerance}%</span>
              </div>
              <input
                id="tolerance-slider"
                type="range"
                min="1"
                max="90"
                value={settings.tolerance}
                onChange={(e) => update({ tolerance: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Exact Match</span>
                <span>Broader Shades</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-zinc-700">Edge Feathering</span>
                <span className="font-mono text-zinc-500">{settings.feather}px</span>
              </div>
              <input
                id="feather-slider"
                type="range"
                min="0"
                max="30"
                value={settings.feather}
                onChange={(e) => update({ feather: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Sharp Edge</span>
                <span>Soft Blend</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: FORENSIC CHANNEL SEPARATION */}
        <section className="space-y-3 bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Forensic Channel Isolator
            </label>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            In digital images, green highlighter has very little Red or Blue component. Isolating the
            <strong className="text-zinc-800"> Red</strong> or <strong className="text-zinc-800">Blue</strong> channel
            frequently reveals white text underneath transparent or feathered ink!
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'all', label: 'Full RGB' },
              { id: 'red', label: 'Red Channel' },
              { id: 'blue', label: 'Blue Channel' },
              { id: 'green', label: 'Green Channel' },
              { id: 'grayscale', label: 'Luminance' },
              { id: 'hue', label: 'Hue Map' },
            ].map((ch) => (
              <button
                key={ch.id}
                onClick={() => update({ channel: ch.id as ChannelMode })}
                className={`py-1.5 px-1.5 text-xs rounded border text-center transition-colors cursor-pointer font-medium ${
                  settings.channel === ch.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 3: EXPOSURE & CONTRAST RECOVERY */}
        <section className="space-y-3 bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Text Contrast & Exposure
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-zinc-700">Exposure / Brightness</span>
                <span className="font-mono text-zinc-500">{settings.brightness}</span>
              </div>
              <input
                id="brightness-slider"
                type="range"
                min="-100"
                max="100"
                value={settings.brightness}
                onChange={(e) => update({ brightness: Number(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-zinc-700">Contrast Boost</span>
                <span className="font-mono text-zinc-500">{settings.contrast}</span>
              </div>
              <input
                id="contrast-slider"
                type="range"
                min="-100"
                max="100"
                value={settings.contrast}
                onChange={(e) => update({ contrast: Number(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700">Invert Palette</span>
              <button
                id="toggle-invert-button"
                onClick={() => update({ invert: !settings.invert })}
                className={`px-3 py-1 text-xs rounded border font-medium cursor-pointer transition-colors ${
                  settings.invert
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                }`}
              >
                {settings.invert ? 'Inverted' : 'Standard'}
              </button>
            </div>

            {/* Thresholding */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700">High-Contrast Binarization</label>
                <input
                  id="toggle-threshold-checkbox"
                  type="checkbox"
                  checked={settings.thresholdEnabled}
                  onChange={(e) => update({ thresholdEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300 cursor-pointer"
                />
              </div>

              {settings.thresholdEnabled && (
                <div>
                  <div className="flex justify-between text-xs mb-1 text-zinc-500">
                    <span>Threshold Cutoff</span>
                    <span className="font-mono">{settings.threshold}</span>
                  </div>
                  <input
                    id="threshold-slider"
                    type="range"
                    min="10"
                    max="245"
                    value={settings.threshold}
                    onChange={(e) => update({ threshold: Number(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Edge detection */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-700 block">Sobel Edge Outlines</span>
                <span className="text-[10px] text-zinc-400">Detects font strokes</span>
              </div>
              <button
                id="toggle-edge-detect-button"
                onClick={() => update({ edgeDetect: !settings.edgeDetect })}
                className={`px-3 py-1 text-xs rounded border font-medium cursor-pointer transition-colors ${
                  settings.edgeDetect
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                }`}
              >
                {settings.edgeDetect ? 'Edges Active' : 'Off'}
              </button>
            </div>
          </div>
        </section>

        {/* Notice on Flattened Images */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-900 text-xs flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Redaction Note</span>
            <p className="text-[11px] text-amber-800 leading-normal">
              If an image was drawn over with an opaque 100% solid brush, the original pixel values were completely overwritten and discarded. Use the Channel and Contrast controls to test if any edge gradients or transparency were preserved.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
