# Canva build spec - Sportbud Meeting scorecard

This spec translates the approved **Web-Native Quiz System + Stadium Scoreboard** direction into a concrete Canva layout. Canva MCP is not available in this session, so this is the implementation-ready handoff for manual Canva work or a later MCP run.

## Document

- Format: A4 portrait
- Size: 210 x 297 mm
- Export target: PDF Print
- Safe margin: 10 mm
- Working grid: 2 columns for quiz rounds, 14 px / 3.7 mm inner gaps

## Assets

- Logo: `assets/brand/logo/meeting_logo_inverted.png`
- Heading font: Be Vietnam Pro Black or ExtraBold
- Body/table font: Nunito Sans Regular, SemiBold, Bold
- Optional decorative shapes: use simple chevron blocks based on the web homepage treatment, not heavy legacy decoration

## Color Tokens

| Role | Hex |
| --- | --- |
| Page background | `#06091a` |
| Surface | `#0a0f2e` |
| Card surface | `#0d1640` |
| Brand blue | `#041562` |
| Sky blue | `#11468f` |
| Competitive red | `#ad0000` |
| Red text accent | `#e03535` |
| Text | `#eeeeee` |
| CTA / live / bonus accent | `#00ffe7` |
| Thin borders | white at 5-10% opacity |

## Object Hierarchy

1. Background rectangle
   - Fill `#06091a`
   - Add subtle navy-to-red diagonal gradient if available; otherwise use a large transparent navy shape on the left and transparent red chevron on the right.

2. Header
   - Place meeting logo top-left, width about 58-62 mm.
   - Add uppercase label `SPORTBUD MEETING`, Nunito Sans Bold, 10-11 pt, red `#e03535`, letter spacing wide.
   - Add title `Scorecard`, Be Vietnam Pro Black, 38-44 pt, off-white.
   - Add short line: `Sportovni pub kviz pro fanousky, kteri chteji sport zazivat i mimo stadion.`

3. Event meta card
   - Top-right card, width about 48-52 mm.
   - Fill `#0d1640`, border white 5-10%, left border `#ad0000`.
   - Text: `SEZONA 2026/2027`, `1. KOLO`, venue/date.

4. Team and total row
   - Left wide card: `Nazev tymu` with write line.
   - Right compact total card: `Celkem` and `__/40`.
   - Total card uses red tint over `#0d1640`.

5. Quiz rounds
   - Four rounded cards in a 2x2 grid.
   - Each card has a dark header strip, round title, and small red score pill `__/8`.
   - Each card contains 8 cells in a 2x4 grid.
   - Cell label format: `OTAZKA 1`, `1 BOD`; leave a write/check line.

6. Bonus row
   - Two bonus cards with turquoise border/tint:
     - `Bonusovy tip`
     - `Pivni bonus`
   - One compact activity card:
     - `1. misto +3`
     - `2. misto +2`
     - `3. misto +1`

7. Footer
   - Thin top border, white 5-10% opacity.
   - Left: `Sdilime tvou sportovni vasen` in red.
   - Right: `sportbud.cz · @sportbud_cz`.

## Presentation Slide Variant

If the first Canva draft should be a slide instead of a scorecard:

- Format: 16:9 presentation
- Background: `#06091a`
- Top-left label: `1. KOLO` in red uppercase
- Main title/question: Be Vietnam Pro Black, off-white
- Content card: `#0d1640`, white 5% border, radius 16-20 px
- Question number or topic accent: red pill
- Bonus/live/timer accent only: turquoise
- Logo: bottom-right or top-left depending on slide type

## Notes

- Keep the new web as the visual authority.
- Use the legacy palette and quiz mechanics as continuity, not as the dominant look.
- Avoid overusing turquoise; it should stay special.
- Avoid large white page backgrounds unless a print-cost variant is explicitly needed.
