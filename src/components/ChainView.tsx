import React, { useState, useEffect } from 'react';
import {
  X,
  Link2,
  Copy,
  Check,
  Download,
  QrCode,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  parseProxyURLSingle,
  parseSSHForm,
  ParsedProxy,
} from '../lib/proxyParser';
import {
  generateFullConfig,
  generateSingboxConfig,
  generateSingboxClientConfig,
  generateNekoboxConfig,
  getAndroidClientLinks,
} from '../lib/proxyGenerators';
import { backgroundRunner } from '../lib/backgroundService';
import { QRCodeModal } from './QRCodeModal';

interface ChainViewProps {
  onRunConfig?: () => void;
}

export const ChainView: React.FC<ChainViewProps> = ({ onRunConfig }) => {
  // Config 1 State
  const [config1Text, setConfig1Text] = useState('');
  const [sshMode1, setSshMode1] = useState(false);
  const [ssh1Server, setSsh1Server] = useState('');
  const [ssh1Port, setSsh1Port] = useState('22');
  const [ssh1User, setSsh1User] = useState('root');
  const [ssh1Pass, setSsh1Pass] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [parsed1, setParsed1] = useState<ParsedProxy | null>(null);
  const [error1, setError1] = useState<string | null>(null);

  // Config 2 State
  const [config2Text, setConfig2Text] = useState('');
  const [sshMode2, setSshMode2] = useState(false);
  const [ssh2Server, setSsh2Server] = useState('');
  const [ssh2Port, setSsh2Port] = useState('22');
  const [ssh2User, setSsh2User] = useState('root');
  const [ssh2Pass, setSsh2Pass] = useState('');
  const [showPass2, setShowPass2] = useState(false);
  const [parsed2, setParsed2] = useState<ParsedProxy | null>(null);
  const [error2, setError2] = useState<string | null>(null);

  // Settings
  const [dnsServer, setDnsServer] = useState('https://8.8.8.8/dns-query');
  const [socksPort, setSocksPort] = useState(10808);
  const [logLevel, setLogLevel] = useState('warning');

  // Outputs
  const [activeTab, setActiveTab] = useState<'singbox' | 'xray'>('singbox');
  const [activeSubTab, setActiveSubTab] = useState<'nekobox' | 'standard' | 'nekoray'>('nekobox');
  const [generatedJson, setGeneratedJson] = useState<Record<string, unknown> | null>(null);
  const [activeRemark, setActiveRemark] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Parse Config 1
  useEffect(() => {
    if (sshMode1) {
      if (!ssh1Server.trim()) {
        setParsed1(null);
        setError1(null);
        return;
      }
      const res = parseSSHForm({
        server: ssh1Server,
        port: ssh1Port,
        user: ssh1User,
        password: ssh1Pass,
      });
      if ('error' in res) {
        setError1(res.error || 'خطا در اطلاعات SSH');
        setParsed1(null);
      } else {
        setError1(null);
        setParsed1(res);
      }
    } else {
      if (!config1Text.trim()) {
        setParsed1(null);
        setError1(null);
        return;
      }
      const res = parseProxyURLSingle(config1Text.trim());
      if (!res || 'error' in res) {
        setError1('فرمت کانفیگ ۱ نامعتبر است');
        setParsed1(null);
      } else {
        setError1(null);
        setParsed1(res);
      }
    }
  }, [config1Text, sshMode1, ssh1Server, ssh1Port, ssh1User, ssh1Pass]);

  // Parse Config 2
  useEffect(() => {
    if (sshMode2) {
      if (!ssh2Server.trim()) {
        setParsed2(null);
        setError2(null);
        return;
      }
      const res = parseSSHForm({
        server: ssh2Server,
        port: ssh2Port,
        user: ssh2User,
        password: ssh2Pass,
      });
      if ('error' in res) {
        setError2(res.error || 'خطا در اطلاعات SSH');
        setParsed2(null);
      } else {
        setError2(null);
        setParsed2(res);
      }
    } else {
      if (!config2Text.trim()) {
        setParsed2(null);
        setError2(null);
        return;
      }
      const res = parseProxyURLSingle(config2Text.trim());
      if (!res || 'error' in res) {
        setError2('فرمت کانفیگ ۲ نامعتبر است');
        setParsed2(null);
      } else {
        setError2(null);
        setParsed2(res);
      }
    }
  }, [config2Text, sshMode2, ssh2Server, ssh2Port, ssh2User, ssh2Pass]);

  const hasSSH = parsed1?.protocol === 'ssh' || parsed2?.protocol === 'ssh';

  const handleGenerate = () => {
    if (!parsed1 || !parsed2) return;
    const opts = { dnsServer, socksPort, logLevel };
    let result: { config: Record<string, unknown>; remark: string };

    if (activeTab === 'xray') {
      result = generateFullConfig(parsed1, parsed2, opts);
    } else {
      if (activeSubTab === 'standard') {
        result = generateSingboxConfig(parsed1, parsed2, opts);
      } else if (activeSubTab === 'nekoray') {
        result = generateSingboxClientConfig(parsed1, parsed2, opts);
      } else {
        result = generateNekoboxConfig(parsed1, parsed2, opts);
      }
    }

    setGeneratedJson(result.config);
    setActiveRemark(result.remark);
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
  };

  useEffect(() => {
    if (generatedJson && parsed1 && parsed2) {
      handleGenerate();
    }
  }, [activeTab, activeSubTab]);

  const handleCopy = async () => {
    if (!generatedJson) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(generatedJson, null, 2));
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    if (!generatedJson) return;
    const jsonStr = JSON.stringify(generatedJson, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chain-${activeTab}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isReady = parsed1 && parsed2;
  const jsonString = generatedJson ? JSON.stringify(generatedJson, null, 2) : '';
  const clientLinks = jsonString ? getAndroidClientLinks(jsonString, activeRemark) : null;

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 2-Node Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Node 1: Entry Server / CDN */}
        <div className="rounded-3xl bg-[#0e111a] border border-white/[0.1] p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/30">
                ۱
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-200">
                گره ورودی (پروکسی میانی یا CDN)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSshMode1(!sshMode1)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  sshMode1
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/[0.04] text-gray-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>SSH</span>
              </button>
              {parsed1 && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {parsed1.protocol.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {!sshMode1 ? (
            <textarea
              value={config1Text}
              onChange={(e) => setConfig1Text(e.target.value)}
              placeholder="vless://... یا trojan://..."
              rows={4}
              dir="ltr"
              className="w-full min-h-[110px] p-3.5 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm leading-relaxed outline-none focus:border-emerald-500/50 resize-y text-left placeholder:text-gray-500"
              spellCheck={false}
            />
          ) : (
            <div className="space-y-2.5 text-xs sm:text-sm">
              <input
                type="text"
                value={ssh1Server}
                onChange={(e) => setSsh1Server(e.target.value)}
                placeholder="آدرس سرور SSH (IP یا دامنه)"
                dir="ltr"
                className="w-full p-3 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm outline-none focus:border-amber-500/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={ssh1User}
                  onChange={(e) => setSsh1User(e.target.value)}
                  placeholder="نام کاربری (root)"
                  dir="ltr"
                  className="w-full p-2.5 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm outline-none"
                />
                <input
                  type="password"
                  value={ssh1Pass}
                  onChange={(e) => setSsh1Pass(e.target.value)}
                  placeholder="رمز عبور"
                  dir="ltr"
                  className="w-full p-2.5 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Node 2: Exit Server / Target */}
        <div className="rounded-3xl bg-[#0e111a] border border-white/[0.1] p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
                ۲
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-200">
                گره خروجی (اینترنت آزاد)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSshMode2(!sshMode2)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  sshMode2
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/[0.04] text-gray-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>SSH</span>
              </button>
              {parsed2 && (
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {parsed2.protocol.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {!sshMode2 ? (
            <textarea
              value={config2Text}
              onChange={(e) => setConfig2Text(e.target.value)}
              placeholder="vless://... یا vmess://..."
              rows={4}
              dir="ltr"
              className="w-full min-h-[110px] p-3.5 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm leading-relaxed outline-none focus:border-cyan-500/50 resize-y text-left placeholder:text-gray-500"
              spellCheck={false}
            />
          ) : (
            <div className="space-y-2.5 text-xs sm:text-sm">
              <input
                type="text"
                value={ssh2Server}
                onChange={(e) => setSsh2Server(e.target.value)}
                placeholder="آدرس سرور SSH (IP یا دامنه)"
                dir="ltr"
                className="w-full p-3 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm outline-none focus:border-amber-500/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={ssh2User}
                  onChange={(e) => setSsh2User(e.target.value)}
                  placeholder="نام کاربری (root)"
                  dir="ltr"
                  className="w-full p-2.5 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm outline-none"
                />
                <input
                  type="password"
                  value={ssh2Pass}
                  onChange={(e) => setSsh2Pass(e.target.value)}
                  placeholder="رمز عبور"
                  dir="ltr"
                  className="w-full p-2.5 bg-[#07090f] border border-white/[0.08] rounded-xl text-white font-mono text-xs sm:text-sm outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Trigger */}
      <div>
        <button
          onClick={handleGenerate}
          disabled={!isReady}
          className="w-full h-14 sm:h-16 py-4 px-6 rounded-2xl font-black text-black bg-gradient-to-r from-cyan-400 to-blue-400 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:opacity-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-98 text-base sm:text-lg flex items-center justify-center gap-2.5"
        >
          <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          <span>تولید کانفیگ ترکیبی (Generate Chain)</span>
        </button>
      </div>

      {/* Output Result */}
      {generatedJson && (
        <div className="rounded-2xl bg-[#0e111a] border border-cyan-500/35 p-5 sm:p-7 shadow-2xl space-y-4 animate-fadeIn">
          {/* Engine Selector */}
          <div className="flex gap-2 p-1 bg-[#07090f] rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveTab('singbox')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'singbox'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sing-box (NekoBox)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('xray')}
              disabled={hasSSH}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'xray'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35 shadow-sm'
                  : hasSSH
                  ? 'opacity-30 cursor-not-allowed text-gray-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Xray Core
            </button>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={handleCopy}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                copied
                  ? 'bg-emerald-400 text-black'
                  : 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1]'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'کپی شد' : 'کپی JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل</span>
            </button>

            <button
              onClick={() => setShowQR(true)}
              className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] transition flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>کد QR</span>
            </button>
          </div>

          {/* Code Viewer */}
          <pre className="p-4 bg-[#07090f] border border-white/[0.06] rounded-xl font-mono text-[11px] text-cyan-300/80 overflow-x-auto whitespace-pre-wrap max-h-56 leading-relaxed text-left" dir="ltr">
            {JSON.stringify(generatedJson, null, 2)}
          </pre>
        </div>
      )}

      {/* QR Modal */}
      {generatedJson && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          title="Chained Proxy Config"
          data={JSON.stringify(generatedJson)}
          remark={activeRemark}
        />
      )}
    </div>
  );
};
