/**
 * Color Contrast Ratio Test
 * 
 * This test validates that all color combinations in the cream theme
 * meet WCAG AA contrast requirements:
 * - Normal text: 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 * 
 * Requirements: 3.6, 9.1
 */

// Color contrast calculation based on WCAG 2.1 guidelines
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Theme colors from styles.css
const colors = {
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
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
};

// Test cases: [foreground, background, minRatio, description]
const testCases: Array<[string, string, number, string]> = [
  // Primary text colors on cream backgrounds
  [colors.gray[900], colors.cream.base, 4.5, 'Primary text (gray-900) on cream-base'],
  [colors.gray[900], colors.cream.light, 4.5, 'Primary text (gray-900) on white'],
  [colors.gray[900], colors.cream.dark, 4.5, 'Primary text (gray-900) on cream-dark'],
  
  // Secondary text colors
  [colors.gray[800], colors.cream.base, 4.5, 'Secondary text (gray-800) on cream-base'],
  [colors.gray[700], colors.cream.base, 4.5, 'Secondary text (gray-700) on cream-base'],
  [colors.gray[600], colors.cream.base, 4.5, 'Muted text (gray-600) on cream-base'],
  
  // Text on gray backgrounds
  [colors.gray[900], colors.gray[100], 4.5, 'Primary text on gray-100'],
  [colors.gray[700], colors.gray[100], 4.5, 'Secondary text on gray-100'],
  
  // Accent colors on cream backgrounds
  [colors.primary, colors.cream.base, 4.5, 'Primary accent on cream-base'],
  [colors.primary, colors.cream.light, 4.5, 'Primary accent on white'],
  [colors.success, colors.cream.base, 4.5, 'Success color on cream-base'],
  [colors.warning, colors.cream.base, 4.5, 'Warning color on cream-base'],
  [colors.error, colors.cream.base, 4.5, 'Error color on cream-base'],
  
  // Interactive elements
  [colors.primary, colors.gray[100], 4.5, 'Primary on gray-100 (buttons)'],
  [colors.cream.light, colors.primary, 4.5, 'White text on primary (buttons)'],
  
  // Status badges (large text - 3:1 minimum)
  [colors.primary, colors.cream.light, 3.0, 'Primary badge text (large)'],
  [colors.success, colors.cream.light, 3.0, 'Success badge text (large)'],
  [colors.warning, colors.cream.light, 3.0, 'Warning badge text (large)'],
  [colors.error, colors.cream.light, 3.0, 'Error badge text (large)'],
  
  // Border colors (3:1 for UI components)
  [colors.gray[300], colors.cream.base, 3.0, 'Border color (gray-300) on cream-base'],
];

// Run tests
console.log('🎨 Color Contrast Ratio Test\n');
console.log('Testing WCAG AA compliance for cream theme colors\n');
console.log('─'.repeat(80));

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

for (const [fg, bg, minRatio, description] of testCases) {
  const ratio = getContrastRatio(fg, bg);
  const passes = ratio >= minRatio;
  
  const status = passes ? '✓ PASS' : '✗ FAIL';
  const color = passes ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log(`${color}${status}${reset} ${description}`);
  console.log(`     Ratio: ${ratio.toFixed(2)}:1 (required: ${minRatio}:1)`);
  console.log(`     FG: ${fg} / BG: ${bg}`);
  console.log();
  
  if (passes) {
    passCount++;
  } else {
    failCount++;
    failures.push(`${description}: ${ratio.toFixed(2)}:1 (required: ${minRatio}:1)`);
  }
}

console.log('─'.repeat(80));
console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

if (failCount > 0) {
  console.log('❌ Failed tests:');
  failures.forEach((failure) => {
    console.log(`   - ${failure}`);
  });
  console.log();
  process.exit(1);
} else {
  console.log('✅ All color contrast ratios meet WCAG AA requirements!');
  console.log();
  process.exit(0);
}
