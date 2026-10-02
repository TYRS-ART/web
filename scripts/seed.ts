/**
 * Seeds Sanity with the content shown on the design canvas.
 *
 *   pnpm seed                                    → dataset from NEXT_PUBLIC_SANITY_DATASET
 *   NEXT_PUBLIC_SANITY_DATASET=development pnpm seed
 *
 * Development datasets get everything, including the canvas sample events, courses
 * and bracketed placeholders, with dates relative to today so the pages stay full.
 * The production dataset only gets the site-wide documents (settings, Venue,
 * Pronájem) with every placeholder stripped out (BRIEF §10). Re-running replaces
 * the seeded documents; anything created by hand in Studio is left alone.
 */
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { join } from "node:path";

import { getCliClient } from "sanity/cli";

import { findPlaceholder } from "../src/lib/placeholders";

const client = getCliClient({ apiVersion: "2026-10-01" });
const dataset = client.config().dataset;
const isProduction = dataset === "production";
const root = process.cwd();

type Doc = { _id: string; _type: string; [key: string]: unknown };
type L<T = string> = { cs: T; en: T };

// ---------------------------------------------------------------- helpers

const key = () => randomUUID().replaceAll("-", "").slice(0, 12);
const ls = (cs: string, en: string): L & { _type: "localeString" } => ({ _type: "localeString", cs, en });
const lt = (cs: string, en: string): L & { _type: "localeText" } => ({ _type: "localeText", cs, en });
const ref = (id: string) => ({ _type: "reference", _ref: id });
const withKeys = <T extends object>(items: T[]) => items.map((item) => ({ _key: key(), ...item }));

function block(text: string, style = "normal") {
  return { _type: "block", _key: key(), style, markDefs: [], children: [{ _type: "span", _key: key(), text, marks: [] }] };
}

function blocks(cs: string[], en: string[]) {
  const toBlocks = (paragraphs: string[]) =>
    paragraphs.map((p) => (p.startsWith("## ") ? block(p.slice(3), "h3") : block(p)));
  return { _type: "localeBlockContent", cs: toBlocks(cs), en: toBlocks(en) };
}

/** "Ráno {lekce:Lekce}, …" → one block where {category:word} becomes a category pill. */
function heroBlock(sentence: string) {
  const markDefs: object[] = [];
  const children = sentence.split(/(\{[a-z]+:[^}]+\})/).filter(Boolean).map((part) => {
    const pill = part.match(/^\{([a-z]+):([^}]+)\}$/);
    if (!pill) return { _type: "span", _key: key(), text: part, marks: [] };
    const markKey = key();
    markDefs.push({ _type: "categoryPill", _key: markKey, category: pill[1] });
    return { _type: "span", _key: key(), text: pill[2], marks: [markKey] };
  });
  return [{ _type: "block", _key: key(), style: "normal", markDefs, children }];
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const localeSlug = (cs: string, en: string) => ({
  _type: "localeSlug",
  cs: { _type: "slug", current: slugify(cs) },
  en: { _type: "slug", current: slugify(en) },
});

// Dates: all sample dates are relative to today, in Prague time.

const DAY = 86_400_000;
const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Prague" }));

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** Calendar day + "HH:MM" in Prague → UTC ISO string. */
function pragueTime(date: Date, time: string) {
  const naive = new Date(`${isoDate(date)}T${time}:00Z`);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Prague", timeZoneName: "longOffset" })
    .formatToParts(naive)
    .find((p) => p.type === "timeZoneName")!
    .value.match(/GMT([+-]\d{2}):(\d{2})/);
  const minutes = offset ? Number(offset[1]) * 60 + Math.sign(Number(offset[1])) * Number(offset[2]) : 0;
  return new Date(naive.getTime() - minutes * 60_000).toISOString();
}

/** Monday of the current week. */
const weekStart = addDays(today, -((today.getUTCDay() + 6) % 7));

// ---------------------------------------------------------------- images

