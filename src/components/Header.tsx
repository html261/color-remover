import React from 'react';
import { Download, Copy, RotateCcw, Upload, HelpCircle, Check, Image as ImageIcon } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  onReset: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onShowInfo: () => void;
  copied: boolean;
  hasImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onUploadClick,
  onReset,
  onDownload,
  onCopy,
  onShowInfo,
  copied,
  hasImage,
}) => {
  return (
    <header className="h-16 border-b border-zinc-200 bg-white px-4 md:px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
          <ImageIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-zinc-900 leading-tight">
            Color Remover & Image Inspector
          </h1>
          <p className="text-xs text-zinc-500 hidden sm:block">
            Eliminate marker overlays, separate color channels, and inspect pixel data
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          id="upload-button"
          onClick={onUploadClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
          title="Upload or drop image (Ctrl+V supported)"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>

        <button
          id="reset-filters-button"
          onClick={onReset}
          disabled={!hasImage}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Reset all filters to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reset</span>
        </button>

        <div className="h-4 w-px bg-zinc-200 mx-1 hidden sm:block" />

        <button
          id="copy-image-button"
          onClick={onCopy}
          disabled={!hasImage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Copy processed image to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>

        <button
          id="download-image-button"
          onClick={onDownload}
          disabled={!hasImage}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Download PNG file"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        <button
          id="info-modal-button"
          onClick={onShowInfo}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer ml-1"
          title="How color removal and redaction recovery works"
          aria-label="Information"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
