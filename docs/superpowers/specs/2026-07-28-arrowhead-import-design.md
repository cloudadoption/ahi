# Design: Import arrowheadintermediaries.com into AEM Edge Delivery + da.live

**Date:** 2026-07-28
**Status:** Approved (design), pending spec review
**Target content repo:** https://da.live/#/cloudadoption/ahi (org `cloudadoption`, repo `ahi`)
**Code repo:** this repository (AEM boilerplate)

## 1. Goal

Recreate https://arrowheadintermediaries.com/ as an AEM Edge Delivery Services site:
- **Code** (blocks, styles, scripts) lives in this repo.
- **Content** is authored into da.live under `/cloudadoption/ahi`.
- Visual design matches the source brand closely.
- Images are downloaded, optimized, and stored in DA so the site is self-contained.
- Delivered in phases: Home → top-level (Leadership, News index) → second-level (11 news posts).

## 2. Source site analysis

WordPress + Elementor (hello-elementor theme). We rebuild semantically, not by copying Elementor markup.

Real content pages (from sitemaps):
- `/` — home
- `/leadership/`
- `/news/<slug>/` × 11 posts (plus a `/news/` index and 4 auto category pages)

### Home page sections (in order)
1. Hero — headline "Three distinct divisions, one unified platform." + intro paragraph
2. Stats band — 3 animated counters (Dedicated Teammates, Specialized Practice Groups, Global Locations)
3. Division links — Programs / Wholesale / Specialty (external links)
4. "Read Our Story" text section — history since 1966
5. Four feature cards with images (Three Distinct Divisions, Trading for Partnership, Legacy of Underwriting Excellence, Specialization at Scale)
6. Leadership CTA → `/leadership/`
7. Three division cards (logo + description + link): Programs → arrowheadprograms.com, Wholesale → bridgespecialtygroup.com, Specialty → one80.com
8. Latest news — 3 most recent post cards (image, title, date, link)

### Leadership page sections
1. Hero (banner image + "Meet our leaders" + intro)
2. Senior Leadership grid — 6 cards (headshot, name, title)
3. Leadership Team grid — 11 cards (headshot, name, title)
4. Detailed bios — per-leader (larger headshot, name, title, paragraphs)

### News post pages
Title, publish date, location, featured image, body (subtitle, quotes, paragraphs), media-contact block. Metadata drives the news index.

## 3. Brand tokens (from Elementor global kit)

Added as CSS custom properties in `styles/styles.css`.

| Token | Value | Use |
|---|---|---|
| Navy (primary) | `#1B2A51` | primary brand, headings on light, buttons |
| Near-black | `#231F20` | body text |
| Warm gray (secondary) | `#7C796E` | secondary text |
| Stone / tan | `#B9B5A3` | accent text, muted |
| Light stone | `#F1F0ED` | section backgrounds |
| Bronze/gold | `#8B7F57` | accents |
| White | `#FFFFFF` | inverse text, hero overlays |

Font family: **Helvetica, Arial, sans-serif** for both headings and body (single-family site). Use system Helvetica/Arial fallback stack; no web-font download needed unless review requests otherwise.

## 4. Blocks

Reuse and extend existing boilerplate blocks; add two small new ones. Variants are expressed as extra classes on the block element (e.g. `cards features`), matching AEM convention.

| Section | Block | Status |
|---|---|---|
| Home hero, Leadership hero | `hero` | **extend** — support background image + overlaid heading + intro text |
| Stats band (3 counters) | `stats` | **new** — 3-up responsive counters, count-up on scroll into view |
| Division links, 3 division cards | `cards` variant `divisions` | **extend** |
| 4 feature cards | `cards` variant `features` | **extend** |
| Leadership people grids | `cards` variant `people` | **extend** — headshot, name, title |
| Latest news + news index | `cards` variant `news` | **extend** — image, title, date, link; index page driven by `query-index.json` |
| Detailed leader bios | `columns` | reuse |
| News post header (title/date) | autoblock in `scripts.js` | **new (small)** — build from page metadata + first heading |
| Nav / Footer | `header` / `footer` | reuse, fed by `nav`/`footer` DA docs |

