import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import si from 'systeminformation';

const execAsync = promisify(exec);

export interface ServerStatus {
  isRunning: boolean;
  pid?: number;
  uptime?: string;
}

export interface SystemResources {
  cpu: number;
  memory: number;
}

export class LighttpdManager {
  private configPath: string;
  private logPath: string;

  constructor(configPath = '/etc/lighttpd/lighttpd.conf', logPath = '/var/log/lighttpd/error.log') {
    this.configPath = configPath;
    this.logPath = logPath;
  }

  async getStatus(): Promise<ServerStatus> {
    try {
      const { stdout } = await execAsync('pgrep lighttpd');
      const pid = parseInt(stdout.trim());
      if (pid) {
        const uptimeProcess = await execAsync(`ps -p ${pid} -o etime=`);
        return {
          isRunning: true,
          pid,
          uptime: uptimeProcess.stdout.trim()
        };
      }
    } catch (error) {
      // Process not found
    }
    return { isRunning: false };
  }

  async startServer(): Promise<boolean> {
    try {
      await execAsync('sudo systemctl start lighttpd');
      return true;
    } catch (error) {
      console.error('Failed to start lighttpd:', error);
      return false;
    }
  }

  async stopServer(): Promise<boolean> {
    try {
      await execAsync('sudo systemctl stop lighttpd');
      return true;
    } catch (error) {
      console.error('Failed to stop lighttpd:', error);
      return false;
    }
  }

  async restartServer(): Promise<boolean> {
    try {
      await execAsync('sudo systemctl restart lighttpd');
      return true;
    } catch (error) {
      console.error('Failed to restart lighttpd:', error);
      return false;
    }
  }

  async getConfig(): Promise<string> {
    try {
      return await fs.readFile(this.configPath, 'utf-8');
    } catch (error) {
      console.error('Failed to read config:', error);
      throw error;
    }
  }

  async saveConfig(content: string): Promise<boolean> {
    try {
      // First, validate the configuration
      const tempPath = '/tmp/lighttpd-test.conf';
      await fs.writeFile(tempPath, content);
      
      try {
        await execAsync(`lighttpd -t -f ${tempPath}`);
      } catch (error) {
        console.error('Invalid configuration:', error);
        return false;
      }

      // If validation passes, save the actual config
      await execAsync(`sudo tee ${this.configPath} > /dev/null`, { input: content });
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  async getLogs(lines = 100): Promise<string> {
    try {
      const { stdout } = await execAsync(`tail -n ${lines} ${this.logPath}`);
      return stdout;
    } catch (error) {
      console.error('Failed to read logs:', error);
      throw error;
    }
  }

  async getSystemResources(): Promise<SystemResources> {
    const [cpuLoad, memLoad] = await Promise.all([
      si.currentLoad(),
      si.mem()
    ]);

    return {
      cpu: Math.round(cpuLoad.currentLoad),
      memory: Math.round((memLoad.used / memLoad.total) * 100)
    };
  }

  async clearCache(): Promise<boolean> {
    try {
      await execAsync('sudo rm -rf /var/cache/lighttpd/*');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  async testConfig(): Promise<{ isValid: boolean; message: string }> {
    try {
      const { stdout, stderr } = await execAsync(`lighttpd -t -f ${this.configPath}`);
      return { isValid: true, message: stdout || 'Configuration is valid' };
    } catch (error: any) {
      return { isValid: false, message: error.stderr || 'Configuration test failed' };
    }
  }
}
