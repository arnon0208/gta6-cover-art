[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/arnon0208/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/arnon0208/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

Vice Cover Studio turns your photos and a caption into a GTA-style multi-panel poster — sunset and neon colour grades, four panel layouts, drag to crop each photo, and a one-click PNG export in 1080 × 1080, 1080 × 1350 or 1920 × 1080. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

Enter the bounty: https://make.fun/bounty/gta6-cover-art-01

## How it works

1. Add up to 4 photos (file picker or drag-drop) — or start from the 3 built-in sample scenes.
2. Pick a layout: Solo, Duo, Trio or Quad. Click a panel to make it active, drag to pan its photo, scroll to zoom.
3. Write the title and sub-caption, pick a colour grade (Sunset, Neon, Golden, Noir) and an export size.
4. Hit **Export PNG** — the cover downloads at the exact post size.

Everything runs offline in the browser: the app is static files under `app/`, no network requests, no uploads. Photos never leave your machine.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Referral

Made with make.fun — try it with referral code `sgangr8c`: https://make.fun/r/sgangr8c

## License

MIT. The vendored fonts (Noto Sans Condensed Black and Bold) are under the SIL Open Font License.
