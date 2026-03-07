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
}

function buildPageList(): OGPageDef[] {
  const pages: OGPageDef[] = [
    {
      path: "public/og/home.png",
      title: "Quang Luong",
      subtitle: "Building Systems. Crafting Experiences.",
    },
    {
      path: "public/og/about.png",
      title: "About",
      subtitle: "Building Systems. Crafting Experiences.",
    },
    {
      path: "public/og/work.png",
      title: "Selected Work",
      subtitle: "Enterprise AI, Automation, 3D Visualization & More",
    },
    {
      path: "public/og/demos.png",
      title: "Demo Laboratory",
      subtitle: "Interactive Browser Experiments",
    },
    {
      path: "public/og/points.png",
      title: "Points of View",
      subtitle: "Enterprise Architecture Presentations",
    },
    {
      path: "public/og/creative.png",
      title: "Creative Works",
      subtitle: "Experiments in Connection, Expression & Craft",
    },
    {
      path: "public/og/colophon.png",
      title: "The Night Sky",
      subtitle: "60\u00b0N \u2014 A Swedish Winter Night",
    },
    {
      path: "public/og/blob.png",
      title: "Iridescent",
      subtitle: "GLSL Shaders, Perlin Noise & Fresnel Iridescence",
    },
    {
      path: "public/og/rfcs.png",
      title: "Requests for Comments",
      subtitle: "Structured Architectural Proposals",
    },
    {
      path: "public/og/creative/flowers.png",
      title: "Flower Garden",
      subtitle: "An Interactive Digital Garden",
    },
    {
      path: "public/og/creative/sakura.png",
      title: "Sakura",
      subtitle: "Transient Beauty in Bloom",
    },
    {
      path: "public/og/creative/type-race.png",
      title: "Type Race",
      subtitle: "A Beautiful Typing Speed Game",
    },
    {
      path: "public/og/creative/embers.png",
      title: "Embers",
      subtitle: "Warmth in the Dark",
    },
    {
      path: "public/og/creative/fly.png",
      title: "Celestial Glider",
      subtitle: "A Chill Ambient Flying Experience",
    },
  ];

  for (const demo of demos.filter((d) => d.status === "live")) {
    pages.push({
      path: `public/og/demos/${demo.slug}.png`,
      title: demo.title,
      subtitle: demo.subtitle,
    });
  }

  for (const point of points.filter((p) => p.status === "live")) {
    pages.push({
      path: `public/og/points/${point.slug}.png`,
      title: point.title,
      subtitle: point.subtitle,
    });
  }

  for (const rfc of rfcs.filter((r) => r.status === "live")) {
    pages.push({
      path: `public/og/rfcs/${rfc.slug}.png`,
      title: rfc.title,
      subtitle: rfc.subtitle,
    });
  }

  return pages;
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
          alignItems: "center",
          justifyContent: "center",
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
                fontSize: "14px",
                color: "#475569",
                letterSpacing: "0.12em",
              },
              children: "qualuo.github.io",
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "0 120px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "72px",
                      fontWeight: 700,
                      color: "#ffffff",
                      lineHeight: 1.05,
                      marginBottom: "20px",
                      textAlign: "center",
                    },
                    children: page.title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "22px",
                      color: "#64748b",
                      fontWeight: 400,
                      textAlign: "center",
                    },
                    children: page.subtitle,
                  },
                },
              ],
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
