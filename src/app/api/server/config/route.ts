import { NextResponse } from 'next/server';
import { LighttpdManager } from '@/lib/lighttpd';

const manager = new LighttpdManager();

export async function GET() {
  try {
    const config = await manager.getConfig();
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get configuration' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { config } = await request.json();
    const success = await manager.saveConfig(config);
    
    if (success) {
      return NextResponse.json({ message: 'Configuration saved successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
