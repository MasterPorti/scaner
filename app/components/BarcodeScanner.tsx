'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (codigo: string) => void;
  isScanning: boolean;
  onStop: () => void;
}

export default function BarcodeScanner({ onScan, isScanning, onStop }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Obtener lista de cámaras disponibles
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // Preferir cámara trasera
          const backCamera = devices.find(
            (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        }
      })
      .catch((err) => {
        console.log('Error obteniendo cámaras:', err);
      });
  }, []);

  useEffect(() => {
    if (isScanning && selectedCamera) {
      startScanning();
    } else if (!isScanning) {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isScanning, selectedCamera]);

  const startScanning = async () => {
    try {
      setError('');

      // Limpiar scanner anterior si existe
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          // Ignorar errores de limpieza
        }
      }

      const scanner = new Html5Qrcode('reader', {
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ],
      };

      await scanner.start(
        selectedCamera || { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Vibrar si es posible
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          onScan(decodedText);
        },
        () => {
          // Ignorar errores de escaneo continuo
        }
      );
    } catch (err: unknown) {
      console.error('Error al iniciar el escáner:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
        setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('not found')) {
        setError('No se encontró ninguna cámara en este dispositivo.');
      } else if (errorMessage.includes('NotSupportedError') || errorMessage.includes('not supported')) {
        setError('Tu navegador no soporta el acceso a la cámara. Prueba usar la opción de subir foto.');
      } else {
        setError(`Error al acceder a la cámara: ${errorMessage}. Prueba usar la opción de subir foto.`);
      }
      onStop();
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error al detener el escáner:', err);
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      const scanner = new Html5Qrcode('file-reader', {
        verbose: false,
      });

      const result = await scanner.scanFile(file, true);
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      onScan(result);
      scanner.clear();
    } catch (err) {
      console.error('Error al escanear imagen:', err);
      setError('No se pudo leer ningún código de barras en la imagen. Intenta con otra foto más clara.');
    }

    // Limpiar input para poder seleccionar el mismo archivo otra vez
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Selector de cámara */}
      {cameras.length > 1 && isScanning && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar cámara:
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Cámara ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {isScanning ? (
        <div className="space-y-4">
          <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-blue-500" style={{ minHeight: '300px' }}></div>
          <button
            onClick={onStop}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Detener Escáner
          </button>
        </div>
      ) : (
        <div className="text-center py-4 space-y-4">
          <p className="text-gray-500">El escáner está detenido</p>

          {/* Opción alternativa: subir foto */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">
              Si la cámara no funciona, puedes tomar una foto del código de barras:
            </p>
            <label className="inline-block cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">
              Subir Foto de Código
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Contenedor oculto para escaneo de archivos */}
      <div id="file-reader" className="hidden"></div>
    </div>
  );
}
