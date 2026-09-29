import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Share2, ExternalLink, QrCode } from 'lucide-react';
import { getAndroidClientLinks } from '../lib/proxyGenerators';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: string;
  remark?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  remark,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !data) return;

    QRCode.toDataURL(data, {
      width: 320,
      margin: 2,
      color: {
        dark: '#07080c',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: remark || 'Proxy Config',
          text: data,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `proxy-qr-${Date.now()}.png`;
    a.click();
  };

  const clientLinks = getAndroidClientLinks(data, remark);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#0e111a] border border-white/[0.1] rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">کد QR کانفیگ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {remark && (
          <p className="text-xs text-emerald-400 font-mono truncate mb-4 text-center px-3 py-1.5 bg-[#07090f] rounded-xl border border-white/[0.06]" dir="ltr">
            {remark}
          </p>
        )}

        {/* QR Canvas Container */}
        <div className="flex justify-center p-3.5 bg-white rounded-2xl shadow-xl mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Proxy QR Code" className="w-52 h-52 object-contain" />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-gray-500 text-xs">
              در حال ساخت QR...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-gray-200 rounded-xl border border-white/[0.08] transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
            <span>{copied ? 'کپی شد' : 'کپی'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-gray-200 rounded-xl border border-white/[0.08] transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>ذخیره عکس</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-gray-200 rounded-xl border border-white/[0.08] transition"
          >
            <Share2 className="w-4 h-4 text-emerald-300" />
            <span>{shareSuccess ? 'ارسال شد' : 'اشتراک'}</span>
          </button>
        </div>

        {/* Direct Android Intents */}
        <div className="space-y-2 pt-3 border-t border-white/[0.08]">
          <p className="text-[11px] font-medium text-gray-400">باز کردن مستقیم در برنامه‌ها:</p>
          <div className="flex gap-2">
            {clientLinks?.v2rayng && (
              <a
                href={clientLinks.v2rayng}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition"
              >
                <span>v2rayNG</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {clientLinks?.nekobox && (
              <a
                href={clientLinks.nekobox}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold rounded-xl border border-cyan-500/30 transition"
              >
                <span>NekoBox</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
