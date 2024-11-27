import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface VHost {
  serverName: string;
  documentRoot: string;
  enabled: boolean;
  port?: number;
  serverAlias?: string[];
  errorHandler404?: string;
  compressSettings?: {
    enabled: boolean;
    cacheDir: string;
    fileTypes: string[];
  };
  urlRewrite?: {
    enabled: boolean;
    rules: {
      pattern: string;
      replacement: string;
    }[];
  };
  ssl?: boolean;
  sslCertFile?: string;
  sslKeyFile?: string;
  optimizations?: {
    compress?: boolean;
    cache?: boolean;
    expires?: boolean;
    etag?: boolean;
    staticCache?: boolean;
    proxyCache?: boolean;
    gzip?: boolean;
    keepalive?: boolean;
  };
}

export class VHostManager {
  private confPath: string;
  private availablePath: string;
  private enabledPath: string;
  private mainVHostFile: string;
  private useMainFile: boolean;

  constructor(
    confPath = '/etc/lighttpd/conf-enabled/50-vhosts.conf',
    availablePath = '/etc/lighttpd/conf-available',
    enabledPath = '/etc/lighttpd/conf-enabled',
    useMainFile = true
  ) {
    this.confPath = confPath;
    this.availablePath = availablePath;
    this.enabledPath = enabledPath;
    this.mainVHostFile = confPath;
    this.useMainFile = useMainFile;
  }

