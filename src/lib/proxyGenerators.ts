import { ParsedProxy } from './proxyParser';

export interface ChainConfigOptions {
  dnsServer: string;
  socksPort: number;
  logLevel: string;
}

// ===== Xray Outbound Builders =====
export function buildStreamSettings(params: ParsedProxy, isChain: boolean) {
  const stream: Record<string, unknown> = {};
  const netType = params.type || 'tcp';

  stream.network = netType;
  const security = params.security || 'none';
  stream.security = security;

  if (isChain) {
    stream.sockopt = {
      domainStrategy: 'UseIPv4',
      dialerProxy: 'proxy',
    };
  } else {
    stream.sockopt = {
      domainStrategy: 'UseIP',
    };
  }

  switch (netType) {
    case 'ws': {
      const wsSettings: Record<string, unknown> = {};
      if (params.host) wsSettings.host = params.host;
      if (params.path) wsSettings.path = params.path;
      if (!params.host && !params.path) wsSettings.path = '/';
      stream.wsSettings = wsSettings;
      break;
    }
    case 'grpc': {
      const grpcSettings: Record<string, unknown> = {};
      if (params.authority) grpcSettings.authority = params.authority;
      if (params.mode) grpcSettings.multiMode = params.mode === 'multi';
      if (params.serviceName) grpcSettings.serviceName = params.serviceName;
      stream.grpcSettings = grpcSettings;
      break;
    }
    case 'httpupgrade': {
      const httpupgradeSettings: Record<string, unknown> = {};
      if (params.host) httpupgradeSettings.host = params.host;
      httpupgradeSettings.path = params.path || '/';
      stream.httpupgradeSettings = httpupgradeSettings;
      break;
    }
    case 'tcp':
    case 'raw': {
      if (params.headerType === 'http') {
        const rawSettings: Record<string, unknown> = {
          header: {
            type: 'http',
            request: {
              headers: {} as Record<string, unknown>,
              path: params.path ? params.path.split(',') : ['/'],
              method: 'GET',
              version: '1.1',
            },
          },
        };
        if (params.host) {
          (rawSettings.header as { request: { headers: Record<string, unknown> } }).request.headers.Host =
            params.host.split(',');
        }
        stream.rawSettings = rawSettings;
      }
      break;
    }
  }

  if (security === 'tls') {
    const tlsSettings: Record<string, unknown> = {
      serverName: params.sni || params.server,
      fingerprint: params.fp || 'chrome',
      alpn: params.alpn ? params.alpn.split(',') : ['http/1.1'],
      allowInsecure: !!params.allowInsecure,
    };
    if (params.ech) {
      tlsSettings.echConfigList = params.ech;
    }
    stream.tlsSettings = tlsSettings;
  } else if (security === 'reality') {
    stream.realitySettings = {
      serverName: params.sni || params.server,
      fingerprint: params.fp || 'chrome',
      publicKey: params.pbk || '',
      shortId: params.sid || '',
      spiderX: params.spx || '',
      show: false,
      allowInsecure: !!params.allowInsecure,
    };
  }

  return stream;
}

export function buildProxyOutbound(params: ParsedProxy) {
  const streamSettings = buildStreamSettings(params, false);
  const outbound: Record<string, unknown> = {
    protocol: params.protocol === 'shadowsocks' ? 'shadowsocks' : params.protocol,
    tag: 'proxy',
  };

  switch (params.protocol) {
    case 'vless': {
      const users: Record<string, unknown>[] = [
        {
          id: params.uuid,
          encryption: params.encryption || 'none',
        },
      ];
      if (params.flow) users[0].flow = params.flow;
      outbound.settings = {
        vnext: [
          {
            address: params.server,
            port: params.port,
            users,
          },
        ],
      };
      break;
    }
    case 'vmess': {
      outbound.settings = {
        vnext: [
          {
            address: params.server,
            port: params.port,
            users: [
              {
                id: params.uuid,
                alterId: params.aid || 0,
                security: 'auto',
              },
            ],
          },
        ],
      };
      break;
    }
    case 'trojan': {
      outbound.settings = {
        servers: [
          {
            address: params.server,
            port: params.port,
            password: params.password,
          },
        ],
      };
      break;
    }
    case 'shadowsocks': {
      outbound.settings = {
        servers: [
          {
            address: params.server,
            port: params.port,
            method: params.method,
            password: params.password,
          },
        ],
      };
      break;
    }
    case 'socks':
    case 'http': {
      const servers: Record<string, unknown>[] = [
        {
          address: params.server,
          port: params.port,
        },
      ];
      if (params.user && params.pass) {
        servers[0].users = [
          {
            user: params.user,
            pass: params.pass,
          },
        ];
      }
      outbound.settings = { servers };
      break;
    }
    default:
      return null;
  }

  outbound.streamSettings = streamSettings;
  return outbound;
}

