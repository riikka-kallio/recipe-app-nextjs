import { NextRequest } from 'next/server';

/**
 * CORS Proxy for downloading images from external recipe websites
 * This allows us to bypass CORS restrictions when downloading recipe images
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }
  
  // Basic URL validation
  try {
    const url = new URL(imageUrl);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return new Response('Invalid URL protocol', { status: 400 });
    }
    
    // Block localhost and internal IPs for security
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return new Response('Cannot proxy internal URLs', { status: 403 });
    }
  } catch (error) {
    return new Response('Invalid URL format', { status: 400 });
  }
  
  try {
    console.log('Proxying image request for:', imageUrl);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'RecipeApp/1.0 (Recipe Import Feature)',
        'Accept': 'image/*',
      },
      // Set a timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });
    
    if (!response.ok) {
      console.error('Failed to fetch image:', response.statusText);
      return new Response('Failed to fetch image', { status: response.status });
    }
    
    // Verify content type is an image
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response('URL does not point to an image', { status: 400 });
    }
    
    const blob = await response.blob();
    
    return new Response(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    if (error.name === 'TimeoutError') {
      return new Response('Request timeout', { status: 504 });
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}
