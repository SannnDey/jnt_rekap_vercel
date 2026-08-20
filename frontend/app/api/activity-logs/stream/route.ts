import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { subscribeActivity } from '@/lib/activityPubSub';

export async function GET(request: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = async (data: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      // ignore
    }
  };

  const encoder = new TextEncoder();

  const unsubscribe = subscribeActivity((data) => {
    send(data);
  });

  request.signal.addEventListener('abort', () => {
    try { unsubscribe(); writer.close(); } catch (e) {}
  });

  // send a ping
  send({ type: 'ping', ts: new Date().toISOString() });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
