import { ColorFilterSettings } from '../types';

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Perceptual color distance (0 to 100)
export function calculateColorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weighted Euclidean distance (human eye is most sensitive to green)
  const dist = Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
  return (dist / 255) * 100;
}

export function applyImageFilters(
  ctx: CanvasRenderingContext2D,
  sourceImageData: ImageData,
  settings: ColorFilterSettings
): void {
  const width = sourceImageData.width;
  const height = sourceImageData.height;
  const output = ctx.createImageData(width, height);
  const src = sourceImageData.data;
  const dst = output.data;

  const targetR = settings.targetColor.r;
  const targetG = settings.targetColor.g;
  const targetB = settings.targetColor.b;
  const fillRgb = hexToRgb(settings.fillColor);

  const tolerance = settings.tolerance;
  const feather = Math.max(1, settings.feather);

  // Pre-calculate contrast factor
  const contrastFactor = settings.contrast !== 0
    ? (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
    : 1;

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];
    let a = src[i + 3];

    // 1. Color Removal / Keying
    if (settings.colorRemovalEnabled && a > 0) {
      const dist = calculateColorDistance(r, g, b, targetR, targetG, targetB);

      if (dist < tolerance + feather) {
        let matchWeight = 1.0;
        if (dist > tolerance) {
          // Feather region
          matchWeight = 1.0 - (dist - tolerance) / feather;
        }

        switch (settings.targetMode) {
          case 'transparent':
            a = Math.round(a * (1.0 - matchWeight));
            break;
          case 'fill':
            r = Math.round(r * (1 - matchWeight) + fillRgb.r * matchWeight);
            g = Math.round(g * (1 - matchWeight) + fillRgb.g * matchWeight);
            b = Math.round(b * (1 - matchWeight) + fillRgb.b * matchWeight);
            break;
          case 'invert':
            r = Math.round(r * (1 - matchWeight) + (255 - r) * matchWeight);
            g = Math.round(g * (1 - matchWeight) + (255 - g) * matchWeight);
            b = Math.round(b * (1 - matchWeight) + (255 - b) * matchWeight);
            break;
          case 'isolate':
            // In isolate mode, non-matching colors fade to grayscale or transparent
            break;
        }
      } else if (settings.targetMode === 'isolate') {
        // Not matching target: fade out or desaturate
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray;
        g = gray;
        b = gray;
        a = Math.round(a * 0.2);
      }
    }

    // 2. Channel Isolation
    if (settings.channel !== 'all') {
      switch (settings.channel) {
        case 'red':
          g = r;
          b = r;
          break;
        case 'green':
          r = g;
          b = g;
          break;
        case 'blue':
          r = b;
          g = b;
          break;
        case 'grayscale': {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray;
          g = gray;
          b = gray;
          break;
        }
        case 'hue': {
          // Hue isolation / visualization
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h = 0;
          if (max !== min) {
            const d = max - min;
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
          }
          const val = Math.round(h * 255);
          r = val;
          g = val;
          b = val;
          break;
        }
      }
    }

    // 3. Brightness
    if (settings.brightness !== 0) {
      r += settings.brightness * 2.55;
      g += settings.brightness * 2.55;
      b += settings.brightness * 2.55;
    }

    // 4. Contrast
    if (settings.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 5. Inversion
    if (settings.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    // 6. Thresholding / High-Contrast Binarization
    if (settings.thresholdEnabled) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const bin = lum >= settings.threshold ? 255 : 0;
      r = bin;
      g = bin;
      b = bin;
    }

    dst[i] = Math.max(0, Math.min(255, Math.round(r)));
    dst[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    dst[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    dst[i + 3] = Math.max(0, Math.min(255, Math.round(a)));
  }

  // 7. Edge enhancement / Sobel filter (if requested)
  if (settings.edgeDetect) {
    applyEdgeFilter(dst, width, height);
  }

  ctx.putImageData(output, 0, 0);
}

function applyEdgeFilter(pixels: Uint8ClampedArray, width: number, height: number) {
  const copy = new Uint8ClampedArray(pixels);
  const grayscale = new Float32Array(width * height);

  for (let i = 0; i < pixels.length; i += 4) {
    grayscale[i / 4] = 0.299 * copy[i] + 0.587 * copy[i + 1] + 0.114 * copy[i + 2];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Sobel horizontal & vertical
      const gx =
        -1 * grayscale[idx - width - 1] +
        1 * grayscale[idx - width + 1] +
        -2 * grayscale[idx - 1] +
        2 * grayscale[idx + 1] +
        -1 * grayscale[idx + width - 1] +
        1 * grayscale[idx + width + 1];

      const gy =
        -1 * grayscale[idx - width - 1] +
        -2 * grayscale[idx - width] +
        -1 * grayscale[idx - width + 1] +
        1 * grayscale[idx + width - 1] +
        2 * grayscale[idx + width] +
        1 * grayscale[idx + width + 1];

      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const pIdx = idx * 4;
      pixels[pIdx] = mag;
      pixels[pIdx + 1] = mag;
      pixels[pIdx + 2] = mag;
    }
  }
}

/**
 * Creates a sample test image that simulates a WhatsApp message with green markup
 */
export function createDefaultSampleImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark background like WhatsApp dark theme
  ctx.fillStyle = '#0b141a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header bar
  ctx.fillStyle = '#1f2c34';
  ctx.fillRect(0, 0, canvas.width, 70);

  // Avatar circle
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.arc(45, 35, 20, 0, Math.PI * 2);
  ctx.fill();

  // Contact name covered with green scribble
  ctx.fillStyle = '#e9edef';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Secret Contact', 80, 42);

  // Simulated green marker over contact
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(75, 38);
  ctx.lineTo(240, 38);
  ctx.stroke();

  // PhonePe receipt card
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(50, 100, 540, 240, 14);
  ctx.fill();

  // Receipt text
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('₹37.00', 270, 150);

  ctx.fillStyle = '#6b7280';
  ctx.font = '14px sans-serif';
  ctx.fillText('Paid to', 290, 180);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('THARUN S', 270, 210);

  ctx.fillStyle = '#4b5563';
  ctx.font = '14px sans-serif';
  ctx.fillText('PhonePe • 7483859663@ybl', 220, 235);
  ctx.fillText('19 August 2026, 9:06 am', 230, 260);

  // Chat bubble 1 (Done)
  ctx.fillStyle = '#1f2c34';
  ctx.beginPath();
  ctx.roundRect(30, 370, 160, 55, 10);
  ctx.fill();
  ctx.fillStyle = '#e9edef';
  ctx.font = '16px sans-serif';
  ctx.fillText('Done', 50, 403);
  ctx.fillStyle = '#8696a0';
  ctx.font = '11px sans-serif';
  ctx.fillText('9:06 AM', 130, 415);

  // Chat bubble 2 (Outgoing Ok)
  ctx.fillStyle = '#005c4b';
  ctx.beginPath();
  ctx.roundRect(430, 440, 180, 50, 10);
  ctx.fill();
  ctx.fillStyle = '#e9edef';
  ctx.font = '16px sans-serif';
  ctx.fillText('Ok', 450, 470);
  ctx.fillStyle = '#8696a0';
  ctx.font = '11px sans-serif';
  ctx.fillText('9:07 AM ✓✓', 530, 478);

  // Chat bubble 3 with links
  ctx.fillStyle = '#1f2c34';
  ctx.beginPath();
  ctx.roundRect(180, 510, 430, 240, 12);
  ctx.fill();

  ctx.fillStyle = '#e9edef';
  ctx.font = '16px sans-serif';
  ctx.fillText('Here is the link', 200, 540);
  ctx.fillText('1)', 200, 570);
  ctx.fillText('https://drive.google.com/folder/tracker-1', 200, 595);

  ctx.fillText('2)', 200, 645);
  ctx.fillText('https://docs.google.com/spreadsheets/d/x9', 200, 670);

  // Now draw realistic green marker scribbles over the links
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Scribble 1
  ctx.beginPath();
  ctx.moveTo(215, 590);
  ctx.lineTo(580, 590);
  ctx.lineTo(230, 608);
  ctx.lineTo(560, 608);
  ctx.stroke();

  // Scribble 2
  ctx.beginPath();
  ctx.moveTo(215, 665);
  ctx.lineTo(580, 665);
  ctx.lineTo(225, 682);
  ctx.lineTo(550, 682);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}
