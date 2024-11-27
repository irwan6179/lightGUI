import { NextResponse } from 'next/server';
import { VHostManager } from '@/lib/vhost';

const manager = new VHostManager();

export async function POST(request: Request) {
  try {
    const { serverName, enable } = await request.json();
    const success = await manager.toggleVHost(serverName, enable);
    
    if (success) {
      return NextResponse.json({ message: 'Virtual host toggled successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to toggle virtual host' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to toggle virtual host' },
      { status: 500 }
    );
  }
}