const imageCache = new Map<string, object>();

async function image(file: string, alt?: L) {
  if (!imageCache.has(file)) {
    const asset = await client.assets.upload("image", createReadStream(join(root, file)), {
      filename: file.split("/").pop(),
    });
    imageCache.set(file, { _type: "reference", _ref: asset._id });
  }
  return { _type: "image", asset: imageCache.get(file), ...(alt ? { alt: { _type: "localeString", ...alt } } : {}) };
}

// Design stand-ins, uploaded to development datasets only.
const placeholderImage = (name: string) => image(`design/img/placeholder-${name}.jpg`);

// ---------------------------------------------------------------- site-wide documents

async function siteDocuments(): Promise<Doc[]> {
  return [
    {
      _id: "settings",
      _type: "settings",
      heroSentence: {
        _type: "localeHeroSentence",
        cs: heroBlock("Nové venue na Kampě. Ráno {lekce:Lekce}, odpoledne {tanec:Tanec}, večer {divadlo:Divadlo} a v noci {hudba:Hudba}."),
        en: heroBlock("A new venue on Kampa. {lekce:Classes} in the morning, {tanec:Dance} in the afternoon, {divadlo:Theatre} in the evening and {hudba:Music} at night."),
      },
      rentalBand: {
        title: ls("Sál, zkušebna nebo celý dům na večer.", "A hall, a rehearsal room or the whole house for the night."),
        text: lt(
          "Koncerty, divadlo, workshopy, firemní akce, natáčení. [Kapacita, cena od — doplnit]",
          "Concerts, theatre, workshops, corporate events, film shoots. [Capacity, price from — to be added]",
        ),
      },
      address: {
        street: "Nosticova 634/2",
        district: "Malá Strana",
        postalCode: "118 00",
        city: "Praha 1",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Nosticova+634%2F2%2C+118+00+Praha+1",
      },
      email: "booking@tyrs.art",
      openingHours: lt(
        "Bar a foyer denně [16:00–24:00]. Sál podle programu, dveře hodinu před začátkem.",
        "Bar and foyer daily [16:00–24:00]. The hall follows the programme, doors open an hour before the start.",
      ),
      socials: { instagram: "https://www.instagram.com/tyrs.art/" },
    },
    {
      _id: "venuePage",
      _type: "venuePage",
      statement: lt(
        "Dům na Malé Straně, kde se během jednoho dne vystřídá jóga, zkouška kapely a večerní představení.",
        "A house in Malá Strana where yoga, a band rehearsal and an evening show all happen in a single day.",
      ),
      intro: blocks(
        ["[Dva odstavce o tom, kdo TYRŠ zakládá, proč a co má být jinak. Historie domu, vztah k sokolovně, k Malé Straně. Text dodají zakladatelé.]"],
        ["[Two paragraphs about who is founding TYRŠ, why, and what should be different. The history of the house, its link to the Sokol hall and to Malá Strana. Text from the founders.]"],
      ),
      founders: isProduction ? [] : withKeys([1, 2, 3].map((n) => ref(`sample-founder-${n}`))),
      motto: ls("„[Jedna věta, která říká, proč to děláme.]“", "“[One sentence that says why we do this.]”"),
      infoCards: withKeys([
        {
          title: ls("Otevírací doba", "Opening hours"),
          headline: ls("Bar a foyer denně [16:00–24:00]", "Bar and foyer daily [16:00–24:00]"),
          body: lt("Sál podle programu, dveře hodinu před začátkem.", "The hall follows the programme, doors open an hour before the start."),
        },
        {
          title: ls("Vstupenky", "Tickets"),
          headline: ls("Online nebo na baru", "Online or at the bar"),
          body: lt("Platba kartou i hotově.", "Card or cash."),
        },
        {
          title: ls("Bezbariérovost", "Accessibility"),
          headline: ls("Sál, bar i toalety bez schodů", "Step-free hall, bar and toilets"),
          body: lt("Napište nám předem a připravíme místo.", "Let us know in advance and we'll keep a place for you."),
        },
        {
          title: ls("Děti", "Children"),
          headline: ls("Vítané", "Welcome"),
          body: lt("Věková hranice je vždy u akce. Přebalovací pult na toaletách.", "Age limits are listed with each event. Baby changing table in the toilets."),
        },
        {
          title: ls("Umělci a pořadatelé", "Artists and promoters"),
          headline: ls("Chceš u nás hrát?", "Want to play here?"),
          link: { label: ls("Pronájem prostor →", "Space rental →"), href: "/pronajem" },
        },
        {
          title: ls("Kontakt", "Contact"),
          headline: ls("booking@tyrs.art", "booking@tyrs.art"),
          body: lt("Program, pronájem i dotazy.", "Programme, rentals and questions."),
          link: { label: ls("booking@tyrs.art", "booking@tyrs.art"), href: "mailto:booking@tyrs.art" },
          highlight: true,
        },
      ]),
    },
    {
      _id: "rentalPage",
      _type: "rentalPage",
      headline: ls("Sál, zkušebna nebo celý dům na večer.", "A hall, a rehearsal room or the whole house for the night."),
      intro: lt(
        "Koncerty, divadlo, workshopy, firemní akce, natáčení, oslavy. Napište, co chystáte — ozveme se do dvou pracovních dnů.",
        "Concerts, theatre, workshops, corporate events, film shoots, parties. Tell us what you're planning and we'll reply within two working days.",
      ),
      included: withKeys([
        {
          title: ls("Technika", "Tech"),
          body: lt("Zvuk, světla, projekce a technik v ceně. [Rider ke stažení]", "Sound, lights, projection and a technician included. [Rider download]"),
        },
        {
          title: ls("Catering", "Catering"),
          body: lt("Vlastní bar. Jídlo od partnerů nebo vlastní catering po domluvě.", "Our own bar. Food from our partners, or your own catering by arrangement."),
        },
        {
          title: ls("Ceník", "Pricing"),
          body: lt("Od [X 000] Kč za večer. Neziskové a komunitní projekty se slevou.", "From CZK [X 000] per evening. Discounts for non-profit and community projects."),
        },
        {
          title: ls("Přístup", "Access"),
          body: lt(
            "Bezbariérově, nakládka z Nosticovy. Metro Malostranská 8 min pěšky.",
            "Step-free, loading from Nosticova street. Malostranská metro is an 8-minute walk.",
          ),
        },
      ]),
      formIntro: lt(
        "Stačí pár řádků. Detaily doladíme spolu, klidně i na prohlídce.",
        "A few lines are enough. We'll sort out the details together, on a site visit if you like.",
      ),
      quote: {
        text: lt(
          "[Krátká reference od někoho, kdo u nás akci pořádal. Jedna nebo dvě věty.]",
          "[A short testimonial from someone who held an event here. One or two sentences.]",
        ),
        author: "[Jméno]",
        organisation: "[organizace]",
      },
    },
  ];
}

