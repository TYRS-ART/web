/**
 * Builds the Malá Strana map used on the homepage and Venue page from OpenStreetMap
 * data (© OpenStreetMap contributors, ODbL), styled in the TYRŠ palette.
 *
 *   node scripts/map/build-map.mjs            # downloads fresh OSM data
 *   node scripts/map/build-map.mjs --cached   # reuses scripts/map/osm.json
 *
 * Writes public/images/map-kampa.svg (vector source, labels in brand fonts)
 * and renders public/images/map-kampa.jpg at 3200 px with headless Chrome.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

/* ------------------------------------------------------------------ Extent */

// TYRŠ, Nosticova 634/2a.
const HOUSE = { lat: 50.0842796, lon: 14.4070477 };
const BBOX = { south: 50.0816, west: 14.4, north: 50.0868, east: 14.4165 };
const PX_WIDTH = 3200;

const M_PER_DEG = 111_320;
const cosLat = Math.cos(((BBOX.south + BBOX.north) / 2) * (Math.PI / 180));
const W = (BBOX.east - BBOX.west) * M_PER_DEG * cosLat;
const H = (BBOX.north - BBOX.south) * M_PER_DEG;
const project = ({ lat, lon }) => [(lon - BBOX.west) * M_PER_DEG * cosLat, (BBOX.north - lat) * M_PER_DEG];
const fmt = (n) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ Data */

const cachePath = join(here, "osm.json");
async function loadOsm() {
  if (process.argv.includes("--cached") && existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, "utf8"));
  const b = `${BBOX.south - 0.001},${BBOX.west - 0.0015},${BBOX.north + 0.001},${BBOX.east + 0.0015}`;
  const query = `[out:json][timeout:90];(
    way["building"](${b});relation["building"](${b});
    way["highway"](${b});way["railway"="tram"](${b});
    way["natural"="water"](${b});relation["natural"="water"](${b});way["waterway"](${b});
    way["leisure"~"park|garden"](${b});relation["leisure"~"park|garden"](${b});
    way["landuse"~"grass|forest|recreation_ground"](${b});way["natural"~"wood|scrub"](${b});
  );out geom;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": "tyrs-web-map/1.0 (booking@tyrs.art)", "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}`);
  const json = await response.json();
  writeFileSync(cachePath, JSON.stringify(json));
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

function inside(point, ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.lat > point.lat !== b.lat > point.lat && point.lon < ((b.lon - a.lon) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lon) hit = !hit;
  }
  return hit;
}

/* ------------------------------------------------------------------ Style */

const C = {
  paper: "#f3f1ea",
  green: "#d3e5d4",
  greenEdge: "#bfd8c2",
  water: "#cddcf4",
  waterText: "#6f8fd9",
  building: "#e5e0d3",
  buildingEdge: "#d5cfbf",
  road: "#ffffff",
  tram: "#c9c2b4",
  text: "#5c5c5c",
  ink: "#000000",
  lime: "#79cb6f",
};

const ROAD_WIDTH = {
  secondary: 10, tertiary: 9, residential: 7, unclassified: 7, living_street: 6, pedestrian: 6, busway: 6,
  service: 3.6, footway: 1.8, path: 1.6, cycleway: 1.8, steps: 1.8,
};

const LABELS = [
  "Újezd", "Karmelitská", "Hellichova", "Harantova", "Nosticova", "Lázeňská", "Maltézské náměstí",
  "Velkopřevorské náměstí", "Na Kampě", "U Sovových mlýnů", "Karlův most", "Mostecká", "Všehrdova",
  "Říční", "Nebovidská", "Prokopská", "Tržiště", "Malostranské náměstí", "Vlašská",
];

/* ------------------------------------------------------------------ Build */

const osm = await loadOsm();
const els = osm.elements;

const greens = els.filter((e) => e.tags && (e.tags.leisure || e.tags.landuse || ["wood", "scrub"].includes(e.tags.natural)));
const waters = els.filter((e) => e.tags?.natural === "water" && !e.tags.amenity);
const buildings = els.filter((e) => e.tags?.building);
const roads = els.filter((e) => e.tags?.highway && e.geometry && ROAD_WIDTH[e.tags.highway] && !["steps"].includes(e.tags.highway));
const trams = els.filter((e) => e.tags?.railway === "tram" && e.geometry);

// The TYRŠ house: the building whose outline contains the address point.
const house = buildings.find((b) => b.type === "way" && b.geometry && inside(HOUSE, b.geometry));
if (!house) console.warn("House outline not found — only the pin will mark it.");

