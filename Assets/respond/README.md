# Support hub illustrations

The four images for the "Respond to Incident" page currently live one level up,
in `Assets/` itself:

| File                     | Column                            |
| ------------------------ | --------------------------------- |
| `../Hotline.png`         | Need help? Call a hotline         |
| `../Legal.png`           | Get legal aid                     |
| `../Counseling.png`      | Get trauma and safety counseling  |
| `../Donate.png`          | Donate to a legal fund            |

To swap one out, replace the file and keep the name — `index.html` references
them by exact filename, and the deploy server is case-sensitive even though
macOS is not.

Notes on what fits well here:

- The frame is 4:3 and the artwork is **contained**, not cropped, with padding
  around it. Square icons work; so does wider artwork.
- Transparent backgrounds are fine — the frame supplies its own, which follows
  the light/dark theme.
- If a file is missing the frame shows an "Illustration" placeholder rather
  than a broken image, so the layout never collapses.
