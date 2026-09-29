import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Copy,
  Check,
  ClipboardPaste,
  Loader2,
} from 'lucide-react';
import {
  parseProxyURLSingle,
  extractLines,
  enhanceURL,
  ParsedProxy,
} from '../lib/proxyParser';
import {
  isSubscriptionUrl,
  fetchSubscriptionConfigs,
} from '../lib/subscriptionFetcher';

const FM_PRESET_V2 = JSON.stringify({
  tcp: [
    {
      type: 'fragment',
      settings: {
        packets: 'tlshello',
        lengths: ['0', '104', '1'],
        delays: ['0'],
        maxSplit: '0',
      },
    },
    {
      type: 'fragment',
      settings: {
        packets: '1-1',
        lengths: ['114', '1'],
        delays: ['1'],
        maxSplit: '11',
      },
    },
  ],
});

const DEFAULT_CS =
  'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256:TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256';

export const EnhancerView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isSub, setIsSub] = useState(false);
  const [isFetchingSub, setIsFetchingSub] = useState(false);
  const [subConfigs, setSubConfigs] = useState<string[]>([]);
  const [subError, setSubError] = useState<string | null>(null);

  const [parsedList, setParsedList] = useState<ParsedProxy[]>([]);
  const [outputUrls, setOutputUrls] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Quick Paste
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text.trim());
        if (navigator.vibrate) navigator.vibrate(30);
      }
    } catch {}
  };

  // Detect input type and parse
  useEffect(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setIsSub(false);
      setSubConfigs([]);
      setSubError(null);
      setParsedList([]);
      setOutputUrls([]);
      return;
    }

    if (isSubscriptionUrl(trimmed)) {
      setIsSub(true);
      setParsedList([]);
      setOutputUrls([]);

      // Auto-fetch subscription configs
      let cancelled = false;
      setIsFetchingSub(true);
      setSubError(null);

      fetchSubscriptionConfigs(trimmed)
        .then((res) => {
          if (cancelled) return;
          setIsFetchingSub(false);
          if (res.ok && res.configs && res.configs.length > 0) {
            setSubConfigs(res.configs);
            setSubError(null);

            // Parse valid proxy items
            const valid: ParsedProxy[] = [];
            res.configs.forEach((line) => {
              const p = parseProxyURLSingle(line);
              if (p && !('error' in p) && (p.protocol === 'vless' || p.protocol === 'trojan')) {
                valid.push(p);
              }
            });
            setParsedList(valid);
          } else {
            setSubConfigs([]);
            setSubError(res.error || 'کانفیگی در این سابسکریپشن یافت نشد');
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setIsFetchingSub(false);
          setSubConfigs([]);
          setSubError(err instanceof Error ? err.message : 'خطا در ارتباط با سابسکریپشن');
        });

      return () => {
        cancelled = true;
      };
    } else {
      setIsSub(false);
      setSubConfigs([]);
      setSubError(null);

      // Parse direct proxy lines
      const lines = extractLines(trimmed);
      const valid: ParsedProxy[] = [];
      lines.forEach((line) => {
        const p = parseProxyURLSingle(line);
        if (p && !('error' in p) && (p.protocol === 'vless' || p.protocol === 'trojan')) {
          valid.push(p);
        }
      });
      setParsedList(valid);
    }
  }, [inputText]);

  // Enhance action
  const handleEnhance = async () => {
    let sourceLines: string[] = [];

    if (isSub) {
      if (subConfigs.length > 0) {
        sourceLines = subConfigs;
      } else {
        // Try fetching on click if not yet loaded
        setIsFetchingSub(true);
        const res = await fetchSubscriptionConfigs(inputText.trim());
        setIsFetchingSub(false);
        if (res.ok && res.configs && res.configs.length > 0) {
          sourceLines = res.configs;
          setSubConfigs(res.configs);
        } else {
          setSubError(res.error || 'خطا در دریافت سابسکریپشن');
          return;
        }
      }
    } else {
      sourceLines = extractLines(inputText);
    }

    if (sourceLines.length === 0) return;

    const enhanced: string[] = [];

    sourceLines.forEach((line) => {
      const p = parseProxyURLSingle(line);
      if (p && !('error' in p) && (p.protocol === 'vless' || p.protocol === 'trojan')) {
        const res = enhanceURL(line, {
          fp: 'unsafe',
          cs: DEFAULT_CS,
          fm: FM_PRESET_V2,
        });
        if (res.url) {
          enhanced.push(res.url);
        }
      } else if (line.startsWith('vless://') || line.startsWith('trojan://')) {
        // Fallback enhancement
        const res = enhanceURL(line, {
          fp: 'unsafe',
          cs: DEFAULT_CS,
          fm: FM_PRESET_V2,
        });
        if (res.url) {
          enhanced.push(res.url);
        }
      }
    });

    if (enhanced.length === 0) {
      setSubError('هیچ کانفیگ VLESS یا Trojan قابل تقویتی یافت نشد');
      return;
    }

    setOutputUrls(enhanced);
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
  };

  // Copy action
  const handleCopy = async () => {
    if (outputUrls.length === 0) return;
    try {
      await navigator.clipboard.writeText(outputUrls.join('\n\n'));
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const isEnhanceDisabled =
    (!isSub && parsedList.length === 0) ||
    (isSub && isFetchingSub) ||
    (isSub && !isFetchingSub && subConfigs.length === 0 && !inputText.trim());

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Input Card */}
      <div className="rounded-3xl bg-[#0e111a] border border-white/[0.1] p-5 sm:p-7 shadow-2xl shadow-black/60">
        {/* Card Header with prominent Paste Button */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-mono font-bold border border-emerald-500/30">
              ۱
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
              کانفیگ یا لینک سابسکریپشن
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/50 rounded-2xl text-sm sm:text-base font-bold transition active:scale-95 shadow-md shadow-emerald-500/10"
            >
              <ClipboardPaste className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span>جای‌گذاری لینک</span>
            </button>

            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setSubConfigs([]);
                  setSubError(null);
                  setOutputUrls([]);
                }}
                className="p-2.5 rounded-2xl text-gray-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition active:scale-95"
                title="پاک کردن"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="لینک سابسکریپشن (https://...) یا کانفیگ‌های vless:// و trojan:// را با دکمه جای‌گذاری بالا قرار دهید..."
          rows={5}
          dir="ltr"
          className="w-full min-h-[160px] sm:min-h-[190px] p-4 sm:p-5 bg-[#07090f] border border-white/[0.08] rounded-2xl text-white font-mono text-sm sm:text-base leading-relaxed outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition resize-y text-left placeholder:text-gray-500 placeholder:font-sans placeholder:text-right placeholder:text-sm sm:placeholder:text-base"
          spellCheck={false}
        />

        {/* Dynamic Status Line */}
        <div className="mt-4 flex items-center justify-between text-xs sm:text-sm min-h-[26px]">
          {isSub ? (
            isFetchingSub ? (
              <div className="flex items-center gap-2 text-cyan-400 font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>در حال دریافت کانفیگ‌ها از لینک سابسکریپشن...</span>
              </div>
            ) : subError ? (
              <div className="text-rose-400 font-semibold text-xs sm:text-sm">
                {subError}
              </div>
            ) : subConfigs.length > 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {parsedList.length > 0
                    ? `تعداد ${parsedList.length} کانفیگ از سابسکریپشن شناسایی شد و آماده تقویت است`
                    : `تعداد ${subConfigs.length} آیتم از سابسکریپشن دریافت شد`}
                </span>
              </div>
            ) : (
              <div className="text-gray-400">لینک سابسکریپشن وارد شد.</div>
            )
          ) : parsedList.length > 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs sm:text-sm font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {parsedList.length === 1
                  ? `${parsedList[0].protocol.toUpperCase()} • ${parsedList[0].server}:${parsedList[0].port}`
                  : `${parsedList.length} کانفیگ آماده تقویت`}
              </span>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-gray-500 font-medium">
              لینک سابسکریپشن یا کانفیگ را جای‌گذاری کنید تا دکمه تقویت فعال شود.
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="w-full">
        <button
          onClick={handleEnhance}
          disabled={isEnhanceDisabled}
          className="w-full h-14 sm:h-16 py-4 px-6 rounded-2xl font-black text-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:opacity-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-98 text-base sm:text-lg flex items-center justify-center gap-3 tracking-wide"
        >
          {isFetchingSub ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <span>در حال دریافت سابسکریپشن...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-black" />
              <span>
                {outputUrls.length > 0
                  ? `تقویت مجدد (${outputUrls.length} کانفیگ)`
                  : isSub && parsedList.length > 0
                  ? `تقویت همه ${parsedList.length} کانفیگ سابسکریپشن`
                  : parsedList.length > 1
                  ? `تقویت ${parsedList.length} کانفیگ`
                  : 'تقویت کانفیگ و دور زدن فیلترینگ (Enhance)'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Clean Result Section */}
      {outputUrls.length > 0 && (
        <div className="rounded-3xl bg-[#0e111a] border border-emerald-500/50 p-5 sm:p-7 shadow-2xl shadow-emerald-950/40 space-y-4 animate-fadeIn">
          {/* Main Giant Copy Button */}
          <button
            onClick={handleCopy}
            className={`w-full h-14 sm:h-16 py-4 px-6 rounded-2xl font-black text-base sm:text-lg transition-all duration-200 shadow-lg active:scale-98 flex items-center justify-center gap-3 ${
              copied
                ? 'bg-emerald-400 text-black shadow-emerald-400/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-emerald-500/25'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-6 h-6 stroke-[3] text-black" />
                <span>
                  {outputUrls.length > 1
                    ? `هر ${outputUrls.length} کانفیگ کپی شد! آماده پیست در برنامه`
                    : 'کپی شد! آماده پیست در برنامه'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 text-black" />
                <span>
                  {outputUrls.length > 1
                    ? `کپی همه ${outputUrls.length} کانفیگ تقویت‌شده (Copy All)`
                    : 'کپی کانفیگ تقویت‌شده (Copy)'}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
