import { THEME_STORAGE_KEY } from '@/lib/theme';

// Everything the site stores in the visitor's browser. The site sets no
// cookies; the cookie policy (/cookies) lists these items, so add every new
// one here.

export const storedItems: {
  key: string;
  purpose: string;
  value: string;
}[] = [
  {
    key: THEME_STORAGE_KEY,
    purpose: 'Megjegyzi a választott témát (világos vagy sötét).',
    value: '„light” vagy „dark”',
  },
];
