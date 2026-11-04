import type { ComponentType } from 'react';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType;
  /** The item is highlighted for these paths (the detail pages belong to the list). */
  match: (pathname: string) => boolean;
};

/**
 * Entries of the main menu. Every role sees all of them; add new screens here and they appear in the menu of
 * both the phone and the desktop interface.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Crear cotización', href: '/', icon: NoteAddIcon, match: (pathname) => pathname === '/' },
  { label: 'Ver cotizaciones', href: '/quotes', icon: ListAltIcon, match: (pathname) => pathname.startsWith('/quotes') },
];