export function buildChainOutbound(params: ParsedProxy) {
  const streamSettings = buildStreamSettings(params, true);
  const outbound: Record<string, unknown> = {
    protocol: params.protocol === 'shadowsocks' ? 'shadowsocks' : params.protocol,
    tag: 'chain',
  };

  switch (params.protocol) {
    case 'vless': {
      outbound.settings = {
        vnext: [
          {
            address: params.server,
            port: params.port,
            users: [
              {
                id: params.uuid,
                encryption: params.encryption || 'none',
              },
            ],
          },
        ],
      };
      break;
    }
    case 'vmess': {
      outbound.settings = {
        vnext: [
          {
            address: params.server,
            port: params.port,
            users: [
              {
                id: params.uuid,
                alterId: params.aid || 0,
                security: 'auto',
              },
            ],
          },
        ],
      };
      break;
    }
    case 'trojan': {
      outbound.settings = {
        servers: [
          {
            address: params.server,
            port: params.port,
            password: params.password,
          },
        ],
      };
      break;
    }
    case 'shadowsocks': {
      outbound.settings = {
        servers: [
          {
            address: params.server,
            port: params.port,
            method: params.method,
            password: params.password,
          },
        ],
      };
      break;
    }
    case 'socks':
    case 'http': {
      const servers: Record<string, unknown>[] = [
        {
          address: params.server,
          port: params.port,
        },
      ];
      if (params.user && params.pass) {
        servers[0].users = [
          {
            user: params.user,
            pass: params.pass,
          },
        ];
      }
      outbound.settings = { servers };
      break;
    }
    default:
      return null;
  }

  outbound.streamSettings = streamSettings;
  return outbound;
}

// ===== Full Xray Config Generator =====
export function generateFullConfig(
  config1: ParsedProxy,
  config2: ParsedProxy,
  options: ChainConfigOptions
) {
  const proxyOutbound = buildProxyOutbound(config1);
  const chainOutbound = buildChainOutbound(config2);
  const remark = `🔗 ${config1.protocol.toUpperCase()} → ${config2.protocol.toUpperCase()} | ${config2.server}:${config2.port}`;

  const fullConfig = {
    remarks: remark,
    log: {
      loglevel: options.logLevel,
    },
    dns: {
      servers: [
        {
          address: options.dnsServer,
          tag: 'remote-dns',
        },
      ],
      queryStrategy: 'UseIP',
      tag: 'dns',
    },
    inbounds: [
      {
        listen: '127.0.0.1',
        port: options.socksPort,
        protocol: 'socks',
        settings: {
          auth: 'noauth',
          udp: true,
        },
        tag: 'mixed-in',
        sniffing: {
          enabled: true,
          destOverride: ['http', 'tls'],
        },
      },
    ],
    outbounds: [
      chainOutbound,
      proxyOutbound,
      {
        protocol: 'dns',
        tag: 'dns-out',
      },
      {
        protocol: 'freedom',
        tag: 'direct',
        settings: {
          domainStrategy: 'UseIP',
        },
      },
      {
        protocol: 'blackhole',
        tag: 'block',
      },
    ],
    routing: {
      domainStrategy: 'IPIfNonMatch',
      rules: [
        {
          inboundTag: ['remote-dns'],
          outboundTag: 'proxy',
          type: 'field',
        },
        {
          network: 'tcp',
          outboundTag: 'chain',
          type: 'field',
        },
        {
          protocol: ['dns'],
          outboundTag: 'dns-out',
          type: 'field',
        },
      ],
    },
  };

  return { config: fullConfig, remark };
}

