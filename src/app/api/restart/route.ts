import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Using sudo requires NOPASSWD configuration for lighttpd service
    await execAsync('sudo systemctl restart lighttpd');
    return NextResponse.json({ message: 'Lighttpd service restarted successfully' });
  } catch (error) {
    console.error('Failed to restart Lighttpd:', error);
    return NextResponse.json(
      { error: 'Failed to restart Lighttpd service' },
      { status: 500 }
    );
  }
}
