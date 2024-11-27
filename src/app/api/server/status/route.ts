import { NextResponse } from 'next/server';
import { LighttpdManager } from '@/lib/lighttpd';

const manager = new LighttpdManager();

export async function GET() {
  try {
    const [status, resources] = await Promise.all([
      manager.getStatus(),
      manager.getSystemResources()
    ]);
    
    return NextResponse.json({ status, resources });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get server status' }, { status: 500 });
  }
}
