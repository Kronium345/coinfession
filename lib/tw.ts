import clsx from "clsx";
import tw from "twrnc";
import { colors, fonts, semanticClasses } from "../theme";

type CxArg = string | false | null | undefined;

const themeColorTokens: Record<string, string> = {
  background: colors.background,
  foreground: colors.foreground,
  card: colors.card,
  muted: colors.muted,
  "muted-foreground": colors.mutedForeground,
  primary: colors.primary,
  accent: colors.accent,
  border: colors.border,
  success: colors.success,
  destructive: colors.destructive,
  subscription: colors.subscription,
};

const fontTokens: Record<string, string> = {
  "font-sans": fonts.sans,
  "font-sans-light": fonts.sansLight,
  "font-sans-medium": fonts.sansMedium,
  "font-sans-semibold": fonts.sansSemibold,
  "font-sans-bold": fonts.sansBold,
  "font-sans-extrabold": fonts.sansExtrabold,
};

const withOpacity = (color: string, opacityPercent?: string) => {
  if (!opacityPercent) return color;
  const alpha = Number(opacityPercent) / 100;
  if (Number.isNaN(alpha)) return color;
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const resolveToken = (token: string) => {
  if (fontTokens[token]) {
    return { fontFamily: fontTokens[token] };
  }

  if (token.startsWith("size-")) {
    const sizeValue = token.replace("size-", "");
    return tw.style(`h-${sizeValue} w-${sizeValue}`);
  }

  const colorMatch = token.match(/^(bg|text|border)-([a-z-]+)(?:\/(\d+))?$/);
  if (colorMatch) {
    const [, kind, colorName, opacity] = colorMatch;
    const resolvedColor = themeColorTokens[colorName];
    if (resolvedColor) {
      const colorValue = withOpacity(resolvedColor, opacity);
      if (kind === "bg") return { backgroundColor: colorValue };
      if (kind === "text") return { color: colorValue };
      return { borderColor: colorValue };
    }
  }

  return tw.style(token);
};

export const cx = (...inputs: CxArg[]) => {
  const tokens = clsx(inputs).split(" ").filter(Boolean);
  const resolved = tokens.map((token) => {
    const mapped = semanticClasses[token as keyof typeof semanticClasses];
    if (mapped) {
      return tw.style(...mapped.split(" ").map(resolveToken));
    }
    return resolveToken(token);
  });
  return tw.style(...resolved);
};