// ---------------------------------------------------------------- sample content (development only)

const spaces = [
  { id: "velky-sal", cs: "Velký sál", en: "Main hall", capacity: 180, area: 220, img: "velky",
    features: ["Pódium, zvuk a světla, zatemnění, bar", "Stage, sound and lights, blackout, bar"] },
  { id: "maly-sal", cs: "Malý sál", en: "Small hall", capacity: 60, area: 80, img: "maly",
    features: ["Zkušebna, workshopy, komorní představení, jóga", "Rehearsals, workshops, chamber shows, yoga"] },
  { id: "foyer", cs: "Foyer a bar", en: "Foyer and bar", capacity: 80, area: 110, img: "bar",
    features: ["Recepce, vernisáž, večírek, pop-up", "Receptions, openings, parties, pop-ups"] },
  { id: "cely-dum", cs: "Celý dům", en: "The whole house", capacity: 300, area: undefined, img: "dum",
    features: ["Festival, konference, natáčení, oslava", "Festivals, conferences, film shoots, celebrations"] },
];

type SampleEvent = {
  day: number; // days from today
  time: string;
  cs: string;
  en: string;
  categories: string[];
  hall?: string;
  img: string;
  price?: [string, string];
};

// Canvas October programme, re-anchored so that "Dnes" (14. 10. on the canvas) is today.
const events: SampleEvent[] = [
  { day: -12, time: "20:00", cs: "[Koncert]", en: "[Concert]", categories: ["hudba"], img: "img_eno" },
  { day: -11, time: "19:30", cs: "[Divadlo]", en: "[Theatre]", categories: ["divadlo"], img: "img_poster" },
  { day: -10, time: "10:00", cs: "[Workshop]", en: "[Workshop]", categories: ["lekce"], img: "img_paint" },
  { day: -8, time: "18:00", cs: "[Tanec]", en: "[Dance]", categories: ["tanec"], img: "img_dijon" },
  { day: -6, time: "20:00", cs: "[Koncert]", en: "[Concert]", categories: ["hudba"], img: "img_eno2" },
  { day: -5, time: "21:00", cs: "[DJ set]", en: "[DJ set]", categories: ["hudba"], img: "img_dijon" },
  { day: -4, time: "19:30", cs: "[Divadlo]", en: "[Theatre]", categories: ["divadlo"], img: "img_poster" },
  { day: -1, time: "18:00", cs: "[Tanec]", en: "[Dance]", categories: ["tanec"], img: "img_paint" },
  { day: 0, time: "19:30", cs: "[Název akce]", en: "[Event title]", categories: ["hudba"], hall: "velky-sal", img: "img_eno",
    price: ["390 Kč", "CZK 390"] },
  { day: 1, time: "18:00", cs: "[Název akce]", en: "[Event title]", categories: ["tanec"], hall: "maly-sal", img: "img_dijon",
    price: ["250 Kč", "CZK 250"] },
  { day: 2, time: "20:00", cs: "[Koncert]", en: "[Concert]", categories: ["hudba"], hall: "velky-sal", img: "img_eno2",
    price: ["390 Kč · 450 na místě · 250 stud.", "CZK 390 · 450 at the door · 250 students"] },
  { day: 3, time: "19:30", cs: "[Divadelní představení]", en: "[Theatre performance]", categories: ["divadlo"], hall: "velky-sal", img: "img_poster" },
  { day: 5, time: "19:30", cs: "[Čtení]", en: "[Reading]", categories: ["divadlo"], hall: "maly-sal", img: "img_paint" },
  { day: 7, time: "20:00", cs: "[Taneční večer]", en: "[Dance night]", categories: ["tanec"], hall: "velky-sal", img: "img_dijon" },
  { day: 9, time: "20:00", cs: "[Koncert] a afterparty", en: "[Concert] and afterparty", categories: ["hudba"], img: "img_eno" },
  { day: 10, time: "19:30", cs: "[Divadlo]", en: "[Theatre]", categories: ["divadlo"], img: "img_poster" },
  { day: 11, time: "10:00", cs: "[Workshop]", en: "[Workshop]", categories: ["lekce"], hall: "maly-sal", img: "img_paint" },
  { day: 13, time: "18:00", cs: "[Tanec]", en: "[Dance]", categories: ["tanec"], img: "img_dijon" },
  { day: 15, time: "20:00", cs: "[Koncert]", en: "[Concert]", categories: ["hudba"], img: "img_eno2" },
  { day: 16, time: "19:30", cs: "[Divadlo]", en: "[Theatre]", categories: ["divadlo"], img: "img_poster" },
  { day: 17, time: "15:00", cs: "[Taneční lekce]", en: "[Dance class]", categories: ["tanec", "lekce"], img: "img_paint" },
];

