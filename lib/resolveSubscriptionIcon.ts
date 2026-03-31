import { icons } from "@/constants/icons";
import type { ImageSourcePropType } from "react-native";

/**
 * Large public icon libraries (good references if you want deeper / vector matching later):
 * - Iconify — https://iconify.design — ~200k icons across sets; API: https://api.iconify.design/
 * - Simple Icons (brands) — https://simpleicons.org — CDN e.g. https://cdn.simpleicons.org/netflix
 * - Material / Ionicons — already available via @expo/vector-icons for in-app glyph matching
 *
 * This app keeps zero new deps: we (1) match known names to your bundled PNGs, then
 * (2) fall back to Google’s favicon endpoint, which works with <Image source={{ uri }} />.
 */

const STOP_WORDS = new Set([
  "pro",
  "plus",
  "premium",
  "max",
  "ultra",
  "family",
  "student",
  "team",
  "teams",
  "personal",
  "business",
  "free",
  "basic",
  "standard",
  "the",
  "and",
  "for",
  "app",
]);

/** Longer / more specific keys first where it matters. */
const LOCAL_BRAND_ENTRIES: { keys: string[]; icon: ImageSourcePropType }[] = [
  { keys: ["adobe creative", "creative cloud", "adobe"], icon: icons.adobe },
  { keys: ["anthropic", "claude"], icon: icons.claude },
  { keys: ["chatgpt", "chat gpt", "openai", "gpt"], icon: icons.openai },
  { keys: ["github", "git hub"], icon: icons.github },
  { keys: ["notion"], icon: icons.notion },
  { keys: ["figma"], icon: icons.figma },
  { keys: ["spotify"], icon: icons.spotify },
  { keys: ["canva"], icon: icons.canva },
  { keys: ["medium"], icon: icons.medium },
  { keys: ["dropbox"], icon: icons.dropbox },
  { keys: ["activity", "fitness"], icon: icons.activity },
];

function normalizeForMatch(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function faviconSourceForDomain(domain: string): ImageSourcePropType {
  const host = domain.replace(/^https?:\/\//i, "").split("/")[0] ?? domain;
  return {
    uri: `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(host)}`,
  };
}

/**
 * Guess a hostname from a human subscription title (e.g. "Netflix Premium" → netflix.com).
 */
function guessDomainFromName(name: string): string {
  const words = normalizeForMatch(name)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length === 0) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 32);
    return slug ? `${slug}.com` : "example.com";
  }

  const brand = words[0].replace(/[^a-z0-9]/g, "");
  if (!brand) return "example.com";

  const compoundHints: Record<string, string> = {
    youtube: "youtube.com",
    microsoft: "microsoft.com",
    apple: "apple.com",
    amazon: "amazon.com",
    google: "google.com",
    notion: "notion.so",
    figma: "figma.com",
    netflix: "netflix.com",
    linkedin: "linkedin.com",
    twitter: "x.com",
    x: "x.com",
  };

  if (compoundHints[brand]) return compoundHints[brand];

  return `${brand}.com`;
}

export function resolveSubscriptionIcon(name: string): ImageSourcePropType {
  const normalized = normalizeForMatch(name);
  if (!normalized) return icons.wallet;

  for (const { keys, icon } of LOCAL_BRAND_ENTRIES) {
    for (const key of keys) {
      if (normalized.includes(key)) return icon;
    }
  }

  return faviconSourceForDomain(guessDomainFromName(name));
}
