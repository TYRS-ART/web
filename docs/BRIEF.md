# TYRŠ — website build brief (for Claude Code)

Website for **TYRŠ**, a venue at Nosticova 634/2, Malá Strana, Praha 1. One house: concerts, theatre, dance, classes and courses, plus space rental.

**Design source of truth:** the TYRŠ web canvas (Claude Design artifact) — https://claude.ai/artifact/3Lcfvrt2KGQvnttb3meKFq
**Design system (fonts, logos, tokens):** https://claude.ai/artifact/Tn9MG1Bi1UjvdD26CrCdsK

The canvas holds every page in desktop (1440 px) and mobile (390 px) versions. The pages are plain HTML/CSS, so CSS such as the logo hover, chip gradients, duotone and nav animation can be copied almost verbatim. Treat the canvas as the visual spec: match it, don't reinterpret it.

---

## 0. Starting point (brand-new project)

This is a **completely new project**. Do not reuse any earlier TYRŠ code or repository.

- This folder holds only the inputs: `CLAUDE.md`, `docs/`, `design/` and `public/` (fonts, logos, map). Scaffold the app **inside this folder** with `create-next-app` (latest Next.js 16, TypeScript, App Router, Tailwind CSS v4, ESLint, `src/` dir, pnpm), keeping the existing `docs/`, `design/` and `public/` files.
- Read `node_modules/next/dist/docs/` before writing Next.js code. Next.js 16 changed APIs and conventions.
- Git: `git init`, then push to **github.com/TYRS-ART/web** (private, empty, owned by Matej). The first commit may go straight to `main`. After that: a branch per step (`feat/homepage`, `fix/nav-overflow`…), Conventional Commits (`feat(events): add event detail page`), `pnpm lint && pnpm type-check` before every commit, and a pull request into `main` for each step.
- Add a GitHub Actions workflow that runs lint and type-check on every PR.
- Motion (motion.dev) may be added only where CSS can't do the job; the design-system effects stay CSS.

---

## 1. Decisions already made

| Topic | Decision |
|---|---|
| Framework | **Next.js 16** (App Router, React 19) + TypeScript, pnpm. Deployed on **Vercel** (connected to the TYRS-ART GitHub organization). |
| Styling | **Tailwind CSS v4** with the tokens below defined in `@theme`; hand-written CSS for the special effects (drift, duotone, feather, logo hover, nav roll). |
| CMS | **Sanity** (hosted Studio at /studio or studio.tyrs.art) |
| Languages | **Czech + English at launch** (next-intl). Czech is default (`/`), English under `/en`. All CMS text fields bilingual. |
| Tickets | **External service.** Each event has a ticket URL (GoOut / Ticketportal / Eventbrite…). No payments on our site. |
| Course sign-ups | **External booking tool** (e.g. Reservio, Bookio). Each course has a booking URL; optional separate URL for a single lesson. |
| Course pricing | **Per course setting:** full-course price always; single-lesson price + booking only if enabled for that course. |
| Newsletter | **Mailchimp** (embedded signup form / API route). |
| Analytics | Plausible |
| Maps | Static map image + "Otevřít v Google Maps" link (no embedded Google Map). |
| Music | Monthly Spotify playlist (embed/link), shown in the header dropdown. |

---

## 2. Design tokens

### Colours
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#f3f1ea` | page background everywhere |
| `--sunken` | `#e7e3d8` | empty/placeholder surfaces |
| `--card` | `#ffffff` | white cards grouping content |
| `--ink` | `#000000` | text, rules, primary buttons |
| `--muted` | `#5c5c5c` | secondary text |
| `--green` | `#204f25` | TYRŠ dark green (Spotify card, focus rings) |
| `--lime` | `#79cb6f` | play button, "Vstupenky / Přihlásit se" buttons, live dot |
| `--butter` | `#f2dd6e` | accent bands (Pronájem band, quotes, Kontakt tile, "Pohyb" tag) |

**Category colours** (always black text):
| Category | Base | Gradient stops (drift) | Hover/selected border |
|---|---|---|---|
| Hudba | `#8fa8ee` | `#a3b8f2 → #7b97e8 → #b6c6f5` | `#4f6fd6` |
| Divadlo | `#f29572` | `#f5a888 → #ee8460 → #f8bba1` | `#d0613a` |
| Tanec | `#c9de78` | `#d4e58f → #bdd463 → #e0ecaa` | `#94b23a` |
| Lekce | `#8cc4a0` | `#9fcfb0 → #78b78e → #b2dac0` | `#4b9466` |