  async parseVHosts(): Promise<VHost[]> {
    try {
      const content = await fs.readFile(this.mainVHostFile, 'utf-8');
      const vhosts: VHost[] = [];
      const lines = content.split('\n');
      let currentVHost: Partial<VHost> = {};
      let isCommented = false;
      let currentLines: string[] = [];
      let currentCompressSettings: VHost['compressSettings'] = {
        enabled: false,
        cacheDir: '',
        fileTypes: []
      };
      let currentUrlRewrite: VHost['urlRewrite'] = {
        enabled: false,
        rules: []
      };

      const processCurrentVHost = () => {
        if (Object.keys(currentVHost).length > 0) {
          if (currentCompressSettings.cacheDir || currentCompressSettings.fileTypes.length > 0) {
            currentVHost.compressSettings = currentCompressSettings;
          }
          if (currentUrlRewrite.rules.length > 0) {
            currentVHost.urlRewrite = currentUrlRewrite;
          }
          vhosts.push(currentVHost as VHost);
          currentVHost = {};
          currentLines = [];
          currentCompressSettings = {
            enabled: false,
            cacheDir: '',
            fileTypes: []
          };
          currentUrlRewrite = {
            enabled: false,
            rules: []
          };
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (trimmedLine === '') continue;

        // Check if this is a host definition line
        const hostMatch = trimmedLine.match(/^#?\s*\$HTTP\["host"\]/);
        if (hostMatch) {
          processCurrentVHost();
          
          // Determine if this vhost block is commented
          isCommented = line.trimStart().startsWith('#');
          
          // Extract server name with or without comment
          const serverNameMatch = trimmedLine.match(/\$HTTP\["host"\]\s*==\s*"([^"]+)"/);
          if (!serverNameMatch) {
            console.error('Failed to parse hostname from line:', trimmedLine);
          }
          currentVHost = {
            enabled: !isCommented,
            serverName: serverNameMatch?.[1] || ''
          };
          currentLines = [line];
          continue;
        }

        // If we're in a vhost block
        if (Object.keys(currentVHost).length > 0) {
          currentLines.push(line);
          
          // Remove comment marker for parsing if line is commented
          const parseLine = trimmedLine.replace(/^#\s*/, '');

          if (parseLine.startsWith('server.document-root')) {
            currentVHost.documentRoot = parseLine.match(/"([^"]+)"/)?.[1] || '';
          } else if (parseLine.startsWith('server.port')) {
            currentVHost.port = parseInt(parseLine.match(/=\s*(\d+)/)?.[1] || '80');
          } else if (parseLine.startsWith('server.name')) {
            const aliases = parseLine.match(/"([^"]+)"/)?.[1].split(' ') || [];
            currentVHost.serverAlias = aliases.filter(a => a !== currentVHost.serverName);
          } else if (parseLine.startsWith('server.error-handler-404')) {
            currentVHost.errorHandler404 = parseLine.match(/"([^"]+)"/)?.[1] || '';
          } else if (parseLine.startsWith('compress.cache-dir')) {
            currentCompressSettings.enabled = true;
            currentCompressSettings.cacheDir = parseLine.match(/"([^"]+)"/)?.[1] || '';
          } else if (parseLine.startsWith('compress.filetype')) {
            currentCompressSettings.enabled = true;
            const fileTypesMatch = parseLine.match(/\((.*)\)/);
            if (fileTypesMatch) {
              currentCompressSettings.fileTypes = fileTypesMatch[1]
                .split(',')
                .map(type => type.trim().replace(/["']/g, ''))
                .filter(type => type !== '');
            }
          } else if (parseLine.startsWith('url.rewrite-if-not-file')) {
            currentUrlRewrite.enabled = true;
            const rulesMatch = parseLine.match(/\((.*)\)/s);
            if (rulesMatch) {
              const rulesStr = rulesMatch[1];
              const ruleMatches = rulesStr.matchAll(/"([^"]+)"\s*=>\s*"([^"]+)"/g);
              for (const match of ruleMatches) {
                currentUrlRewrite.rules.push({
                  pattern: match[1],
                  replacement: match[2]
                });
              }
            }
          } else if (parseLine.startsWith('ssl.engine')) {
            currentVHost.ssl = parseLine.includes('enable');
          } else if (parseLine.startsWith('ssl.pemfile')) {
            currentVHost.sslCertFile = parseLine.match(/"([^"]+)"/)?.[1] || '';
          } else if (parseLine.startsWith('ssl.keyfile')) {
            currentVHost.sslKeyFile = parseLine.match(/"([^"]+)"/)?.[1] || '';
          } else if (parseLine.startsWith('compress.cache-dir')) {
            currentVHost.optimizations = currentVHost.optimizations || {};
            currentVHost.optimizations.compress = true;
          } else if (parseLine.startsWith('server.stat-cache-engine')) {
            currentVHost.optimizations = currentVHost.optimizations || {};
            currentVHost.optimizations.cache = true;
          } else if (parseLine.startsWith('expire.url')) {
            currentVHost.optimizations = currentVHost.optimizations || {};
            currentVHost.optimizations.expires = true;
          } else if (parseLine.startsWith('etag.use-inode')) {
            currentVHost.optimizations = currentVHost.optimizations || {};
            currentVHost.optimizations.etag = true;
          } else if (parseLine.startsWith('proxy-cache.enable')) {
            currentVHost.optimizations = currentVHost.optimizations || {};
            currentVHost.optimizations.proxyCache = true;
          } else if (parseLine.startsWith('server.max-keep-alive-requests')) {
            currentVHost.optimizations = currentVHost.optimizations || {};
            currentVHost.optimizations.keepalive = true;
          }

          // If we find the closing brace, process this vhost
          if (parseLine === '}') {
            processCurrentVHost();
          }
        }
      }

      // Process any remaining vhost
      processCurrentVHost();

      return vhosts;
    } catch (error) {
      console.error('Failed to parse vhosts:', error);
      throw error;
    }
  }

  async saveVHost(vhost: VHost): Promise<boolean> {
    try {
      if (!this.useMainFile) {
        // Original behavior - separate files
        const vhostConfig = this.generateVHostConfig(vhost);
        const filename = `${vhost.serverName}.conf`;
        const filePath = path.join(this.availablePath, filename);
        await fs.writeFile(filePath, vhostConfig);

        if (vhost.enabled) {
          const enabledPath = path.join(this.enabledPath, filename);
          try {
            await fs.symlink(filePath, enabledPath);
          } catch (error) {
            // Symlink might already exist
          }
        }
      } else {
        // New behavior - single file
        const vhosts = await this.parseVHosts();
        const existingIndex = vhosts.findIndex(v => 
          v.serverName.toLowerCase() === vhost.serverName.toLowerCase()
        );
        
        if (existingIndex !== -1) {
          // Update existing vhost but keep the original serverName case
          const originalServerName = vhosts[existingIndex].serverName;
          vhosts[existingIndex] = {
            ...vhost,
            serverName: originalServerName // Preserve the original case
          };
        } else {
          vhosts.push(vhost);
        }

        const newConfig = vhosts.map(v => this.generateVHostConfig(v, !v.enabled)).join('\n\n');
        await fs.writeFile(this.mainVHostFile, newConfig);
      }

      return true;
    } catch (error) {
      console.error('Failed to save vhost:', error);
      return false;
    }
  }

  private generateVHostConfig(vhost: VHost, commented: boolean = false): string {
    const comment = commented ? '# ' : '';
    let config = `${comment}$HTTP["host"] == "${vhost.serverName}" {\n`;
    config += `${comment}  server.document-root = "${vhost.documentRoot}"\n`;

    if (vhost.port && vhost.port !== 80) {
      config += `${comment}  server.port = ${vhost.port}\n`;
    }

    if (vhost.serverAlias?.length) {
      config += `${comment}  server.name = "${[vhost.serverName, ...vhost.serverAlias].join(' ')}"\n`;
    }

    if (vhost.errorHandler404) {
      config += `${comment}  server.error-handler-404 = "${vhost.errorHandler404}"\n`;
    }

    if (vhost.compressSettings?.enabled) {
      config += `${comment}  compress.cache-dir = "${vhost.compressSettings.cacheDir}"\n`;
      if (vhost.compressSettings.fileTypes.length > 0) {
        config += `${comment}  compress.filetype = (\n`;
        vhost.compressSettings.fileTypes.forEach((type, index) => {
          config += `${comment}    "${type}"${index === vhost.compressSettings!.fileTypes.length - 1 ? '' : ','}\n`;
        });
        config += `${comment}  )\n`;
      }
    }

    if (vhost.urlRewrite?.enabled && vhost.urlRewrite.rules.length > 0) {
      config += `${comment}  url.rewrite-if-not-file = (\n`;
      vhost.urlRewrite.rules.forEach((rule, index) => {
        config += `${comment}    "${rule.pattern}" => "${rule.replacement}"${index === vhost.urlRewrite!.rules.length - 1 ? '' : ','}\n`;
      });
      config += `${comment}  )\n`;
    }

    if (vhost.ssl) {
      config += `${comment}  ssl.engine = "enable"\n`;
      if (vhost.sslCertFile) {
        config += `${comment}  ssl.pemfile = "${vhost.sslCertFile}"\n`;
      }
      if (vhost.sslKeyFile) {
        config += `${comment}  ssl.keyfile = "${vhost.sslKeyFile}"\n`;
      }
    }

    // Add performance optimizations
    if (vhost.optimizations) {
      const opt = vhost.optimizations;
      
      if (opt.compress || opt.gzip) {
        config += `${comment}  compress.cache-dir = "/var/cache/lighttpd/compress/"\n`;
        config += `${comment}  compress.filetype = ("text/plain", "text/html", "text/javascript", "text/css", "text/xml", "application/javascript", "application/json")\n`;
      }

      if (opt.cache || opt.staticCache) {
        config += `${comment}  server.stat-cache-engine = "simple"\n`;
        config += `${comment}  static-file.etags = "enable"\n`;
      }

      if (opt.expires) {
        config += `${comment}  expire.url = (\n`;
        config += `${comment}    "\\.(gif|jpg|jpeg|png|ico|webp)$" => "access plus 1 month",\n`;
        config += `${comment}    "\\.(css|js)$" => "access plus 1 week",\n`;
        config += `${comment}    "\\.(woff|woff2|ttf|eot|otf)$" => "access plus 1 month"\n`;
        config += `${comment}  )\n`;
      }

      if (opt.etag) {
        config += `${comment}  etag.use-inode = "enable"\n`;
        config += `${comment}  etag.use-mtime = "enable"\n`;
        config += `${comment}  etag.use-size = "enable"\n`;
      }

      if (opt.proxyCache) {
        config += `${comment}  proxy-cache.enable = "enable"\n`;
        config += `${comment}  proxy-cache.cache-dir = "/var/cache/lighttpd/proxy/"\n`;
        config += `${comment}  proxy-cache.max-age = 3600\n`;
      }

      if (opt.keepalive) {
        config += `${comment}  server.max-keep-alive-requests = 100\n`;
        config += `${comment}  server.max-keep-alive-idle = 30\n`;
      }
    }

    config += `${comment}}\n`;
    return config;
  }

  async deleteVHost(serverName: string): Promise<boolean> {
    try {
      if (!this.useMainFile) {
        // Original behavior - separate files
        const filename = `${serverName}.conf`;
        const availablePath = path.join(this.availablePath, filename);
        const enabledPath = path.join(this.enabledPath, filename);

        try {
          await fs.unlink(enabledPath);
        } catch (error) {
          // File might not exist
        }

        try {
          await fs.unlink(availablePath);
        } catch (error) {
          // File might not exist
        }
      } else {
        // New behavior - single file
        const vhosts = await this.parseVHosts();
        const filteredVhosts = vhosts.filter(v => 
          v.serverName.toLowerCase() !== serverName.toLowerCase()
        );
        const newConfig = filteredVhosts.map(v => this.generateVHostConfig(v, !v.enabled)).join('\n\n');
        await fs.writeFile(this.mainVHostFile, newConfig);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete vhost:', error);
      return false;
    }
  }

  async toggleVHost(serverName: string, enable: boolean): Promise<boolean> {
    try {
      if (!this.useMainFile) {
        // Original behavior - separate files
        const filename = `${serverName}.conf`;
        const availablePath = path.join(this.availablePath, filename);
        const enabledPath = path.join(this.enabledPath, filename);

        if (enable) {
          try {
            await fs.symlink(availablePath, enabledPath);
          } catch (error) {
            // Symlink might already exist
          }
        } else {
          try {
            await fs.unlink(enabledPath);
          } catch (error) {
            // File might not exist
          }
        }
      } else {
        // New behavior - single file
        const vhosts = await this.parseVHosts();
        const vhost = vhosts.find(v => v.serverName === serverName);
        
        if (vhost) {
          vhost.enabled = enable;
          const newConfig = vhosts.map(v => this.generateVHostConfig(v, !v.enabled)).join('\n\n');
          await fs.writeFile(this.mainVHostFile, newConfig);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to toggle vhost:', error);
      return false;
    }
  }
}
