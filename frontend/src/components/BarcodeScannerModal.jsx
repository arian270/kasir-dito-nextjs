'use client';

import React, { useEffect, useState, useRef } from 'react';
import Modal from './Modal';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, ScanBarcode, ArrowRight } from 'lucide-react';

const BarcodeScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setCameraError(null);
      setManualCode('');

      // Beri sedikit jeda agar DOM ter-render
      const timer = setTimeout(async () => {
        try {
          const element = document.getElementById('qr-reader');
          if (!element) return;

          html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          const qrConfig = {
            fps: 10,
            qrbox: { width: 250, height: 180 },
            aspectRatio: 1.333334
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            qrConfig,
            (decodedText) => {
              // Sukses scan
              if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(() => {});
              }
              onScanSuccess(decodedText);
              onClose();
            },
            () => {
              // Ignore frame decode failure
            }
          );
          setIsScanning(true);
        } catch (err) {
          console.warn('Gagal mengakses kamera scanner:', err);
          setCameraError('Kamera tidak dapat diakses atau izin belum diberikan. Silakan gunakan input barcode manual di bawah.');
          setIsScanning(false);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(() => {});
            }
            scannerRef.current.clear().catch(() => {});
          } catch {}
        }
      };
    }
  }, [isOpen, onScanSuccess, onClose]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Barcode Barang" maxWidth="max-w-md">
      <div className="space-y-4">
        
        {/* Camera Viewfinder Area */}
        <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[240px] flex flex-col items-center justify-center text-white">
          <div id="qr-reader" className="w-full h-full"></div>

          {cameraError && (
            <div className="p-4 text-center text-xs text-amber-300 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-2 text-amber-400" />
              <p className="font-semibold">{cameraError}</p>
            </div>
          )}

          {!cameraError && !isScanning && (
            <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center">
              <Camera className="w-8 h-8 mb-2 animate-pulse text-emerald-400" />
              <p>Mengaktifkan kamera...</p>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ScanBarcode className="w-4 h-4 text-emerald-600" />
            Input Barcode / Kode Manual:
          </label>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: 8992388123456"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Cari</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-[11px] text-slate-500 mt-1">
            Jika menggunakan USB Barcode Scanner fisik, scanner akan otomatis mengisi input ini dan menekan Enter.
          </p>
        </div>

      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;
