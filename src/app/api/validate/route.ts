import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Run lighttpd configuration test with full path
    const { stdout, stderr } = await execAsync('sudo /usr/sbin/lighttpd -t -f /etc/lighttpd/lighttpd.conf');
    
    // If we reach here, the configuration is valid
    return NextResponse.json({ 
      success: true, 
      message: 'Configuration is valid',
      details: stdout 
    });
  } catch (error: any) {
    // If lighttpd -t fails, it means the configuration is invalid
    return NextResponse.json({ 
      success: false, 
      message: 'Configuration validation failed',
      details: error.stderr || error.message 
    }, { status: 400 });
  }
}
