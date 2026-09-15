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
_quarto.yml          # Master site configuration (project, navbar links, output dir, HTML options)
assets/
  custom.scss        # Custom CSS behavior/layout + optimized self-hosted @font-face loading
  fonts/             # Self-hosted WOFF2 files (Lato 300/400/700, Playfair Display 400-900)
  template.ejs       # EJS template for the post listing on the homepage
html/
  a11y.html          # Runtime JS patches for main-content focusability and navbar toggle role
  skip-link.html     # Skip-to-content link, moved before navigation by its inline script
posts/               # Blog posts, each in its own subdirectory with index.qmd
  _metadata.yml      # Shared frontmatter defaults for all posts (freeze: auto)
404.qmd              # Custom 404 page
.well-known/         # PGP key (pgp-key.txt), security.txt, OpenPGP Web Key Directory files
_redirects           # Cloudflare redirect rules
_headers             # Cloudflare response header rules (global security headers + OpenPGP headers)
wrangler.jsonc       # Cloudflare Workers deployment config
package.json         # Node deps (just wrangler)
bun.lock             # Bun lockfile
renv.lock            # Locked R package versions
.Rprofile            # Sources renv/activate.R (auto-snapshot + pak enabled)
```

`_site/` (rendered output) and `_freeze/` (computational cache) are **committed to the repository** — they must be up to date before pushing.

---

## Design system

**Colors** (defined in `_brand.yml`):
- Navbar background: `#24617a` (teal)
- Navbar foreground / text: `#fbf5f5` (off-white)
- Page background: `#fbf5f5` (off-white)
- Footer background: `#fbf5f5`, foreground: `#070a0c`
- Body text: `#070a0c`
- Links: `#183e4d`

**Typography** (brand tokens defined in `_brand.yml`; fonts are self-hosted WOFF2 files in `assets/fonts/`, loaded via optimized `@font-face` rules in `assets/custom.scss`):
- Body font: Lato, 14pt
- Navbar title: Playfair Display (applied via `.navbar-title` in SCSS)
- Code highlighting: a11y style, with copy buttons enabled

**Layout** (`assets/custom.scss`):
- Max content width: `.navbar-container { width: 820px }` (viewport-capped)
- Navbar title size: `font-size: clamp(1.25rem, 4vw, 3rem)` (viewport-relative with min/max bounds)
- `h2` elements: no bottom border, no bottom padding, 1rem top margin
- Listing table cells: `padding-inline: 0; padding-block: 1rem` via `.quarto-listing-table > :not(caption) > * > td`
- Post listing: borderless table; date column is right-aligned

**Post listing** (`assets/template.ejs`):
- Renders title (hyperlinked) and ISO date in a two-column borderless table
- Sorted by date descending; no categories, search, filters, or sort UI

When changing look and feel, use `_brand.yml` for reusable theme tokens (colors, typography, navbar/footer defaults) and `assets/custom.scss` for CSS behavior, layout, accessibility fixes, and optimized local font loading. `_quarto.yml` should stay focused on Quarto project/site options and the HTML theme stack. Do not introduce a Quarto theme — the site intentionally uses `theme: none`.

**Bootstrap caveat**: `theme: none` disables the *Quarto* theme layer, but Quarto still ships Bootstrap's CSS/JS in the rendered output. The HTML theme stack is `none`, `brand`, then `assets/custom.scss`, so `_brand.yml` establishes Bootstrap variables and `custom.scss` can reference `$brand-*` variables or override Bootstrap defaults where needed. A few `!important` layout rules are expected, not technical debt.

---

## Key `_quarto.yml` settings

- `llms-txt: true` — Quarto generates an `llms.txt` file for LLM consumption
- `format.html.theme` is `none`, `brand`, then `assets/custom.scss` — keep `brand` between `none` and the custom SCSS so `_brand.yml` tokens are available while custom CSS keeps final precedence
- `project.resources` includes `/assets/fonts/` with a leading slash intentionally — Quarto globs are recursive by default, and the leading slash anchors the self-hosted font directory at the project root so `renv/.../assets/fonts/` is not copied into `_site/`
- `email-obfuscation: references` — email addresses are obfuscated in rendered HTML
- `draft-mode: gone` — posts with `draft: true` in their frontmatter are excluded from the rendered site entirely
- `search: false` — site-wide search is disabled intentionally
- `feed: true` (set in `index.qmd`) — an RSS feed is generated for the post listing
- `anchor-sections: false` (set in `index.qmd`) — no anchor links on the homepage

