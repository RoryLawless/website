---
name: new-post
description: Scaffold a new blog post directory with correct kebab-case naming and frontmatter
disable-model-invocation: true
---

Create a new post at posts/<kebab-case-title>/index.qmd.

Directory name: convert the title argument to lowercase kebab-case (spaces and punctuation become hyphens, strip leading/trailing hyphens).

Frontmatter template:
```
---
title: "<title>"
date: <today ISO 8601>
draft: true
---
```

Do not add categories, tags, description, or any other frontmatter — the post inherits defaults from posts/_metadata.yml (freeze: auto, date-format: iso).

Do not create any other files in the directory.

After creating the file, remind the user that they will need to run `quarto render` before committing.
