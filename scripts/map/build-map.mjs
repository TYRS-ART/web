/**
 * Builds the Kampa map used on the homepage and Venue page: OpenStreetMap data
 * (© OpenStreetMap contributors, ODbL) in the light style of the design canvas,
 * with the TYRŠ house shown in a white bubble holding a photo of the building
 * (scripts/map/building.jpg, cropped to the bubble's 156 × 134 proportions).
 *
 *   node scripts/map/build-map.mjs            # downloads fresh OSM data
 *   node scripts/map/build-map.mjs --cached   # reuses scripts/map/osm.json
 *
 * Renders two crops with headless Chrome (labels in the brand fonts), each as a map
 * layer and a transparent bubble layer so the page can fade the map but not the bubble:
 *   public/images/map-kampa.jpg + map-kampa-bubble.png                 wide, desktop (3200 px)
 *   public/images/map-kampa-mobile.jpg + map-kampa-mobile-bubble.png   tall, phones (1200 px)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const cached = process.argv.includes("--cached");

/* -------------------------------------------------------------- Geometry */

// TYRŠ, Nosticova 634/2a. Everything is measured in metres from the house.
const HOUSE = { lat: 50.0842796, lon: 14.4070477 };
const M_PER_DEG = 111_320;
const cosLat = Math.cos(HOUSE.lat * (Math.PI / 180));
const project = ({ lat, lon }) => [(lon - HOUSE.lon) * M_PER_DEG * cosLat, (HOUSE.lat - lat) * M_PER_DEG];
const fmt = (n) => Math.round(n * 10) / 10;

/**
 * Crops: size in metres, where the house sits (fraction of width/height), output
 * pixels, and a scale for labels and the bubble so they read the same on screen.
 */
const VARIANTS = [
  { name: "map-kampa", w: 1180, h: 580, hx: 0.43, hy: 0.62, px: 3200, scale: 1, bubble: 1, vltava: { lat: 50.0836, lon: 14.411 } },
  { name: "map-kampa-mobile", w: 560, h: 800, hx: 0.5, hy: 0.42, px: 1200, scale: 1.8, bubble: 1.25, vltava: { lat: 50.0853, lon: 14.4099 } },
];

// Area to download: everything any crop can show, plus a margin.
const extent = VARIANTS.reduce(
  (box, v) => ({
    west: Math.min(box.west, -v.hx * v.w),
    east: Math.max(box.east, (1 - v.hx) * v.w),
    north: Math.min(box.north, -v.hy * v.h),
    south: Math.max(box.south, (1 - v.hy) * v.h),
  }),
  { west: 0, east: 0, north: 0, south: 0 },
);
const toLon = (x) => HOUSE.lon + x / (M_PER_DEG * cosLat);
const toLat = (y) => HOUSE.lat - y / M_PER_DEG;
const BBOX = `${toLat(extent.south + 80)},${toLon(extent.west - 80)},${toLat(extent.north - 80)},${toLon(extent.east + 80)}`;

/* ------------------------------------------------------------------ Data */

const osmPath = join(here, "osm.json");
const UA = { "User-Agent": "tyrs-web-map/1.0 (booking@tyrs.art)" };

async function loadOsm() {
  if (cached && existsSync(osmPath)) return JSON.parse(readFileSync(osmPath, "utf8"));
  const b = BBOX;
  const query = `[out:json][timeout:90];(
    way["building"](${b});relation["building"](${b});
    way["highway"](${b});way["railway"="tram"](${b});
    way["natural"="water"](${b});relation["natural"="water"](${b});way["waterway"](${b});
    way["leisure"~"park|garden"](${b});relation["leisure"~"park|garden"](${b});
    way["landuse"~"grass|forest|recreation_ground"](${b});way["natural"~"wood|scrub"](${b});
  );out geom;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}`);
  const json = await response.json();
  writeFileSync(osmPath, JSON.stringify(json));
  return json;
}

