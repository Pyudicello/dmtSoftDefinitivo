import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://prevenia-backend-env.eba-7b3x3km4.us-east-1.elasticbeanstalk.com'
).replace(/\/+$/, '');

async function handleProxy(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    const headers: Record<string, string> = {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      Accept: req.headers.get('accept') || 'application/json',
    };

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    let body: string | undefined = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
    }

    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const data = await backendResponse.text();

    return new NextResponse(data, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      {
        error: 'PROXY_ERROR',
        message: error?.message || 'Error communicating with backend',
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
