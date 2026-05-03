---
name: publish-post
description: Remove draft: true from a post's frontmatter to mark it ready for publication
disable-model-invocation: true
---

Given a post title or directory name, find the corresponding index.qmd under posts/ and remove the `draft: true` line from its frontmatter.

If the post cannot be found, list the available post directories and ask the user to clarify.

After removing the draft flag, remind the user to:
1. Run `quarto render` to include the post in `_site/`
2. Commit `_site/`, `_freeze/`, and the updated `index.qmd` together before pushing