// Long-form copy from the event detail page on the canvas.
const detailBody = blocks(
  [
    "Kapela vznikla v roce 2021 ve zkušebně na Žižkově jako experiment: zahrát taneční hudbu bez počítače. Z experimentu se stala deska Nízký tlak, šňůra po evropských klubech a pověst jednoho z nejlepších živých setů na scéně.",
    "V Tyrši představí nový materiál, který vznikal přímo u nás během rezidence v Malém sále. Bicí, kontrabas a modulární syntezátor, který ale nikdo neprogramuje dopředu — všechno se děje teď a tady.",
    "## Proč přijít",
    "Protože je to první koncert po návratu z turné a protože Velký sál zní na tenhle druh hudby skvěle. Doporučujeme stání u pódia, ale u baru uslyšíte stejně dobře.",
    "Předskokan: [DJ set, 19:30]. Koncert začíná ve 20:00, konec kolem 22:00. Po koncertě bar otevřený do půlnoci.",
    "[Ukázkový text — nahradí se popisem konkrétní akce.]",
  ],
  [
    "The band started in 2021 in a rehearsal room in Žižkov as an experiment: play dance music without a computer. The experiment became the album Nízký tlak, a run of European club dates and a reputation for one of the best live sets around.",
    "At TYRŠ they'll present new material written here during a residency in the Small hall. Drums, double bass and a modular synth that nobody programs in advance — everything happens here and now.",
    "## Why come",
    "Because it's their first show back from tour, and because the Main hall sounds great for this kind of music. We recommend standing by the stage, but you'll hear just as well from the bar.",
    "Support: [DJ set, 19:30]. The concert starts at 20:00 and ends around 22:00. The bar stays open until midnight.",
    "[Sample text — will be replaced by the description of the actual event.]",
  ],
);

