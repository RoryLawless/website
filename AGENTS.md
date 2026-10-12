# Agent Instructions

This file provides guidance to AI coding agents (including Claude Code) when working with code in this repository.

## What this is

A personal website at [rorylawless.com](https://rorylawless.com). It is a static site built with [Quarto](https://quarto.org), hosted on Cloudflare Workers. Content is written in `.qmd` (Quarto Markdown) files. Posts that include R code use `renv` for reproducible dependency management.

**Agents should not help with writing or editing content.** Work here is focused on look and feel, infrastructure, and tooling.

---

## Tech stack

| Layer | Tool |
|---|---|
| Site framework | Quarto |
| Styling | `_brand.yml` theme tokens + custom SCSS (`assets/custom.scss`), no Quarto theme (`theme: none`) |
| Hosting | Cloudflare Workers static assets (deployed via Wrangler, no Worker script) |
| CI/CD | Repo connected to Cloudeflare Worker for automatic deployment when _site/* changes |
| R environment | renv |

---

## Repository layout

```
_brand.yml           # Canonical brand tokens (colors, typography, navbar/footer defaults)
_quarto.yml          # Master site configuration (project, title/search header, output dir, HTML options)
assets/
  custom.scss        # Custom CSS behavior/layout + optimized self-hosted @font-face loading
  fonts/            # Active self-hosted Newsreader Text WOFF2 files + OFL license
  template.ejs       # EJS template for the post listing on the homepage
html/
  a11y.html          # Runtime JS patches for main-content focusability and navbar toggle role
  skip-link.html     # Skip-to-content link, moved before navigation by its inline script
posts/               # Blog posts, each in its own subdirectory with index.qmd
  _metadata.yml      # Shared frontmatter defaults for all posts (freeze: auto)
.well-known/         # PGP key (pgp-key.txt), security.txt, OpenPGP Web Key Directory files
_redirects           # Cloudflare redirect rules
_headers             # Cloudflare response header rules (global security headers + OpenPGP headers)
wrangler.jsonc       # Cloudflare Workers deployment config
renv.lock            # Locked R package versions
.Rprofile            # Sources renv/activate.R (auto-snapshot + pak enabled)
```

`_site/` (rendered output) and `_freeze/` (computational cache) are **committed to the repository** — they must be up to date before pushing.

---

## Design system

**Colors** (defined in `_brand.yml`):
- Navbar background: `#fbf5f5` (off-white)
- Navbar foreground / text: `#070a0c` (ink)
- Page background: `#fbf5f5` (off-white)
- Footer background: `#fbf5f5`, foreground: `#070a0c`
- Body text: `#070a0c`
- Links: `#183e4d`

**Typography** (brand tokens defined in `_brand.yml`; fonts are self-hosted WOFF2 files in `assets/fonts/`, loaded via optimized `@font-face` rules in `assets/custom.scss`):
- Body font: Newsreader Text, 20px, weight 400, line height 1.55
- Headings: Newsreader Text, weight 500, line height 1.2
- Navbar title: Newsreader Text, weight 500, fixed 24px size in SCSS
- Real italic, bold, and bold italic faces are self-hosted; code stays monospace
- Code highlighting: a11y style, with copy buttons enabled

**Layout** (`assets/custom.scss`):
- Reading column: 660px maximum, left aligned with responsive page insets
- Navbar aligns with the reading column and shows only the site name and search; there is no hamburger menu
- Navbar title size: `font-size: 1.5rem` (24px at the site's 16px root size, independent of viewport width)
- Main content: no top margin, with `1rem` top padding after the navbar at all viewport widths
- The homepage's native title is visually hidden, retaining an `h1` for heading navigation without adding visible space
- `h2` elements: no bottom border or padding; generous section spacing
- Post listing: a semantic list of prose sentences, with hidden list markers, underlined title links, and generous spacing
- Prose and footer links use a brighter teal and a stronger underline on hover or keyboard focus; the brief color transition respects reduced-motion preferences

**Post listing** (`assets/template.ejs`):
- Renders each linked title followed by "published on" and a date such as "Sunday, September 20th 2026"
- The listing uses `date-format: "dddd, MMMM Do YYYY"`; source publication dates remain ISO 8601
- Uses `role="list"` to preserve list semantics when CSS hides markers, and escapes titles, URLs, and dates with Quarto's `<%- value %>` syntax
- Sorted by date descending; no categories, search, filters, or sort UI

When changing look and feel, use `_brand.yml` for reusable theme tokens (colors, typography, navbar/footer defaults) and `assets/custom.scss` for CSS behavior, layout, accessibility fixes, and optimized local font loading. `_quarto.yml` should stay focused on Quarto project/site options and the HTML theme stack. Do not introduce a Quarto theme — the site intentionally uses `theme: none`.

**Bootstrap caveat**: `theme: none` disables the *Quarto* theme layer, but Quarto still ships Bootstrap's CSS/JS in the rendered output. The HTML theme stack is `none`, `brand`, then `assets/custom.scss`, so `_brand.yml` establishes Bootstrap variables and `custom.scss` can reference `$brand-*` variables or override Bootstrap defaults where needed. A few `!important` layout rules are expected, not technical debt.

---

## Key `_quarto.yml` settings

- `llms-txt: true` — Quarto generates an `llms.txt` file for LLM consumption
- `format.html.theme` is `none`, `brand`, then `assets/custom.scss` — keep `brand` between `none` and the custom SCSS so `_brand.yml` tokens are available while custom CSS keeps final precedence
- `project.resources` includes `/assets/fonts/` with a leading slash intentionally — Quarto globs are recursive by default, and the leading slash anchors the font directory at the project root so package fonts are not copied into `_site/`
- `email-obfuscation: references` — email addresses are obfuscated in rendered HTML
- `draft-mode: gone` — posts with `draft: true` in their frontmatter are excluded from the rendered site entirely
- `search` is unset, so Quarto's default site-wide search is enabled — this is intentional (distinct from the post listing, which has no search UI)
- `feed: true` (set in `index.qmd`) — an RSS feed is generated for the post listing
- `anchor-sections: false` (set in `index.qmd`) — no anchor links on the homepage

---

## Accessibility compatibility (reviewed 2026-09-14)

The Quarto version used for this review was **1.10.18**. Keep these workarounds until the
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
  focus transfer and removes the navbar toggle's incorrect `role="menu"`.
- No custom code-copy focus restoration is needed for the current successful-copy
  flow: Quarto calls `button.blur()`, but subsequently calls `e.clearSelection()`.
  The bundled ClipboardJS 2.0.11 implementation restores focus to the trigger in
  that method. Do not infer lost focus from `blur()` alone.

**Quarto 1.11 migration:** As of this review, **1.11.4 is a prerelease** and
1.10.18 is the latest stable release. Version 1.11.4 includes:

- A native first-body-child skip link (`#quarto-skip-link`), focus-only styling,
  and `tabindex="-1"` on its target ([PR #14685](https://github.com/quarto-dev/quarto-cli/pull/14685)).
  Its text is customizable through `language.skip-to-content`. It applies to
  Bootstrap HTML output; this site's `none`, `brand`, custom SCSS stack still
  uses Bootstrap. Verify the native link appears after upgrading.
- Correct navbar toggle semantics without `role="menu"`
  ([PR #14805](https://github.com/quarto-dev/quarto-cli/pull/14805)).

After upgrading and verifying those replacements, remove both custom HTML
includes from `_quarto.yml` and their files. Remove `.skip-to-content` styling or
adapt the desired appearance to `#quarto-skip-link`; retain general focus styles.
Check [issue #14875](https://github.com/quarto-dev/quarto-cli/issues/14875), open
at review time: 1.11.4 can rewrite the native skip link on explicit `/index.html`
URLs into a cross-document navigation. Test both directory and `index.html` URLs.

After rendering accessibility changes, check that the first Tab reveals the skip
link, Enter transfers focus into main, and the next Tab reaches a content control.
Also check mobile navbar keyboard operation and code copying with Enter and Space,
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


Agents in this environment should not attempt to run the full build.

The standalone About and Resume pages have been retired. Their URL redirects in
`_redirects` keep old bookmarks working by sending visitors to the homepage.

---

## Cloudflare configuration

`wrangler.jsonc` defines:
- Static assets served from `_site/`
- `html_handling: "auto-trailing-slash"` — URL normalisation (nested under `assets`)
- Custom domain: `rorylawless.com` only (apex). This is the single entry in `routes`.
- No `observability` block — Cloudflare defaults apply (view logs/traces in the Cloudflare dashboard)

There is no Worker script — the deployment is static assets only. URL redirects live in `_redirects` (Cloudflare syntax). Response headers live in `_headers` — currently used for global security headers (`Strict-Transport-Security`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`) plus CORS and `Content-Type` headers for the OpenPGP Web Key Directory endpoint at `/.well-known/openpgpkey/`. The HSTS header intentionally omits `includeSubDomains` and `preload`. `www.rorylawless.com` is 301'd to the apex by a Cloudflare Redirect Rule configured in the dashboard (not in this repo, and not in `wrangler.jsonc`).

---

## Dependencies

- **R**: Pinned in `renv.lock`, which records the R version and package sources. `.Rprofile` sources `renv/activate.R` and enables `renv.config.auto.snapshot` and `renv.config.pak.enabled`.

---

## Conventions

- Post directories use kebab-case naming (e.g., `posts/the-basics-of-duckdb-in-r/`)
- Source dates are ISO 8601 (`2026-05-03`); the homepage listing displays expanded dates with weekday and ordinal day
- Reusable content snippets use Quarto's `{{< include >}}` shortcode.
- The homepage places About Me above Posts. The biography, email, and social links appear in prose within `index.qmd`.
- All posts inherit settings from `posts/_metadata.yml` (`freeze: auto`, expanded publication dates with weekday and ordinal day). The native title-block publication metadata reads "Published on Sunday, September 20th 2026." on one prose line, wrapping naturally on small screens.
- Draft visibility is controlled exclusively via the `draft: true` setting — do not edit `_quarto.yml` for this

---

## Claude Code automations

The `.claude/` directory contains project-specific Claude Code configuration.

**Hooks** (active on every session, defined in `.claude/settings.json`):
- Edits to `_site/` are blocked — modify source files and run `quarto render` instead
- Edits to `renv.lock` are blocked — use renv to manage R packages

**Skills** (invoke with `/skill-name`):
- `/new-post <title>` — scaffold a new post directory with kebab-case naming, minimal frontmatter, and `draft: true`
- `/publish-post <title>` — remove `draft: true` from a post's frontmatter when ready to publish

**Subagents**:
- `security-headers-reviewer` — reviews changes to `_headers` for security regressions; invoke before committing header changes

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