Category chips carry a slow, drifting gradient within their own hue (copy the `.cl`, `.cl-*` and `@keyframes drift` CSS from the canvas; 9–13 s, `alternate`; disabled under `prefers-reduced-motion`).

### Type
- **Display:** Clash Grotesk (variable), weight 500, letter-spacing −0.03em. Headlines, event titles, menu items.
- **Text:** General Sans (variable), 400/500.
- **Quotes:** Hedvig Letters Serif.
- Font files come from the design system artifact. Self-host them (`next/font/local`).
- Desktop scale (approx.): hero 120/108, section titles 200/168 ("Říjen"), H2 72–120, tile titles 56–120, body 20–22/32–34, small 14–18. Mobile: hero 52/50, section 88–104, body 15–17.

### Shape and space
- Radii: cards 24 px (mobile 16), tiles 16 (mobile 14), buttons and chips 999 px.
- Page gutters: 64 px desktop text, 24 px for cards; 20 / 12 px on mobile.
- Rules: 2 px black lines between list rows and footer top.

### Imagery
- **Feathered edges** on photos: eased 22 px mask desktop / 16 px mobile (copy `.soft`). Tile background transparent behind feathered photos.
- **Duotone** on homepage event photos: grayscale + two blend layers (shadow `#302a25` via `lighten`, highlight `#efe8d8` via `multiply`). They fade to real colour in 450 ms on hover of the tile/row, or when hovering any chip of the same category (CSS `:has()`). Touch devices: stay duotone.
- Bottom gradient scrim on tiles for white titles.

---

## 3. Global components

- **Header (desktop):** logo (primary black) left; centre nav **Program · Venue · Pronájem · EN** (Clash 26 px, black). Hover: word rolls up and a copy rolls in, black underline wipes in from the left. Active page: 4 px black underline that draws in on load. Colours never change on hover or active. Right side: black "now playing" capsule (green play circle, "Říjen 26 · playlist"), which opens a Spotify card (green `#204f25`) on hover or focus.
- **Header (mobile):** logo, green play button (same dropdown), black "Menu" pill → full-screen menu.
- **Mobile menu:** big Clash items Program (with sub-chips Akce / Kurzy & lekce), Venue, Pronájem; "Dnes" card with ticket button; Instagram / Spotify / Newsletter; address + Mapa link; CZ/EN toggle; "Zavřít ✕".
- **Footer:** 4 text columns (Menu / Sleduj nás: Instagram, Spotify, Newsletter / Kde / Napiš nám), then the full-width **boxed-row logo** as inline SVG. Each letter tile inverts on hover (outlined box, black letter). No copyright line, no Facebook.
- **Category chip / pill:** coloured, drifting gradient, black text. Hover and selected state = 3 px border in the category's darker shade.
- **Event tile:** photo + feathered edge + scrim, white date badge + category chip top-left, Clash title bottom-left.
- **Event row:** date · title + chip · time · 160×100 thumbnail; 2 px rule; no underline or colour change on hover.
- **Buttons:** black pill (primary), outline pill (secondary), lime pill (tickets / sign-up).
- **Cards:** white, radius 24, used to group related content (mosaic, lists, calendar, side info).

---

## 4. Pages and routes

Paths shown for Czech; English mirrors them under `/en` with translated slugs.

### `/` Homepage
1. Hero sentence with clickable category pills (current copy: "Nové venue na Kampě. Ráno *Lekce*, odpoledne *Tanec*, večer *Divadlo* a v noci *Hudba*."). Lekce → `/kurzy`; the others → `/program?kategorie=…` with that filter preselected.
2. "Dnes" ticker band: transparent, black rules above and below, scrolling text with green dots (today and next events, auto from CMS).
3. "Nejbližší události" white card: mosaic of the next 5 events (8+4 / 3+5+4 grid on desktop, stacked on mobile), duotone photos.
4. "Tenhle týden v kurzech": white card with 5 course slots (sage green) → course detail; "Celý rozvrh →".
5. "Říjen" (current month) list: next 4 events as rows, "Celý program →".
6. Butter "Pronájem" band → `/pronajem`.
7. Map section: static map image, white address card bottom-right, Google Maps button.
8. Footer.

### `/program` Programme — events
- Tabs: **Akce** (active) | **Kurzy & lekce** → `/kurzy`.
- Month headline + month navigation (← / "Listopad →").
- Category filters (Vše + 4 categories, multi-select, ✓ and coloured ring when selected, others dimmed), and a **Kalendář / Seznam** toggle.
- Calendar view: month grid on a white card, photo tiles per event with time badge in the category colour; today highlighted.
- List view: event rows.
- "Tento týden" card; channels block (Instagram, WhatsApp kanál, Spotify, Kalendář feed + newsletter email signup).
- URL state: `?kategorie=hudba,tanec&mesic=2026-10&zobrazeni=seznam`.

