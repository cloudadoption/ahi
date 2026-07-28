# Arrowhead Intermediaries Import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate arrowheadintermediaries.com as an AEM Edge Delivery site — code (blocks/styles) in this repo, content authored into da.live `/cloudadoption/ahi` — matching the source brand, delivered Home → top-level → second-level.

**Architecture:** Vanilla-JS EDS blocks decorate DA-authored HTML documents. We add brand tokens to global CSS, extend `hero`/`cards`, add a `stats` block and a small news-article autoblock, then author DA docs via the DA Prod MCP with self-hosted (uploaded) images.

**Tech Stack:** AEM Edge Delivery Services, vanilla ES6+ JS, CSS3 (no build step), `@adobe/aem-cli` dev server, DA Prod MCP (`da_create_source`, `da_update_source`, `da_upload_media`, `da_get_source`, `da_list_sources`).

## Global Constraints

- Code repo & DA target: GitHub `cloudadoption/ahi`, DA org `cloudadoption` repo `ahi`.
- Preview URLs: branch `https://import-arrowhead--ahi--cloudadoption.aem.page/`, prod `https://main--ahi--cloudadoption.aem.page/`.
- No build step, no transpiling. Vanilla ES6+, always include `.js` extensions in imports, Unix (LF) line endings.
- CSS mobile-first; `min-width` breakpoints at 600px / 900px / 1200px.
- All block CSS selectors scoped to the block (e.g. `.cards.people .name`); never use bare `.item-list`; avoid `{blockname}-container` / `{blockname}-wrapper` class names.
- `npm run lint` (eslint airbnb-base + stylelint standard) MUST pass before every commit.
- Brand tokens (CSS custom properties): navy `#1B2A51`, near-black text `#231F20`, warm gray `#7C796E`, stone `#B9B5A3`, light stone bg `#F1F0ED`, bronze `#8B7F57`, white `#FFFFFF`. Font stack: `Helvetica, Arial, sans-serif`.
- DA doc format: `<body><header></header><main><div>…section…</div></main><footer></footer></body>`; block = `<div class="blockname variant">`, rows = child `<div>`, cells = grandchild `<div>`; images = `<picture><img src loading="lazy"></picture>`; `metadata`/`section-metadata` are 2-cell key/value rows.
- Images MUST be downloaded from source, optimized, and uploaded to DA (`da_upload_media`) — no hotlinking to arrowheadintermediaries.com. Page images → sibling dot-folder (`/.index/…`, `/news/.<slug>/…`); shared logos → `/media/`.
- Source site is behind Cloudflare — always fetch with a browser User-Agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36`.
- Verification has no unit-test framework: each task is verified by (a) `npm run lint`, (b) local render on `http://localhost:3000` via a `drafts/` file, and/or (c) the DA preview URL rendering correctly.

---

## Setup (once, before Task 1)

- [ ] **Start the dev server** (background): `npx -y @adobe/aem-cli up --no-open --forward-browser-logs`. Confirm `http://localhost:3000` responds: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`.
- [ ] **Create the drafts folder** for local block verification: `mkdir -p drafts`. Note: to serve drafts, restart the dev server with `--html-folder drafts` when verifying block markup that isn't yet in DA.
- [ ] Confirm working branch is `import-arrowhead`: `git branch --show-current`.

---

## Phase 0 — Foundation

### Task 1: Brand tokens in global CSS

**Files:**
- Modify: `styles/styles.css` (`:root` custom properties + body font)

**Interfaces:**
- Produces: CSS variables `--brand-navy`, `--brand-ink`, `--brand-gray`, `--brand-stone`, `--brand-stone-bg`, `--brand-bronze` and remaps boilerplate vars (`--background-color`, `--text-color`, `--link-color`, `--body-font-family`, `--heading-font-family`).

- [ ] **Step 1: Read current `:root` and body rules** in `styles/styles.css` to find the existing variable names (`--link-color`, `--text-color`, `--background-color`, `--body-font-family`, `--heading-font-family`, etc.).

- [ ] **Step 2: Add brand variables and remap existing ones.** In `:root`, add:

```css
:root {
  /* Arrowhead brand */
  --brand-navy: #1b2a51;
  --brand-ink: #231f20;
  --brand-gray: #7c796e;
  --brand-stone: #b9b5a3;
  --brand-stone-bg: #f1f0ed;
  --brand-bronze: #8b7f57;

  /* Remap boilerplate tokens to brand */
  --background-color: #fff;
  --light-color: var(--brand-stone-bg);
  --dark-color: var(--brand-navy);
  --text-color: var(--brand-ink);
  --link-color: var(--brand-navy);
  --link-hover-color: var(--brand-bronze);

  --body-font-family: helvetica, arial, sans-serif;
  --heading-font-family: var(--body-font-family);
}
```

Keep the existing font-size / spacing variables. If a variable already exists, edit its value rather than duplicating the declaration.

- [ ] **Step 3: Lint.** Run `npm run lint:css`. Expected: PASS (fix any stylelint hex-case / shorthand complaints — stylelint standard wants lowercase hex).

- [ ] **Step 4: Verify render.** `curl -s http://localhost:3000/styles/styles.css | grep -i brand-navy` → shows the variable. Load `http://localhost:3000/` in a browser; confirm links/headers pick up navy.

