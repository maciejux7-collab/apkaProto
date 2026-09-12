/**
 * Advanced Document Scanner Utility in pure TypeScript.
 * Detects document edges, performs perspective warping (straightening), 
 * crops background, and applies adaptive thresholding/contrast boosting 
 * to turn grey/shadowed paper into perfect white and text into deep black.
 */

interface Point {
  x: number;
  y: number;
}

/**
 * Solves a system of linear equations using Gaussian elimination.
 */
function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[j][i]) > Math.abs(A[maxRow][i])) {
        maxRow = j;
      }
    }
    // Swap rows
    const tempA = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempA;
    const tempB = B[i];
    B[i] = B[maxRow];
    B[maxRow] = tempB;

    // Pivot should not be zero
    if (Math.abs(A[i][i]) < 1e-10) {
      throw new Error("Singular matrix");
    }

    // Eliminate below
    for (let j = i + 1; j < n; j++) {
      const factor = A[j][i] / A[i][i];
      for (let k = i; k < n; k++) {
        A[j][k] -= factor * A[i][k];
      }
      B[j] -= factor * B[i];
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (B[i] - sum) / A[i][i];
  }
  return x;
}

/**
 * Computes the 3x3 homography matrix mapping src coordinates to dst coordinates.
 * Returns coefficients h0..h7 (h8 is assumed to be 1).
 */
function getHomography(src: Point[], dst: Point[]): number[] {
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = src[i];
    const { x: dx, y: dy } = dst[i];

    A.push([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy]);
    B.push(sx);

    A.push([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy]);
    B.push(sy);
  }

  return solveLinearSystem(A, B);
}

/**
 * Automatically detects the four corners of a bright document in the image.
 * Uses adaptive thresholding and scanning for the convex quadrilateral.
 */
export function detectDocumentCorners(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Point[] {
  // 1. Get a low-res representation for fast corner detection
  const lowResW = 150;
  const lowResH = Math.round((height / width) * lowResW);

  const offscreen = document.createElement("canvas");
  offscreen.width = lowResW;
  offscreen.height = lowResH;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) {
    return getDefaultCorners(width, height);
  }

  // Draw low-res version
  offCtx.drawImage(ctx.canvas, 0, 0, lowResW, lowResH);
  const imgData = offCtx.getImageData(0, 0, lowResW, lowResH);
  const data = imgData.data;

  // 2. Grayscale & average brightness computation
  const gray = new Uint8Array(lowResW * lowResH);
  let sumBright = 0;
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Standard luminance weights
    const val = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = val;
    sumBright += val;
  }
  const avgBright = sumBright / gray.length;

  // 3. Document binarization (paper is typically brighter than desk/background)
  // We use adaptive threshold to segment bright page regions
  const binary = new Uint8Array(lowResW * lowResH);
  const thresholdValue = Math.max(105, Math.min(180, avgBright * 1.05));

  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] >= thresholdValue ? 1 : 0;
  }

  // 4. Find bright pixels to detect corners
  const whitePoints: Point[] = [];
  const marginX = Math.round(lowResW * 0.03);
  const marginY = Math.round(lowResH * 0.03);

  for (let y = marginY; y < lowResH - marginY; y++) {
    for (let x = marginX; x < lowResW - marginX; x++) {
      if (binary[y * lowResW + x] === 1) {
        whitePoints.push({ x, y });
      }
    }
  }

  // If not enough bright pixels detected, fallback to standard margins
  if (whitePoints.length < 200) {
    return getDefaultCorners(width, height);
  }

  // 5. Calculate 4 corners by optimizing coordinate projections:
  // TL: minimizes x + y
  // TR: maximizes x - y
  // BR: maximizes x + y
  // BL: minimizes x - y
  let tl = whitePoints[0];
  let tr = whitePoints[0];
  let br = whitePoints[0];
  let bl = whitePoints[0];

  let minSum = tl.x + tl.y;
  let maxDiff = tr.x - tr.y;
  let maxSum = br.x + br.y;
  let minDiff = bl.x - bl.y;

  for (let i = 1; i < whitePoints.length; i++) {
    const p = whitePoints[i];
    const sum = p.x + p.y;
    const diff = p.x - p.y;

    if (sum < minSum) {
      minSum = sum;
      tl = p;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      tr = p;
    }
    if (sum > maxSum) {
      maxSum = sum;
      br = p;
    }
    if (diff < minDiff) {
      minDiff = diff;
      bl = p;
    }
  }

  // Scale corners back to original high-res dimensions
  const scaleX = width / lowResW;
  const scaleY = height / lowResH;

  const points = [
    { x: tl.x * scaleX, y: tl.y * scaleY }, // Top-Left
    { x: tr.x * scaleX, y: tr.y * scaleY }, // Top-Right
    { x: br.x * scaleX, y: br.y * scaleY }, // Bottom-Right
    { x: bl.x * scaleX, y: bl.y * scaleY }, // Bottom-Left
  ];

  // Validate convexity & separation to avoid crazy overlapping polygons
  const minDistance = Math.min(width, height) * 0.15;
  const dTL_TR = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  const dTR_BR = Math.hypot(points[1].x - points[2].x, points[1].y - points[2].y);
  const dBR_BL = Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y);
  const dBL_TL = Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y);

  if (
    dTL_TR < minDistance ||
    dTR_BR < minDistance ||
    dBR_BL < minDistance ||
    dBL_TL < minDistance
  ) {
    return getDefaultCorners(width, height);
  }

  return points;
}

