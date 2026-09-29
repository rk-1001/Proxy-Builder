import React, { useState } from 'react';
import {
  Power,
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Wifi,
  Radio,
  Sliders,
} from 'lucide-react';
import { backgroundRunner, RunnerState } from '../lib/backgroundService';
import { parseProxyURLSingle } from '../lib/proxyParser';

interface BackgroundRunnerViewProps {
  state: RunnerState;
}

export const BackgroundRunnerView: React.FC<BackgroundRunnerViewProps> = ({ state }) => {
  const [customInput, setCustomInput] = useState('');
  const [quickPingLoading, setQuickPingLoading] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (state.isActive) {
      backgroundRunner.stopService();
    } else {
      if (customInput.trim()) {
        const p = parseProxyURLSingle(customInput.trim());
        if (p && !('error' in p)) {
          backgroundRunner.startService({
            name: p.remark || `${p.protocol.toUpperCase()} ${p.server}:${p.port}`,
            server: p.server,
            port: p.port,
            protocol: p.protocol,
          });
          return;
        }
      }

      // If existing node or default
      const server = state.serverAddress || '1.1.1.1';
      const port = state.serverPort || 443;
      backgroundRunner.startService({
        name: state.configName !== 'No Config Loaded' ? state.configName : 'Default Direct Cloud Node',
        server,
        port,
        protocol: state.protocol || 'vless',
      });
    }
  };

  const handleManualPing = async () => {
    setQuickPingLoading(true);
    await backgroundRunner.testPing();
    setQuickPingLoading(false);
  };

  const handleCopyLogs = async () => {
    const text = state.logs.map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Hero Power Card */}
      <div className="bg-[#161623]/90 border border-[rgba(100,100,180,0.22)] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden">
        {/* Subtle background status glow */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
            state.isActive
              ? 'bg-radial-gradient from-[#4cdf86]/15 via-transparent to-transparent opacity-100'
              : 'opacity-0'
          }`}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Status Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-semibold mb-6 border transition-all">
            {state.isActive ? (
              <span className="flex items-center gap-1.5 text-[#4cdf86] bg-[#4cdf86]/10 px-3 py-1 rounded-full border border-[#4cdf86]/30">
                <span className="w-2 h-2 rounded-full bg-[#4cdf86] animate-ping" />
                <span>RUNNING IN BACKGROUND</span>
              </span>
            ) : state.status === 'connecting' ? (
              <span className="flex items-center gap-1.5 text-[#f0c040] bg-[#f0c040]/10 px-3 py-1 rounded-full border border-[#f0c040]/30 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>ESTABLISHING TUNNEL...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                <span>DISCONNECTED</span>
              </span>
            )}
          </div>

          {/* Master Power Toggle Button */}
          <div className="relative mb-6">
            {/* Outer animated rings */}
            {state.isActive && (
              <div className="absolute -inset-4 rounded-full border-2 border-[#4cdf86]/30 animate-ping pointer-events-none" />
            )}
            {state.isActive && (
              <div className="absolute -inset-2 rounded-full border border-[#3cd4f0]/40 pointer-events-none" />
            )}

            <button
              onClick={handleToggle}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1 border-4 transition-all duration-300 shadow-2xl active:scale-95 ${
                state.isActive
                  ? 'bg-gradient-to-b from-[#1b4332] to-[#081c15] border-[#4cdf86] text-[#4cdf86] shadow-[#4cdf86]/30 hover:shadow-[#4cdf86]/50'
                  : 'bg-gradient-to-b from-[#1e1e30] to-[#12121e] border-white/10 text-gray-400 hover:text-white hover:border-[#7c5cff]/50 hover:shadow-[#7c5cff]/20'
              }`}
            >
              <Power className={`w-12 h-12 transition-transform duration-300 ${state.isActive ? 'scale-110 drop-shadow-[0_0_12px_#4cdf86]' : ''}`} />
              <span className="text-[11px] font-bold tracking-wider uppercase mt-1">
                {state.isActive ? 'Stop' : 'Start'}
              </span>
            </button>
          </div>

          {/* Active Config Name & Details */}
          <div className="max-w-md w-full px-4">
            <h3 className="text-base font-bold text-white truncate mb-1">
              {state.configName}
            </h3>
            {state.serverAddress && (
              <p className="text-xs text-[#3cd4f0] font-mono truncate">
                {state.serverAddress}:{state.serverPort} • {state.protocol.toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row: Ping, Speeds, Uptime */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Latency */}
        <div className="bg-[#161623]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl relative group">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#3cd4f0]" />
              <span>Ping</span>
            </span>
            <button
              onClick={handleManualPing}
              disabled={quickPingLoading || !state.serverAddress}
              className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition"
              title="Test Ping Now"
            >
              <RefreshCw className={`w-3 h-3 ${quickPingLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {state.latencyMs ? (
              <span
                className={
                  state.latencyMs < 160
                    ? 'text-[#4cdf86]'
                    : state.latencyMs < 350
                    ? 'text-[#f0c040]'
                    : 'text-[#f05050]'
                }
              >
                {state.latencyMs} ms
              </span>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </div>
        </div>

        {/* Download Speed */}
        <div className="bg-[#161623]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center text-gray-400 mb-1 gap-1">
            <ArrowDown className="w-3.5 h-3.5 text-[#4cdf86]" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Download</span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {state.isActive ? `${state.downloadSpeedKbps} KB/s` : '0 KB/s'}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            Total: {formatBytes(state.totalDownBytes)}
          </div>
        </div>

        {/* Upload Speed */}
        <div className="bg-[#161623]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center text-gray-400 mb-1 gap-1">
            <ArrowUp className="w-3.5 h-3.5 text-[#5c8cff]" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Upload</span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {state.isActive ? `${state.uploadSpeedKbps} KB/s` : '0 KB/s'}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            Total: {formatBytes(state.totalUpBytes)}
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-[#161623]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center text-gray-400 mb-1 gap-1">
            <Clock className="w-3.5 h-3.5 text-[#7c5cff]" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Uptime</span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {state.isActive ? formatUptime(state.uptimeSeconds) : '00:00'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {state.isActive ? 'Active Tunnel' : 'Idle'}
          </div>
        </div>
      </div>

      {/* Quick Launch Custom Node */}
      <div className="bg-[#161623]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#7c5cff]" />
          <span>Switch Target Node / URL</span>
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Paste any VLESS, VMess, Trojan URL to run in background..."
            className="flex-1 p-2.5 bg-[#0f0f19] border border-white/10 rounded-xl text-white font-mono text-xs outline-none focus:border-[#7c5cff]"
          />
          <button
            onClick={handleToggle}
            className="px-4 py-2 bg-[#7c5cff]/20 hover:bg-[#7c5cff]/30 text-[#7c5cff] border border-[#7c5cff]/40 rounded-xl text-xs font-semibold whitespace-nowrap transition"
          >
            {state.isActive ? 'Switch & Run' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Live System Execution Logs */}
      <div className="bg-[#161623]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#3cd4f0] animate-pulse" />
            <h4 className="text-xs font-semibold text-white">Live Background Logs</h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 transition"
            >
              {copiedLogs ? <Check className="w-3 h-3 text-[#4cdf86]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Logs Terminal */}
        <div className="bg-[#05050f] border border-white/5 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5">
          {state.logs.length === 0 ? (
            <p className="text-gray-600">No logs yet. Service ready.</p>
          ) : (
            state.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-gray-600 select-none text-[10px]">{log.time}</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-[#4cdf86]'
                      : log.type === 'error'
                      ? 'text-[#f05050]'
                      : log.type === 'warning'
                      ? 'text-[#f0c040]'
                      : log.type === 'packet'
                      ? 'text-[#3cd4f0]'
                      : 'text-gray-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Android Background Tips */}
      <div className="bg-[#161623]/60 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#4cdf86]" />
          <span>Android Background Service Optimization</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          To ensure Android does not pause the proxy service in the background, set Battery Optimization for <strong>Proxy Builder</strong> to <em>"Unrestricted"</em> in Android App Settings, and lock the app card in Android Recent Apps.
        </p>
      </div>
    </div>
  );
};
