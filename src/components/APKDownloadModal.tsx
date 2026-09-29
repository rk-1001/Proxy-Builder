import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  ExternalLink,
  Check,
  Package,
  Share2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface APKDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APKDownloadModal: React.FC<APKDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isInstalled } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-divageohpmqvqk32i45jrh-624872931780.europe-west2.run.app';

  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0e111a] border border-white/[0.1] rounded-3xl shadow-2xl p-6 sm:p-7 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">نصب برنامه و دانلود APK</h3>
              <p className="text-xs text-gray-400">اپلیکیشن اختصاصی اندروید</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3.5">
          {/* Option 1: Instant PWA Install */}
          <div className="p-4 rounded-2xl bg-[#07090f] border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">روش اول (پیشنهادی و فوری):</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                WebAPK
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              برنامه را مستقیماً مانند یک اپلیکیشن بومی روی گوشی اندروید یا رایانه خود نصب کنید (بدون نیاز به دانلود فایل سنگین، با قابلیت کارکرد آفلاین).
            </p>
            {isInstalled ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-1">
                <Check className="w-4 h-4" />
                <span>برنامه قبلاً با موفقیت نصب شده است.</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-black bg-gradient-to-r from-emerald-400 to-teal-300 shadow-md transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>نصب فوری روی دستگاه</span>
              </button>
            ) : (
              <p className="text-[11px] text-gray-400 bg-white/[0.04] p-2.5 rounded-xl">
                در مرورگر کروم گوشی، منوی ۳ نقطه را باز کرده و گزینه «افزودن به صفحه اصلی (Add to Home screen)» یا «Install App» را لمس کنید.
              </p>
            )}
          </div>

          {/* Option 2: PWABuilder Android APK */}
          <div className="p-4 rounded-2xl bg-[#07090f] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">روش دوم (فایل خام APK):</span>
              <span className="text-[10px] bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-md font-mono">
                .apk
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              تولید بسته نصبی مستقیم اندروید (.apk) از طریق موتور رسمی PWABuilder مایکروسافت:
            </p>
            <div className="flex gap-2">
              <a
                href={pwaBuilderUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 transition flex items-center justify-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>تولید APK در PWABuilder</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition flex items-center justify-center gap-1.5"
                title="کپی لینک وب‌اپ"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'کپی شد' : 'کپی آدرس'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