/** Joins open member ways of a multipolygon into closed rings. */
function rings(members, role) {
  const parts = members.filter((m) => m.type === "way" && m.role === role && m.geometry?.length).map((m) => [...m.geometry]);
  const out = [];
  const key = (p) => `${p.lat.toFixed(7)},${p.lon.toFixed(7)}`;
  while (parts.length) {
    let ring = parts.shift();
    let grew = true;
    while (key(ring[0]) !== key(ring.at(-1)) && grew) {
      grew = false;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const end = key(ring.at(-1));
        if (key(p[0]) === end) ring = ring.concat(p.slice(1));
        else if (key(p.at(-1)) === end) ring = ring.concat([...p].reverse().slice(1));
        else continue;
        parts.splice(i, 1);
        grew = true;
        break;
      }
    }
    out.push(ring);
  }
  return out;
}

const ringPath = (ring) => `M${ring.map((p) => project(p).map(fmt).join(" ")).join("L")}Z`;
const linePath = (geom) => `M${geom.map((p) => project(p).map(fmt).join(" ")).join("L")}`;

function areaPaths(element) {
  if (element.type === "way" && element.geometry) return ringPath(element.geometry);
  if (element.type === "relation" && element.members) {
    return [...rings(element.members, "outer"), ...rings(element.members, "inner")].map(ringPath).join("");
  }
  return "";
}

/* ------------------------------------------------------------------ Style */

// The light style of the design canvas: grey ground, cream buildings with a
// little depth, blue-grey streets, bright blue water, pale green parks.
const C = {
  land: "#f2f2f4",
  green: "#c9ecd3",
  greenEdge: "#b7e2c3",
  water: "#a9dff1",
  waterText: "#5a8fa6",
  building: "#f6eedc",
  buildingSide: "#e6dcc6",
  buildingEdge: "#ece2cc",
  road: "#e1e5ee",
  roadMinor: "#e9ecf2",
  tram: "#cfd3dc",
  text: "#5f6368",
  halo: "#ffffff",
  white: "#ffffff",
};

const ROAD_WIDTH = {
  secondary: 10, tertiary: 9, residential: 7, unclassified: 7, living_street: 6, pedestrian: 6, busway: 6,
  service: 3.6, footway: 1.8, path: 1.6, cycleway: 1.8,
};

const LABELS = [
  "Újezd", "Karmelitská", "Hellichova", "Harantova", "Nosticova", "Lázeňská", "Maltézské náměstí",
  "Velkopřevorské náměstí", "Na Kampě", "U Sovových mlýnů", "Karlův most", "Mostecká", "Všehrdova",
  "Říční", "Nebovidská", "Prokopská", "Tržiště", "Malostranské náměstí", "Vlašská",
];

/* ------------------------------------------------------------------ Build */

const osm = await loadOsm();
const building = readFileSync(join(here, "building.jpg"));
const els = osm.elements;

const greens = els.filter((e) => e.tags && (e.tags.leisure || e.tags.landuse || ["wood", "scrub"].includes(e.tags.natural)));
const waters = els.filter((e) => e.tags?.natural === "water" && !e.tags.amenity);
const buildings = els.filter((e) => e.tags?.building);
const roads = els.filter((e) => e.tags?.highway && e.geometry && ROAD_WIDTH[e.tags.highway]);
const trams = els.filter((e) => e.tags?.railway === "tram" && e.geometry);

