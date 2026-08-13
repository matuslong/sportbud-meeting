# Sportbud Meeting design handoff

Date: 2026-08-13

## Where we stopped

The current design direction is **Web-Native Quiz System + Stadium Scoreboard**.

The new Sportbud web is the primary visual reference. Older quiz presentations, scorecards, logos, brand docs, and assets are secondary historical context. The goal is not a new brand from scratch, but a unified visual update so pub quiz slides, scorecards, web, and future campaign assets feel like one system.

## Completed outputs

- `design-audit-summary.md`
  - Audit of the available brand/web/quiz materials.
  - Summary of what works, what is outdated, and where the visual system diverges.
  - Three proposed design directions.
  - Recommended direction: **Web-Native Quiz System**, with **Stadium Scoreboard** for data-heavy scorecards and standings.

- `drafts/scorecard-web-native.html`
  - Static A4 scorecard draft.
  - Can be opened directly in a browser.
  - Uses the web's dark UI language, Sportbud colors, local brand fonts, and local meeting logo.
  - Intended as a visual draft/reference, not final production artwork.

- `drafts/canva-scorecard-build-spec.md`
  - Concrete Canva handoff spec for rebuilding the scorecard manually or later through Canva MCP.
  - Includes page format, colors, fonts, object hierarchy, and slide variant guidance.

- `drafts/reference-scorecard.png`
  - Copy of the existing legacy scorecard from the OneDrive path provided by the user.
  - Kept as a local reference for the next design pass.

## How to view the current draft

Open:

```powershell
Start-Process "C:\dev\sportbud-meeting\drafts\scorecard-web-native.html"
```

Or double-click:

```text
C:\dev\sportbud-meeting\drafts\scorecard-web-native.html
```

For PDF preview/export from the browser:

- Press `Ctrl+P`
- Destination: `Save as PDF`
- Paper: `A4`
- Margins: `None` or `Minimum`
- Enable background graphics

## Important constraints and limitations

- Canva MCP server `mcp.canva.com` was not available in this Codex session.
- Because of that, no actual Canva design was created.
- Local image rendering failed in the Codex image viewer, including for the copied scorecard PNG. The file exists and is committed as reference, but it still needs a manual visual check.
- The current HTML draft uses the recommended new web direction, but it has not yet been visually QA'd in a rendered browser screenshot from this session.
- Existing untracked file `documentation/ADMIN GUIDE.docx` was already present before this design work and is intentionally not part of this commit.

## Design baseline to keep

- Primary background: `#06091a`
- Surfaces: `#0a0f2e`, `#0d1640`
- Brand blue: `#041562`
- Sky blue: `#11468f`
- Red accent: `#ad0000`, text red `#e03535`
- Text: `#eeeeee`
- Special/CTA/bonus accent: `#00ffe7`
- Heading font: Be Vietnam Pro, preferably ExtraBold or Black
- Body/table font: Nunito Sans
- Style: dark sports UI, compact cards, thin low-opacity borders, red competitive accents, turquoise used sparingly

## Recommended next steps

1. Manually open `drafts/scorecard-web-native.html` and check whether the dark scorecard is practical for printing.
2. Compare it against `drafts/reference-scorecard.png`.
3. Decide whether the production scorecard should be:
   - dark premium/event version,
   - light ink-friendly print version,
   - or both.
4. If Canva MCP becomes available, recreate the approved direction in Canva using `drafts/canva-scorecard-build-spec.md`.
5. If Canva MCP is still unavailable, rebuild the Canva draft manually from the spec.
6. After scorecard approval, apply the same system to the Google Slides template:
   - title/intro slides,
   - question slides,
   - answer slides,
   - standings slides,
   - Riskuj menu/question/answer slides.
7. After the visual system is approved, update the Apps Script generator only if slide placeholders, template structure, or standings layout IDs change.

## Open decisions for the next session

- Should the first finalized artifact be the scorecard or a presentation slide?
- Should the scorecard prioritize dark brand impact or print economy?
- Should we keep A4 portrait, or create both A4 and A5/table-friendly versions?
- Should the next pass include a light print variant?
- Should the presentation template be redesigned directly in Google Slides, in Canva, or first as local HTML mockups?
