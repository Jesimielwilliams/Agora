# Published snapshot

`agora.json` is **generated, not edited**. It is written by:

```bash
cd backend && npm run publish
```

which reads the published records out of Postgres and emits them in the shape
`AGORA_DATA` already has. `js/data-loader.js` fetches it at boot.

The file is absent until you run that, and that is fine — the site falls back to
the bundled dataset in `js/data.js` and renders normally. Check
`window.AGORA_DATA_SOURCE` in the console to see which one is live.

Do not commit `agora.json`; publish it as part of deployment so the CDN copy is
always the one the database produced.
