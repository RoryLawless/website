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
| Styling | Custom SCSS (`assets/custom.scss`), no Quarto theme (`theme: none`) |
| Hosting | Cloudflare Workers static assets (deployed via Wrangler, no Worker script) |
| CI/CD | Tangled CI (`.tangled/workflows/deploy.yaml`) |
| R environment | renv |

---

## Repository layout

```
_quarto.yml          # Master site configuration (colors, fonts, navbar, output dir)
assets/
  custom.scss        # All custom styles — primary target for look and feel changes
  fonts/             # Self-hosted WOFF2 files (Lato 300/400/700, Playfair Display 400-900)
  template.ejs       # EJS template for the post listing on the homepage
html/
  a11y.html          # Runtime JS patches for Quarto template a11y bugs (main-content focus, navbar role, code-copy focus restore)
  skip-link.html     # Skip-to-content link injected into every page
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
.tangled/
  workflows/deploy.yaml  # CI pipeline: deploys _site/ to Cloudflare on push to main
```

`_site/` (rendered output) and `_freeze/` (computational cache) are **committed to the repository** — they must be up to date before pushing.

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

**Bootstrap caveat**: `theme: none` disables the *Quarto* theme layer, but Quarto still ships Bootstrap's CSS/JS in the rendered output. That's why `custom.scss` uses `!important` in a few navbar/layout rules to override Bootstrap defaults — it's expected, not technical debt.

---

## Key `_quarto.yml` settings

- `llms-txt: true` — Quarto generates an `llms.txt` file for LLM consumption
- `project.resources` includes `/assets/fonts/` with a leading slash intentionally — Quarto globs are recursive by default, and the leading slash anchors the self-hosted font directory at the project root so `renv/.../assets/fonts/` is not copied into `_site/`
- `email-obfuscation: references` — email addresses are obfuscated in rendered HTML
- `draft-mode: gone` — posts with `draft: true` in their frontmatter are excluded from the rendered site entirely
- `search: false` — site-wide search is disabled intentionally
- `feed: true` (set in `index.qmd`) — an RSS feed is generated for the post listing
- `anchor-sections: false` (set in `index.qmd`) — no anchor links on the homepage

---

## Build and deploy

Quarto is **rendered locally** before committing. The CI pipeline (`.tangled/workflows/deploy.yaml`) only handles deployment — it does not build the site.

**Local workflow:**
1. Make changes to source files
2. Run `quarto render` → outputs to `_site/`; updates `_freeze/` for any executed R code
3. Commit `_site/`, `_freeze/`, and any source changes together
4. Push to `main` → Tangled CI runs `bun ci` followed by `bun run wrangler deploy` → uploads `_site/` to Cloudflare Workers using the lockfile-pinned Wrangler version

To preview without a full render, run `quarto preview` (requires Quarto and R installed locally).

**Secrets required**: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (stored in Tangled CI secrets).

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
- Do not use unanchored resource paths for root-level asset directories in `_quarto.yml` — prefer `/assets/fonts/` over `assets/fonts/` so Quarto does not recursively match package assets under `renv/`
- Always commit `_site/` and `_freeze/` together with source changes — the CI pipeline deploys whatever `_site/` is in the repo
- Do not edit `.qmd` content files — content is out of scope for agents
- Do not modify `renv.lock` manually — R package changes go through `renv`
- Do not add search, categories, or sort UI to the post listing — the site is intentionally minimal
