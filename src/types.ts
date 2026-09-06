export type ChannelMode = 'all' | 'red' | 'green' | 'blue' | 'grayscale' | 'hue';

export type RemovalTargetMode = 'transparent' | 'fill' | 'isolate' | 'invert';

export interface ColorFilterSettings {
  // Target color removal
  targetColor: { r: number; g: number; b: number; hex: string };
  colorRemovalEnabled: boolean;
  tolerance: number; // 0 to 100
  feather: number; // 0 to 50
  targetMode: RemovalTargetMode;
  fillColor: string; // hex for replacement
  
  // Forensic / Exposure enhancements
  channel: ChannelMode;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  threshold: number; // 0 (off) to 255
  thresholdEnabled: boolean;
  invert: boolean;
  edgeDetect: boolean;
  sharpen: boolean;
}

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
}