type SampleCourse = {
  id: string;
  cs: string;
  en: string;
  focus: "tanec" | "hudba" | "pohyb";
  audience?: string[];
  level?: [string, string];
  slots: [number, string, string][];
  space: string;
  lecturer: number;
  lessons: number;
  startsNextWeek?: boolean;
};

const courses: SampleCourse[] = [
  { id: "joga-rano", cs: "Jóga ráno", en: "Morning yoga", focus: "pohyb", level: ["otevřená lekce", "drop-in class"],
    slots: [[1, "08:00", "09:00"], [3, "08:00", "09:00"], [5, "08:00", "09:00"]], space: "maly-sal", lecturer: 1, lessons: 30 },
  { id: "kytara", cs: "Kytara", en: "Guitar", focus: "hudba", audience: ["zacatecnici"], level: ["začátečníci", "beginners"],
    slots: [[1, "17:00", "18:30"]], space: "maly-sal", lecturer: 2, lessons: 10 },
  { id: "soucasny-tanec-pokrocili", cs: "Současný tanec — pokročilí", en: "Contemporary dance — advanced", focus: "tanec",
    audience: ["pokrocili"], level: ["pokročilí", "advanced"], slots: [[1, "19:00", "20:30"]], space: "velky-sal", lecturer: 3, lessons: 10 },
  { id: "soucasny-tanec-zacatecnici", cs: "Současný tanec — začátečníci", en: "Contemporary dance — beginners", focus: "tanec",
    audience: ["zacatecnici"], level: ["začátečníci", "beginners"], slots: [[2, "18:00", "19:30"]], space: "maly-sal", lecturer: 3,
    lessons: 10, startsNextWeek: true },
  { id: "hip-hop", cs: "Hip hop", en: "Hip hop", focus: "tanec", level: ["otevřená lekce", "drop-in class"],
    slots: [[2, "19:30", "21:00"]], space: "velky-sal", lecturer: 4, lessons: 10 },
  { id: "klavir-pro-dospele", cs: "Klavír pro dospělé", en: "Piano for adults", focus: "hudba", audience: ["zacatecnici"],
    level: ["začátečníci", "beginners"], slots: [[3, "17:00", "18:00"]], space: "maly-sal", lecturer: 2, lessons: 8, startsNextWeek: true },
  { id: "contact-improvizace", cs: "Contact improvizace", en: "Contact improvisation", focus: "tanec",
    level: ["všechny úrovně", "all levels"], slots: [[3, "18:30", "20:00"]], space: "velky-sal", lecturer: 4, lessons: 10 },
  { id: "soucasny-tanec-mirne-pokrocili", cs: "Současný tanec — mírně pokročilí", en: "Contemporary dance — improvers", focus: "tanec",
    level: ["mírně pokročilí", "improvers"], slots: [[4, "18:00", "19:30"]], space: "maly-sal", lecturer: 3, lessons: 10 },
  { id: "sbor-tyrs", cs: "Sbor TYRŠ", en: "TYRŠ choir", focus: "hudba", level: ["zpěv", "singing"],
    slots: [[4, "19:30", "21:00"]], space: "velky-sal", lecturer: 5, lessons: 12, startsNextWeek: true },
  { id: "bici", cs: "Bicí", en: "Drums", focus: "hudba", audience: ["pro-deti"], level: ["děti 8+", "kids 8+"],
    slots: [[5, "16:00", "17:00"]], space: "maly-sal", lecturer: 2, lessons: 10 },
  { id: "hlasova-technika", cs: "Hlasová technika", en: "Vocal technique", focus: "hudba",
    slots: [[5, "17:30", "19:00"]], space: "maly-sal", lecturer: 5, lessons: 10 },
  { id: "detsky-tanecni-krouzek", cs: "Dětský taneční kroužek", en: "Kids' dance club", focus: "tanec", audience: ["pro-deti"],
    level: ["4–7 let", "ages 4–7"], slots: [[6, "10:00", "11:00"]], space: "maly-sal", lecturer: 4, lessons: 12 },
  { id: "street-dance", cs: "Street dance", en: "Street dance", focus: "tanec", level: ["teens", "teens"],
    slots: [[6, "11:30", "13:00"]], space: "velky-sal", lecturer: 4, lessons: 12 },
  { id: "joga-nedele", cs: "Jóga neděle", en: "Sunday yoga", focus: "pohyb", level: ["pomalá", "slow"],
    slots: [[7, "10:00", "11:30"]], space: "maly-sal", lecturer: 1, lessons: 10 },
];

