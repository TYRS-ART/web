# TYRŠ

TYRŠ is a venue at Nosticova 634/2, Malá Strana, Prague. In one house and one day you get a morning class, an afternoon dance session, an evening play and a late concert. The identity has to hold all of that without flattening it.

This system describes the website as designed in October 2026. It is a bold, maximalist version of the designer's first draft: big display type, warm paper ground, white cards, black bands and four category colours that do the talking. Where this file and an older draft disagree, this file wins.

## Principles

**Big and confident.** Headlines are huge (`display-month` at 200px, `display-hero` at 120px), rules are 2px black, buttons are pills. Nothing is timid or grey-on-grey.

**Paper, cards, bands.** Every page sits on warm paper (`surface`, #f3f1ea). Related content is grouped on white cards (`surface-raised`, `radius-xl`) set in from the edges. Strong statements go on full-bleed or inset bands: black (`surface-inverse`) for facts (date, price, place), butter (`butter`) for invitations (rental, quotes, contact). Nothing floats loose when it belongs to a group.

**Colour means a category.** Hudba, Divadlo, Tanec and Lekce each own one colour, and only that colour, everywhere: chips, the hero pills, calendar time badges, filter rings. Lekce covers every class and course. Never reassign a colour, and never use a category colour decoratively.

**Photos are calm until you point at them.** On the homepage, event photos sit in a warm duotone (espresso and paper) so the page reads as one composition. Hovering an event, or a category chip, brings its photos back to full colour. Photos have softly feathered edges, never hard crops into shapes.

**No placeholders on the live site.** A section without real content hides itself; an event without a photo gets a typographic tile in its category colour.

## Colour

- **Neutrals:** `surface` (paper), `surface-raised` (white cards), `surface-sunken` (wells, empty days), `surface-inverse` (black bands, primary buttons), `ink` (all text, black), `ink-muted` (metadata only).
- **Rules:** `line` is black at 2px between rows and under the footer; `line-soft` divides inside white cards.
- **Categories:** each has a base, a tint and a shade (the stops of its slowly drifting gradient) and an edge (the 3px border on hover or when selected).

| Category | Base | Edge | Covers |
|---|---|---|---|
| Hudba | `cat-hudba` #8fa8ee | `cat-hudba-edge` | concerts, DJ sets, listening |
| Divadlo | `cat-divadlo` #f29572 | `cat-divadlo-edge` | theatre, readings, performance |
| Tanec | `cat-tanec` #c9de78 | `cat-tanec-edge` | dance evenings and performances |
| Lekce | `cat-lekce` #8cc4a0 | `cat-lekce-edge` | all classes, courses, workshops |

  Text on every category colour is black (`constant-black`). Course focus tags inside the timetable (Tanec, Hudba, Pohyb) are small white labels with a coloured dot; Pohyb uses `butter`.
- **Brand accents:** `green-deep` for the Spotify card and listen button; `green-live` for the play disc, live dots and the commit buttons (Vstupenky, Přihlásit se); `butter` for accent bands.
- **Photo treatment:** `duotone-shadow` + `duotone-light` over a grayscale image; `scrim` under white titles.
- `orange` and `red` belong to the social formats only.

## Typography

**Clash Grotesk** (display, weight 500, tracking −0.03em) sets headlines, event titles, menu items, info-band values and the hero sentence. **General Sans** sets everything a visitor reads in sentences or scans as data: body, labels, chips, buttons, footer. **Hedvig Letters Serif** sets quotes on butter bands, at most one per page.

Mobile scale: hero 52/50, month 88–104, section heads 36–56, row titles 36, body 15–17.

## Layout

- Desktop canvas 1440px; text gutters 64px; white cards inset 24px from the page edge, 32px padding inside.
- Mobile 390px; gutters 20px; cards inset 12px with 16px padding.
- Sections are separated by 96px on desktop and 48–56px on mobile.
- The homepage event mosaic is a 12-column grid: one large plus one tall tile, then a row of three. It adapts to however many real events exist; there are no empty slots.

## Interaction and motion

- **Navigation:** black words at all times. On hover the word rolls up and an identical copy rolls in, while a 4px black underline wipes in from the left (480ms, cubic-bezier(.7,0,.2,1)). The current page keeps the underline, drawn in on load. Colour never changes.
- **Category chips and pills:** a slow drifting gradient within their own hue (9–13s, alternate). Hover or selected adds a 3px border in the category's `-edge` colour. Selected filter chips also show ✓; unselected chips dim when a filter is active.
- **Duotone reveal:** a photo fades to full colour in 450ms on hover of its tile or row, or when any chip of its category is hovered.
- **Footer logo:** the boxed-row wordmark is live SVG. Each letter tile inverts on hover (outlined box, black letter).
- **Now-playing capsule:** black pill with a green play disc. It opens the monthly Spotify card (green-deep) on hover or focus.
- All motion stops under `prefers-reduced-motion`.

## Imagery

Artists, audiences, posters and the house itself. Grain, halftone and print texture are welcome. Photos run edge to edge inside tiles with a 22px eased feathered edge (16px on mobile); the tile behind a feathered photo is transparent. White titles sit bottom-left over the `scrim`, and white date badges plus a category chip sit top-left. Never tint photos with brand colours other than through the duotone.

## Logos

The header uses the primary lockup only (black on paper; the inverse on dark). The footer uses the boxed-row lockup full width, as interactive SVG. Other alternates are for print, social and physical space; see the Logos group.

## Language

Czech first, English at launch. Plain, short, slightly deadpan. Times are 24-hour, dates in Czech format (Pá 16. 10.), prices in Kč. Contact is one address: booking@tyrs.art. Instagram: @tyrs.art.

## Fonts

Self-hosted variable WOFF2 under `fonts/`: Clash Grotesk and General Sans (with italic) from Fontshare (ITF Free Font License permits self-hosting), and Hedvig Letters Serif from Google Fonts (SIL OFL). All cover the full Czech alphabet.
