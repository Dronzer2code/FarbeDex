// Design tokens — docs/UI_DESIGN.md → DESIGN TOKENS.

export const color = {
  bg: '#F6F6F8',
  surface: '#FFFFFF',
  surfaceSunken: '#EFEFF3',
  ink: '#17171C',
  inkSoft: '#6B6B76',
  line: '#E7E7EC',
  silhouette: '#C9C9D2',
  silhouetteBg: '#E9E9EE',
  success: '#1F9D55',
  warning: '#D9822B',
  danger: '#D64545',
  catchButton: '#17171C',
  catchIcon: '#FFFFFF',
} as const;

export const rarityColor = {
  COMMON: '#8A8A96',
  UNCOMMON: '#3F9C6D',
  RARE: '#3B6FD8',
  LEGENDARY: '#C98A1B',
  MYTHICAL: '#8B4FD8',
} as const;

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const;

// Android needs one family name per weight; these are the names registered in app/_layout.tsx.
export const fontFamily = {
  ui400: 'Poppins_400Regular',
  ui500: 'Poppins_500Medium',
  ui600: 'Poppins_600SemiBold',
  mono500: 'JetBrainsMono_500Medium',
} as const;

export const font = {
  ui: 'Poppins', // 400, 500, 600
  mono: 'JetBrainsMono', // 500, for HEX/RGB/OKLCH and #numbers in stats
} as const;

export const type = {
  display: { fontSize: 32, fontFamily: fontFamily.ui600, lineHeight: 38 },
  title: { fontSize: 22, fontFamily: fontFamily.ui600, lineHeight: 28 },
  body: { fontSize: 15, fontFamily: fontFamily.ui400, lineHeight: 22 },
  label: { fontSize: 11, fontFamily: fontFamily.ui500, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  number: { fontSize: 16, fontFamily: fontFamily.ui500, color: color.inkSoft },
  stat: { fontSize: 22, fontFamily: fontFamily.ui500 },
} as const;

export const shadow = {
  card: {
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  button: {
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;