- [ ] **Step 5: Commit.**

```bash
git add styles/styles.css
git commit -m "feat: add Arrowhead brand tokens to global styles"
```

### Task 2: Extend the `hero` block (image background + intro)

**Files:**
- Modify: `blocks/hero/hero.js`, `blocks/hero/hero.css`
- Create: `drafts/hero-test.html` (local verification)

**Interfaces:**
- Consumes: brand vars from Task 1.
- Produces: `hero` renders an optional background `<picture>` behind an overlaid heading + intro paragraph(s); a `.hero-content` wrapper element holds text. A `hero minimal` variant (no image) renders text on a stone background.

- [ ] **Step 1: Read `blocks/hero/hero.js` and `blocks/hero/hero.css`** to see the current (likely empty/minimal) decorate.

- [ ] **Step 2: Create a local test draft** `drafts/hero-test.html` mirroring DA output:

```html
<body><header></header><main>
<div>
  <div class="hero">
    <div><div><picture><img src="https://picsum.photos/1600/700" loading="lazy"></picture></div></div>
    <div><div>
      <h1>Three distinct divisions, one unified platform.</h1>
      <p>Arrowhead Intermediaries brings together Arrowhead Programs, Bridge Specialty Group, and One80 Intermediaries.</p>
    </div></div>
  </div>
</div>
</main><footer></footer></body>
```

- [ ] **Step 3: Implement `hero.js`.** Wrap text cells in a `.hero-content` div, move any `<picture>` to a `.hero-bg` element, and mark the block as `has-image` when a picture is present:

```js
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const rows = [...block.children];
  const content = document.createElement('div');
  content.className = 'hero-content';
  rows.forEach((row) => {
    if (picture && row.contains(picture)) {
      const bg = document.createElement('div');
      bg.className = 'hero-bg';
      bg.append(picture);
      block.prepend(bg);
      row.remove();
    } else {
      content.append(...row.querySelectorAll(':scope > div > *'));
      row.remove();
    }
  });
  block.append(content);
  if (picture) block.classList.add('has-image');
}
```

- [ ] **Step 4: Implement `hero.css`** — mobile-first, brand-aware, text overlay legible on image:

```css
.hero { position: relative; display: grid; }
.hero .hero-bg { grid-area: 1 / 1; }
.hero .hero-bg img { width: 100%; height: 100%; object-fit: cover; }
.hero .hero-content { grid-area: 1 / 1; position: relative; z-index: 1; padding: 2rem; color: var(--brand-ink); max-width: 40rem; }
.hero.has-image { min-height: 60vh; align-items: center; }
.hero.has-image::after { content: ''; grid-area: 1 / 1; background: linear-gradient(90deg, rgb(27 42 81 / 70%), rgb(27 42 81 / 20%)); }
.hero.has-image .hero-content { color: #fff; z-index: 2; }
.hero:not(.has-image) { background: var(--brand-stone-bg); }
.hero h1 { font-size: 2rem; line-height: 1.1; }
@media (min-width: 900px) {
  .hero .hero-content { padding: 4rem; }
  .hero h1 { font-size: 3rem; }
}
```

