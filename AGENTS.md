# Agent Instructions

This file provides guidance to AI coding agents (including Claude Code) when working with code in this repository.

## What this is

A personal website at [rorylawless.com](https://rorylawless.com). It is a static site built with [Quarto](https://quarto.org), hosted on Cloudflare Workers. Content is written in `.qmd` (Quarto Markdown) files. Posts that include R code use `renv` for reproducible dependency management.

**Agents should not help with writing or editing content.** Work here is focused on look and feel, infrastructure, and tooling.

---

`_site/` (rendered output) and `_freeze/` (computational cache) are **committed to the repository** — they must be up to date before pushing.

---

## Design system

**Typography** (brand tokens defined in `_brand.yml`; fonts are self-hosted WOFF2 files in `assets/fonts/`, loaded via optimized `@font-face` rules in `assets/custom.scss`):
- Body font: Newsreader Text, 20px, weight 400, line height 1.55. `$font-family-base` in `assets/custom.scss` adds the Georgia and serif fallbacks
- Headings: inherit the body font stack, weight 500 (the `_brand.yml` heading weight also overrides Quarto's 600 for `h1`–`h3`), Bootstrap's 1.2 line height
- Navbar title: inherits the body font, weight 500, fixed 24px size in SCSS
- Real italic, bold, and bold italic faces are self-hosted; code stays monospace
- Code highlighting: a11y style, with copy buttons enabled

**Layout** (`assets/custom.scss`):
- Reading column: 660px maximum, left aligned with responsive page insets
- Navbar aligns with the reading column and shows only the site name. It is pinned (`navbar.pinned: true`) and never collapses (`navbar.collapse: false`), so there is no toggle button
- Navbar title size: `font-size: 1.5rem` (24px at the site's 16px root size, independent of viewport width)
- Main content: no top margin, with `1rem` top padding after the navbar at all viewport widths
- Footer: aligns with the reading column, with the same inset on both sides at every width
- The homepage's native title is visually hidden, retaining an `h1` for heading navigation without adding visible space
- `h2` elements: no bottom border or padding; generous section spacing
- Post listing: a semantic list of prose sentences, with hidden list markers, underlined title links, and generous spacing
- Prose and footer links use a brighter teal and an underline at least 2px thick on hover or keyboard focus; the brief color transition respects reduced-motion preferences

**Resume notes** (`assets/resume-notes.js`, loaded by `html/resume-notes.html`, which only `index.qmd` includes). The script is an external file by choice, not necessity: the Content-Security-Policy allows `'unsafe-inline'`, which Quarto's generated scripts require, but keeping our own larger script out of the HTML leaves less to change if the policy is ever tightened. It is listed in `project.resources` so Quarto copies it to `_site/assets/`. The small skip-link and a11y scripts intentionally stay inline: external copies would add requests for about 600 bytes, and the skip link must be moved to the start of `<body>` as soon as the browser reaches it:
- Homepage spans marked `{.resume-note data-title="…" data-years="…"}` become inline disclosures that reveal "(title, years)" after the organization name. Without JavaScript they stay plain text, and the data attributes keep the details out of the prose and `.llms.md` output
- The trigger is a `<span role="button" tabindex="0">` rather than a `<button>`, because browsers render native buttons as unbreakable inline-block boxes and long organization names must wrap with the sentence. It handles Enter, Space, and Escape itself
- The toggle is instant, with no animation. Triggers use a pale teal background tint rather than an underline, so they don't read as links or `<abbr>` tooltips, and share the prose links' hover and focus color. Forced-colors modes drop backgrounds, so they fall back to a dotted underline there

**Post listing** (`assets/template.ejs`):
- Renders each linked title followed by "published on" and a date such as "Sunday, September 20th 2026"
- The listing uses `date-format: "dddd, MMMM Do YYYY"`; source publication dates remain ISO 8601
- Uses `role="list"` to preserve list semantics when CSS hides markers, and escapes titles, URLs, and dates with Quarto's `<%- value %>` syntax
- Keep `class="list"` on the `<ul>`: Quarto's listing script looks for it and throws without it. Items need no `metadataAttrs()` data attributes because there is no sort or filter UI
- Sorted by date descending; no categories, search, filters, or sort UI

When changing look and feel, use `_brand.yml` for reusable theme tokens (colors, typography, navbar/footer defaults) and `assets/custom.scss` for CSS behavior, layout, accessibility fixes, and optimized local font loading. `_quarto.yml` should stay focused on Quarto project/site options and the HTML theme stack. Do not introduce a Quarto theme — the site intentionally uses `theme: none`.

**Bootstrap caveat**: `theme: none` disables the *Quarto* theme layer, but Quarto still ships Bootstrap's CSS/JS in the rendered output. The HTML theme stack is `none`, `brand`, then `assets/custom.scss`, so `_brand.yml` establishes Bootstrap variables and `custom.scss` can reference `$brand-*` variables or override Bootstrap defaults where needed. Prefer Bootstrap variables and mixins over rules that undo Bootstrap's output: the `custom.scss` defaults section sets `$paragraph-margin-bottom`, `$navbar-padding-y`, `$footer-font-size`, and `$font-family-base`, and its rules use `media-breakpoint-down`, `transition` (which also disables the transition for reduced motion), `list-unstyled`, and `visually-hidden`. Plain assignments in the `custom.scss` defaults section take precedence over `_brand.yml`, whose variables are emitted with `!default`; for the same reason, that section is compiled before the `$brand-*` variables exist, so only `custom.scss` rules can use them. Quarto also adds rules that variables don't reach, such as 1em of horizontal padding on `#quarto-header > nav` and `footer.footer .nav-footer`; `custom.scss` resets those explicitly.

---

## Key `_quarto.yml` settings

- `llms-txt: true` — Quarto generates an `llms.txt` file for LLM consumption
- `format.html.theme` is `none`, `brand`, then `assets/custom.scss` — keep `brand` between `none` and the custom SCSS so `_brand.yml` tokens are available while custom CSS keeps final precedence
- `brand: light: _brand.yml` — uses the brand for light mode only. If Quarto auto-discovers `_brand.yml`, it treats it as a unified light/dark brand and builds a second, unused dark Bootstrap stylesheet that every page downloads. Add a `dark` entry only together with a deliberate dark design
- `format.html.title-block-style: plain` — keeps Quarto's title-block markup but omits its stylesheet (metadata grid, uppercase labels, reduced font sizes), so the publication line needs only a small rule in `custom.scss`
- `format.html.canonical-url: true` — each page declares its `site-url`-based canonical URL
- `website.open-graph.image` and `website.twitter-card.image` use the root-relative `/assets/social-card.png`; Quarto resolves a leading `/` from the project root, so the card also works for nested posts
- `project.resources` includes `/assets/fonts/` with a leading slash intentionally — Quarto globs are recursive by default, and the leading slash anchors the font directory at the project root so package fonts are not copied into `_site/`
- `draft-mode: gone` — posts with `draft: true` in their frontmatter are excluded from the rendered site entirely
- `website.search: false` — site-wide search is off, so Quarto adds no search button or scripts (it still writes `search.json`)
- `feed: true` (set in `index.qmd`) — an RSS feed is generated for the post listing
- `anchor-sections: false` (set in `index.qmd`) — no anchor links on the homepage

---

## Accessibility compatibility (reviewed 2026-09-14)

The Quarto version used for this review was **1.10.19**. Keep these workarounds until the
rendered output provides their native replacements:

- `html/skip-link.html` supplies the skip link and immediately moves it to the
  start of `<body>`. Use `include-after-body` to keep the link and its script
  outside main content, which Quarto uses for RSS descriptions. The relocation
  makes the link the first tab stop and requires JavaScript.
  The link is wrapped in `llms-hidden-content` because `.llms.md` generation
  reads the HTML before browser scripts run. Quarto's LLM converter drops the
  wrapper's contents and its HTML finalizer unwraps the link for the website.
  Use a wrapper rather than putting this class on the anchor itself: the HTML
  cleanup removes the marked element while retaining its children. Raw HTML
  includes bypass the Markdown conditional-content filter, so this uses its
  generated HTML marker directly. Recheck this behaviour when upgrading Quarto.
- `html/a11y.html` adds `tabindex="-1"` to `#quarto-document-content` for reliable
  focus transfer. The navbar never collapses, so Quarto renders no toggle button
  and its incorrect `role="menu"` does not arise.
- No custom code-copy focus restoration is needed for the current successful-copy
  flow: Quarto calls `button.blur()`, but subsequently calls `e.clearSelection()`.
  The bundled ClipboardJS 2.0.11 implementation restores focus to the trigger in
  that method. Do not infer lost focus from `blur()` alone.

When upgrading Quarto, follow the `quarto-upgrade` skill
(`.agents/skills/quarto-upgrade/SKILL.md`), which covers replacing these
workarounds with Quarto 1.11's native features.

After rendering accessibility changes, check that the first Tab reveals the skip
link, Enter transfers focus into main, and the next Tab reaches a content control.
Also check code copying with Enter and Space,
including the focus indicator and subsequent Tab order. Check Safari and another
browser. Source inspection does not replace these browser checks.

---

## Build and deploy

Quarto is **rendered locally** before committing. Cloudflare's Git-connected deployment only uploads the committed `_site/` — it does not build the site.

**Local workflow:**
1. Make changes to source files
2. Run `quarto render` → outputs to `_site/`; updates `_freeze/` for any executed R code
3. Commit `_site/`, `_freeze/`, and any source changes together
4. Push to `main` → Cloudflare Worker deployment triggered → uploads `_site/` to Cloudflare Workers

To preview without a full render, run `quarto preview` (requires Quarto and R
installed locally).


**Agents must not run the full build** (`quarto render`); the human renders and commits `_site/`. `quarto preview` is fine for local checks.

The standalone About and Resume pages have been retired. Their URL redirects in
`_redirects` keep old bookmarks working by sending visitors to the homepage.

---

## Cloudflare configuration

`wrangler.jsonc` defines:
- Static assets served from `_site/`
- `html_handling: "auto-trailing-slash"` — URL normalisation (nested under `assets`)
- Custom domain: `rorylawless.com` only (apex). This is the single entry in `routes`.
- `workers_dev: false` — production is not served on `workers.dev`. A dashboard toggle is overwritten by the next production `wrangler deploy` from `main`.
- `preview_urls: true` and an empty `previews: {}` block — enables [Workers Previews](https://developers.cloudflare.com/workers/previews/) for non-production branches. Workers Builds runs `npx wrangler preview` (requires Wrangler 4.135.0 or later) and posts the Preview URL (`<branch>-website.<subdomain>.workers.dev`) on the pull request. The `previews` block is required even when empty; it takes only Preview-specific settings such as vars and bindings, never `routes` or `workers_dev`.
- Preview URLs are public; Cloudflare adds `X-Robots-Tag: noindex` to `workers.dev` Preview URLs automatically.
- No `observability` block — Cloudflare defaults apply (view logs/traces in the Cloudflare dashboard)

There is no Worker script — the deployment is static assets only. URL redirects live in `_redirects` (Cloudflare syntax). Response headers live in `_headers` — currently used for global security headers (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`) plus `Content-Type: text/markdown` for the generated `*.llms.md` files, and CORS and `Content-Type` headers for the OpenPGP Web Key Directory endpoint at `/.well-known/openpgpkey/`. The HSTS header sets `includeSubDomains` and `preload`. The Content-Security-Policy is `default-src 'self'` plus `frame-ancestors 'none'`, `'unsafe-inline'` in `script-src` and `style-src` (Quarto emits inline scripts and styles, and hashing them would break whenever its output changes), `https://gc.zgo.at` in `script-src` for the GoatCounter script (the host must match exactly; `zgo.at` does not cover `gc.zgo.at`), and `connect-src` for the `https://rorylawless.goatcounter.com/count` beacon. Any new third-party script or request needs its own entry. `www.rorylawless.com` is 301'd to the apex by a Cloudflare Redirect Rule configured in the dashboard (not in this repo, and not in `wrangler.jsonc`).

---

## Dependencies

- **R**: Pinned in `renv.lock`, which records the R version and package sources. `.Rprofile` sources `renv/activate.R` and enables `renv.config.auto.snapshot` and `renv.config.pak.enabled`.

---

## Conventions

- Post directories use kebab-case naming (e.g., `posts/the-basics-of-duckdb-in-r/`)
- Source dates are ISO 8601 (`2026-05-03`); the homepage listing displays expanded dates with weekday and ordinal day
- Reusable content snippets use Quarto's `{{< include >}}` shortcode.
- The homepage opens with the biography, email, and social links in prose within `index.qmd`, followed by Posts.
- All posts inherit settings from `posts/_metadata.yml` (`freeze: auto`, `author`, expanded publication dates with weekday and ordinal day). The native title-block publication metadata reads "Published on Sunday, September 20th 2026." on one prose line, wrapping naturally on small screens.
- `author` feeds the `author` meta tag and the RSS feed's `dc:creator` without a visible byline: `html/title-metadata.html` is a copy of Quarto 1.10.19's title-metadata partial with authors and affiliations removed. Re-sync it with Quarto's partial when upgrading.
- `filters/date-meta.lua` sets `date-meta`, which Pandoc writes as `dcterms.date`, from the ISO source date, because Quarto applies `date-format` before filters run. When upgrading Quarto, check whether `dcterms.date` is still correct without it.
- Draft visibility is controlled exclusively via the `draft: true` setting — do not edit `_quarto.yml` for this
- Third-party agent skills live in `.agents/skills/` (symlinked from `.claude/skills/`) and are managed with `npx skills add|remove`, which keeps `skills-lock.json` in sync — don't add or delete them by hand. Repo-specific skills (`new-post`, `publish-post`, `quarto-upgrade`) are maintained directly. `new-post` and `publish-post` live in `.claude/skills/` and are symlinked into `.agents/skills/` so other LLM tools can use them; `quarto-upgrade` is the reverse.

---

## What to avoid

- Do not introduce a Quarto theme (Bootstrap-based) — styling is intentionally from scratch
- Do not add JavaScript frameworks or bundlers
- Do not move the self-hosted fonts into `_brand.yml` as `source: file` unless Quarto preserves the current `@font-face` behavior; `assets/custom.scss` intentionally keeps `font-display: swap`, root-relative URLs, explicit static weights and italics, and the full supplied Newsreader glyph coverage
- Do not use unanchored resource paths for root-level asset directories in `_quarto.yml` — prefer `/assets/fonts/` over `assets/fonts/` so Quarto does not recursively match package assets under `renv/`
- Always commit `_site/` and `_freeze/` together with source changes — the CI pipeline deploys whatever `_site/` is in the repo
- Do not edit `.qmd` content files — content is out of scope for agents
- Do not modify `renv.lock` manually — R package changes go through `renv`
- Do not add search, categories, or sort UI to the post listing — the site is intentionally minimal
