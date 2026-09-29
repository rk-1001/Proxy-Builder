export interface ParsedProxy {
  protocol: 'vless' | 'vmess' | 'trojan' | 'shadowsocks' | 'socks' | 'http' | 'ssh';
  server: string;
  port: number;
  remark?: string;
  uuid?: string;
  password?: string;
  method?: string;
  user?: string;
  pass?: string;
  aid?: number;
  type?: string;
  headerType?: string;
  host?: string;
  path?: string;
  serviceName?: string;
  authority?: string;
  mode?: string;
  security?: string;
  sni?: string;
  fp?: string;
  alpn?: string;
  pbk?: string;
  sid?: string;
  spx?: string;
  flow?: string;
  encryption?: string;
  ech?: string;
  allowInsecure?: boolean;
  tfo?: boolean;
  error?: string;
}

export interface ParseError {
  error: string;
}

export type ParseResult = ParsedProxy | ParseError;

// ===== Base64 Helpers =====
export function safeAtob(str: string): string | null {
  if (!str) return null;
  try {
    const clean = str.trim().replace(/\s+/g, '');
    if (!/^[A-Za-z0-9+/=_-]+$/.test(clean)) return null;
    const padded = clean.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4;
    if (pad === 1) return null;
    const final = pad ? padded + '='.repeat(4 - pad) : padded;
    const decoded = decodeURIComponent(
      atob(final)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return decoded;
  } catch {
    try {
      const clean = str.trim().replace(/\s+/g, '');
      if (!/^[A-Za-z0-9+/=_-]+$/.test(clean)) return null;
      const padded = clean.replace(/-/g, '+').replace(/_/g, '/');
      const pad = padded.length % 4;
      if (pad === 1) return null;
      const final = pad ? padded + '='.repeat(4 - pad) : padded;
      const raw = atob(final);
      if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(raw)) return null;
      return raw;
    } catch {
      return null;
    }
  }
}

