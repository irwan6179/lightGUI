'use client';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

interface ServerData {
  status: {
    isRunning: boolean;
    pid?: number;
    uptime?: string;
  };
  resources: {
    cpu: number;
    memory: number;
  };
}

export default function Home() {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/server/status');
      const data = await response.json();
      setServerData(data);
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      await fetch('/api/server/restart', { method: 'POST' });
      await fetchServerStatus();
    } catch (error) {
      console.error('Failed to restart server:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">LightGUI</h1>
            <p className="text-gray-400">Lighttpd Server Management</p>
          </div>
          <Button variant="outline">Settings</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">Server Status</CardTitle>
              <CardDescription className="text-gray-400">Current lighttpd server status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${serverData?.status.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={serverData?.status.isRunning ? 'text-green-400' : 'text-red-400'}>
                    {serverData?.status.isRunning ? 'Running' : 'Stopped'}
                  </span>
                  {serverData?.status.uptime && (
                    <span className="text-gray-400 text-sm ml-2">
                      Uptime: {serverData.status.uptime}
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline"
                  onClick={handleRestart}
                  disabled={loading}
                >
                  {loading ? 'Restarting...' : 'Restart Server'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">Configuration</CardTitle>
              <CardDescription className="text-gray-400">Manage server configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="default"
                className="w-full"
                onClick={() => window.location.href = '/config'}
              >
                Edit Configuration
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">Logs</CardTitle>
              <CardDescription className="text-gray-400">View server logs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                View Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">Common server tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">Clear Cache</Button>
                <Button variant="outline">Test Config</Button>
                <Button variant="outline">Reload Rules</Button>
                <Button variant="outline">View Stats</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">System Resources</CardTitle>
              <CardDescription className="text-gray-400">Server resource usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">CPU Usage</span>
                    <span className="text-white">{serverData?.resources.cpu ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${serverData?.resources.cpu ?? 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Memory Usage</span>
                    <span className="text-white">{serverData?.resources.memory ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${serverData?.resources.memory ?? 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
