'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export default function QRCodeGenerator({ value, size = 256 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [value, size]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'event-qr-code.png';
      a.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="border-4 border-white shadow-lg rounded-lg" />
      <button
        onClick={downloadQR}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
      >
        Download QR Code
      </button>
    </div>
  );
}
