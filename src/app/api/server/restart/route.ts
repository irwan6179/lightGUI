import { NextResponse } from 'next/server';
import { LighttpdManager } from '@/lib/lighttpd';

const manager = new LighttpdManager();

export async function POST() {
  try {
    const success = await manager.restartServer();
    if (success) {
      return NextResponse.json({ message: 'Server restarted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to restart server' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to restart server' }, { status: 500 });
  }
}
