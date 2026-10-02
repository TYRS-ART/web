# TYRŠ website: instructions for Claude Code

The owner (Matej) is not technical. Explain every step that needs him in plain language, one action at a time, and never ask him to type terminal commands. Run them yourself.

This is a **brand-new project**. Nothing from earlier TYRŠ code is reused.

## Read first
1. `docs/BRIEF.md`: what to build, the stack, the CMS content model and the build order. Start with section 0, then follow section 8 step by step. Section 10 (no placeholders) is mandatory.
2. `docs/design-system/README.md` + `tokens.json`: colours, type, motion and rules. `components.css` holds reference CSS for chips, drift, duotone, feather, nav roll and the footer logo hover. Copy these effects rather than reinventing them.
3. `design/screens/*.jpg`: what every page must look like (desktop 1440 px and mobile 390 px).
4. `design/pages/*.html`: the same pages as static HTML. Read exact sizes, spacing and CSS from them.

## Rules
- Match the design. Don't restyle or "improve" it without asking.
- `design/img/placeholder-*` are design stand-ins only. **Never** use them on the live site.
- Bracketed texts in the design ("[Název akce]") are placeholders. All real content comes from Sanity; empty sections hide.
- Real assets are in `public/`: fonts, logos (`logo-primary.svg` in the header, an inline SVG version of `logo-boxed-row.svg` in the footer, built like the footer in `design/pages/*.html`) and the map image.
- Contact: booking@tyrs.art · Instagram @tyrs.human.lab (https://www.instagram.com/tyrs.human.lab/) · domain tyrs.art (Namecheap → Vercel).
- Czech + English from day one.

## First session
1. Scaffold the Next.js app in this folder (BRIEF section 0) without touching `docs/`, `design/` and `public/`.
2. Help Matej log in to GitHub (`gh auth login`, browser flow), `git init`, make the first commit and push `main` to github.com/TYRS-ART/web.
3. Then continue with BRIEF section 8, step 1, on a branch with a pull request per step.

@AGENTS.md
