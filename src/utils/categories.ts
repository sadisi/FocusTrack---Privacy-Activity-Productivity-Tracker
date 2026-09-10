import { CategoryType, ProductivityType } from '../types';

export const ALL_CATEGORIES: CategoryType[] = [
  'Development',
  'Education',
  'Work',
  'Productivity',
  'Communication',
  'Social Media',
  'Entertainment',
  'News',
  'Shopping',
  'Finance',
  'Search',
  'Other',
];

export const DEFAULT_DOMAIN_CATEGORIES: Record<string, CategoryType> = {
  // Development
  'github.com': 'Development',
  'gitlab.com': 'Development',
  'stackoverflow.com': 'Development',
  'npmjs.com': 'Development',
  'developer.mozilla.org': 'Development',
  'typescriptlang.org': 'Development',
  'react.dev': 'Development',
  'codepen.io': 'Development',
  'leetcode.com': 'Development',
  'w3schools.com': 'Development',
  'replit.com': 'Development',
  'stackblitz.com': 'Development',
  'vercel.com': 'Development',
  'netlify.com': 'Development',
  'aws.amazon.com': 'Development',
  'huggingface.co': 'Development',
  'chatgpt.com': 'Productivity',
  'openai.com': 'Development',
  'claude.ai': 'Productivity',

  // Education
  'coursera.org': 'Education',
  'udemy.com': 'Education',
  'khanacademy.org': 'Education',
  'edx.org': 'Education',
  'duolingo.com': 'Education',
  'brilliant.org': 'Education',
  'wikipedia.org': 'Education',
  'mit.edu': 'Education',
  'stanford.edu': 'Education',
  'quizlet.com': 'Education',

  // Work & Productivity
  'linkedin.com': 'Work',
  'notion.so': 'Productivity',
  'figma.com': 'Productivity',
  'jira.com': 'Work',
  'atlassian.net': 'Work',
  'trello.com': 'Productivity',
  'asana.com': 'Productivity',
  'linear.app': 'Productivity',
  'clickup.com': 'Productivity',
  'docs.google.com': 'Productivity',
  'drive.google.com': 'Productivity',
  'sheets.google.com': 'Productivity',

  // Communication
  'gmail.com': 'Communication',
  'mail.google.com': 'Communication',
  'outlook.live.com': 'Communication',
  'slack.com': 'Communication',
  'discord.com': 'Communication',
  'whatsapp.com': 'Communication',
  'telegram.org': 'Communication',
  'zoom.us': 'Communication',
  'teams.microsoft.com': 'Communication',

  // Social Media
  'reddit.com': 'Social Media',
  'twitter.com': 'Social Media',
  'x.com': 'Social Media',
  'facebook.com': 'Social Media',
  'instagram.com': 'Social Media',
  'tiktok.com': 'Social Media',
  'threads.net': 'Social Media',
  'pinterest.com': 'Social Media',

  // Entertainment
  'youtube.com': 'Entertainment',
  'netflix.com': 'Entertainment',
  'twitch.tv': 'Entertainment',
  'spotify.com': 'Entertainment',
  'hulu.com': 'Entertainment',
  'disneyplus.com': 'Entertainment',
  'vimeo.com': 'Entertainment',

  // Search
  'google.com': 'Search',
  'bing.com': 'Search',
  'duckduckgo.com': 'Search',
  'ecosia.org': 'Search',

  // News
  'news.ycombinator.com': 'Development',
  'nytimes.com': 'News',
  'bbc.com': 'News',
  'cnn.com': 'News',
  'reuters.com': 'News',
  'bloomberg.com': 'News',
  'theguardian.com': 'News',

  // Shopping
  'amazon.com': 'Shopping',
  'ebay.com': 'Shopping',
  'aliexpress.com': 'Shopping',
  'walmart.com': 'Shopping',
  'target.com': 'Shopping',
  'etsy.com': 'Shopping',

  // Finance
  'chase.com': 'Finance',
  'bankofamerica.com': 'Finance',
  'paypal.com': 'Finance',
  'stripe.com': 'Finance',
  'coinbase.com': 'Finance',
  'robinhood.com': 'Finance',
};

export const DEFAULT_PRODUCTIVE_CATEGORIES: CategoryType[] = [
  'Development',
  'Education',
  'Work',
  'Productivity',
];

export const DEFAULT_DISTRACTING_CATEGORIES: CategoryType[] = [
  'Entertainment',
  'Social Media',
  'Shopping',
];

/**
 * Resolve category for a given domain, taking user overrides into account.
 */
export function getDomainCategory(
  domain: string,
  categoryOverrides: Record<string, CategoryType> = {}
): CategoryType {
  if (!domain) return 'Other';
  const cleanDomain = domain.toLowerCase();

  if (categoryOverrides[cleanDomain]) {
    return categoryOverrides[cleanDomain];
  }

  if (DEFAULT_DOMAIN_CATEGORIES[cleanDomain]) {
    return DEFAULT_DOMAIN_CATEGORIES[cleanDomain];
  }

  // Fallback heuristic based on subdomains or keywords
  if (cleanDomain.endsWith('.edu')) return 'Education';
  if (cleanDomain.includes('news')) return 'News';

  return 'Other';
}

/**
 * Returns whether a category is classified as productive, distracting, or neutral.
 */
export function getCategoryProductivityType(
  category: CategoryType,
  productiveCategories: CategoryType[],
  distractingCategories: CategoryType[]
): ProductivityType {
  if (productiveCategories.includes(category)) return 'productive';
  if (distractingCategories.includes(category)) return 'distracting';
  return 'neutral';
}
