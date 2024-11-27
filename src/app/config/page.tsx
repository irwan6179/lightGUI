'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { toast } from 'react-hot-toast';

export default function ConfigPage() {
  const [config, setConfig] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/server/config');
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Failed to fetch config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/server/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        toast.success('Configuration saved successfully');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Configuration Editor</h1>
            <p className="text-gray-400">Edit lighttpd configuration file</p>
          </div>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-lg backdrop-blur-lg p-4">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-white">Loading configuration...</div>
            </div>
          ) : (
            <Editor
              height="600px"
              defaultLanguage="apache"
              theme="vs-dark"
              value={config}
              onChange={(value) => setConfig(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                rulers: [],
                wordWrap: 'on',
                wrappingIndent: 'indent',
                automaticLayout: true,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