export function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export function extractLines(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function parseVless(url: string): ParseResult {
  try {
    const u = new URL(url);
    const params = Object.fromEntries(u.searchParams);
    return {
      protocol: 'vless',
      uuid: u.username || safeDecode(url.split('://')[1].split('@')[0]),
      server: u.hostname,
      port: parseInt(u.port) || 443,
      remark: safeDecode(u.hash.slice(1) || ''),
      type: params.type || 'tcp',
      headerType: params.headerType || 'none',
      host: params.host || undefined,
      path: params.path || undefined,
      serviceName: params.serviceName || undefined,
      authority: params.authority || undefined,
      mode: params.mode || undefined,
      security: params.security || 'none',
      sni: params.sni || undefined,
      fp: params.fp || 'chrome',
      alpn: params.alpn || undefined,
      pbk: params.pbk || undefined,
      sid: params.sid || undefined,
      spx: params.spx || undefined,
      flow: params.flow || undefined,
      encryption: params.encryption || 'none',
      ech: params.ech || undefined,
      allowInsecure:
        params.allowInsecure === '1' ||
        params.allowInsecure === 'true' ||
        params.insecure === '1' ||
        params.insecure === 'true',
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: 'Failed to parse VLESS URL: ' + msg };
  }
}

export function parseVmess(url: string): ParseResult {
  try {
    const b64 = url.replace(/^vmess:\/\//i, '');
    const decoded = safeAtob(b64);
    if (!decoded) return { error: 'Failed to decode VMess base64' };
    const config = JSON.parse(decoded);
    return {
      protocol: 'vmess',
      uuid: config.id,
      server: config.add,
      port: parseInt(config.port) || 443,
      aid: parseInt(config.aid) || 0,
      remark: config.ps || '',
      type: config.net || 'tcp',
      headerType: config.type || 'none',
      host: config.host || undefined,
      path: config.path || undefined,
      serviceName: config.path || undefined,
      authority: config.authority || undefined,
      security: config.tls || 'none',
      sni: config.sni || undefined,
      fp: config.fp || 'chrome',
      alpn: config.alpn || undefined,
      allowInsecure:
        config.tls === 'tls' &&
        (config.allowInsecure === 1 ||
          config.allowInsecure === true ||
          config.insecure === 1 ||
          config.insecure === true),
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: 'Failed to parse VMess URL: ' + msg };
  }
}

export function parseTrojan(url: string): ParseResult {
  try {
    const u = new URL(url);
    const params = Object.fromEntries(u.searchParams);
    return {
      protocol: 'trojan',
      password: safeDecode(u.username || url.split('://')[1].split('@')[0]),
      server: u.hostname,
      port: parseInt(u.port) || 443,
      remark: safeDecode(u.hash.slice(1) || ''),
      type: params.type || 'tcp',
      headerType: params.headerType || 'none',
      host: params.host || undefined,
      path: params.path || undefined,
      serviceName: params.serviceName || undefined,
      authority: params.authority || undefined,
      mode: params.mode || undefined,
      security: params.security || 'tls',
      sni: params.sni || undefined,
      fp: params.fp || 'chrome',
      alpn: params.alpn || undefined,
      pbk: params.pbk || undefined,
      sid: params.sid || undefined,
      spx: params.spx || undefined,
      ech: params.ech || undefined,
      allowInsecure:
        params.allowInsecure === '1' ||
        params.allowInsecure === 'true' ||
        params.insecure === '1' ||
        params.insecure === 'true',
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: 'Failed to parse Trojan URL: ' + msg };
  }
}

export function parseShadowsocks(url: string): ParseResult {
  try {
    let raw = url.replace(/^ss:\/\//i, '');
    const hashIdx = raw.indexOf('#');
    let remark = '';
    if (hashIdx !== -1) {
      remark = safeDecode(raw.slice(hashIdx + 1));
      raw = raw.slice(0, hashIdx);
    }
    let method: string | undefined;
    let password: string | undefined;
    let server: string | undefined;
    let port: number | undefined;

    if (raw.includes('@')) {
      const [userPart, hostPart] = raw.split('@');
      const decoded = safeAtob(userPart) || userPart;
      const colonIdx = decoded.indexOf(':');
      method = decoded.slice(0, colonIdx);
      password = decoded.slice(colonIdx + 1);
      const hostMatch = hostPart.match(/^(.+):(\d+)/);
      if (hostMatch) {
        server = hostMatch[1];
        port = parseInt(hostMatch[2]);
      }
    } else {
      const decoded = safeAtob(raw);
      if (!decoded) return { error: 'Failed to decode SS base64' };
      const match = decoded.match(/^(.+?):(.+)@(.+):(\d+)/);
      if (match) {
        method = match[1];
        password = match[2];
        server = match[3];
        port = parseInt(match[4]);
      }
    }
    if (!server || !port) return { error: 'Failed to parse Shadowsocks URL' };
    return {
      protocol: 'shadowsocks',
      method,
      password,
      server,
      port,
      remark,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: 'Failed to parse Shadowsocks URL: ' + msg };
  }
}

export function parseSocks(url: string): ParseResult {
  try {
    const target = url.trim();
    let remark = '';
    let user: string | undefined;
    let pass: string | undefined;
    let server: string | undefined;
    let port: number | undefined;

    const lower = target.toLowerCase();
    if (
      lower.startsWith('tg://socks') ||
      lower.startsWith('tg://socks5') ||
      lower.startsWith('https://t.me/socks') ||
      lower.startsWith('http://t.me/socks')
    ) {
      const u = new URL(
        /^tg:\/\//i.test(target)
          ? target.replace(/^tg:\/\/(socks5|socks)\?/i, 'http://localhost/?')
          : target
      );
      server =
        u.searchParams.get('server') ||
        u.searchParams.get('host') ||
        u.searchParams.get('ip') ||
        '';
      port = parseInt(u.searchParams.get('port') || '0') || 1080;
      user = u.searchParams.get('user') || u.searchParams.get('username') || undefined;
      pass = u.searchParams.get('pass') || u.searchParams.get('password') || undefined;
      const tgHash = u.hash.slice(1);
      remark = tgHash ? safeDecode(tgHash) : u.searchParams.get('remark') || '';
      if (!server) return { error: 'Failed to parse Telegram SOCKS URL: missing server' };
      return {
        protocol: 'socks',
        server,
        port,
        user,
        pass,
        remark,
      };
    }

    let body = target.replace(/^(socks5:\/\/|socks:\/\/)/i, '');
    const hashIdx = body.indexOf('#');
    if (hashIdx !== -1) {
      remark = safeDecode(body.slice(hashIdx + 1));
      body = body.slice(0, hashIdx);
    }
    if (!body.includes('@')) {
      const decodedBody = safeAtob(body);
      if (decodedBody && (decodedBody.includes(':') || decodedBody.includes('@'))) {
        if (!remark && decodedBody.includes('#')) {
          const dHashIdx = decodedBody.indexOf('#');
          remark = safeDecode(decodedBody.slice(dHashIdx + 1));
          body = decodedBody.slice(0, dHashIdx);
        } else {
          body = decodedBody;
        }
      }
    }
    let userPart = '';
    let hostPart = body;
    if (body.includes('@')) {
      const atIdx = body.lastIndexOf('@');
      userPart = body.slice(0, atIdx);
      hostPart = body.slice(atIdx + 1);
    }
    if (userPart) {
      if (userPart.includes(':')) {
        const colonIdx = userPart.indexOf(':');
        user = safeDecode(userPart.slice(0, colonIdx));
        pass = safeDecode(userPart.slice(colonIdx + 1));
      } else {
        const decodedUser = safeAtob(userPart);
        if (decodedUser && decodedUser.includes(':')) {
          const colonIdx = decodedUser.indexOf(':');
          user = decodedUser.slice(0, colonIdx);
          pass = decodedUser.slice(colonIdx + 1);
        } else {
          user = safeDecode(userPart);
        }
      }
    }
    let searchParams: URLSearchParams | null = null;
    if (hostPart.includes('?')) {
      const qIdx = hostPart.indexOf('?');
      try {
        searchParams = new URLSearchParams(hostPart.slice(qIdx + 1));
      } catch {}
      hostPart = hostPart.slice(0, qIdx);
    }
    hostPart = hostPart.replace(/\/+$/, '');
    if (hostPart.startsWith('[')) {
      const closeBracket = hostPart.indexOf(']');
      if (closeBracket !== -1) {
        server = hostPart.slice(1, closeBracket);
        const portPart = hostPart.slice(closeBracket + 1);
        port = portPart.startsWith(':') ? parseInt(portPart.slice(1)) || 1080 : 1080;
      } else {
        server = hostPart;
        port = 1080;
      }
    } else if (hostPart.includes(':')) {
      const lastColon = hostPart.lastIndexOf(':');
      server = hostPart.slice(0, lastColon);
      port = parseInt(hostPart.slice(lastColon + 1)) || 1080;
    } else {
      server = hostPart;
      port = 1080;
    }

    if (searchParams) {
      if (!user && (searchParams.get('user') || searchParams.get('username'))) {
        user = searchParams.get('user') || searchParams.get('username') || undefined;
      }
      if (!pass && (searchParams.get('pass') || searchParams.get('password'))) {
        pass = searchParams.get('pass') || searchParams.get('password') || undefined;
      }
      if (!remark && searchParams.get('remark')) {
        remark = searchParams.get('remark') || '';
      }
    }

    if (!server) return { error: 'Failed to parse SOCKS URL: missing server' };
    return {
      protocol: 'socks',
      server,
      port,
      user,
      pass,
      remark,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: 'Failed to parse SOCKS URL: ' + msg };
  }
}

export function parseHttp(url: string): ParseResult {
  try {
    const target = url.trim();
    let remark = '';
    let user: string | undefined;
    let pass: string | undefined;
    let server: string | undefined;
    let port = 80;

    let body = target.replace(/^(https:\/\/|http:\/\/)/i, '');
    const hashIdx = body.indexOf('#');
    if (hashIdx !== -1) {
      remark = safeDecode(body.slice(hashIdx + 1));
      body = body.slice(0, hashIdx);
    }
    if (!body.includes('@')) {
      const decodedBody = safeAtob(body);
      if (decodedBody && (decodedBody.includes(':') || decodedBody.includes('@'))) {
        if (!remark && decodedBody.includes('#')) {
          const dHashIdx = decodedBody.indexOf('#');
          remark = safeDecode(decodedBody.slice(dHashIdx + 1));
          body = decodedBody.slice(0, dHashIdx);
        } else {
          body = decodedBody;
        }
      }
    }
    let userPart = '';
    let hostPart = body;
    if (body.includes('@')) {
      const atIdx = body.lastIndexOf('@');
      userPart = body.slice(0, atIdx);
      hostPart = body.slice(atIdx + 1);
    }
    if (userPart) {
      if (userPart.includes(':')) {
        const colonIdx = userPart.indexOf(':');
        user = safeDecode(userPart.slice(0, colonIdx));
        pass = safeDecode(userPart.slice(colonIdx + 1));
      } else {
        const decodedUser = safeAtob(userPart);
        if (decodedUser && decodedUser.includes(':')) {
          const colonIdx = decodedUser.indexOf(':');
          user = decodedUser.slice(0, colonIdx);
          pass = decodedUser.slice(colonIdx + 1);
        } else {
          user = safeDecode(userPart);
        }
      }
    }
    let searchParams: URLSearchParams | null = null;
    if (hostPart.includes('?')) {
      const qIdx = hostPart.indexOf('?');
      try {
        searchParams = new URLSearchParams(hostPart.slice(qIdx + 1));
      } catch {}
      hostPart = hostPart.slice(0, qIdx);
    }
    hostPart = hostPart.replace(/\/+$/, '');
    if (hostPart.startsWith('[')) {
      const closeBracket = hostPart.indexOf(']');
      if (closeBracket !== -1) {
        server = hostPart.slice(1, closeBracket);
        const portPart = hostPart.slice(closeBracket + 1);
        port = portPart.startsWith(':') ? parseInt(portPart.slice(1)) || 80 : 80;
      } else {
        server = hostPart;
        port = 80;
      }
    } else if (hostPart.includes(':')) {
      const lastColon = hostPart.lastIndexOf(':');
      server = hostPart.slice(0, lastColon);
      port = parseInt(hostPart.slice(lastColon + 1)) || 80;
    } else {
      server = hostPart;
      port = 80;
    }

    if (searchParams) {
      if (!user && (searchParams.get('user') || searchParams.get('username'))) {
        user = searchParams.get('user') || searchParams.get('username') || undefined;
      }
      if (!pass && (searchParams.get('pass') || searchParams.get('password'))) {
        pass = searchParams.get('pass') || searchParams.get('password') || undefined;
      }
      if (!remark && searchParams.get('remark')) {
        remark = searchParams.get('remark') || '';
      }
    }

    if (!server) return { error: 'Failed to parse HTTP URL: missing server' };
    return {
      protocol: 'http',
      server,
      port,
      user,
      pass,
      remark,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: 'Failed to parse HTTP URL: ' + msg };
  }
}

export function parseSSHForm(fields: {
  server: string;
  port?: number | string;
  user?: string;
  password?: string;
}): ParseResult {
  const server = fields.server.trim();
  const port = Number(fields.port) || 22;
  const user = fields.user?.trim() || 'root';
  const password = fields.password || '';

  if (!server) return { error: 'Server address is required for SSH' };
  if (!password) return { error: 'Password is required for SSH' };

  return {
    protocol: 'ssh',
    server,
    port,
    user,
    password,
    remark: `SSH ${server}:${port}`,
  };
}

export function parseProxyURLSingle(raw: string): ParseResult | null {
  const url = raw.trim();
  if (!url) return null;
  const lower = url.toLowerCase();

  if (lower.startsWith('vless://')) return parseVless(url);
  if (lower.startsWith('vmess://')) return parseVmess(url);
  if (lower.startsWith('trojan://')) return parseTrojan(url);
  if (lower.startsWith('ss://')) return parseShadowsocks(url);
  if (
    lower.startsWith('tg://socks') ||
    lower.startsWith('tg://socks5') ||
    lower.startsWith('https://t.me/socks') ||
    lower.startsWith('http://t.me/socks') ||
    lower.startsWith('socks://') ||
    lower.startsWith('socks5://')
  ) {
    return parseSocks(url);
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) return parseHttp(url);

  try {
    const decoded = safeAtob(url);
    if (decoded) {
      if (decoded.includes('"add"')) {
        return parseVmess('vmess://' + url);
      }
      const decodedLower = decoded.toLowerCase();
      if (
        decodedLower.startsWith('vless://') ||
        decodedLower.startsWith('vmess://') ||
        decodedLower.startsWith('trojan://') ||
        decodedLower.startsWith('ss://') ||
        decodedLower.startsWith('socks://') ||
        decodedLower.startsWith('socks5://') ||
        decodedLower.startsWith('http://') ||
        decodedLower.startsWith('https://') ||
        decodedLower.startsWith('tg://')
      ) {
        return parseProxyURLSingle(decoded);
      }
      if (decoded.includes('@') && decoded.includes(':')) {
        return parseSocks('socks5://' + decoded);
      }
    }
  } catch {}

  return { error: 'Unknown protocol. Supported: vless, vmess, trojan, ss, socks, http' };
}

export function parseProxyURL(raw: string): ParseResult | ParseResult[] | null {
  const lines = extractLines(raw);
  if (lines.length === 0) return null;
  if (lines.length === 1) return parseProxyURLSingle(lines[0]);

  const parsedList = lines.map((line) => parseProxyURLSingle(line)).filter(Boolean) as ParseResult[];
  const validList = parsedList.filter((p) => !('error' in p));
  if (validList.length > 0) {
    return validList;
  }
  return parsedList[0] || { error: 'Unknown protocol. Supported: vless, vmess, trojan, ss, socks, http' };
}

// ===== URL Enhancer =====
export interface EnhanceOptions {
  server?: string;
  fp?: string;
  cs?: string;
  fm?: string;
}

export function enhanceURL(raw: string, options: EnhanceOptions): { url?: string; error?: string } {
  const url = raw.trim();
  if (!url) return { error: 'No URL provided' };
  if (!url.startsWith('vless://') && !url.startsWith('trojan://')) {
    return { error: 'Only VLESS and Trojan URLs are supported' };
  }

  let u: URL;
  try {
    u = new URL(url);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: 'Failed to parse URL: ' + msg };
  }

  const params = u.searchParams;
  const security = params.get('security') || 'none';

  // Server override
  const server = options.server?.trim();
  if (server) {
    const host = server.includes(':') && !server.startsWith('[') ? '[' + server + ']' : server;
    try {
      u.hostname = host;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: 'Invalid server address: ' + msg };
    }
  }

  // Fingerprint
  const fp = options.fp?.trim();
  if (fp && fp !== 'none') {
    params.set('fp', fp);
  }

  // Cipher suites & Fragment mask (only meaningful with TLS or reality)
  if (security === 'tls' || security === 'reality') {
    const cs = options.cs?.trim();
    if (cs) {
      params.set('cs', cs);
    }
    const fm = options.fm?.trim();
    if (fm) {
      params.set('fm', fm);
    }
  }

  // URLSearchParams encodes spaces as '+', but v2ray clients use '%20'
  u.search = u.search.replace(/\+/g, '%20');
  return { url: u.toString() };
}
