import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { X, QrCode, Radio, Copy, Check, Printer, ExternalLink, Download } from 'lucide-react';
import { BusinessConfig } from '../types';

interface QrNfcModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessConfig;
}

export const QrNfcModal: React.FC<QrNfcModalProps> = ({ isOpen, onClose, business }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'qr' | 'nfc' | null>(null);

  const baseUrl = 'https://askmatereview.com';
  const qrUrl = `${baseUrl}/?source=qr`;
  const nfcUrl = `${baseUrl}/?source=nfc`;

  useEffect(() => {
    if (isOpen && baseUrl) {
      QRCode.toDataURL(qrUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [isOpen, baseUrl, qrUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: 'qr' | 'nfc') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">QR Code & NFC Card Setup</h3>
                <p className="text-xs text-neutral-500">Touchless customer review touchpoints</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Table Stand Preview Card */}
            <div className="bg-gradient-to-b from-neutral-50 to-neutral-100/70 p-6 rounded-2xl border border-neutral-200/90 text-center flex flex-col items-center shadow-inner">
              <div className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-1">
                ASKMATE · LEARN | EASY
              </div>
              <h4 className="text-lg font-display font-extrabold text-neutral-900">
                {business.name}
              </h4>
              <p className="text-xs text-neutral-500 mb-4">
                Scan or Tap to leave a 10-star rating for your assignment order
              </p>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="ASKMATE QR Code"
                    className="w-48 h-48 rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400">
                    Generating QR code...
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>NFC Tap Enabled</span>
                <span className="text-neutral-300">·</span>
                <span>Fast AI Feedback</span>
              </div>
            </div>

            {/* Direct Links section */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-neutral-800">Direct Touchpoint URLs</h5>

              {/* QR Link */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-semibold text-neutral-700 block">QR Code Destination:</span>
                  <span className="text-neutral-500 text-[11px] truncate font-mono">{qrUrl}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(qrUrl, 'qr')}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium flex items-center gap-1 transition-colors"
                >
                  {copiedType === 'qr' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* NFC Link */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-semibold text-neutral-700 block">NFC Chip Tag Payload URL:</span>
                  <span className="text-neutral-500 text-[11px] truncate font-mono">{nfcUrl}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(nfcUrl, 'nfc')}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium flex items-center gap-1 transition-colors"
                >
                  {copiedType === 'nfc' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`askmate-${business.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Image</span>
                </a>
              )}
              <button
                type="button"
                onClick={handlePrintCard}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Card</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
