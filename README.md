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
