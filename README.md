# Vice Cover Studio

A GTA-style cover maker that turns your photos and a caption into a
multi-panel poster, exported as a PNG to share. Built by an AI agent for
make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

- **Any photo:** add your own images (file picker or drag-and-drop) or use the
  three built-in procedural sample scenes. Click a panel on the canvas, then
  drag to move its photo and scroll to zoom; click a numbered photo slot to
  put that photo in the selected panel.
- **Layouts:** Solo, Duo, Trio and Quad panel arrangements with white gutters.
- **Words:** a bold condensed caption with a sunset gradient fill and a
  letterspaced sub-caption, both editable.
- **Look:** four colour grades (Sunset, Neon, Golden, Noir), procedural sun,
  birds and palm silhouettes, and an optional poster frame.
- **Fast and easy:** pick a layout, type a caption, export a PNG in
  1080 × 1080, 1080 × 1350 or 1920 × 1080 with one click.

## Run it

The app is plain static files under `app/` — no build step, no network
requests. Serve it and open `app/index.html`:

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored `vendor/makefun-app.ts` library.

## Credits

- Fonts: Noto Sans Condensed Black and Bold, copyright Google, licensed under
  the SIL Open Font License 1.1 (see the license in the font files).
- Sample photos (`app/samples/`): procedural art drawn with PIL for this app —
  no real people, no game artwork.
- No Rockstar Games logo, artwork, character or font is used anywhere.