- [ ] **Step 5: Verify render.** Restart dev server with `--html-folder drafts`, then open `http://localhost:3000/hero-test` (or `curl` it). Confirm image is a full-bleed background with legible overlaid heading.

- [ ] **Step 6: Lint.** `npm run lint`. Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add blocks/hero/ drafts/hero-test.html
git commit -m "feat: extend hero block with background image and intro variant"
```

### Task 3: New `stats` block (animated counters)

**Files:**
- Create: `blocks/stats/stats.js`, `blocks/stats/stats.css`, `drafts/stats-test.html`

**Interfaces:**
- Consumes: brand vars.
- Produces: `stats` block — each row is one stat (value cell + label cell); values count up from 0 to the target when scrolled into view. Target parsed from the value text; a trailing `+` is preserved.

- [ ] **Step 1: Create `drafts/stats-test.html`.**

```html
<body><header></header><main><div>
<div class="stats">
  <div><div><p>750+</p></div><div><p>Dedicated Teammates</p></div></div>
  <div><div><p>40</p></div><div><p>Specialized Practice Groups</p></div></div>
  <div><div><p>60+</p></div><div><p>Global Locations</p></div></div>
</div>
</div></main><footer></footer></body>
```

- [ ] **Step 2: Implement `stats.js`** with count-up on intersection:

```js
function countUp(el, target, suffix) {
  const duration = 1500;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(p * target).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('stat');
    const [valueCell, labelCell] = row.children;
    if (valueCell) valueCell.classList.add('stat-value');
    if (labelCell) labelCell.classList.add('stat-label');
  });
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      block.querySelectorAll('.stat-value').forEach((cell) => {
        const raw = cell.textContent.trim();
        const target = parseInt(raw.replace(/\D/g, ''), 10) || 0;
        const suffix = raw.replace(/[\d,]/g, '');
        countUp(cell, target, suffix);
      });
      obs.disconnect();
    });
  }, { threshold: 0.3 });
  observer.observe(block);
}
```

- [ ] **Step 3: Implement `stats.css`** (3-up on desktop, stacked on mobile):

```css
.stats { display: grid; gap: 2rem; text-align: center; padding: 3rem 1rem; background: var(--brand-navy); color: #fff; }
.stats .stat-value { font-size: 3rem; font-weight: 700; color: #fff; }
.stats .stat-label { color: var(--brand-stone); text-transform: uppercase; letter-spacing: 0.05em; }
@media (min-width: 600px) { .stats { grid-template-columns: repeat(3, 1fr); } }
```

- [ ] **Step 4: Verify render.** Dev server with `--html-folder drafts`; open `http://localhost:3000/stats-test`. Confirm three counters animate 0 → target and keep the `+`.

- [ ] **Step 5: Lint.** `npm run lint`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add blocks/stats/ drafts/stats-test.html
git commit -m "feat: add stats block with animated counters"
```

### Task 4: Extend `cards` with variants (features, divisions, people, news)

**Files:**
- Modify: `blocks/cards/cards.js`, `blocks/cards/cards.css`
- Create: `drafts/cards-test.html`

**Interfaces:**
- Consumes: brand vars.
- Produces: `cards` supports variant classes `features`, `divisions`, `people`, `news`. Base behavior (image → `.cards-card-image`, text → `.cards-card-body`) preserved. `people` cards expose `.name` (from `<strong>`/first `<p>`) and `.title`. `news` cards keep an optional date `<p>` styled as `.cards-card-date` and make a trailing link the card CTA.

- [ ] **Step 1: Read `blocks/cards/cards.js`** — note the boilerplate builds a `<ul>` of `<li>` with `.cards-card-image` / `.cards-card-body`.

- [ ] **Step 2: Create `drafts/cards-test.html`** with all four variants:

```html
<body><header></header><main><div>
<div class="cards features">
  <div><div><picture><img src="https://picsum.photos/600/400?1" loading="lazy"></picture></div><div><h3>Three Distinct Divisions</h3><p>Each division operates independently with shared infrastructure.</p></div></div>
  <div><div><picture><img src="https://picsum.photos/600/400?2" loading="lazy"></picture></div><div><h3>Trading for Partnership</h3><p>An underwriting-first approach.</p></div></div>
</div>
<div class="cards people">
  <div><div><picture><img src="https://picsum.photos/400/400?3" loading="lazy"></picture></div><div><p><strong>Chris Walker</strong></p><p>Chairman</p></div></div>
  <div><div><picture><img src="https://picsum.photos/400/400?4" loading="lazy"></picture></div><div><p><strong>Steve Boyd</strong></p><p>Chief Executive Officer</p></div></div>
</div>
<div class="cards news">
  <div><div><picture><img src="https://picsum.photos/600/400?5" loading="lazy"></picture></div><div><h3>Arrowhead appoints Leah Berger as Chief Counsel</h3><p>July 28, 2026</p><p><a href="#">Read the post</a></p></div></div>
</div>
<div class="cards divisions">
  <div><div><picture><img src="https://picsum.photos/300/120?6" loading="lazy"></picture></div><div><h3>Programs</h3><p>One of the largest portfolios of insurance programs worldwide.</p><p><a href="https://arrowheadprograms.com/">Learn more</a></p></div></div>
</div>
</div></main><footer></footer></body>
```

- [ ] **Step 3: Extend `cards.js`.** After the existing `<ul>` build, tag people/news cells so CSS can target them. Append before the final `block.append(ul)` / after decoration:

```js
// after the ul is built and block populated
if (block.classList.contains('people')) {
  block.querySelectorAll('.cards-card-body').forEach((body) => {
    const ps = body.querySelectorAll('p');
    if (ps[0]) ps[0].classList.add('name');
    if (ps[1]) ps[1].classList.add('title');
  });
}
if (block.classList.contains('news')) {
  block.querySelectorAll('.cards-card-body').forEach((body) => {
    const ps = [...body.querySelectorAll('p')];
    const dateP = ps.find((p) => !p.querySelector('a') && /\b(19|20)\d{2}\b/.test(p.textContent));
    if (dateP) dateP.classList.add('cards-card-date');
  });
}
```

If `cards.js` uses `createOptimizedPicture`, keep that call intact.

- [ ] **Step 4: Extend `cards.css`** with variant-scoped rules (append; do not alter base rules other than layout tokens):

```css
.cards.features > ul, .cards.news > ul { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.cards.people > ul { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
@media (min-width: 900px) { .cards.people > ul { grid-template-columns: repeat(3, 1fr); } }
.cards.people .cards-card-image img { aspect-ratio: 1; object-fit: cover; }
.cards.people .name { font-weight: 700; color: var(--brand-navy); margin: 0.5rem 0 0; }
.cards.people .title { color: var(--brand-gray); margin: 0; }
.cards.news .cards-card-date { color: var(--brand-bronze); font-size: 0.85rem; text-transform: uppercase; }
.cards.divisions .cards-card-image img { width: auto; max-height: 60px; object-fit: contain; }
.cards.divisions .cards-card-body { text-align: center; }
```

- [ ] **Step 5: Verify render.** Dev server with `--html-folder drafts`; open `http://localhost:3000/cards-test`. Confirm each variant lays out correctly (people = square headshots + name/title; news = date styled; divisions = contained logos).

- [ ] **Step 6: Lint.** `npm run lint`. Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add blocks/cards/ drafts/cards-test.html
git commit -m "feat: add features/divisions/people/news variants to cards block"
```

### Task 5: Author nav and footer DA docs

**Files:**
- DA (MCP): `nav.html`, `footer.html` under `cloudadoption/ahi` (update existing)

**Interfaces:**
- Consumes: existing `header`/`footer` blocks (no code change expected).
- Produces: site-wide nav (Our Story, Meet Our Leaders, Explore Our Divisions, News) + footer (address, email, copyright, legal links) rendered on every page.

- [ ] **Step 1: Read the current header/footer block expectations.** Read `blocks/header/header.js` and `blocks/footer/footer.js` to confirm the nav doc structure (sections separated for brand / sections / tools) and how footer content is consumed.

- [ ] **Step 2: Update `nav.html` via `da_update_source`** (org `cloudadoption`, repo `ahi`, path `nav.html`, contentType `text/html`). Body sections: (1) brand/logo linking to `/`, (2) a `<ul>` of nav items — "Our Story" `/#our-story` or `/`, "Meet Our Leaders" `/leadership`, "Explore Our Divisions" `/#divisions`, "News" `/news`, (3) tools (optional search). Match the row/section structure the current `header.js` expects (three top-level `<div>` sections as seen in the existing boilerplate nav).

- [ ] **Step 3: Update `footer.html` via `da_update_source`.** Include copyright `©2026 Arrowhead Intermediaries. All Rights Reserved.`, address `701 B Street, STE 2100, San Diego, CA 92101`, `info@arrowheadintermediaries.com`, and legal links (Terms of Use → https://us.bbrown.com/terms-of-use, Your Privacy Rights → https://us.bbrown.com/privacy-statement, Commitment to EEO → https://us.bbrown.com/commitment-to-eeo, Cookies Policy → https://us.bbrown.com/cookies-policy).

- [ ] **Step 4: Verify.** `curl -s -o /dev/null -w "%{http_code}\n" "https://import-arrowhead--ahi--cloudadoption.aem.page/nav.plain.html"` returns 200 and `curl` of the nav/footer plain HTML shows the new items. Also load `http://localhost:3000/` (which pulls previewed nav/footer) and confirm header/footer render.

- [ ] **Step 5: Commit.** (No repo files changed; record progress.)

```bash
git commit --allow-empty -m "chore: author Arrowhead nav and footer in DA"
```

---

## Phase 1 — Home page

### Task 6: Download and upload Home assets to DA

**Files:**
- Scratch: `scratchpad/assets/home/` (downloaded originals)
- DA (MCP): `/cloudadoption/ahi/.index/*` (page images), `/media/*` (logos)

**Interfaces:**
- Produces: DA-hosted image URLs for the home hero, 4 feature cards, 3 division logos, 3 news thumbnails — to be referenced by Task 7.

- [ ] **Step 1: Extract source image URLs.** Fetch home with browser UA and list image srcs:

```bash
SP="scratchpad/assets/home"; mkdir -p "$SP"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
curl -s -A "$UA" https://arrowheadintermediaries.com/ -o "$SP/home.html"
grep -oiE 'https://arrowheadintermediaries.com/wp-content/uploads/[^" )]+\.(jpg|jpeg|png|webp|svg)' "$SP/home.html" | sort -u
```

- [ ] **Step 2: Download each needed image** (hero, 4 features, 3 division logos, 3 news thumbs) into `$SP` with `curl -A "$UA" -O`. Identify which is which by inspecting the source order / filenames.

- [ ] **Step 3: Optimize.** Ensure each is web-sized (max ~2000px wide, reasonable quality). Use `sips` (macOS) to resize/compress if any is oversized: `sips -Z 2000 file.jpg`. Confirm each file is < ~500KB where possible.

- [ ] **Step 4: Upload via `da_upload_media`** — page images to `/.index/<name>.<ext>`, shared division logos to `/media/<name>.<ext>`. base64-encode each file (`base64 -i file`). Record the resulting DA URLs (form `https://content.da.live/cloudadoption/ahi/.index/<name>.<ext>` or the URL returned).

- [ ] **Step 5: Verify** each uploaded asset resolves: `da_list_sources` path `.index` and `media` show the files; `curl -s -o /dev/null -w "%{http_code}\n"` each returned URL → 200.

- [ ] **Step 6: Commit.** (Assets live in DA, not repo.)

```bash
git commit --allow-empty -m "chore: upload Home page assets to DA"
```

### Task 7: Author the Home page DA doc

**Files:**
- DA (MCP): `/cloudadoption/ahi/index.html` (replace boilerplate)
- Scratch: `scratchpad/index.html` (compose before upload)

**Interfaces:**
- Consumes: blocks from Tasks 2–4, assets from Task 6.
- Produces: fully rendered home page at the preview URL.

- [ ] **Step 1: Extract real copy.** From `scratchpad/assets/home/home.html`, pull the exact headline, intro, stat numbers/labels, "Read Our Story" text, 4 feature titles+descriptions, 3 division names+descriptions+links, and the 3 latest news titles+dates+links. Save notes to `scratchpad/home-copy.md`.

- [ ] **Step 2: Compose `scratchpad/index.html`** in DA format with sections in order: hero (image bg from `.index`), `stats`, `cards divisions` (or a `columns` for the 3 division links), a default-content "Read Our Story" section, `cards features`, a leadership CTA section (heading + button linking `/leadership`), `cards divisions` (3 division cards), `cards news` (3 latest), and a final `metadata` block (Title, Description, Image). Use uploaded DA asset URLs for every `<img src>`.

- [ ] **Step 3: Verify structure locally.** Copy to `drafts/index.html` and open `http://localhost:3000/index` (dev server with `--html-folder drafts`). Confirm every section renders and no block is malformed. Iterate on the markup here (fast loop) before pushing to DA.

- [ ] **Step 4: Publish to DA.** `da_update_source` org `cloudadoption` repo `ahi` path `index.html` contentType `text/html` with the verified content.

- [ ] **Step 5: Verify preview.** `curl -s -o /dev/null -w "%{http_code}\n" "https://import-arrowhead--ahi--cloudadoption.aem.page/"` → 200; load it and confirm brand-accurate render matching the source home page. Optionally run PSI against the preview URL and note the score.

- [ ] **Step 6: Commit.**

```bash
git add drafts/index.html
git commit -m "feat: author Arrowhead home page in DA"
```

---

## Phase 2 — Top-level pages

### Task 8: News-article autoblock in `scripts.js`

**Files:**
- Modify: `scripts/scripts.js` (`buildAutoBlocks` or equivalent)
- Create: `blocks/article-header/article-header.js`, `blocks/article-header/article-header.css`, `drafts/article-test.html`

**Interfaces:**
- Consumes: page metadata (`publish-date`, `author`) via `getMetadata`.
- Produces: on pages under `/news/`, an `article-header` block is auto-built from the first `<h1>` + `publish-date`/`author` metadata, giving news posts a consistent title/date header.

- [ ] **Step 1: Read `scripts/scripts.js`** to find `buildAutoBlocks(main)` and how existing autoblocks (e.g. hero) are constructed and the `getMetadata` import.

- [ ] **Step 2: Add `buildArticleHeader(main)`** invoked from `buildAutoBlocks` only when `window.location.pathname.startsWith('/news/')` and an `<h1>` exists. It wraps the `<h1>` and a date line into `<div class="article-header">`:

```js
function buildArticleHeader(main) {
  if (!window.location.pathname.startsWith('/news/')) return;
  const h1 = main.querySelector('h1');
  if (!h1) return;
  const date = getMetadata('publish-date');
  const section = document.createElement('div');
  const block = document.createElement('div');
  block.className = 'article-header';
  const inner = document.createElement('div');
  const cell = document.createElement('div');
  cell.append(h1.cloneNode(true));
  if (date) {
    const p = document.createElement('p');
    p.className = 'article-date';
    p.textContent = date;
    cell.append(p);
  }
  inner.append(cell);
  block.append(inner);
  section.append(block);
  h1.replaceWith(section);
}
```

Call `buildArticleHeader(main);` inside `buildAutoBlocks`.

- [ ] **Step 3: Implement `article-header.js`** (minimal — decoration handled at build; keep a no-op/default export that adds a class):

```js
export default function decorate(block) {
  block.classList.add('article-header-decorated');
}
```

- [ ] **Step 4: Implement `article-header.css`** — centered title, bronze date, navy heading, constrained width.

```css
.article-header { max-width: 48rem; margin: 2rem auto; text-align: center; }
.article-header h1 { color: var(--brand-navy); }
.article-header .article-date { color: var(--brand-bronze); text-transform: uppercase; letter-spacing: 0.05em; }
```

- [ ] **Step 5: Verify.** Create `drafts/article-test.html` under a `/news/` path is not possible with drafts routing; instead verify after Task 11 on a real `/news/<slug>` preview. For now, `npm run lint` must pass and confirm `scripts.js` still loads the home page without errors (`curl -s http://localhost:3000/ | grep -i '<main'`).

- [ ] **Step 6: Lint & commit.**

```bash
npm run lint
git add scripts/scripts.js blocks/article-header/
git commit -m "feat: auto-build article header on news pages"
```

### Task 9: Leadership page — assets + doc

**Files:**
- Scratch: `scratchpad/assets/leadership/`, `scratchpad/leadership.html`
- DA (MCP): `/cloudadoption/ahi/.leadership/*` (headshots), `/cloudadoption/ahi/leadership.html`

**Interfaces:**
- Consumes: `hero`, `cards people`, `columns` blocks.
- Produces: `/leadership` page with hero + Senior Leadership grid (6) + Leadership Team grid (11) + detailed bios.

- [ ] **Step 1: Fetch and extract** the leadership page (browser UA) → save to `scratchpad/leadership.html`. Extract: hero image + intro; the 6 senior leaders (name, title, headshot URL, bio); the 11 team members (name, title, headshot, bio). Save to `scratchpad/leadership-copy.md`.

- [ ] **Step 2: Download, optimize, upload headshots** to `/.leadership/<slug>.<ext>` via `da_upload_media` (square crop where practical). Record DA URLs.

- [ ] **Step 3: Compose `scratchpad/leadership.html`** — section 1 `hero has-image`; section 2 heading "Senior Leadership" + `cards people` (6); section 3 heading "Leadership Team" + `cards people` (11); section 4+ detailed bios using `columns` (headshot + bio paragraphs) per leader; final `metadata` (Title, Description). Reference DA asset URLs.

- [ ] **Step 4: Verify locally** via `drafts/leadership.html` at `http://localhost:3000/leadership`. Confirm grids and bios render.

- [ ] **Step 5: Publish** with `da_create_source` (path `leadership.html`, contentType `text/html`).

- [ ] **Step 6: Verify preview** `https://import-arrowhead--ahi--cloudadoption.aem.page/leadership` renders (200 + visual).

- [ ] **Step 7: Commit.**

```bash
git add drafts/leadership.html
git commit -m "feat: author Arrowhead leadership page in DA"
```

### Task 10: News index page

**Files:**
- Scratch: `scratchpad/news.html`
- DA (MCP): `/cloudadoption/ahi/news.html`, `/cloudadoption/ahi/query-index` config

**Interfaces:**
- Consumes: `cards news` variant; `query-index.json` (auto-generated from published pages' metadata).
- Produces: `/news` index listing all posts as news cards.

- [ ] **Step 1: Decide index strategy.** EDS auto-generates `query-index.json` from published pages that carry metadata. The news index can either (a) statically list cards, or (b) be driven by fetching `/query-index.json` filtered to `/news/` paths. Implement (b) as a small block only if `cards news` needs dynamic data; otherwise author static `cards news` now and revisit after Task 11 when posts exist. Default: author static cards for the 11 known posts, ordered newest-first.

- [ ] **Step 2: Compose `scratchpad/news.html`** — a hero/heading section "News" + a `cards news` block with one card per post (thumbnail from that post's `.<slug>` folder — upload in Task 11, so use post asset URLs once available; if authoring index before posts, use a placeholder then update). Final `metadata` block.

- [ ] **Step 3: Publish** `news.html` via `da_create_source`.

- [ ] **Step 4: Verify** `https://import-arrowhead--ahi--cloudadoption.aem.page/news` renders the list.

- [ ] **Step 5: Commit.**

```bash
git add drafts/news.html
git commit -m "feat: author Arrowhead news index in DA"
```

---

## Phase 3 — Second-level pages (news posts)

### Task 11: Author the 11 news posts + metadata

**Files:**
- Scratch: `scratchpad/news/<slug>.html` × 11
- DA (MCP): `/cloudadoption/ahi/news/<slug>.html` × 11, `/cloudadoption/ahi/news/.<slug>/*` assets, `/cloudadoption/ahi/metadata.json`

**Interfaces:**
- Consumes: article-header autoblock (Task 8), page metadata.
- Produces: 11 rendered `/news/<slug>` pages; `metadata.json` mapping each to title/description/publish-date/author/image; news index (Task 10) and home "latest news" (Task 7) reference them.

Post slugs (from sitemap):
- `arrowhead-intermediaries-appoints-leah-berger-as-chief-counsel`
- `arrowhead-programs-appoints-mark-kaufman-senior-vice-president-and-chief-actuary`
- `arrowhead-intermediaries-appoints-benjamin-auray-as-chief-commercial-officer`
- `arrowhead-intermediaries-appoints-jimmy-curcio-executive-vice-president-arrowhead-specialty`
- `arrowhead-intermediaries-appoints-katie-davis-as-chief-marketing-officer`
- `steven-beard-appointed-ceo-of-arrowhead-international`
- `arrowhead-intermediaries-announces-expanded-leadership-team`
- `one80-intermediaries-officially-joins-arrowhead-programs-and-bridge-specialty-group`
- `arrowhead-programs-appoints-mark-kaufman-senior-vice-president-and-chief-actuary` (dedupe if repeated)
- `wright-flood-completes-the-acquisition-of-poulton-associates-llc`
- `wright-flood-acquire-assets-of-poulton-associates`
- `nexus-acquires-medical-tourism-specialist` (path `mergers-acquisitions/...` on source; author under `/news/`)

**Do this loop once per post:**

- [ ] **Step 1: Fetch** `https://arrowheadintermediaries.com/news/<slug>/` (browser UA) → `scratchpad/news/<slug>.src.html`. Extract title, date, location, featured image URL, headshot(s), body paragraphs, quotes, media-contact block.

- [ ] **Step 2: Assets** — download featured image + any inline images, optimize, upload to `/cloudadoption/ahi/news/.<slug>/<name>.<ext>` via `da_upload_media`. Record URLs.

- [ ] **Step 3: Compose** `scratchpad/news/<slug>.html`: `<h1>` title (article-header autobuilds date), featured `<picture>`, body sections (subtitle, quotes as blockquotes, paragraphs), media-contact section, and a `metadata` block with `Title`, `Description`, `Image` (featured), `Author`, `Publish Date` (ISO, e.g. `2026-07-28`), `Template` = `news` (optional).

- [ ] **Step 4: Publish** via `da_create_source` path `news/<slug>.html`.

- [ ] **Step 5: Verify** `https://import-arrowhead--ahi--cloudadoption.aem.page/news/<slug>` renders with the article header (title + date), featured image, and body.

**After all posts:**

- [ ] **Step 6: Update `metadata.json`** via `da_update_source` (path `metadata.json`) with per-path metadata rows for `/news/*` (title, description, publish-date, author, image) so `query-index.json` is populated.

- [ ] **Step 7: Backfill index + home thumbnails.** Update Task 10 news index and Task 7 home "latest news" cards to use the real post thumbnail URLs and confirm links resolve.

- [ ] **Step 8: Verify end-to-end.** Load home → click a latest-news card → lands on the post; load `/news` → all 11 listed newest-first. `curl` each `/news/<slug>` → 200.

- [ ] **Step 9: Commit.**

```bash
git add drafts/ scratchpad/news/
git commit -m "feat: author 11 Arrowhead news posts in DA"
```

---

## Final verification

- [ ] `npm run lint` passes clean.
- [ ] Home, Leadership, News index, and all 11 posts return 200 on the branch preview and render brand-accurately.
- [ ] No `<img>` src points at `arrowheadintermediaries.com` (all self-hosted in DA): grep each authored doc.
- [ ] Nav + footer present and correct on every page.
- [ ] Open a PR to `main` with a link to `https://import-arrowhead--ahi--cloudadoption.aem.page/` per AGENTS.md publishing process.
