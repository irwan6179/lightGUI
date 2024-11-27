import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Power, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface VHost {
  serverName: string;
  documentRoot: string;
  enabled: boolean;
  serverAlias?: string[];
  port?: number;
  optimizations?: {
    compress?: boolean;
    cache?: boolean;
    expires?: boolean;
    etag?: boolean;
    staticCache?: boolean;
    proxyCache?: boolean;
    gzip?: boolean;
    keepalive?: boolean;
  }
  errorHandler404?: string;
  compressSettings?: {
    enabled: boolean;
    cacheDir: string;
    fileTypes: string[];
  }
  urlRewrite?: {
    enabled: boolean;
    rules: {
      pattern: string;
      replacement: string;
    }[];
  }
}

interface VHostEditorProps {
  vhost: VHost;
  optimizationLabels: Record<string, string>;
  optimizationDescriptions: Record<string, string>;
  onToggle: (serverName: string, enable: boolean) => void;
  onDelete?: (serverName: string) => void;
  onSave: (vhost: VHost) => void;
}

export function VHostEditor({ 
  vhost,
  optimizationLabels, 
  optimizationDescriptions,
  onToggle,
  onDelete,
  onSave 
}: VHostEditorProps) {
  const defaultUrlRewrite = {
    enabled: true,
    rules: [
      {
        pattern: '^/favicon\\.svg$',
        replacement: '/favicon.svg'
      },
      {
        pattern: '^/(.*)$',
        replacement: '/index.html'
      }
    ]
  };

  const defaultCompressSettings = {
    enabled: true,
    cacheDir: '/var/cache/lighttpd/compress/',
    fileTypes: [
      'application/javascript',
      'text/css',
      'text/html',
      'text/plain',
      'application/json',
      'image/svg+xml'
    ]
  };

  const defaultOptimizations = {
    compress: false,
    cache: false,
    expires: false,
    etag: false,
    staticCache: false,
    proxyCache: false,
    gzip: false,
    keepalive: false
  };

  const [serverName, setServerName] = useState(vhost.serverName);
  const [port, setPort] = useState(vhost.port ?? 80);
  const [serverAlias, setServerAlias] = useState(vhost.serverAlias ?? []);
  const [documentRoot, setDocumentRoot] = useState(vhost.documentRoot);
  const [errorHandler404, setErrorHandler404] = useState(vhost.errorHandler404 ?? '/index.html');
  const [compressSettings, setCompressSettings] = useState(vhost.compressSettings ?? defaultCompressSettings);
  const [urlRewrite, setUrlRewrite] = useState(vhost.urlRewrite ?? defaultUrlRewrite);
  const [optimizations, setOptimizations] = useState(vhost.optimizations ?? defaultOptimizations);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setServerName(vhost.serverName);
    setPort(vhost.port ?? 80);
    setServerAlias(vhost.serverAlias ?? []);
    setDocumentRoot(vhost.documentRoot);
    setErrorHandler404(vhost.errorHandler404 ?? '/index.html');
    setCompressSettings(vhost.compressSettings ?? defaultCompressSettings);
    setUrlRewrite(vhost.urlRewrite ?? defaultUrlRewrite);
    setOptimizations(vhost.optimizations ?? defaultOptimizations);
    setIsDirty(false);
  }, [vhost]);

  const handlePortChange = (value: string) => {
    const newPort = parseInt(value) || 80;
    setPort(newPort);
    setIsDirty(true);
  };

  const handleAliasChange = (value: string) => {
    const newAlias = value.split('\n').filter(alias => alias.trim() !== '');
    setServerAlias(newAlias);
    setIsDirty(true);
  };

  const handleDocumentRootChange = (value: string) => {
    setDocumentRoot(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!isDirty) return;
    if (!serverName || !documentRoot) return;

    onSave({
      ...vhost,
      serverName,
      port,
      serverAlias,
      documentRoot,
      errorHandler404,
      compressSettings,
      urlRewrite,
      optimizations
    });
    setIsDirty(false);
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-white text-lg">{serverName || 'New Virtual Host'}</h3>
            <p className="text-sm text-gray-400 truncate mt-1">
              {documentRoot || 'No document root set'}
            </p>
            {serverAlias?.length > 0 && (
              <p className="text-sm text-gray-500">
                Alias: {serverAlias.join(', ')}
              </p>
            )}
            {port && port !== 80 && (
              <p className="text-sm text-gray-500">
                Port: {port}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={vhost.enabled ? "default" : "secondary"}
              size="icon"
              onClick={() => onToggle(vhost.serverName, !vhost.enabled)}
              className={vhost.enabled ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this virtual host?')) {
                  onDelete?.(vhost.serverName);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="spa">SPA Settings</TabsTrigger>
            <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor={`${vhost.serverName}-hostname`} className="text-white">Hostname</Label>
                <Input
                  id={`${vhost.serverName}-hostname`}
                  value={serverName}
                  onChange={(e) => {
                    setServerName(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={handleSave}
                  placeholder="example.com"
                  className="bg-gray-900/50 border-gray-700 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${vhost.serverName}-documentRoot`} className="text-white">Document Root</Label>
                <Input
                  id={`${vhost.serverName}-documentRoot`}
                  value={documentRoot}
                  onChange={(e) => {
                    setDocumentRoot(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={handleSave}
                  className="bg-gray-900/50 border-gray-700 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${vhost.serverName}-port`} className="text-white">Port</Label>
                <Input
                  id={`${vhost.serverName}-port`}
                  type="number"
                  value={port}
                  onChange={(e) => handlePortChange(e.target.value)}
                  onBlur={handleSave}
                  className="bg-gray-900/50 border-gray-700 text-white mt-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${vhost.serverName}-alias`} className="text-white">Server Aliases (one per line)</Label>
                <textarea
                  id={`${vhost.serverName}-alias`}
                  placeholder="www.example.com&#10;example.net&#10;www.example.net"
                  value={serverAlias?.join('\n') || ''}
                  onChange={(e) => handleAliasChange(e.target.value)}
                  onBlur={handleSave}
                  className="w-full h-24 p-2 rounded bg-gray-900/50 border border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="spa" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor={`${vhost.serverName}-errorHandler`} className="text-white">404 Error Handler</Label>
                <Input
                  id={`${vhost.serverName}-errorHandler`}
                  value={errorHandler404}
                  onChange={(e) => {
                    setErrorHandler404(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={handleSave}
                  className="bg-gray-900/50 border-gray-700 text-white mt-1"
                  placeholder="/index.html"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">URL Rewrite Rules</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${vhost.serverName}-urlRewrite`}
                      checked={urlRewrite.enabled}
                      onCheckedChange={(checked) => {
                        setUrlRewrite(prev => ({ ...prev, enabled: checked }));
                        setIsDirty(true);
                      }}
                    />
                    <Label htmlFor={`${vhost.serverName}-urlRewrite`} className="text-white">
                      Enable URL Rewrite
                    </Label>
                  </div>
                  {urlRewrite.enabled && (
                    <div className="space-y-2">
                      {urlRewrite.rules.map((rule, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <Input
                            value={rule.pattern}
                            onChange={(e) => {
                              const newRules = [...urlRewrite.rules];
                              newRules[index] = { ...rule, pattern: e.target.value };
                              setUrlRewrite(prev => ({ ...prev, rules: newRules }));
                              setIsDirty(true);
                            }}
                            placeholder="Pattern (e.g., ^/(.*)$)"
                            className="bg-gray-900/50 border-gray-700 text-white"
                          />
                          <Input
                            value={rule.replacement}
                            onChange={(e) => {
                              const newRules = [...urlRewrite.rules];
                              newRules[index] = { ...rule, replacement: e.target.value };
                              setUrlRewrite(prev => ({ ...prev, rules: newRules }));
                              setIsDirty(true);
                            }}
                            placeholder="Replacement (e.g., /index.html)"
                            className="bg-gray-900/50 border-gray-700 text-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Compression Settings</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${vhost.serverName}-compress`}
                      checked={compressSettings.enabled}
                      onCheckedChange={(checked) => {
                        setCompressSettings(prev => ({ ...prev, enabled: checked }));
                        setIsDirty(true);
                      }}
                    />
                    <Label htmlFor={`${vhost.serverName}-compress`} className="text-white">
                      Enable Compression
                    </Label>
                  </div>
                  {compressSettings.enabled && (
                    <>
                      <div>
                        <Label htmlFor={`${vhost.serverName}-compressCache`} className="text-white">Cache Directory</Label>
                        <Input
                          id={`${vhost.serverName}-compressCache`}
                          value={compressSettings.cacheDir}
                          onChange={(e) => {
                            setCompressSettings(prev => ({ ...prev, cacheDir: e.target.value }));
                            setIsDirty(true);
                          }}
                          placeholder="/var/cache/lighttpd/compress/"
                          className="bg-gray-900/50 border-gray-700 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${vhost.serverName}-compressTypes`} className="text-white">File Types (one per line)</Label>
                        <textarea
                          id={`${vhost.serverName}-compressTypes`}
                          value={compressSettings.fileTypes.join('\n')}
                          onChange={(e) => {
                            const types = e.target.value.split('\n').filter(type => type.trim() !== '');
                            setCompressSettings(prev => ({ ...prev, fileTypes: types }));
                            setIsDirty(true);
                          }}
                          placeholder="application/javascript&#10;text/css&#10;text/html&#10;text/plain&#10;application/json&#10;image/svg+xml"
                          className="w-full h-24 p-2 rounded bg-gray-900/50 border border-gray-700 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="optimizations" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(optimizationLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col">
                    <Label htmlFor={`${vhost.serverName}-${key}`} className="text-white">
                      {label}
                    </Label>
                    <p className="text-xs text-gray-400">
                      {optimizationDescriptions[key]}
                    </p>
                  </div>
                  <Switch
                    id={`${vhost.serverName}-${key}`}
                    checked={optimizations?.[key as keyof VHost['optimizations']] || false}
                    onCheckedChange={(checked) => {
                      setOptimizations(prev => ({ ...prev, [key]: checked }));
                      setIsDirty(true);
                    }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
