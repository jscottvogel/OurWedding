import { ThemePreset } from './types/website';

export const DEFAULT_SECTION_ORDER = [
  "hero", "story", "events", "rsvp", "travel", 
  "party", "gallery", "registry", "faq", "guestbook"
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'romantic',
    name: 'Romantic',
    primaryColor: '#e8caca',
    accentColor: '#d4af37',
    backgroundColor: '#fffdfd',
    headingFont: 'Playfair Display',
    bodyFont: 'Lato'
  },
  {
    id: 'modern',
    name: 'Modern',
    primaryColor: '#475569',
    accentColor: '#d4af37',
    backgroundColor: '#f8fafc',
    headingFont: 'Montserrat',
    bodyFont: 'Inter'
  },
  {
    id: 'rustic',
    name: 'Rustic',
    primaryColor: '#7b957a',
    accentColor: '#e2725b',
    backgroundColor: '#fbf9f6',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Open Sans'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    primaryColor: '#000000',
    accentColor: '#666666',
    backgroundColor: '#ffffff',
    headingFont: 'Inter',
    bodyFont: 'Inter'
  }
];
