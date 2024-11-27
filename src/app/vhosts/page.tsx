'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Label } from "@/components/ui/label"
import { VHostEditor } from '@/components/vhost-editor';
import { ValidationErrorDialog } from '@/components/validation-error-dialog';

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

export default function VHostsPage() {
  const [vhosts, setVhosts] = useState<VHost[]>([]);
  const [newVHost, setNewVHost] = useState<VHost>({
    serverName: '',
    documentRoot: '',
    enabled: true,
    serverAlias: [],
    port: 80,
    errorHandler404: '/index.html',
    compressSettings: {
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
    },
    urlRewrite: {
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
    },
    optimizations: {
      compress: false,
      cache: false,
      expires: false,
      etag: false,
      staticCache: false,
      proxyCache: false,
      gzip: false,
      keepalive: false
    }
  });
  const [isRestarting, setIsRestarting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const optimizationLabels = {
    compress: 'Text Compression',
    cache: 'Static File Cache',
    expires: 'Expires Headers',
    etag: 'ETag Support',
    staticCache: 'Static Cache',
    proxyCache: 'Proxy Cache',
    gzip: 'Gzip Compression',
    keepalive: 'Keep-Alive'
  };

  const optimizationDescriptions = {
    compress: 'Compress text-based files (HTML, CSS, JS) for faster delivery',
    cache: 'Cache static files in memory for better performance',
    expires: 'Add expires headers for browser caching',
    etag: 'Enable ETag support for caching validation',
    staticCache: 'Enhanced static file caching',
    proxyCache: 'Cache proxy responses if using as reverse proxy',
    gzip: 'Enable gzip compression for all supported files',
    keepalive: 'Keep connections alive for multiple requests'
  };

  const fetchVHosts = async () => {
    try {
      const response = await fetch('/api/vhosts');
      if (!response.ok) throw new Error('Failed to fetch vhosts');
      const data = await response.json();
      setVhosts(data);
    } catch (error) {
      toast.error('Failed to load virtual hosts');
    }
  };

  useEffect(() => {
    fetchVHosts();
  }, []);

  const handleAddVHost = async () => {
    try {
      const response = await fetch('/api/vhosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVHost)
      });

      if (!response.ok) throw new Error('Failed to add vhost');
      
      toast.success('Virtual host added successfully');
      setNewVHost({
        serverName: '',
        documentRoot: '',
        enabled: true,
        serverAlias: [],
        port: 80,
        errorHandler404: '/index.html',
        compressSettings: {
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
        },
        urlRewrite: {
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
        },
        optimizations: {
          compress: false,
          cache: false,
          expires: false,
          etag: false,
          staticCache: false,
          proxyCache: false,
          gzip: false,
          keepalive: false
        }
      });
      fetchVHosts();
    } catch (error) {
      toast.error('Failed to add virtual host');
    }
  };

  const handleDeleteVHost = async (serverName: string) => {
    try {
      const response = await fetch('/api/vhosts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName })
      });

      if (!response.ok) throw new Error('Failed to delete vhost');
      
      toast.success('Virtual host deleted successfully');
      fetchVHosts();
    } catch (error) {
      toast.error('Failed to delete virtual host');
    }
  };

  const handleToggleVHost = async (serverName: string, enable: boolean) => {
    try {
      const response = await fetch('/api/vhosts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName, enable })
      });

      if (!response.ok) throw new Error('Failed to toggle vhost');
      
      toast.success('Virtual host toggled successfully');
      fetchVHosts();
    } catch (error) {
      toast.error('Failed to toggle virtual host');
    }
  };

  const handleSaveVHost = async (vhost: VHost) => {
    try {
      const response = await fetch('/api/vhosts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vhost)
      });

      if (!response.ok) throw new Error('Failed to save vhost');
      
      toast.success('Virtual host saved successfully');
      fetchVHosts();
    } catch (error) {
      toast.error('Failed to save virtual host');
    }
  };

  const handleRestartService = async () => {
    try {
      setIsRestarting(true);
      setValidationError(null);
      
      // First validate the configuration
      const validateResponse = await fetch('/api/validate', {
        method: 'POST',
      });
      
      const validateData = await validateResponse.json();
      
      if (!validateResponse.ok || !validateData.success) {
        setValidationError(validateData.details || validateData.message || 'Configuration validation failed');
        return;
      }
      
      // If validation passed, proceed with restart
      const response = await fetch('/api/restart', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to restart service');
      
      toast.success('Lighttpd service restarted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to restart Lighttpd service');
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Virtual Hosts</h1>
            <p className="text-gray-400">Manage your Lighttpd virtual hosts</p>
          </div>
          <Button 
            onClick={handleRestartService}
            disabled={isRestarting}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRestarting ? 'animate-spin' : ''}`} />
            Apply Changes
          </Button>
        </div>
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Virtual Host</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Server Name (e.g., example.com)"
                value={newVHost.serverName}
                onChange={(e) => setNewVHost({ ...newVHost, serverName: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Document Root (e.g., /var/www/html)"
                value={newVHost.documentRoot}
                onChange={(e) => setNewVHost({ ...newVHost, documentRoot: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <div className="space-y-2">
                <Label htmlFor="serverAlias" className="text-white">Server Aliases (one per line)</Label>
                <textarea
                  id="serverAlias"
                  placeholder="www.example.com&#10;example.net&#10;www.example.net"
                  value={newVHost.serverAlias?.join('\n') || ''}
                  onChange={(e) => setNewVHost({
                    ...newVHost,
                    serverAlias: e.target.value.split('\n').filter(alias => alias.trim() !== '')
                  })}
                  className="w-full h-24 p-2 rounded bg-gray-900/50 border border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Input
                type="number"
                placeholder="Port (default: 80)"
                value={newVHost.port || ''}
                onChange={(e) => setNewVHost({ 
                  ...newVHost, 
                  port: e.target.value ? parseInt(e.target.value) : 80 
                })}
                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              className="mt-4"
              onClick={handleAddVHost}
              disabled={!newVHost.serverName || !newVHost.documentRoot}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Virtual Host
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vhosts.map((vhost) => (
            <VHostEditor
              key={vhost.serverName}
              vhost={vhost}
              optimizationLabels={optimizationLabels}
              optimizationDescriptions={optimizationDescriptions}
              onToggle={handleToggleVHost}
              onDelete={handleDeleteVHost}
              onSave={handleSaveVHost}
            />
          ))}
        </div>
      </div>
      <ValidationErrorDialog 
        isOpen={validationError !== null}
        onClose={() => setValidationError(null)}
        error={validationError || ''}
      />
    </main>
  );
}
