/**
 * Vercel Serverless Proxy
 *
 * This proxies requests from your HTTPS Vercel frontend
 * to your HTTP backend, avoiding mixed content issues.
 *
 * Usage: /api/whatsapp/status -> http://13.60.14.202:4000/api/whatsapp/status
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://bulksenderapi.todayintech.in';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the path after /api/
    const path = req.url?.replace(/^\/api/, '') || '';
    const targetUrl = `${BACKEND_URL}${path}`;

    console.log(`Proxying: ${req.method} ${targetUrl}`);

    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization as string
        }),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined,
    });

    // Get response data
    const contentType = response.headers.get('content-type');

    // Handle SSE (Server-Sent Events) for QR code streaming
    if (contentType?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
      return;
    }

    // Handle JSON responses
    const data = await response.json();

    // Forward status and response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
