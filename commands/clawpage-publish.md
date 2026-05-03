---
description: Publish a single-file HTML page to clawpage.ai and return its public URL.
---

Run the `create-page` skill to convert the current response / topic into a hosted clawpage page. Default policy is private + 3h TTL with a generated pagecode unless the user explicitly opts public/permanent. Output must include `publicUrl`, `rootUrl`, and `accessUrl`.

If the user mentions an existing `pageId` or wants to revise an existing page, fall through to the `update-page` skill instead.