// ===== Sing-box Outbound Builder =====
export function buildSingboxOutbound(
  params: ParsedProxy,
  tag: string,
  detourTag: string | null
) {
  const outbound: Record<string, unknown> = {
    tag,
    type: params.protocol === 'shadowsocks' ? 'shadowsocks' : params.protocol,
  };

  if (detourTag) {
    outbound.detour = detourTag;
  }

  outbound.server = params.server;
  outbound.server_port = params.port;

  switch (params.protocol) {
    case 'vless':
      outbound.uuid = params.uuid;
      outbound.packet_encoding = '';
      outbound.network = 'tcp';
      if (params.flow) outbound.flow = params.flow;
      break;
    case 'vmess':
      outbound.uuid = params.uuid;
      outbound.security = 'auto';
      outbound.alter_id = params.aid || 0;
      outbound.network = 'tcp';
      break;
    case 'trojan':
      outbound.password = params.password;
      outbound.network = 'tcp';
      break;
    case 'shadowsocks':
      outbound.method = params.method;
      outbound.password = params.password;
      outbound.network = 'tcp';
      break;
    case 'socks':
      outbound.version = '5';
      outbound.network = 'tcp';
      if (params.user && params.pass) {
        outbound.username = params.user;
        outbound.password = params.pass;
      }
      break;
    case 'http':
      if (params.user && params.pass) {
        outbound.username = params.user;
        outbound.password = params.pass;
      }
      break;
    case 'ssh':
      outbound.type = 'ssh';
      outbound.user = params.user || 'root';
      outbound.password = params.password;
      return outbound;
    default:
      return outbound;
  }

  const security = params.security || 'none';
  if (security === 'tls' || security === 'reality') {
    const tls: Record<string, unknown> = {
      enabled: true,
      server_name: params.sni || params.host || params.server,
    };
    if (params.allowInsecure) tls.insecure = true;
    if (params.alpn) {
      const alpnList = params.alpn.split(',').filter((v) => v && v !== 'h2');
      if (alpnList.length) tls.alpn = alpnList;
    }
    if (params.fp) {
      tls.utls = {
        enabled: true,
        fingerprint: params.fp,
      };
    }
    if (security === 'reality' && params.pbk) {
      tls.reality = {
        enabled: true,
        public_key: params.pbk,
        short_id: params.sid || '',
      };
    }
    if (params.ech) {
      const echQueryServer = params.ech.split('+')[0];
      tls.record_fragment = false;
      tls.ech = {
        enabled: true,
        query_server_name: echQueryServer || params.sni || params.server,
      };
    }
    outbound.tls = tls;
  }

  const transportType = params.type || 'tcp';
  switch (transportType) {
    case 'ws': {
      const wsTransport: Record<string, unknown> = {
        type: 'ws',
        path: (params.path || '/').split('?ed=')[0],
        headers: {} as Record<string, unknown>,
      };
      if (params.host) (wsTransport.headers as Record<string, unknown>).Host = params.host;
      const edMatch = (params.path || '').match(/[?&]ed=(\d+)/);
      if (edMatch) {
        wsTransport.max_early_data = parseInt(edMatch[1]);
        wsTransport.early_data_header_name = 'Sec-WebSocket-Protocol';
      }
      outbound.transport = wsTransport;
      break;
    }
    case 'grpc': {
      outbound.transport = {
        type: 'grpc',
        service_name: params.serviceName || '',
      };
      break;
    }
    case 'httpupgrade': {
      outbound.transport = {
        type: 'httpupgrade',
        host: params.host,
        path: (params.path || '/').split('?ed=')[0],
      };
      break;
    }
    case 'tcp': {
      if (params.headerType === 'http') {
        outbound.transport = {
          type: 'http',
          host: params.host ? params.host.split(',') : undefined,
          path: params.path || '/',
          method: 'GET',
          headers: {
            Connection: ['keep-alive'],
            'Content-Type': ['application/octet-stream'],
          },
        };
      }
      break;
    }
  }

  if (params.tfo) outbound.tcp_fast_open = true;
  return outbound;
}