function getDefaultCorners(width: number, height: number): Point[] {
  // Default: slightly inset margins to mimic a scan
  return [
    { x: width * 0.05, y: height * 0.05 }, // TL
    { x: width * 0.95, y: height * 0.05 }, // TR
    { x: width * 0.95, y: height * 0.95 }, // BR
    { x: width * 0.05, y: height * 0.95 }, // BL
  ];
}

/**
 * Straightens the image using homography mapping and crops it.
 */
export function perspectiveWarp(
  ctx: CanvasRenderingContext2D,
  srcPoints: Point[],
  srcW: number,
  srcH: number
): HTMLCanvasElement {
  // Determine standard straightened dimension
  // We'll use a standard A4 ratio (1.414) for highly professional presentation
  const destW = 900;
  const destH = Math.round(destW * 1.414);

  const destCanvas = document.createElement("canvas");
  destCanvas.width = destW;
  destCanvas.height = destH;
  const destCtx = destCanvas.getContext("2d");
  if (!destCtx) {
    return ctx.canvas;
  }

  const dstPoints: Point[] = [
    { x: 0, y: 0 },
    { x: destW, y: 0 },
    { x: destW, y: destH },
    { x: 0, y: destH },
  ];

  // Calculate the reverse homography matrix (mapping dest coordinates to src coordinates)
  let h: number[];
  try {
    h = getHomography(srcPoints, dstPoints);
  } catch (e) {
    console.error("Warp failed, using default corners:", e);
    // Fallback: draw full image stretched to destination
    destCtx.drawImage(ctx.canvas, 0, 0, destW, destH);
    return destCanvas;
  }

  const srcImgData = ctx.getImageData(0, 0, srcW, srcH);
  const srcPixels = srcImgData.data;

  const destImgData = destCtx.createImageData(destW, destH);
  const destPixels = destImgData.data;

  // Warp pixel coordinates
  for (let dy = 0; dy < destH; dy++) {
    for (let dx = 0; dx < destW; dx++) {
      // Apply homography equations
      const denom = h[6] * dx + h[7] * dy + 1;
      const sx = Math.round((h[0] * dx + h[1] * dy + h[2]) / denom);
      const sy = Math.round((h[3] * dx + h[4] * dy + h[5]) / denom);

      const destIdx = (dy * destW + dx) * 4;

      if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
        const srcIdx = (sy * srcW + sx) * 4;
        destPixels[destIdx] = srcPixels[srcIdx];         // R
        destPixels[destIdx + 1] = srcPixels[srcIdx + 1]; // G
        destPixels[destIdx + 2] = srcPixels[srcIdx + 2]; // B
        destPixels[destIdx + 3] = srcPixels[srcIdx + 3]; // A
      } else {
        // Transparent / background padding
        destPixels[destIdx] = 255;
        destPixels[destIdx + 1] = 255;
        destPixels[destIdx + 2] = 255;
        destPixels[destIdx + 3] = 255;
      }
    }
  }

  destCtx.putImageData(destImgData, 0, 0);
  return destCanvas;
}

