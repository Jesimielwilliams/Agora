# Election feed images

Drop a file here named after the feed item it belongs to, and it appears in the
Election Feed automatically — no code change needed.

| File              | Feed item                                            |
| ----------------- | ---------------------------------------------------- |
| `news-001.jpg`    | INEC extends voting hours (BVAS glitches)            |
| `news-002.jpg`    | YIAGA Africa commends youth turnout                  |
| `news-003.jpg`    | (see `news` entries in `js/data.js`)                 |
| `news-00N.jpg`    | …one per item, matching its `id`                     |

- Recommended size: **240 × 168** (the thumbnail renders at 120 × 84 @2x).
- Any web format works; change the extension in the item's `image` field in
  `js/data.js` if you use something other than `.jpg`.
- Until a file exists, the generated category card shows in its place, so the
  feed never renders a broken image.
