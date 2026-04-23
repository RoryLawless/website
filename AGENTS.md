# Agent Instructions

This file provides guidance to AI coding agents (including Claude Code) when working with code in this repository.

## What this is

A personal website at [rorylawless.com](https://rorylawless.com). It is a static site built with [Quarto](https://quarto.org), hosted on Cloudflare Workers. Content is written in `.qmd` (Quarto Markdown) files. Posts that include R code use `renv` for reproducible dependency management.

**Agents are not expected to help with writing or editing content.** Work here is focused on look and feel, infrastructure, and tooling.

---

## Tech stack

| Layer | Tool |
|---|---|
| Site framework | Quarto |
| Styling | Custom SCSS (`assets/custom.scss`), no Quarto theme (`theme: none`) |
| Hosting | Cloudflare Workers static assets (deployed via Wrangler, no Worker script) |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) |
| R environment | renv |
| Analytics | Simple Analytics |

---

## Repository layout

```
_quarto.yml          # Master site configuration (colors, fonts, navbar, output dir)
drafts.yml           # Controls draft post visibility (referenced by _quarto.yml)
assets/
  custom.scss        # All custom styles — primary target for look and feel changes
  fonts/             # Self-hosted WOFF2 files (Lato 300/400/700, Playfair Display 400-900)
  template.ejs       # EJS template for the post listing on the homepage
html/
  analytics.html     # Simple Analytics script injection
  a11y.html          # Accessibility enhancements (ARIA landmarks, roles)
  skip-link.html     # Skip-to-content link injected into every page
posts/               # Blog posts, each in its own subdirectory with index.qmd
  _metadata.yml      # Shared frontmatter defaults for all posts (freeze: auto)
404.qmd              # Custom 404 page
.well-known/         # PGP key (pgp-key.txt) and security.txt
_redirects           # Cloudflare redirect rules
_headers             # Cloudflare response header rules
wrangler.jsonc       # Cloudflare Workers deployment config
package.json         # Node deps (just wrangler)
renv.lock            # Locked R package versions
.github/workflows/
  deploy.yml         # Build and deploy pipeline
```

Output goes to `_site/` (generated, not committed). The `_freeze/` directory (computational cache) is also not committed — it is restored from the GitHub Actions cache between runs.

---

## Design system

**Colors** (defined in `_quarto.yml`):
- Navbar background: `#24617a` (teal)
- Navbar foreground / text: `#fbf5f5` (off-white)
- Page background: `#fbf5f5` (off-white)
- Footer background: `#fbf5f5`, foreground: `#070a0c`
- Body text: `#070a0c`
- Links: `#183e4d`

**Typography** (defined in `_quarto.yml`; fonts are self-hosted WOFF2 files in `assets/fonts/`, loaded via `@font-face` in `assets/custom.scss`):
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

When changing look and feel, `assets/custom.scss` and `_quarto.yml` are the two files to focus on. Do not introduce a Quarto theme — the site intentionally uses `theme: none`.

---

## Key `_quarto.yml` settings

- `llms-txt: true` — Quarto generates an `llms.txt` file for LLM consumption
- `email-obfuscation: references` — email addresses are obfuscated in rendered HTML
- `draft-mode: gone` — set directly in `_quarto.yml`; `drafts.yml` (pulled in via `metadata-files`) lists which posts are drafts (currently none)
- `search: false` — site-wide search is disabled intentionally
- `feed: true` (set in `index.qmd`) — an RSS feed is generated for the post listing
- `anchor-sections: false` (set in `index.qmd`) — no anchor links on the homepage

---

## Build and deploy

The site is **never built locally** — CI handles it. The full pipeline runs on every push to `main`:

1. Restore cached `_freeze/` and `node_modules/` (keyed by OS + hash of `package-lock.json` and all `.qmd` files)
2. Set up R + renv (restores packages from `renv.lock`)
3. Run `quarto render` → outputs to `_site/`
4. Run `wrangler deploy` → uploads `_site/` to Cloudflare Workers

**Runner**: `blacksmith-4vcpu-ubuntu-2404-arm` (4-core ARM Ubuntu 24.04)

**Secrets required**: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (stored in GitHub Actions).

**Paths that do not trigger a deploy**: Changes to `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, and anything under `.claude/` are excluded via `paths-ignore`. Edits to those files alone will not trigger a build.

To preview changes locally you would need Quarto and R installed, then run `quarto preview`. Agents in this environment should not attempt to run the full build.

---

## Cloudflare configuration

`wrangler.jsonc` defines:
- Static assets served from `_site/`
- `not_found_handling: "404-page"` — unmatched routes serve the rendered `404.html`
- `html_handling: "auto-trailing-slash"` — URL normalisation (nested under `assets`)
- Custom domains: `rorylawless.com` and `www.rorylawless.com` (both route to the same Worker)
- Observability: full logs and traces enabled at 100% head sampling rate with persistence (viewable in the Cloudflare dashboard)

There is no Worker script — the deployment is static assets only. URL redirects live in `_redirects` (Cloudflare syntax). Response headers live in `_headers` — currently used to set CORS headers and `Content-Type` for the PGP key endpoint at `/.well-known/openpgpkey/`. A Cloudflare Redirect Rule (configured in the dashboard, not the repo) 301s `www.rorylawless.com` to the apex.

---

## Conventions

- Post directories use kebab-case naming (e.g., `posts/the-basics-of-duckdb-in-r/`)
- Dates throughout are ISO 8601 (`2025-03-30`)
- Reusable content snippets use Quarto's `{{< include >}}` shortcode (e.g., `_about-short.qmd` is included in `index.qmd`)
- All posts inherit settings from `posts/_metadata.yml` (`freeze: auto`, ISO date format)
- Draft visibility is controlled exclusively via `drafts.yml` — do not edit `_quarto.yml` for this

---

## What to avoid

- Do not introduce a Quarto theme (Bootstrap-based) — styling is intentionally from scratch
- Do not add JavaScript frameworks or bundlers
- Do not commit the `_site/` or `_freeze/` output directories — both are in `.gitignore`
- Do not edit `.qmd` content files — content is out of scope for agents
- Do not modify `renv.lock` manually — R package changes go through `renv`
- Do not add search, categories, or sort UI to the post listing — the site is intentionally minimal
