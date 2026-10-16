---
name: quarto-upgrade
description: "Checklist for upgrading Quarto in this site, including replacing the custom skip-link and a11y workarounds with Quarto 1.11's native features"
---

Read the "Accessibility compatibility" section of `AGENTS.md` first: it explains
the workarounds this upgrade may replace. Also re-sync `html/title-metadata.html`
and recheck `filters/date-meta.lua`, as described under Conventions in `AGENTS.md`.

**Quarto 1.11 migration:** As of the 2026-09-14 review, **1.11.4 is a prerelease** and
1.10.18 is the latest stable release. Version 1.11.4 includes:

- A native first-body-child skip link (`#quarto-skip-link`), focus-only styling,
  and `tabindex="-1"` on its target ([PR #14685](https://github.com/quarto-dev/quarto-cli/pull/14685)).
  Its text is customizable through `language.skip-to-content`. It applies to
  Bootstrap HTML output; this site's `none`, `brand`, custom SCSS stack still
  uses Bootstrap. Verify the native link appears after upgrading.
- Correct navbar toggle semantics without `role="menu"`
  ([PR #14805](https://github.com/quarto-dev/quarto-cli/pull/14805)). This
  matters only if the navbar is allowed to collapse again.

After upgrading and verifying those replacements, remove both custom HTML
includes from `_quarto.yml` and their files. Remove `.skip-to-content` styling or
adapt the desired appearance to `#quarto-skip-link`; retain general focus styles.
Check [issue #14875](https://github.com/quarto-dev/quarto-cli/issues/14875), open
at review time: 1.11.4 can rewrite the native skip link on explicit `/index.html`
URLs into a cross-document navigation. Test both directory and `index.html` URLs.

Then run the browser checks listed at the end of the "Accessibility
compatibility" section of `AGENTS.md`.