// ===== Sing-box Standard Config Generator =====
export function generateSingboxConfig(
  config1: ParsedProxy,
  config2: ParsedProxy,
  options: ChainConfigOptions
) {
  const remark = `🔗 ${config1.protocol.toUpperCase()} → ${config2.protocol.toUpperCase()} | ${config2.server}:${config2.port}`;
  const proxyOutbound = buildSingboxOutbound(config1, 'proxy', null);
  const chainOutbound = buildSingboxOutbound(config2, 'chain', 'proxy');

  const sbLogLevel =
    options.logLevel === 'none'
      ? undefined
      : options.logLevel === 'warning'
      ? 'warn'
      : options.logLevel;

  let dnsHost = '8.8.8.8';
  let dnsType = 'https';
  try {
    const dnsUrl = new URL(options.dnsServer);
    dnsHost = dnsUrl.hostname;
    dnsType = dnsUrl.protocol.replace(':', '');
  } catch {}

  const bypassDomains = new Set<string>();
  [config1, config2].forEach((cfg) => {
    if (cfg.server && !cfg.server.match(/^(?:\d{1,3}\.){3}\d{1,3}$/)) {
      bypassDomains.add(cfg.server);
    }
    if (cfg.sni) bypassDomains.add(cfg.sni);
    if (cfg.host) {
      cfg.host.split(',').forEach((h) => bypassDomains.add(h.trim()));
    }
    if (cfg.ech) {
      const echDomain = cfg.ech.split('+')[0];
      if (echDomain) bypassDomains.add(echDomain);
    }
  });

  const singboxConfig = {
    log: {
      disabled: options.logLevel === 'none',
      level: sbLogLevel,
      timestamp: true,
    },
    dns: {
      servers: [
        {
          type: dnsType,
          server: dnsHost,
          detour: 'chain',
          tag: 'dns-remote',
        },
        {
          type: 'local',
          tag: 'dns-direct',
        },
      ],
      rules: [
        {
          clash_mode: 'Direct',
          server: 'dns-direct',
        },
        {
          clash_mode: 'Global',
          server: 'dns-remote',
        },
        {
          domain: Array.from(bypassDomains),
          server: 'dns-direct',
        },
      ],
      strategy: 'ipv4_only',
      independent_cache: true,
    },
    inbounds: [
      {
        type: 'tun',
        tag: 'tun-in',
        address: ['172.19.0.1/28'],
        mtu: 9000,
        auto_route: true,
        strict_route: true,
        stack: 'mixed',
      },
      {
        type: 'mixed',
        tag: 'mixed-in',
        listen: '127.0.0.1',
        listen_port: 2080,
      },
    ],
    outbounds: [
      chainOutbound,
      proxyOutbound,
      {
        type: 'direct',
        tag: 'direct',
      },
    ],
    route: {
      rules: [
        {
          ip_cidr: '172.19.0.2',
          action: 'hijack-dns',
        },
        {
          domain: Array.from(bypassDomains),
          outbound: 'direct',
        },
        {
          clash_mode: 'Direct',
          outbound: 'direct',
        },
        {
          action: 'sniff',
        },
        {
          protocol: 'dns',
          action: 'hijack-dns',
        },
        {
          ip_is_private: true,
          outbound: 'direct',
        },
        {
          network: 'udp',
          action: 'reject',
        },
      ],
      auto_detect_interface: true,
      default_domain_resolver: {
        server: 'dns-direct',
        strategy: 'ipv4_only',
        rewrite_ttl: 60,
      },
      final: 'chain',
    },
    ntp: {
      enabled: true,
      server: 'time.cloudflare.com',
      server_port: 123,
      domain_resolver: 'dns-direct',
      interval: '30m',
      write_to_system: false,
    },
    experimental: {
      cache_file: {
        enabled: true,
        store_fakeip: true,
      },
      clash_api: {
        external_controller: '127.0.0.1:9090',
        external_ui: 'ui',
        default_mode: 'Rule',
        external_ui_download_url:
          'https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip',
        external_ui_download_detour: 'direct',
      },
    },
  };

  return { config: singboxConfig, remark };
}

