export const SITE_CONFIG = {
  name: "Quang Luong",
  title: "Quang Luong",
  description:
    "Systems Architect and Creative Technologist designing AI solutions, enterprise automation, and interactive digital experiences.",
  url: "https://qualuo.github.io",
  locale: "en_US",
  twitterHandle: "@qualuo",
  email: "qualuo@gmail.com",
  github: "https://github.com/qualuo",
  author: {
    name: "Quang Luong",
    jobTitle: "Building Systems. Crafting Experiences.",
    knowsAbout: [
      "Enterprise Architecture",
      "Generative AI",
      "Systems Design",
      "Creative Technology",
      "WebGL",
      "Interactive Experiences",
    ],
  },
} as const;

/** Build a canonical URL with trailing slash */
export function canonicalUrl(path: string = ""): string {
  const base = SITE_CONFIG.url;
  const clean = path.startsWith("/") ? path : `/${path}`;
  const withSlash = clean.endsWith("/") ? clean : `${clean}/`;
  return `${base}${withSlash}`;
}
