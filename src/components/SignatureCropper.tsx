import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCw, ZoomIn, Check, X, Shield } from 'lucide-react';

interface SignatureCropperProps {
  imageSrc: string;
  branchNumber: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

export default function SignatureCropper({ imageSrc, branchNumber, onConfirm, onCancel }: SignatureCropperProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // in degrees: 0, 90, 180, 270
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when imageSrc changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [imageSrc]);

  // Handle Mouse / Touch down
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Handle Mouse / Touch move
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Rotate image by 90 deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setPosition({ x: 0, y: 0 }); // reset position on rotation to keep in bounds
  };

  // Execute crop on a canvas
  const handleCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    
    // We want the cropped output to have a 5:1 ratio, matching 15cm x 3cm
    // Let's output at high resolution (1500 x 300) for pristine PDF print quality
    canvas.width = 1500;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Move origin to center of output canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Let's determine how the cropping window relates to the actual image size
    // Crop box dimensions in the UI
    const cropBoxWidth = 350;

    // Scale factor between output high-res canvas and UI crop box
    const uiToCanvasScale = canvas.width / cropBoxWidth; // 1500 / 350 = ~4.28

    // Apply the exact same transform chain as the CSS: translate, then rotate
    ctx.translate(position.x * uiToCanvasScale, position.y * uiToCanvasScale);
    ctx.rotate((rotation * Math.PI) / 180);

    // The image size in the UI (unzoomed) is img.width x img.height
    // We scale it by 'zoom' and then by 'uiToCanvasScale' to match the canvas resolution.
    const renderWidth = img.width * zoom * uiToCanvasScale;
    const renderHeight = img.height * zoom * uiToCanvasScale;

    // Draw the image centered at this new origin
    ctx.drawImage(
      img,
      -renderWidth / 2,
      -renderHeight / 2,
      renderWidth,
      renderHeight
    );

    ctx.restore();

    // Now let's apply a binarization and contrast enhancement to the cropped canvas
    // to ensure the signature is perfectly legible (white background, dark ink)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    // Adaptive threshold block size
    const blockSize = 20;
    const gridW = Math.ceil(canvas.width / blockSize);
    const gridH = Math.ceil(canvas.height / blockSize);
    const localMeans = new Float32Array(gridW * gridH);

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        let sum = 0;
        let count = 0;
        const startX = gx * blockSize;
        const endX = Math.min(canvas.width, startX + blockSize);
        const startY = gy * blockSize;
        const endY = Math.min(canvas.height, startY + blockSize);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * canvas.width + x) * 4;
            const brightness = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
            sum += brightness;
            count++;
          }
        }
        localMeans[gy * gridW + gx] = count > 0 ? sum / count : 128;
      }
    }

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

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

        const localMean = (1 - t) * (1 - u) * m00 + t * (1 - u) * m10 + (1 - t) * u * m01 + t * u * m11;
        const difference = gray - localMean;

        let newVal = 255;
        if (difference < -12) {
          const factor = Math.max(0, (difference + 45) / 33);
          newVal = Math.round(Math.min(255, gray * 0.3 * factor));
        } else if (difference < 12) {
          const ratio = (difference + 12) / 24;
          newVal = Math.round(140 + ratio * 115);
        } else {
          newVal = 255;
        }

        pixels[idx] = newVal;
        pixels[idx + 1] = newVal;
        pixels[idx + 2] = newVal;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Apply the watermarked bar to the cropped signature
    const barHeight = 24;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    const pad = (num: number) => String(num).padStart(2, '0');
    const now = new Date();
    const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const branchPrefix = branchNumber ? `ODDZIAŁ: ${branchNumber} | ` : '';
    const watermarkText = `ZWERYFIKOWANO PODPIS ELEKTRONICZNIE | HISTORIA MONTÁŻU | ${branchPrefix}DATA: ${dateStr}`;

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(watermarkText, canvas.width / 2, canvas.height - (barHeight / 2));

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
    onConfirm(croppedBase64);
  };

  return (
    <div id="signature-cropper-modal" className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-4 md:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col h-full max-h-[600px]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-white text-sm">Kadrowanie podpisu i pieczątki</h3>
          </div>
          <button
            id="btn-close-cropper"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 py-3 bg-blue-950/40 border-b border-blue-900/40 text-xs text-blue-200">
          Przesuwaj i powiększaj zdjęcie tak, aby podpis zmieścił się wewnątrz ramki. 
          Zewnętrzny obszar zostanie przycięty z zachowaniem odpowiednich marginesów.
        </div>

        {/* Cropping Area Viewport */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleEnd}
        >
          {/* Invisible image element to reference for pixels */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Original signature"
            className="pointer-events-none max-w-none origin-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
              maxHeight: '70%',
              maxWidth: '70%',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            referrerPolicy="no-referrer"
          />

          {/* Dark backdrop masks representing cropped-out areas */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top mask */}
            <div className="flex-1 bg-slate-950/85 border-b border-slate-800" />
            {/* Center Row containing Left mask, Crop box, and Right mask */}
            <div className="h-[70px] flex">
              <div className="flex-1 bg-slate-950/85" />
              {/* UI Crop Box 350px x 70px (5:1 Ratio, representing 15x3 cm) */}
              <div className="w-[350px] h-[70px] border-2 border-dashed border-blue-400 bg-transparent relative shadow-[0_0_0_9999px_rgba(2,6,23,0.85)]">
                {/* Visual corners */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-500" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-500" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-500" />

                {/* Margins & Signature Bounding Box Guide */}
                <div className="absolute inset-[10px] border-2 border-dashed border-blue-400/60 flex items-center justify-center">
                  <span className="text-[9px] text-blue-300 font-semibold tracking-wider uppercase bg-slate-950/60 px-1 py-0.5 rounded">
                    Maks. obszar podpisu (15x3 cm)
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-slate-950/85" />
            </div>
            {/* Bottom mask */}
            <div className="flex-1 bg-slate-950/85 border-t border-slate-800" />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> Powiększenie</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              id="slider-zoom"
              type="range"
              min="0.5"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              id="btn-rotate"
              type="button"
              onClick={handleRotate}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              title="Obróć o 90 stopni"
            >
              <RotateCw className="w-4 h-4 text-blue-400" />
              Obróć 90°
            </button>

            <button
              id="btn-cancel-crop"
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Anuluj
            </button>

            <button
              id="btn-confirm-crop"
              type="button"
              onClick={handleCrop}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
            >
              <Check className="w-4 h-4" />
              Wykadruj podpis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