`cards.js` is extended to detect its variant class and render accordingly; each variant gets scoped CSS (`.cards.people ...`). All selectors scoped to the block per project rules.

## 5. DA content model (`/cloudadoption/ahi`)

DA document format (confirmed from existing docs):
- `<body><header></header><main>…</main><footer></footer></body>`
- Each section = a top-level `<div>` inside `<main>`.
- Each block = `<div class="blockname variant">`; rows are child `<div>`, cells are grandchild `<div>`.
- `metadata` and `section-metadata` are key/value blocks (2-cell rows).
- Images = `<picture><img src="…" loading="lazy"></picture>`.

Documents to author:
- `/index` (home) — replace existing boilerplate
- `/leadership`
- `/news/<slug>` × 11
- `/nav` — top nav (Our Story, Meet Our Leaders, Explore Our Divisions, News) + logo
- `/footer` — address, email, copyright, legal links
- `/metadata.json` — per-path metadata (title, description, template, publish date/author for news)
- News posts carry page `metadata` (title, description, publish-date, author, image) so the news index and "latest news" can be query-driven via `query-index.json`.

### Assets
Download every referenced image from the source, optimize, and upload to DA via `da_upload_media`. Page-specific images go in a sibling dot-folder (`/.index/hero.jpg`, `/.leadership/…`, `/news/.<slug>/…`); shared assets (logos) go under `/media/`. Docs reference the uploaded DA URLs.

## 6. Import mechanism

Via **DA Prod MCP** (authorized):
- `da_create_source` / `da_update_source` — author HTML docs (contentType `text/html`)
- `da_upload_media` — upload optimized images (base64)
- `da_list_sources` / `da_get_source` — inspect
- After authoring, content is previewable at `https://main--ahi--cloudadoption.aem.page/` and the docs are visible in da.live.

Local-first workflow for each page:
1. Fetch source HTML, extract real text/structure/image URLs (browser UA — site is behind Cloudflare).
2. Build/extend the block(s) + CSS in the repo.
3. Verify rendering on `localhost:3000` using a local draft HTML (`drafts/` + `--html-folder drafts`) or against the DA preview.
4. Download + optimize + upload images to DA.
5. Author the DA doc(s) referencing uploaded assets.
6. Verify the DA preview URL renders correctly; run PSI where relevant.

## 7. Execution phases

- **Phase 0 — Foundation:** brand tokens in `styles.css`; extend `hero`; add `stats`; extend `cards` (variants); nav + footer DA docs; local dev server verification.
- **Phase 1 — Home:** author `/index` with all 8 sections; upload home assets; verify end-to-end before proceeding.
- **Phase 2 — Top level:** `/leadership` (hero + 2 people grids + bios) and `/news` index (query-driven cards).
- **Phase 3 — Second level:** 11 news posts + `metadata.json` entries + news-article autoblock; verify index picks them up.

Each phase is verified (localhost render + DA preview) before the next begins.

## 8. Out of scope / decisions

- News posts are **static authored content**, not a live RSS/feed integration (approved).
- Category pages (`/category/...`) are not recreated as separate pages; the single news index with query-driven cards covers browsing.
- External division sites (arrowheadprograms.com, etc.) remain external links.
- Legal/footer links continue to point to their existing `us.bbrown.com` destinations.
- No web-font download unless review requests exact Helvetica web font; system stack used.

## 9. Success criteria

- Home, Leadership, and 11 news posts render in da.live preview matching the source structure and brand.
- All images self-hosted in DA (no hotlinking to arrowheadintermediaries.com).
- `npm run lint` passes; blocks are responsive (mobile-first, 600/900/1200 breakpoints) and accessible.
- Nav + footer shared across pages.
