import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200">
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-zinc-900">
              How Color Removal & Redaction Recovery Works
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-zinc-700 text-sm leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs uppercase tracking-wider text-amber-800 mb-1">
                The Reality of Flattened Digital Images
              </div>
              <p className="text-xs text-amber-900 leading-normal">
                When someone draws over text in a messaging app (like WhatsApp) with a <strong>100% opaque brush</strong> and sends the screenshot, the image is saved as a single flat layer. The underlying pixels were overwritten and permanently deleted before sending.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-900 text-xs uppercase tracking-wider">
              When Can Text Be Recovered?
            </h3>
            <div className="grid gap-2.5">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-zinc-900 block mb-0.5">1. Semi-Transparent / Highlighter Brush</strong>
                  If the sender used a highlighter tool instead of an opaque marker, pixel luminance from the text is blended with the ink. Adjusting contrast and exposure can pull out the text.
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex gap-3">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-zinc-900 block mb-0.5">2. Color Channel Isolation (Red / Blue)</strong>
                  Pure green ink contains almost zero Red (R=0) or Blue (B=0) light. White text contains full RGB (255, 255, 255). By switching to the <strong>Red Channel</strong> or <strong>Blue Channel</strong>, the green ink drops out and leaves text outlines visible if any blending occurred.
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-zinc-900 block mb-0.5">3. Feathered & Anti-Aliased Edges</strong>
                  Letter ascenders, descenders, and URL symbols (like <code className="text-zinc-800 bg-zinc-200 px-1 rounded">h...</code> or <code className="text-zinc-800 bg-zinc-200 px-1 rounded">.c...</code>) often escape the scribble edges.
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-900 text-zinc-300 rounded-xl space-y-2 text-xs">
            <div className="font-semibold text-white">Recommended Forensic Workflow:</div>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>Click <strong>Sample Color from Image</strong> and click the green marker.</li>
              <li>Set Action Mode to <strong>Erase to Alpha</strong> or <strong>Replace with Fill</strong>.</li>
              <li>In the <strong>Channel Isolator</strong>, click <strong>Red Channel</strong> or <strong>Blue Channel</strong>.</li>
              <li>Turn on <strong>High-Contrast Binarization</strong> or increase <strong>Contrast Boost</strong>.</li>
            </ol>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            Got it, let's inspect
          </button>
        </div>
      </div>
    </div>
  );
};
