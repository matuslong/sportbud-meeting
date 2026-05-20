# Sportbud Meeting — Pub Quiz Slide Generator

Google Apps Script utility that generates pub quiz presentations in Google Slides from structured data in a Google Sheet.

## How it works

1. Fill in quiz data in the Google Sheet (rounds → topics → questions)
2. Open the sheet and use the **Quiz Tools** menu
3. Choose **Generate Presentation** to create a new Google Slides deck
4. Optionally use **Refresh Standings Slides** to update leaderboard tables in an existing presentation without regenerating from scratch

## Project structure

| File | Purpose |
|------|---------|
| `Main.js` | Entry point, menu definition |
| `Config.js` | Template IDs, column mappings, quiz config; stores last presentation ID |
| `Parser.js` | Data validation and parsing from Sheets |
| `SlidesService.js` | Presentation generation, slide manipulation, standings refresh |

> `.gs` files are local source mirrors — excluded from clasp pushes via `.claspignore`. Only `.js` files are deployed to Apps Script.

## Reference materials

- `assets/brand/` contains Sportbud brand source materials used for future presentation and product expansion.
- `assets/brand/brand-colors.md` is the canonical reference for Sportbud brand colors.
- `assets/others/current_web/` contains screenshots of the current web for visual and UX reference.
- `assets/others/timers/` contains timer video assets for Riskuj flows.
- `documentation/` contains supporting product and brand documents:
  - `BRAND FOUNDATION.docx`
  - `FUTURE VISION & PRODUCT EXPANSION.docx`
  - `WEB & PRODUCT DOCUMENTATION.docx`

## Setup & deploy

```bash
npm install
npx clasp login       # first time only
npx clasp push        # deploy to Google Apps Script
```

Or use the npm script:

```bash
npm run clasp:push
```

## Data structure

```
Rounds
  └─ Topics (2 per round)
       └─ Questions (4 per topic + bonus question)
```

## Features

- Full presentation generation from Sheet data
- Per-round promo slides
- Beer bonus slides
- Riskuj presentation generation
- Refresh Standings Slides — updates leaderboard tables in an existing presentation; state persisted to hidden `__sportbud_meta` sheet

## Standings refresh behavior

- The generator stores the last generated presentation ID and the standings slide bindings in the hidden `__sportbud_meta` sheet.
- `Refresh Standings Slides` updates only the stored standings slides. It does not regenerate the full deck.
- Standings slides can be implemented either with text placeholders or with a rendered table layout in the template.
- Refresh first tries to use stored bindings, then self-heals them from standings tokens or from a rendered standings table if needed.
- This keeps refresh working even after the placeholders on the slide have already been replaced with real values.
- Current standings mapping expects:
  - data sheet `Aktuální kolo`
  - 14 teams maximum
  - round-point columns `1. kolo` to `4. kolo`
  - total-points column `Celkově`