async function sampleDocuments(): Promise<Doc[]> {
  const docs: Doc[] = [];

  for (const [index, s] of spaces.entries()) {
    docs.push({
      _id: `sample-space-${s.id}`,
      _type: "space",
      name: ls(s.cs, s.en),
      capacity: s.capacity,
      area: s.area,
      features: ls(...(s.features as [string, string])),
      photo: await placeholderImage(s.img),
      rentable: true,
      order: index,
    });
  }

  for (const n of [1, 2, 3]) {
    docs.push({
      _id: `sample-founder-${n}`,
      _type: "person",
      name: "[Jméno]",
      role: ls(n === 1 ? "[Role — dramaturgie, provoz, produkce]" : "[Role]", "[Role]"),
    });
  }
  for (const n of [1, 2, 3, 4, 5]) {
    docs.push({
      _id: `sample-lecturer-${n}`,
      _type: "person",
      name: n === 5 ? "[Sbormistr]" : "[Jméno lektora]",
      role: ls(n === 5 ? "Sbormistr" : "Lektor", n === 5 ? "Choirmaster" : "Teacher"),
      photo: await placeholderImage("pin"),
      bio: lt(
        "[Dvě věty o lektorovi: odkud přišel, s kým tančil, co učí a jak. Text dodá lektor.]",
        "[Two sentences about the teacher: background, who they've worked with, what and how they teach.]",
      ),
    });
  }

  for (const e of events) {
    const date = addDays(today, e.day);
    const isDetail = e.day === 2;
    const [h, m] = e.time.split(":").map(Number);
    docs.push({
      _id: `sample-event-${isoDate(date)}-${slugify(e.cs)}`,
      _type: "event",
      title: ls(e.cs, e.en),
      slug: {
        ...localeSlug(e.cs, e.en),
        cs: { _type: "slug", current: `${slugify(e.cs)}-${isoDate(date)}` },
        en: { _type: "slug", current: `${slugify(e.en)}-${isoDate(date)}` },
      },
      startsAt: pragueTime(date, e.time),
      doorsAt: pragueTime(date, `${String(h - 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`),
      endsAt: pragueTime(date, `${String(Math.min(h + 2, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`),
      hall: e.hall ? ref(`sample-space-${e.hall}`) : undefined,
      categories: e.categories,
      heroImage: await placeholderImage(e.img),
      lead: isDetail
        ? lt(
            "Pražské trio, které hraje elektroniku na akustické nástroje. Večer bez playbacku, kde se smyčky skládají živě před publikem.",
            "A Prague trio playing electronic music on acoustic instruments. A night without playback, where loops are built live in front of the audience.",
          )
        : undefined,
      body: isDetail ? detailBody : undefined,
      goodToKnow: isDetail
        ? withKeys([
            ls("Vstup do sálu od 19:00, bar od 18:00.", "Hall opens at 19:00, bar at 18:00."),
            ls("Vstupenky nejsou vratné, ale dají se přeposlat kamarádovi.", "Tickets are non-refundable but can be passed on to a friend."),
            ls("Bezbariérový přístup do sálu i na toalety.", "Step-free access to the hall and toilets."),
            ls("[Věková hranice / jazyk / délka — doplnit]", "[Age limit / language / length — to be added]"),
          ])
        : undefined,
      priceText: e.price ? ls(...e.price) : undefined,
      ticketUrl: e.price ? "https://example.com/vstupenky" : undefined,
      capacityNote: isDetail ? ls("Zbývá posledních [24] vstupenek", "Only [24] tickets left") : undefined,
      links: isDetail ? { spotify: "https://open.spotify.com/", website: "https://example.com/" } : undefined,
      featured: e.day >= 2 && e.day <= 11,
      tickerText: undefined,
    });
  }

  for (const c of courses) {
    const firstWeekday = c.slots[0][0];
    const runStart = addDays(weekStart, (c.startsNextWeek ? 7 : -28) + firstWeekday - 1);
    const isDetail = c.id === "soucasny-tanec-zacatecnici";
    const lessonDates = Array.from({ length: c.lessons }, (_, i) => ({
      _type: "lessonDate",
      _key: key(),
      date: pragueTime(addDays(runStart, i * 7), c.slots[0][1]),
      isTrial: isDetail && i === 0,
    }));
    docs.push({
      _id: `sample-course-${c.id}`,
      _type: "course",
      title: ls(c.cs, c.en),
      slug: localeSlug(c.cs, c.en),
      focus: c.focus,
      audienceTags: c.audience,
      level: c.level ? ls(...c.level) : undefined,
      lecturer: ref(`sample-lecturer-${c.lecturer}`),
      space: ref(`sample-space-${c.space}`),
      heroImage: await placeholderImage(c.focus === "hudba" ? "img_eno2" : "img_dijon"),
      slots: c.slots.map(([weekday, startTime, endTime]) => ({ _type: "slot", _key: key(), weekday, startTime, endTime })),
      runStart: isoDate(runStart),
      runEnd: isoDate(addDays(runStart, (c.lessons - 1) * 7)),
      lessonsCount: c.lessons,
      lessonDates: c.slots.length === 1 ? lessonDates : undefined,
      coursePrice: isDetail ? 3200 : 2800,
      bookingUrl: "https://example.com/rezervace",
      allowSingleLesson: isDetail || c.level?.[0] === "otevřená lekce",
      singleLessonPrice: 390,
      trialPrice: isDetail ? 195 : undefined,
      capacity: 14,
      placesLeft: isDetail ? 4 : undefined,
      description: isDetail
        ? blocks(
            [
              "[Co se v kurzu naučíš a pro koho je — tři věty, které čte i ten, kdo nikdy netančil.]",
              "[Druhý odstavec: jak lekce probíhá, z čeho vychází, co je cílem po deseti týdnech. Text dodá lektor.]",
            ],
            [
              "[What you'll learn and who it's for — three sentences for someone who has never danced.]",
              "[Second paragraph: how a class runs, what it builds on, the goal after ten weeks. Text from the teacher.]",
            ],
          )
        : undefined,
      forWhom: isDetail
        ? lt(
            "Úplní začátečníci, 16+\nŽádná předchozí zkušenost. Pokročilí mají čtvrtek.",
            "Complete beginners, 16+\nNo experience needed. Improvers come on Thursdays.",
          )
        : undefined,
      whatToBring: isDetail
        ? lt(
            "Pohodlné oblečení, ponožky, voda\nTančí se naboso nebo v ponožkách. Šatna a sprcha v domě.",
            "Comfortable clothes, socks, water\nWe dance barefoot or in socks. Changing room and shower in the house.",
          )
        : undefined,
      goodToKnow: isDetail
        ? withKeys([
            ls("První lekce je zkušební za 195 Kč — když se přihlásíš na kurz, odečteme ji.", "The first class is a CZK 195 trial — it's deducted if you sign up for the course."),
            ls("Zmeškanou lekci si nahradíš v jiné skupině do konce běhu.", "Make up a missed class with another group before the run ends."),
            ls("Platba kartou online nebo na baru.", "Pay by card online or at the bar."),
            ls("Minimálně 6 lidí, jinak kurz posuneme.", "At least 6 people, otherwise we postpone the course."),
          ])
        : undefined,
    });
  }

  const month = isoDate(today).slice(0, 7);
  const monthName = (locale: string) =>
    today.toLocaleDateString(locale, { month: "long", timeZone: "UTC" }).replace(/^./, (ch) => ch.toUpperCase());
  docs.push({
    _id: `sample-playlist-${month}`,
    _type: "playlist",
    month,
    title: ls(`${monthName("cs-CZ")} v Tyrši`, `${monthName("en-GB")} at TYRŠ`),
    spotifyUrl: "https://open.spotify.com/",
    cover: await placeholderImage("img_eno"),
    tracks: [1, 2, 3, 4].map(() => ({ _type: "track", _key: key(), title: "[Skladba]", artist: "[Interpret]" })),
  });

  return docs;
}

