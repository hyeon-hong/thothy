/**
 * Cleans and normalizes content by removing unwanted characters and formatting
 */
export function cleanContent(content: string): string {
  return content
    .trim()
    .replace(/\\n/g, '\n')
    .replace(/\s+$/gm, ''); // Remove trailing whitespace from each line
}

/**
 * Reverses the cleaning process for content
 */
export function reverseCleanContent(content: string): string {
  return content
    .replace(/\n/g, '\\n')
    .trim();
} 