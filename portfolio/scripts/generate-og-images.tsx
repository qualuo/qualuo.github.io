import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { demos } from "../src/lib/demos";
import { points } from "../src/lib/points";
import { rfcs } from "../src/lib/rfcs";

const WIDTH = 1200;
const HEIGHT = 630;

async function loadFonts() {
  // Fetch Poppins TTF from Google Fonts GitHub (satori requires ttf/woff, not woff2)
  const regular = await fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf"
  ).then((r) => r.arrayBuffer());

  const bold = await fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf"
  ).then((r) => r.arrayBuffer());

  return [
    { name: "Poppins", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Poppins", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

interface OGPageDef {
  path: string;
  title: string;
  subtitle: string;
  accentColor: string;
}

function buildPageList(): OGPageDef[] {
  const pages: OGPageDef[] = [
    {
      path: "public/og/home.png",
      title: "Quang Luong",
      subtitle: "Systems Architect & Creative Technologist",
      accentColor: "#60a5fa",
    },
    {
      path: "public/og/about.png",
      title: "About",
      subtitle: "Systems Architect & Creative Technologist",
      accentColor: "#60a5fa",
    },
    {
      path: "public/og/work.png",
      title: "Selected Work",
      subtitle: "Enterprise AI, Automation, 3D Visualization & More",
      accentColor: "#a78bfa",
    },
    {
      path: "public/og/demos.png",
      title: "Demo Laboratory",
      subtitle: "Interactive Browser Experiments",
      accentColor: "#818cf8",
    },
    {
      path: "public/og/points.png",
      title: "Points of View",
      subtitle: "Enterprise Architecture Presentations",
      accentColor: "#94a3b8",
    },
    {
      path: "public/og/creative.png",
      title: "Creative Works",
      subtitle: "Experiments in Connection, Expression & Craft",
      accentColor: "#f472b6",
    },
    {
      path: "public/og/colophon.png",
      title: "The Night Sky",
      subtitle: "60\u00b0N \u2014 A Swedish Winter Night",
      accentColor: "#93c5fd",
    },
    {
      path: "public/og/blob.png",
      title: "Iridescent",
      subtitle: "GLSL Shaders, Perlin Noise & Fresnel Iridescence",
      accentColor: "#c084fc",
    },
    {
      path: "public/og/rfcs.png",
      title: "Requests for Comments",
      subtitle: "Structured Architectural Proposals",
      accentColor: "#3b82f6",
    },
    {
      path: "public/og/creative/flowers.png",
      title: "Flower Garden",
      subtitle: "An Interactive Digital Garden",
      accentColor: "#FDBA74",
    },
    {
      path: "public/og/creative/sakura.png",
      title: "Sakura",
      subtitle: "Transient Beauty in Bloom",
      accentColor: "#F9A8D4",
    },
    {
      path: "public/og/creative/type-race.png",
      title: "Type Race",
      subtitle: "A Beautiful Typing Speed Game",
      accentColor: "#FBBF24",
    },
  ];

  for (const demo of demos.filter((d) => d.status === "live")) {
    pages.push({
      path: `public/og/demos/${demo.slug}.png`,
      title: demo.title,
      subtitle: demo.subtitle,
      accentColor: gradientToColor(demo.gradient),
    });
  }

  for (const point of points.filter((p) => p.status === "live")) {
    pages.push({
      path: `public/og/points/${point.slug}.png`,
      title: point.title,
      subtitle: point.subtitle,
      accentColor: gradientToColor(point.gradient),
    });
  }

  for (const rfc of rfcs.filter((r) => r.status === "live")) {
    pages.push({
      path: `public/og/rfcs/${rfc.slug}.png`,
      title: rfc.title,
      subtitle: rfc.subtitle,
      accentColor: gradientToColor(rfc.gradient),
    });
  }

  return pages;
}

function gradientToColor(gradient: string): string {
  const match = gradient.match(/from-(\w+)-(\d+)/);
  if (!match) return "#60a5fa";

  const colorMap: Record<string, Record<string, string>> = {
    emerald: { "500": "#10b981" },
    teal: { "500": "#14b8a6" },
    cyan: { "500": "#06b6d4" },
    violet: { "500": "#8b5cf6" },
    purple: { "500": "#a855f7" },
    fuchsia: { "500": "#d946ef" },
    orange: { "500": "#f97316" },
    rose: { "500": "#f43f5e" },
    pink: { "500": "#ec4899" },
    indigo: { "500": "#6366f1" },
    blue: { "500": "#3b82f6" },
    sky: { "500": "#0ea5e9" },
    amber: { "500": "#f59e0b" },
    slate: { "400": "#94a3b8", "500": "#64748b" },
    zinc: { "400": "#a1a1aa" },
    neutral: { "500": "#737373" },
    red: { "500": "#ef4444" },
  };

  return colorMap[match[1]]?.[match[2]] || "#60a5fa";
}

async function generateImage(
  page: OGPageDef,
  fonts: Awaited<ReturnType<typeof loadFonts>>
) {
  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          fontFamily: "Poppins",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: "48px",
                left: "80px",
                fontSize: "16px",
                color: "#64748b",
                letterSpacing: "0.1em",
              },
              children: "qualuo.github.io",
            },
          },
          {
            type: "div",
            props: {
              style: {
                width: "64px",
                height: "4px",
                backgroundColor: page.accentColor,
                borderRadius: "2px",
                marginBottom: "32px",
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: "64px",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.1,
                marginBottom: "16px",
              },
              children: page.title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: "24px",
                color: "#94a3b8",
                fontWeight: 400,
              },
              children: page.subtitle,
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts,
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

async function main() {
  console.log("Generating OG images...\n");

  const fonts = await loadFonts();
  const pages = buildPageList();

  const root = join(__dirname, "..");
  for (const dir of ["public/og", "public/og/demos", "public/og/points", "public/og/rfcs", "public/og/creative"]) {
    const fullDir = join(root, dir);
    if (!existsSync(fullDir)) mkdirSync(fullDir, { recursive: true });
  }

  for (const page of pages) {
    const png = await generateImage(page, fonts);
    const outPath = join(root, page.path);
    writeFileSync(outPath, png);
    console.log(`  \u2713 ${page.path}`);
  }

  console.log(`\nDone! Generated ${pages.length} OG images.`);
}

main().catch(console.error);