const roadLayers = Object.entries(ROAD_WIDTH)
  .sort((a, b) => a[1] - b[1])
  .map(([kind, width]) => {
    const d = roads.filter((r) => r.tags.highway === kind).map((r) => linePath(r.geometry)).join("");
    if (!d) return "";
    const dash = kind === "footway" || kind === "path" || kind === "cycleway" ? ` opacity=".85"` : "";
    return `<path d="${d}" stroke="${C.road}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
  })
  .join("\n");

// Street labels along the longest way of each name, written left to right.
let defs = "";
const labels = [];
for (const name of LABELS) {
  const ways = roads.filter((r) => r.tags.name === name);
  if (!ways.length) continue;
  const longest = ways
    .map((w) => ({ w, len: w.geometry.reduce((s, p, i, a) => (i ? s + Math.hypot(...project(p).map((v, k) => v - project(a[i - 1])[k])) : 0), 0) }))
    .sort((a, b) => b.len - a.len)[0];
  if (longest.len < name.length * 6.5) continue;
  let pts = longest.w.geometry.map(project);
  // Keep text upright.
  if (pts[0][0] > pts.at(-1)[0]) pts = pts.reverse();
  const visible = pts.some(([x, y]) => x > 0 && x < W && y > 0 && y < H);
  if (!visible) continue;
  const id = `s${labels.length}`;
  defs += `<path id="${id}" d="M${pts.map((p) => p.map(fmt).join(" ")).join("L")}"/>`;
  labels.push(
    `<text class="street"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${name}</textPath></text>`,
  );
}

const [hx, hy] = project(HOUSE);
const logo = readFileSync(join(root, "public/logos/logo-primary-inverse.svg"), "utf8")
  .replace(/<metadata>[\s\S]*?<\/metadata>/, "")
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

// Pin: black pill with the white wordmark, pointer down onto the house.
const PIN_W = 104;
const PIN_H = 38;
const pinX = hx - PIN_W / 2;
const pinY = hy - PIN_H - 22;
const pin = `
  <g filter="url(#shadow)">
    <rect x="${fmt(pinX)}" y="${fmt(pinY)}" width="${PIN_W}" height="${PIN_H}" rx="${PIN_H / 2}" fill="${C.ink}"/>
    <path d="M${fmt(hx - 7)} ${fmt(pinY + PIN_H - 0.5)} L${fmt(hx)} ${fmt(pinY + PIN_H + 9)} L${fmt(hx + 7)} ${fmt(pinY + PIN_H - 0.5)}Z" fill="${C.ink}"/>
  </g>
  <svg x="${fmt(pinX + 18)}" y="${fmt(pinY + 8)}" width="${PIN_W - 36}" height="${PIN_H - 16}" viewBox="340.43 329.06 496.87 164.04" preserveAspectRatio="xMidYMid meet">${logo}</svg>
  <circle cx="${fmt(hx)}" cy="${fmt(hy)}" r="6" fill="${C.lime}" stroke="${C.ink}" stroke-width="2.4"/>`;

// Big place names, positioned by hand in metres.
const place = (text, x, y, cls, rotate = 0) =>
  `<text class="${cls}" x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle"${rotate ? ` transform="rotate(${rotate} ${fmt(x)} ${fmt(y)})"` : ""}>${text}</text>`;
const [kx, ky] = project({ lat: 50.08285, lon: 14.40835 });
const [vx, vy] = project({ lat: 50.0836, lon: 14.4110 });
const [cx, cy] = project({ lat: 50.08335, lon: 14.40712 });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(W)} ${fmt(H)}" width="${PX_WIDTH}" height="${Math.round((PX_WIDTH * H) / W)}">
<defs>
  ${defs}
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity=".18"/></filter>
  <style>
    .street { font: 500 9.5px "General Sans", system-ui, sans-serif; fill: ${C.text}; letter-spacing: .02em; paint-order: stroke; stroke: ${C.paper}; stroke-width: 2.6px; stroke-linejoin: round; }
    .park { font: 500 28px "Clash Grotesk Variable", system-ui, sans-serif; fill: #6f9c7b; letter-spacing: -.02em; }
    .river { font: 500 34px "Clash Grotesk Variable", system-ui, sans-serif; fill: ${C.waterText}; letter-spacing: .12em; }
    .stream { font: italic 500 10px "General Sans", system-ui, sans-serif; fill: ${C.waterText}; }
  </style>
</defs>
<rect width="100%" height="100%" fill="${C.paper}"/>
<path d="${greens.map(areaPaths).join("")}" fill="${C.green}" fill-rule="evenodd" stroke="${C.greenEdge}" stroke-width=".6"/>
<path d="${waters.map(areaPaths).join("")}" fill="${C.water}" fill-rule="evenodd"/>
<path d="${trams.map((t) => linePath(t.geometry)).join("")}" stroke="${C.tram}" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/>
${roadLayers}
<path d="${buildings.filter((b) => b !== house).map(areaPaths).join("")}" fill="${C.building}" stroke="${C.buildingEdge}" stroke-width=".5" fill-rule="evenodd"/>
${house ? `<path d="${areaPaths(house)}" fill="${C.ink}"/>` : ""}
${labels.join("\n")}
${place("Kampa", kx, ky, "park")}
${place("VLTAVA", vx, vy, "river", -82)}
${place("Čertovka", cx, cy, "stream", -68)}
${pin}
</svg>`;

const svgPath = join(root, "public/images/map-kampa.svg");
writeFileSync(svgPath, svg);
console.log(`SVG: ${(svg.length / 1024).toFixed(0)} KB, ${buildings.length} buildings, ${labels.length} street labels, house ${house ? "found" : "missing"}`);

/* ------------------------------------------------------------------ Render */

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const pxH = Math.round((PX_WIDTH * H) / W);
const html = join(here, "render.html");
const font = (name, file) =>
  `@font-face{font-family:"${name}";src:url("${join(root, "public/fonts", file)}") format("woff2");font-weight:200 700;font-style:normal}`;
writeFileSync(
  html,
  `<!doctype html><meta charset="utf-8"><style>${font("General Sans", "GeneralSans-Variable.woff2")}${font(
    "Clash Grotesk Variable",
    "ClashGrotesk-Variable.woff2",
  )}@font-face{font-family:"General Sans";src:url("${join(root, "public/fonts/GeneralSans-VariableItalic.woff2")}") format("woff2");font-weight:200 700;font-style:italic}html,body{margin:0}svg{display:block}</style>${svg}`,
);
const png = join(here, "map.png");
execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--allow-file-access-from-files",
  "--virtual-time-budget=4000",
  `--window-size=${PX_WIDTH},${pxH}`,
  `--screenshot=${png}`,
  `file://${html}`,
]);
const jpg = join(root, "public/images/map-kampa.jpg");
execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "88", png, "--out", jpg]);
console.log(`JPG: ${jpg} (${PX_WIDTH}×${pxH})`);