### `/program/[slug]` Event detail
- Large hero photo with category chips and hall badge, huge title.
- Black info band: Kdy / Dveře / Kde (hall + address link) / Vstupné. Lime **"Vstupenky · {price}"** → external ticket URL; "Přidat do kalendáře" (.ics); remaining-capacity line (optional field).
- Body: lead paragraph (display font) + rich text (paragraphs, subheadings, bold or italic, links).
- Right column: "Dobré vědět" card (bullets); **links card** with "Poslechni si" (Spotify, Web umělce) and "Sdílet" (native Web Share API, fallback copies the link) + "Kopírovat odkaz"; butter "Pronájem prostor →" card.
- "Další akce" white card with 3 related events.
- Mobile: sticky black bottom bar with date, title and ticket button.

### `/kurzy` Courses and classes
- Same tabs (Kurzy & lekce active), week headline + week navigation.
- Filters: Vše / Tanec / Hudba / Pohyb / Pro děti / Začátečníci.
- **Weekly timetable** (desktop): 7 day columns × time rows 8:00–22:00, sage slots placed by start/end time with title, time and a small white tag with a coloured dot (Tanec / Hudba / Pohyb). Hover inverts to black. Mobile: day-by-day list.
- "Začínáme v říjnu": 3 course tiles for new runs.

### `/kurzy/[slug]` Course detail
- Hero photo, chips (Lekce + focus + level), title.
- Black info band: Kdy (weekday + time) / Běh (dates, number of lessons) / Lektor / Cena (course price; single-lesson price if enabled). Lime **"Přihlásit se na kurz"** → external booking URL; outline "Jen jedna lekce · {price}" only if single lessons are enabled; places-left line.
- Body: description, "Pro koho" and "Co s sebou" cards, lecturer card (photo, name, bio), "Termíny" list of all dates (first lesson can be marked as a trial).
- Right column: "Dobré vědět", share card, butter "Nehodí se ti {weekday}? Celý rozvrh lekcí →".
- "Další kurzy" card.

### `/pronajem` Space rental
Hero headline + "Poptat termín"; "Prostory" white card with 4 space tiles (Velký sál, Malý sál, Foyer a bar, Celý dům: capacity, m², features); black "Co je v ceně" band (Technika / Catering / Ceník / Přístup); enquiry form (name, organisation, email, phone, space, event type, date, people, message, consent) → email to hello@tyrs.art (Resend or Vercel email route); butter reference quote.

### `/venue` Venue (Kdo / Kde / Jak)
Kdo: big statement, intro text, founders in 3 photo tiles on a white card. Butter motto band. Kde: full-width map image + address card + Google Maps. Jak: 6 info cards (Otevírací doba, Vstupenky, Bezbariérovost, Děti, Umělci a pořadatelé, butter Kontakt).

### Also needed (not on canvas, keep in the same style)
404 page; privacy policy / cookies page; newsletter success state; empty states ("Tento měsíc zatím nic").

---

## 5. Content model (Sanity)

All human-readable text fields are bilingual (`{cs, en}`); slugs per language.

**event**
title · slug · startsAt (datetime) · doorsAt · endsAt? · hall → `space` · categories[] (hudba / divadlo / tanec / lekce) · heroImage (+ hotspot) · lead (short) · body (portable text) · priceText (e.g. "390 Kč · 450 na místě · 250 stud.") · ticketUrl · capacityNote? · goodToKnow[] (strings) · links { spotify?, website? } · featured (bool, homepage mosaic order) · tickerText?

**course**
title · slug · focus (tanec / hudba / pohyb) · audienceTags[] (pro děti, začátečníci, pokročilí) · level · lecturer → `person` · space → `space` · weekday + startTime + endTime (recurring slot; allow several slots) · runStart / runEnd · lessonDates[] (generated or manual; `isTrial` flag) · lessonsCount · coursePrice · **allowSingleLesson (bool)** · singleLessonPrice? · bookingUrl · singleLessonBookingUrl? · capacity · placesLeft? · heroImage · description · forWhom · whatToBring · goodToKnow[]

**person** (lecturers, founders): name · role · photo · bio

**space**: name · capacity · area m² · features · photo · rentable (bool)

**playlist** (monthly): month · title · spotifyUrl · cover? · tracks preview?

