/**
 * Validate and sanitize URLs to prevent SSRF attacks
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }
    
    // Block localhost and internal IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    const internalIpPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
    
    if (blockedHosts.includes(hostname) || internalIpPattern.test(hostname)) {
      return { valid: false, error: 'Internal URLs are not allowed' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
