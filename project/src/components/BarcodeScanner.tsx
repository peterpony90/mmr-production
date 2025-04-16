import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner with larger scanning area and higher FPS
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      {
        qrbox: {
          width: 300,
          height: 200,
        },
        fps: 15,
        aspectRatio: 1.7777778,
        formatsToSupport: ['CODE_128', 'EAN_13', 'EAN_8', 'CODE_39'],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    // Start scanning
    scannerRef.current.render(
      (decodedText: string) => {
        if (scannerRef.current) {
          scannerRef.current.clear();
          onScan(decodedText);
          onClose();
        }
      },
      (errorMessage: string) => {
        console.warn(`Code scan error = ${errorMessage}`);
      }
    );

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Escanear código de barras
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div id="reader" className="w-full"></div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600 text-center">
              Coloca el código de barras frente a la cámara para escanearlo
            </p>
            <p className="text-xs text-gray-500 text-center">
              Asegúrate de que haya buena iluminación y el código esté enfocado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}