---

## Accessibility compatibility (reviewed 2026-09-14)

The current local Quarto version is **1.10.18**. Keep these workarounds until the
rendered output provides their native replacements:

- `html/skip-link.html` supplies the skip link and immediately moves it to the
  start of `<body>`. Quarto places `include-before-body` inside main content,
  after website navigation; the include alone does not make it the first tab
  stop. This relocation requires JavaScript.
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

Quarto is **rendered locally** before committing. The CI pipeline (`.tangled/workflows/deploy.yaml`) only handles deployment — it does not build the site.

**Local workflow:**
1. Make changes to source files
2. Run `quarto render` → outputs to `_site/`; updates `_freeze/` for any executed R code
3. Commit `_site/`, `_freeze/`, and any source changes together
4. Push to `main` → Cloudflare Worker deployment triggered → uploads `_site/` to Cloudflare Workers using the lockfile-pinned Wrangler version

To preview without a full render, run `quarto preview` (requires Quarto and R
installed locally).


Agents in this environment should not attempt to run the full build.

---

## Cloudflare configuration

`wrangler.jsonc` defines:
- Static assets served from `_site/`
- `not_found_handling: "404-page"` — unmatched routes serve the rendered `404.html`
- `html_handling: "auto-trailing-slash"` — URL normalisation (nested under `assets`)
- Custom domain: `rorylawless.com` only (apex). This is the single entry in `routes`.
- No `observability` block — Cloudflare defaults apply (view logs/traces in the Cloudflare dashboard)

There is no Worker script — the deployment is static assets only. URL redirects live in `_redirects` (Cloudflare syntax). Response headers live in `_headers` — currently used for global security headers (`Strict-Transport-Security`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`) plus CORS and `Content-Type` headers for the OpenPGP Web Key Directory endpoint at `/.well-known/openpgpkey/`. The HSTS header intentionally omits `includeSubDomains` and `preload`. `www.rorylawless.com` is 301'd to the apex by a Cloudflare Redirect Rule configured in the dashboard (not in this repo, and not in `wrangler.jsonc`).

---

## Dependencies

- **Node**: Only `wrangler` (devDependency). `package.json` sets `"type": "module"`. Managed with Bun (`bun.lock`).
- **R**: Pinned in `renv.lock` (R 4.6.0, CRAN + R-Multiverse). `.Rprofile` sources `renv/activate.R` and enables `renv.config.auto.snapshot` and `renv.config.pak.enabled`.

---

## Conventions

- Post directories use kebab-case naming (e.g., `posts/the-basics-of-duckdb-in-r/`)
- Dates throughout are ISO 8601 (`2026-05-03`)
- Reusable content snippets use Quarto's `{{< include >}}` shortcode (e.g., `_about-short.qmd` is included in `index.qmd`)
- All posts inherit settings from `posts/_metadata.yml` (`freeze: auto`, ISO date format)
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
- Do not move the self-hosted fonts into `_brand.yml` as `source: file` unless Quarto preserves the current `@font-face` behavior; `assets/custom.scss` intentionally keeps `font-display: swap`, `unicode-range`, root-relative URLs, and Playfair Display's `400 900` variable range
- Do not use unanchored resource paths for root-level asset directories in `_quarto.yml` — prefer `/assets/fonts/` over `assets/fonts/` so Quarto does not recursively match package assets under `renv/`
- Always commit `_site/` and `_freeze/` together with source changes — the CI pipeline deploys whatever `_site/` is in the repo
- Do not edit `.qmd` content files — content is out of scope for agents
- Do not modify `renv.lock` manually — R package changes go through `renv`
- Do not add search, categories, or sort UI to the post listing — the site is intentionally minimal