// ---------------------------------------------------------------- production safety

/**
 * Drops whatever still contains a design placeholder: whole strings, whole
 * localized values (both languages go together) and whole array items.
 */
function stripPlaceholders<T>(value: T): T | undefined {
  if (!findPlaceholder(value)) return value;
  if (Array.isArray(value)) return value.filter((item) => !findPlaceholder(item)) as T;
  if (!value || typeof value !== "object" || "cs" in value || "en" in value) return undefined;
  const entries = Object.entries(value)
    .map(([k, v]) => [k, stripPlaceholders(v)] as const)
    .filter(([, v]) => v !== undefined);
  return entries.some(([k]) => !k.startsWith("_")) ? (Object.fromEntries(entries) as T) : undefined;
}

// ---------------------------------------------------------------- run

async function main() {
  console.log(`Seeding dataset "${dataset}"${isProduction ? " (site documents only, placeholders stripped)" : ""}…`);

  const site = await siteDocuments();
  const docs = isProduction ? site.map((doc) => stripPlaceholders(doc) as Doc) : [...site, ...(await sampleDocuments())];

  const leaked = isProduction && docs.map((doc) => findPlaceholder(doc)).find(Boolean);
  if (leaked) throw new Error(`Refusing to seed production: placeholder "${leaked}" left in the data.`);

  const tx = client.transaction();
  for (const doc of docs) tx.createOrReplace(JSON.parse(JSON.stringify(doc)));
  await tx.commit();

  console.log(`Done: ${docs.length} documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