const buildingD = buildings.map(areaPaths).join("");
const roadLayers = Object.entries(ROAD_WIDTH)
  .sort((a, b) => a[1] - b[1])
  .map(([kind, width]) => {
    const d = roads.filter((r) => r.tags.highway === kind).map((r) => linePath(r.geometry)).join("");
    if (!d) return "";
    const minor = ["footway", "path", "cycleway", "service"].includes(kind);
    return `<path d="${d}" stroke="${minor ? C.roadMinor : C.road}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  })
  .join("\n");

/** Street labels along the longest way of each name, written left to right. */
function streetLabels(view, size, hidden) {
  let defs = "";
  const texts = [];
  for (const name of LABELS) {
    const ways = roads.filter((r) => r.tags.name === name);
    if (!ways.length) continue;
    const measured = ways.map((w) => {
      const pts = w.geometry.map(project);
      const len = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
      return { pts, len };
    });
    let placed = null;
    for (const longest of measured.sort((a, b) => b.len - a.len)) {
      if (longest.len < name.length * size * 0.62) continue;
      let pts = longest.pts;
      if (pts[0][0] > pts.at(-1)[0]) pts = [...pts].reverse();
      const mid = pts[Math.floor(pts.length / 2)];
      const inView = mid[0] > view.x + 20 && mid[0] < view.x + view.w - 20 && mid[1] > view.y + 20 && mid[1] < view.y + view.h - 20;
      // Names that would peek out from under the bubble are left out: sample the stretch
      // of the street the (centred) name occupies.
      const labelLen = name.length * size * 0.62;
      const at = (d) => {
        for (let i = 1, run = 0; i < pts.length; i++) {
          const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          if (run + seg >= d) {
            const t = (d - run) / seg;
            return [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])];
          }
          run += seg;
        }
        return pts.at(-1);
      };
      const covered = Array.from({ length: 9 }, (_, k) => at(longest.len / 2 - labelLen / 2 + (k * labelLen) / 8)).some(
        ([x, y]) => x > hidden.x && x < hidden.x + hidden.w && y > hidden.y && y < hidden.y + hidden.h,
      );
      if (!inView || covered) continue;
      placed = pts;
      break;
    }
    if (!placed) continue;
    const pts = placed;
    const id = `s${texts.length}`;
    defs += `<path id="${id}" d="M${pts.map((p) => p.map(fmt).join(" ")).join("L")}"/>`;
    texts.push(`<text class="street"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${name}</textPath></text>`);
  }
  return { defs, texts: texts.join("\n") };
}

const place = (text, at, cls, rotate = 0) => {
  const [x, y] = project(at);
  return `<text class="${cls}" x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle"${rotate ? ` transform="rotate(${rotate} ${fmt(x)} ${fmt(y)})"` : ""}>${text}</text>`;
};

/** White rounded bubble with the photo of the building; its pointer touches the house. */
function bubble(scale) {
  const BW = 170 * scale;
  const BH = 148 * scale;
  const border = 7 * scale;
  const r = 22 * scale;
  const bx = -BW / 2 - 6 * scale;
  const by = -BH - 30 * scale;
  return `
  <clipPath id="photo"><rect x="${fmt(bx + border)}" y="${fmt(by + border)}" width="${fmt(BW - 2 * border)}" height="${fmt(BH - 2 * border)}" rx="${fmt(r - border)}"/></clipPath>
  <g filter="url(#shadow)">
    <rect x="${fmt(bx)}" y="${fmt(by)}" width="${fmt(BW)}" height="${fmt(BH)}" rx="${fmt(r)}" fill="${C.white}"/>
    <path d="M${fmt(-13 * scale)} ${fmt(by + BH - 1)} L0 ${fmt(-4 * scale)} L${fmt(13 * scale)} ${fmt(by + BH - 1)}Z" fill="${C.white}"/>
  </g>
  <image href="data:image/jpeg;base64,${building.toString("base64")}" x="${fmt(bx + border)}" y="${fmt(by + border)}" width="${fmt(BW - 2 * border)}" height="${fmt(BH - 2 * border)}" clip-path="url(#photo)" filter="url(#grade)" preserveAspectRatio="xMidYMid slice"/>`;
}

function svgFor(v, layer) {
  const view = { x: -v.hx * v.w, y: -v.hy * v.h, w: v.w, h: v.h };
  const s = v.scale;
  const b = v.bubble;
  const hidden = { x: -91 * b - 15, y: -178 * b - 12, w: 170 * b + 30, h: 178 * b + 6 };
  const { defs, texts } = streetLabels(view, 9.5 * s, hidden);
  const pxH = Math.round((v.px * v.h) / v.w);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(view.x)} ${fmt(view.y)} ${v.w} ${v.h}" width="${v.px}" height="${pxH}">
<defs>
  ${defs}
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="${3 * s}" stdDeviation="${5 * s}" flood-color="#000" flood-opacity=".22"/></filter>
  <!-- Soft, slightly faded grade with a gentle S-curve so the photo sits in the pastel map. -->
  <filter id="grade" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.7"/><feComponentTransfer><feFuncR type="table" tableValues="0.1 0.5 0.98"/><feFuncG type="table" tableValues="0.09 0.48 0.94"/><feFuncB type="table" tableValues="0.12 0.44 0.86"/></feComponentTransfer></filter>
  <style>
    .street { font: 600 ${9.5 * s}px "General Sans", system-ui, sans-serif; fill: ${C.text}; letter-spacing: .01em; paint-order: stroke; stroke: ${C.halo}; stroke-width: ${2.8 * s}px; stroke-linejoin: round; }
    .park { font: italic 500 ${17 * s}px "General Sans", system-ui, sans-serif; fill: #4f5a55; paint-order: stroke; stroke: ${C.green}; stroke-width: ${3 * s}px; }
    .river { font: italic 500 ${17 * s}px "General Sans", system-ui, sans-serif; fill: ${C.waterText}; letter-spacing: .04em; }
    .stream { font: italic 500 ${9.5 * s}px "General Sans", system-ui, sans-serif; fill: ${C.waterText}; }
  </style>
</defs>
${layer === "bubble" ? bubble(v.bubble) : `<rect x="${fmt(view.x)}" y="${fmt(view.y)}" width="${v.w}" height="${v.h}" fill="${C.land}"/>
<path d="${greens.map(areaPaths).join("")}" fill="${C.green}" fill-rule="evenodd" stroke="${C.greenEdge}" stroke-width=".6"/>
<path d="${waters.map(areaPaths).join("")}" fill="${C.water}" fill-rule="evenodd"/>
<path d="${trams.map((t) => linePath(t.geometry)).join("")}" stroke="${C.tram}" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/>
${roadLayers}
<g transform="translate(0 2.4)"><path d="${buildingD}" fill="${C.buildingSide}" fill-rule="evenodd"/></g>
<path d="${buildingD}" fill="${C.building}" stroke="${C.buildingEdge}" stroke-width=".5" fill-rule="evenodd"/>
${texts}
${place("Kampa", { lat: 50.08285, lon: 14.40835 }, "park")}
${place("Vltava", v.vltava, "river", -82)}
${place("Čertovka", { lat: 50.08335, lon: 14.40712 }, "stream", -68)}`}
</svg>`;
}

/* ------------------------------------------------------------------ Render */

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const font = (name, file, style = "normal") =>
  `@font-face{font-family:"${name}";src:url("${join(root, "public/fonts", file)}") format("woff2");font-weight:200 700;font-style:${style}}`;
const fonts =
  font("General Sans", "GeneralSans-Variable.woff2") + font("General Sans", "GeneralSans-VariableItalic.woff2", "italic");

// Two layers per crop: the map (JPEG, faded at the edges on the page) and the
// bubble on a transparent background (PNG, never faded).
for (const v of VARIANTS) {
  const pxH = Math.round((v.px * v.h) / v.w);
  for (const layer of ["map", "bubble"]) {
    const name = layer === "map" ? v.name : `${v.name}-bubble`;
    const html = join(here, `${name}.html`);
    const bg = layer === "map" ? "" : "html,body{background:transparent}";
    writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${fonts}html,body{margin:0}${bg}svg{display:block}</style>${svgFor(v, layer)}`);
    const png = join(here, `${name}.png`);
    execFileSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--allow-file-access-from-files",
        "--virtual-time-budget=4000",
        "--default-background-color=00000000",
        `--window-size=${v.px},${pxH}`,
        `--screenshot=${png}`,
        `file://${html}`,
      ],
      { stdio: "ignore" },
    );
    if (layer === "map") {
      execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "86", png, "--out", join(root, `public/images/${name}.jpg`)], { stdio: "ignore" });
      console.log(`${name}.jpg  ${v.px}×${pxH}`);
    } else {
      writeFileSync(join(root, `public/images/${name}.png`), readFileSync(png));
      console.log(`${name}.png  ${v.px}×${pxH}`);
    }
  }
}