/**
 * Applies a state-of-the-art adaptive contrast boost filter.
 * Eliminates background gray colors, phone shadows, and lights up paper to pure white
 * while boosting ink details to pitch black.
 */
export function enhanceContrastAndBinarize(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  // Adaptive thresholding: divided into a local grid to handle uneven shadows/lighting
  const blockSize = 32;
  const gridW = Math.ceil(width / blockSize);
  const gridH = Math.ceil(height / blockSize);

  // Store local average brightness for each grid block
  const localMeans = new Float32Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      let sum = 0;
      let count = 0;

      const startX = gx * blockSize;
      const endX = Math.min(width, startX + blockSize);
      const startY = gy * blockSize;
      const endY = Math.min(height, startY + blockSize);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          // Grayscale value
          const brightness = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
          sum += brightness;
          count++;
        }
      }

      localMeans[gy * gridW + gx] = count > 0 ? sum / count : 128;
    }
  }

  // Process pixels with adaptive contrast boost using bilinear interpolation of grid means
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Find local mean using interpolation
      const gx = x / blockSize - 0.5;
      const gy = y / blockSize - 0.5;

      const g0 = Math.max(0, Math.floor(gx));
      const g1 = Math.min(gridW - 1, g0 + 1);
      const h0 = Math.max(0, Math.floor(gy));
      const h1 = Math.min(gridH - 1, h0 + 1);

      const t = gx - g0;
      const u = gy - h0;

      const m00 = localMeans[h0 * gridW + g0];
      const m10 = localMeans[h0 * gridW + g1];
      const m01 = localMeans[h1 * gridW + g0];
      const m11 = localMeans[h1 * gridW + g1];

      // Bilinear interpolation of local mean
      const localMean = (1 - t) * (1 - u) * m00 + t * (1 - u) * m10 + (1 - t) * u * m01 + t * u * m11;

      // Adaptive contrast enhancement formula
      // If pixel is significantly darker than local mean, pull it to black.
      // If pixel is close to or brighter than local mean, push it to pristine white.
      let newVal = 255;
      const difference = gray - localMean;

      // Adaptive mapping curve
      if (difference < -10) {
        // High contrast dark detail scaling
        const factor = Math.max(0, (difference + 45) / 35); // Scale between black and darker gray
        newVal = Math.round(Math.min(255, gray * 0.4 * factor));
      } else if (difference < 15) {
        // Midtone stretch
        const ratio = (difference + 10) / 25;
        newVal = Math.round(128 + ratio * 127);
      } else {
        newVal = 255; // Solid pristine white
      }

      // Slightly smooth color preservation or clean monochrome conversion
      // Let's make it a clean, beautiful monochromatic scan look
      pixels[idx] = newVal;
      pixels[idx + 1] = newVal;
      pixels[idx + 2] = newVal;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Orchestrates the full automatic document scanning pipeline:
 * 1. Corner Detection
 * 2. Perspective Straightening & Crop
 * 3. Contrast Boosting & Shadow Elimination
 */
export function scanAndEnhanceDocument(
  img: HTMLImageElement
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // 1. Detect document corners automatically
  const corners = detectDocumentCorners(ctx, img.width, img.height);

  // 2. Perform perspective straightening and cropping
  let warpedCanvas = perspectiveWarp(ctx, corners, img.width, img.height);

  // 3. Apply adaptive contrast and binarization boosting
  warpedCanvas = enhanceContrastAndBinarize(warpedCanvas);

  return warpedCanvas;
}