// ===== Nekoray Config Generator =====
export function generateSingboxClientConfig(
  config1: ParsedProxy,
  config2: ParsedProxy,
  options: ChainConfigOptions
) {
  const remark = `🔗 NEKORAY: ${config1.protocol.toUpperCase()} → ${config2.protocol.toUpperCase()} | ${config2.server}:${config2.port}`;
  const hop1Outbound = buildSingboxOutbound(config1, 'hop-1', null);
  if (config1.protocol === 'vless' && !hop1Outbound.packet_encoding) {
    hop1Outbound.packet_encoding = 'xudp';
  }

  const proxyOutbound = buildSingboxOutbound(config2, 'proxy', 'hop-1');
  if (config2.protocol === 'vless' && !proxyOutbound.packet_encoding) {
    proxyOutbound.packet_encoding = 'xudp';
  }

  const sbLogLevel =
    options.logLevel === 'none'
      ? 'info'
      : options.logLevel === 'warning'
      ? 'warn'
      : options.logLevel;

  const singboxClientConfig = {
    log: {
      level: sbLogLevel,
    },
    dns: {
      servers: [
        {
          address: options.dnsServer,
          detour: 'proxy',
          tag: 'dns-remote',
        },
        {
          address: '1.1.1.1',
          detour: 'direct',
          tag: 'dns-direct',
        },
      ],
      rules: [
        {
          outbound: 'any',
          server: 'dns-direct',
        },
      ],
    },
    inbounds: [
      {
        listen: '127.0.0.1',
        listen_port: 2080,
        sniff: true,
        tag: 'mixed-in',
        type: 'mixed',
      },
    ],
    outbounds: [
      hop1Outbound,
      proxyOutbound,
      {
        tag: 'direct',
        type: 'direct',
      },
      {
        tag: 'dns-out',
        type: 'dns',
      },
    ],
    route: {
      auto_detect_interface: true,
      final: 'proxy',
      rules: [
        {
          outbound: 'dns-out',
          protocol: 'dns',
        },
      ],
    },
  };

  return { config: singboxClientConfig, remark };
}

// ===== Nekobox Config Generator (Android Tun Optimized) =====
export function generateNekoboxConfig(
  config1: ParsedProxy,
  config2: ParsedProxy,
  options: ChainConfigOptions
) {
  const remark = `🔗 NEKOBOX: ${config1.protocol.toUpperCase()} → ${config2.protocol.toUpperCase()} | ${config2.server}:${config2.port}`;
  const hop1Outbound = buildSingboxOutbound(config1, 'hop-1', null);
  if (config1.protocol === 'vless' && !hop1Outbound.packet_encoding) {
    hop1Outbound.packet_encoding = 'xudp';
  }

  const proxyOutbound = buildSingboxOutbound(config2, 'proxy', 'hop-1');
  if (config2.protocol === 'vless' && !proxyOutbound.packet_encoding) {
    proxyOutbound.packet_encoding = 'xudp';
  }

  const sbLogLevel =
    options.logLevel === 'none'
      ? 'info'
      : options.logLevel === 'warning'
      ? 'warn'
      : options.logLevel;

  const nekoboxConfig = {
    log: {
      level: sbLogLevel,
    },
    dns: {
      servers: [
        {
          tag: 'dns-remote',
          address: options.dnsServer,
          detour: 'proxy',
        },
        {
          tag: 'dns-direct',
          address: '1.1.1.1',
          detour: 'direct',
        },
      ],
      rules: [
        {
          outbound: 'any',
          server: 'dns-direct',
        },
      ],
    },
    inbounds: [
      {
        type: 'tun',
        tag: 'tun-in',
        interface_name: 'tun0',
        inet4_address: '172.19.0.1/30',
        auto_route: true,
        strict_route: true,
        stack: 'system',
        sniff: true,
        sniff_override_destination: false,
      },
    ],
    outbounds: [
      hop1Outbound,
      proxyOutbound,
      {
        type: 'direct',
        tag: 'direct',
      },
      {
        type: 'dns',
        tag: 'dns-out',
      },
    ],
    route: {
      auto_detect_interface: true,
      final: 'proxy',
      rules: [
        {
          protocol: 'dns',
          outbound: 'dns-out',
        },
      ],
    },
  };

  return { config: nekoboxConfig, remark };
}

// Deep links for Android Clients
export function getAndroidClientLinks(urlOrJson: string, name?: string) {
  const isUrl = urlOrJson.startsWith('vless://') || urlOrJson.startsWith('vmess://') || urlOrJson.startsWith('trojan://') || urlOrJson.startsWith('ss://');
  const encoded = encodeURIComponent(urlOrJson);
  const title = encodeURIComponent(name || 'Proxy Builder Config');

  return {
    v2rayng: isUrl ? `v2rayng://install-config?url=${encoded}` : null,
    singbox: `sing-box://import-remote-profile?url=data:application/json;base64,${btoa(urlOrJson)}#${title}`,
    nekobox: isUrl ? `nekobox://install-config?url=${encoded}` : null,
    clash: isUrl ? `clash://install-config?url=${encoded}` : null,
  };
}
