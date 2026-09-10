import { describe, it, expect } from 'vitest';
import { extractDomain, formatDomainDisplayName } from '../utils/domain';

describe('extractDomain', () => {
  it('extracts domain from https url', () => {
    expect(extractDomain('https://github.com/user/repo')).toBe('github.com');
  });

  it('strips www prefix', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=abc')).toBe('youtube.com');
    expect(extractDomain('http://www.example.com')).toBe('example.com');
  });

  it('handles http protocol', () => {
    expect(extractDomain('http://stackoverflow.com/questions')).toBe('stackoverflow.com');
  });

  it('returns null for chrome:// pages', () => {
    expect(extractDomain('chrome://newtab/')).toBeNull();
    expect(extractDomain('chrome-extension://abc123/dashboard.html')).toBeNull();
  });

  it('returns null for empty or null input', () => {
    expect(extractDomain(null)).toBeNull();
    expect(extractDomain(undefined)).toBeNull();
    expect(extractDomain('')).toBeNull();
  });

  it('returns null for file:// urls', () => {
    expect(extractDomain('file:///home/user/file.html')).toBeNull();
  });

  it('handles subdomains correctly', () => {
    expect(extractDomain('https://mail.google.com/mail')).toBe('mail.google.com');
    expect(extractDomain('https://docs.google.com/spreadsheets')).toBe('docs.google.com');
  });

  it('handles URLs with ports', () => {
    expect(extractDomain('http://localhost:3000')).toBe('localhost');
  });
});

describe('formatDomainDisplayName', () => {
  it('returns custom display names for major sites', () => {
    expect(formatDomainDisplayName('github.com')).toBe('GitHub');
    expect(formatDomainDisplayName('youtube.com')).toBe('YouTube');
    expect(formatDomainDisplayName('stackoverflow.com')).toBe('Stack Overflow');
  });

  it('capitalizes unknown domain names', () => {
    expect(formatDomainDisplayName('somesite.com')).toBe('Somesite');
  });

  it('handles empty string', () => {
    expect(formatDomainDisplayName('')).toBe('');
  });
});
