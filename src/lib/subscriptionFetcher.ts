import { safeAtob, extractLines } from './proxyParser';

export function isSubscriptionUrl(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.includes('\n')) {
    // If it has multiple lines, it's not a single subscription link
    const lines = extractLines(trimmed);
    if (lines.length === 1 && (lines[0].startsWith('http://') || lines[0].startsWith('https://'))) {
      return true;
    }
    return false;
  }
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function decodeSubscriptionContent(rawContent: string): string[] {
  const trimmed = rawContent.trim();
  if (!trimmed) return [];

  // 1. Try decoding as base64
  const decodedB64 = safeAtob(trimmed);
  if (decodedB64 && (decodedB64.includes('://') || decodedB64.includes('vmess://') || decodedB64.includes('vless://') || decodedB64.includes('trojan://'))) {
    return extractLines(decodedB64);
  }

  // 2. Otherwise treat as plaintext lines
  const lines = extractLines(trimmed);
  // Check if any line in lines is base64 itself (some providers do chunked b64)
  const result: string[] = [];
  for (const line of lines) {
    if (line.startsWith('vless://') || line.startsWith('trojan://') || line.startsWith('vmess://') || line.startsWith('ss://')) {
      result.push(line);
    } else {
      const lineDecoded = safeAtob(line);
      if (lineDecoded && lineDecoded.includes('://')) {
        result.push(...extractLines(lineDecoded));
      }
    }
  }

  return result.length > 0 ? result : lines;
}

export async function fetchSubscriptionConfigs(subUrl: string): Promise<{
  ok: boolean;
  configs?: string[];
  error?: string;
}> {
  const trimmed = subUrl.trim();
  if (!isSubscriptionUrl(trimmed)) {
    return { ok: false, error: 'آدرس سابسکریپشن نامعتبر است' };
  }

  // Strip hash/fragment
  let cleanUrl = trimmed;
  try {
    const u = new URL(trimmed);
    u.hash = '';
    cleanUrl = u.toString();
  } catch {}

  // 1. Try fetching via server-side proxy endpoint
  try {
    const proxyApiUrl = `/api/proxy/fetch-sub?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(proxyApiUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && typeof data.data === 'string') {
        const configs = decodeSubscriptionContent(data.data);
        if (configs.length > 0) {
          return { ok: true, configs };
        }
        return { ok: false, error: 'هیچ کانفیگی در این سابسکریپشن یافت نشد' };
      }
    }
  } catch {
    // Fall back to direct fetch
  }

  // 2. Direct browser fetch fallback
  try {
    const res = await fetch(cleanUrl, {
      headers: {
        'Accept': '*/*',
      },
    });
    if (res.ok) {
      const text = await res.text();
      const configs = decodeSubscriptionContent(text);
      if (configs.length > 0) {
        return { ok: true, configs };
      }
      return { ok: false, error: 'هیچ کانفیگی در این سابسکریپشن یافت نشد' };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: 'عدم دریافت سابسکریپشن: ' + msg };
  }

  return { ok: false, error: 'عدم دریافت محتوای سابسکریپشن از سرور' };
}
