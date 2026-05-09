/**
 * Theme Configuration
 * 
 * This TypeScript theme object provides programmatic access to the design system
 * values defined in styles.css as CSS custom properties. All values mirror the
 * CSS variables to ensure consistency between programmatic and declarative styling.
 * 
 * Usage:
 *   import { theme } from './theme';
 *   const primaryColor = theme.colors.primary;
 */

export const theme = {
  colors: {
    cream: {
      base: '#FAF9F6',
      light: '#FFFFFF',
      dark: '#F5F5F0',
    },
    gray: {
      100: '#F8F8F8',
      200: '#E8E8E8',
      300: '#D4D4D4',
      400: '#A8A8A8',
      500: '#808080',
      600: '#5C5C5C',
      700: '#3A3A3A',
      800: '#2C2C2C',
      900: '#1A1A1A',
    },
    primary: '#0A7EA4',
    primaryHover: '#086B8A',
    primaryLight: '#E6F4F8',
    success: '#059669',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    coverage: {
      covered: '#059669',
      pa: '#D97706',
      notCovered: '#DC2626',
      listed: '#0A7EA4',
    },
  },
  typography: {
    fontFamily: {
      sans: '"Inter", "Segoe UI", "Roboto", system-ui, sans-serif',
      mono: '"IBM Plex Mono", "Consolas", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 1px 3px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 6px rgba(0, 0, 0, 0.1)',
    xl: '0 10px 15px rgba(0, 0, 0, 0.1)',
    '2xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease-in-out',
  },
} as const;

/**
 * Type definition for the theme object
 * Provides type safety when accessing theme values programmatically
 */
export type Theme = typeof theme;

/**
 * Type definitions for individual theme sections
 * Useful for component props that accept theme values
 */
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeTypography = typeof theme.typography;
export type ThemeBorderRadius = typeof theme.borderRadius;
export type ThemeShadows = typeof theme.shadows;
export type ThemeTransitions = typeof theme.transitions;
