/**
 * Extracts and normalizes domain name from a full URL string.
 * Returns null if the URL is invalid, internal chrome page, or untrackable schema.
 */
export function extractDomain(urlStr: string | null | undefined): string | null {
  if (!urlStr) return null;

  try {
    const url = new URL(urlStr);

    // Ignore non-http/https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    let hostname = url.hostname.toLowerCase().trim();

    // Strip www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Ignore empty hostnames or invalid local strings
    if (!hostname || hostname === 'newtab') {
      return null;
    }

    return hostname;
  } catch (e) {
    return null;
  }
}

/**
 * Formats a domain name for display (e.g. capitalized domain name or cleaned representation)
 */
export function formatDomainDisplayName(domain: string): string {
  if (!domain) return '';
  
  // Custom display overrides for major sites
  const displayNames: Record<string, string> = {
    'github.com': 'GitHub',
    'youtube.com': 'YouTube',
    'google.com': 'Google',
    'stackoverflow.com': 'Stack Overflow',
    'linkedin.com': 'LinkedIn',
    'twitter.com': 'X / Twitter',
    'x.com': 'X / Twitter',
    'reddit.com': 'Reddit',
    'wikipedia.org': 'Wikipedia',
    'facebook.com': 'Facebook',
    'instagram.com': 'Instagram',
    'amazon.com': 'Amazon',
    'netflix.com': 'Netflix',
    'gmail.com': 'Gmail',
    'mail.google.com': 'Gmail',
    'docs.google.com': 'Google Docs',
    'drive.google.com': 'Google Drive',
    'coursera.org': 'Coursera',
    'udemy.com': 'Udemy',
    'medium.com': 'Medium',
    'chatgpt.com': 'ChatGPT',
    'openai.com': 'OpenAI',
    'claude.ai': 'Claude AI',
    'vercel.com': 'Vercel',
    'figma.com': 'Figma',
  };

  if (displayNames[domain]) {
    return displayNames[domain];
  }

  // Capitalize first letter of domain name before TLD
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const name = parts[parts.length - 2];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return domain;
}

/**
 * Returns Google Favicon URL fallback for any given domain
 */
export function getFaviconUrl(domain: string): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}