**settings** (singleton): heroSentence (rich text with category pills) · address · contacts (hello@tyrs.art; optional phone) · socials (Instagram, Spotify, WhatsApp channel) · opening hours · Mailchimp list id · map image.

The timetable on `/kurzy` and "Tenhle týden v kurzech" are generated from course slots. The homepage lists, calendar and ticker come from events by date.

---

## 6. Behaviour details

- Filters, view toggle and month/week are reflected in the URL (shareable, back button works).
- Header pills on the homepage link to the filtered programme.
- "Přidat do kalendáře" generates an .ics; the Program "Kalendář" channel offers a subscribable iCal feed of all events.
- Share: `navigator.share` when available, otherwise copy link + toast.
- Language switch keeps the user on the equivalent page.
- SEO: Event JSON-LD (schema.org `Event`, `offers.url` = ticket URL); course pages `Course`; Open Graph images from hero photos.
- Images through `next/image` with Sanity CDN; AVIF/WebP.
- Accessibility: focus rings (`#204f25`), all hover info also reachable by focus, `prefers-reduced-motion` turns off drift, roll and duotone fades; contrast is fine because all chips use black text.
- Revalidation: Sanity webhook → on-demand ISR so new events appear within seconds.

---

## 7. Assets to collect

- Fonts and logos (primary black, inverse, boxed-row) from the design system artifact. **Use the boxed-row SVG with each letter tile as a separate group** (see the footer markup on the canvas).
- Static map crop (Malá Strana with the house marked), currently on the canvas.
- Real photos: events, the four spaces, founders, lecturers. Canvas images are placeholders.

---

## 8. Suggested build order

1. Next.js + Sanity setup, schemas from §5, seed with the placeholder content from the canvas (CS + EN).
2. Tokens, fonts, global layout (header, mobile menu, footer with logo hover).
3. Homepage.
4. Program (calendar + list + filters) and event detail.
5. Kurzy (timetable) and course detail.
6. Pronájem (+ enquiry form email), Venue.
7. EN routing and language switch, Mailchimp, .ics and iCal feed, SEO, 404 and legal pages.
8. Deploy to Vercel, connect domain, Sanity webhook, performance and accessibility pass.

## 9. Still open (decide during the build)

- Which ticket service and which booking tool (only URLs are stored, so this can change anytime).
- Real copy, photos, lecturers, prices.
- Domain (tyrs.art?) and who edits content in Sanity.

---

## 10. Launch rule: no placeholders, ever

The site must be usable from day one with whatever real content exists, even if that's only a few events and one course.

- **Nothing in square brackets ships.** The canvas placeholders ([Název akce], [Jméno], [doplnit]…) are design markers only. Never hard-code them or seed them into the production dataset.
- **Every section is driven by real data and hides itself when empty.** No lecturer → no lecturer card. No related events → no "Další akce". No courses this week → hide "Tenhle týden v kurzech". No "Dobré vědět" items → no card. No Spotify link → no "Poslechni si".
- **Graceful minimums:**
  - the homepage mosaic adapts to 1–5 events;
  - an empty month shows "Program na {měsíc} brzy zveřejníme" plus the newsletter signup;
  - the ticker hides when there's nothing today or tomorrow;
  - the playlist capsule hides without a playlist.
- **Optional fields are truly optional** in Sanity. Required fields are only what a page can't live without (event: title, date and time, category, image; course: title, slot, booking URL).
- **Evergreen copy lives in Sanity settings**, not in code, so founders can fix it without a deploy: hero sentence, Venue texts, Pronájem texts, Jak cards, contacts, opening hours.
- **Images:** no stock or generated placeholder photos in production. If an event has no photo, use a typographic tile (category colour + big title) instead of an image.
- **Before launch:** run a check that fails the build if any rendered page contains bracketed placeholder text (e.g. "[Název akce]"), "doplnit" or "Lorem".

---

## 11. Confirmed facts (use these, not canvas placeholders)

- **Domain:** tyrs.art. It's registered at **Namecheap**; point DNS to Vercel (A/CNAME records, or switch nameservers to Vercel).
- **Contact email:** hello@tyrs.art. It's the single address for programme, rental and general questions, used everywhere a contact appears; enquiry form submissions go here too.
- **Instagram:** @tyrs.human.lab → https://www.instagram.com/tyrs.human.lab/ (changed from @tyrs.art on 2 Oct 2026; the link itself is the Instagram field under socials in the Sanity settings document)
- **Capacity:** 80 people.
- **Accessibility:** step-free (barrier-free) entry.
- **Address:** Nosticova 634/2, 118 00 Praha 1 (Malá Strana).
- No public phone number for now, so don't show a phone field until one is set in Sanity.
