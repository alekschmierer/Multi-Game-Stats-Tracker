// Categorical slots 1/2/3 from the validated default palette — color follows
// the game (entity) and stays fixed across every chart, never reassigned.
export const gamePalette = {
  coc: { light: "#2a78d6", dark: "#3987e5", label: "Clash of Clans" },
  cr: { light: "#eb6834", dark: "#d95926", label: "Clash Royale" },
  lol: { light: "#1baf7a", dark: "#199e70", label: "League of Legends" },
} as const;

export const ink = {
  primary: { light: "#0b0b0b", dark: "#ffffff" },
  secondary: { light: "#52514e", dark: "#c3c2b7" },
  muted: { light: "#898781", dark: "#898781" },
  gridline: { light: "#e1e0d9", dark: "#2c2c2a" },
  baseline: { light: "#c3c2b7", dark: "#383835" },
  surface: { light: "#fcfcfb", dark: "#1a1a19" },
  border: { light: "rgba(11,11,11,0.10)", dark: "rgba(255,255,255,0.10)" },
} as const;

export function seriesColor(game: keyof typeof gamePalette, isDark: boolean) {
  return isDark ? gamePalette[game].dark : gamePalette[game].light;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function compositeOverSurface(hex: string, alpha: number, isDark: boolean) {
  const fg = hexToRgb(hex);
  const bg = hexToRgb(ink.surface[isDark ? "dark" : "light"]);
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Sequential encoding for a 0-100 value: one hue, alpha stands in for
// lightness so it composites correctly against either surface without a
// hand-picked dark-mode ramp.
export function sequentialFill(game: keyof typeof gamePalette, value: number | null, isDark: boolean) {
  if (value === null) return isDark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.04)";
  const alpha = 0.12 + (Math.min(Math.max(value, 0), 100) / 100) * 0.88;
  const { r, g, b } = hexToRgb(seriesColor(game, isDark));
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

// Picks readable text ink for a value drawn inside a sequentialFill cell.
export function textOnSequentialFill(game: keyof typeof gamePalette, value: number | null, isDark: boolean) {
  if (value === null) return ink.muted[isDark ? "dark" : "light"];
  const alpha = 0.12 + (Math.min(Math.max(value, 0), 100) / 100) * 0.88;
  const composited = compositeOverSurface(seriesColor(game, isDark), alpha, isDark);
  return relativeLuminance(composited) > 0.55 ? "#0b0b0b" : "#ffffff";
}
