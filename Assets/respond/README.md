# Support hub illustrations

Drop a file here and it replaces the placeholder frame in the matching column
of the "Respond to Incident" page. No code change needed.

| File         | Column                                  |
| ------------ | --------------------------------------- |
| `urgent.svg` | Need help? Call a hotline               |
| `legal.svg`  | Get legal aid                           |
| `care.svg`   | Get trauma and safety counseling        |
| `fund.svg`   | Donate to a legal fund                  |

- The frame is 4:3; artwork is cropped to fill, so keep the subject centred.
- SVG is expected. To use a raster file instead, change the `src` extension on
  that column's `<img>` in `Index.html`.
- Until a file exists the frame shows an "Illustration" placeholder, so the
  layout never collapses.
