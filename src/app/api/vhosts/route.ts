import { NextResponse } from 'next/server';
import { VHostManager } from '@/lib/vhost';

interface VHost {
  serverName: string;
  documentRoot: string;
  enabled: boolean;
  serverAlias: string[];
  port: number;
  errorHandler404: string;
  compressSettings: {
    enabled: boolean;
    cacheDir: string;
    fileTypes: string[];
  };
  urlRewrite: {
    enabled: boolean;
    rules: {
      pattern: string;
      replacement: string;
    }[];
  };
  optimizations: {
    compress: boolean;
    cache: boolean;
    expires: boolean;
    etag: boolean;
    staticCache: boolean;
    proxyCache: boolean;
    gzip: boolean;
    keepalive: boolean;
  }
}

function generateVHostConfig(vhost: VHost): string {
  const config = [];
  
  config.push(`$HTTP["host"] == "${vhost.serverName}" {`);
  config.push(`    server.document-root = "${vhost.documentRoot}"`);
  
  if (vhost.serverAlias && vhost.serverAlias.length > 0) {
    config.push(`    server.name = "${[vhost.serverName, ...vhost.serverAlias].join(' ')}"`);
  }
  
  if (vhost.port && vhost.port !== 80) {
    config.push(`    $SERVER["socket"] == ":${vhost.port}" { }`);
  }

  // Add error handler
  if (vhost.errorHandler404) {
    config.push(`    server.error-handler-404 = "${vhost.errorHandler404}"`);
  }

  // Add compression settings
  if (vhost.compressSettings?.enabled) {
    config.push(`    compress.cache-dir = "${vhost.compressSettings.cacheDir}"`);
    config.push('    compress.filetype = (');
    vhost.compressSettings.fileTypes.forEach((type, index, array) => {
      config.push(`        "${type}"${index === array.length - 1 ? '' : ','}`);
    });
    config.push('    )');
  }

  // Add URL rewrite rules
  if (vhost.urlRewrite?.enabled && vhost.urlRewrite.rules.length > 0) {
    config.push('    url.rewrite-if-not-file = (');
    vhost.urlRewrite.rules.forEach((rule, index, array) => {
      config.push(`        "${rule.pattern}" => "${rule.replacement}"${index === array.length - 1 ? '' : ','}`);
    });
    config.push('    )');
  }

  // Add optimizations
  if (vhost.optimizations) {
    if (vhost.optimizations.compress) config.push('    compress.cache-dir = "/var/cache/lighttpd/compress/"');
    if (vhost.optimizations.cache) config.push('    server.max-keep-alive-requests = 100');
    if (vhost.optimizations.expires) config.push('    expire.url = ( "" => "access plus 1 months" )');
    if (vhost.optimizations.etag) config.push('    static-file.etags = "enable"');
    if (vhost.optimizations.staticCache) config.push('    server.stat-cache-engine = "simple"');
    if (vhost.optimizations.gzip) config.push('    compress.filetype = ( "text/plain" )');
    if (vhost.optimizations.keepalive) config.push('    server.max-keep-alive-idle = 5');
  }

  config.push('}');
  
  return config.join('\n');
}

const manager = new VHostManager();

export async function GET() {
  try {
    const vhosts = await manager.parseVHosts();
    return NextResponse.json(vhosts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get virtual hosts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const vhost: VHost = await request.json();
    const success = await manager.saveVHost(vhost);
    
    if (success) {
      return NextResponse.json({ message: 'Virtual host saved successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to save virtual host' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to save virtual host:', error);
    return NextResponse.json(
      { error: 'Failed to save virtual host' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const vhost: VHost = await request.json();
    const success = await manager.saveVHost(vhost);
    
    if (success) {
      return NextResponse.json({ message: 'Virtual host updated successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to update virtual host' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to update virtual host:', error);
    return NextResponse.json(
      { error: 'Failed to update virtual host' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { serverName } = await request.json();
    const success = await manager.deleteVHost(serverName);
    
    if (success) {
      return NextResponse.json({ message: 'Virtual host deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete virtual host' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete virtual host' },
      { status: 500 }
    );
  }
}
