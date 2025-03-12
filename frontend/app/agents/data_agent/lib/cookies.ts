/**
 * Get a cookie by name
 * @param name The name of the cookie to get
 * @returns The cookie value or an empty string if not found
 */
export function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

/**
 * Remove a cookie by name
 * @param name The name of the cookie to remove
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
} 