import sanitizeHtml from 'sanitize-html';

/**
 * Strip all HTML tags from a string input to prevent XSS attacks.
 * Returns the plain text content with no HTML.
 */
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
