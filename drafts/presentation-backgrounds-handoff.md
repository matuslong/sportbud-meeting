# Sportbud Meeting presentation backgrounds handoff

Date: 2026-08-17

## Current direction

The approved first iteration is the **core quiz** background set:

- `intro`
- `general`
- `quiz-topic`
- `quiz-question`
- `quiz-question-bonus`
- `quiz-answer`
- `round-standings`

Design direction stays aligned with `DESIGN_HANDOFF.md`: **Web-Native Quiz System + Stadium Scoreboard**. The slides should feel connected to the new Sportbud web, but still use the original brand codes: dark blue, sky blue, red, messy white, turquoise, and the Sportbud shape assets.

## Working files

- Preview/mockup: `drafts/presentation-backgrounds-core.html`
- Export script: `scripts/export-presentation-backgrounds.ps1`
- Export target: `drafts/presentation-backgrounds/`

The HTML file includes placeholder text only for approval. The export script opens the same HTML in export mode and hides all text/content overlays, producing clean PNG backgrounds.

## Asset rules

- Use `assets/brand/logo/meeting_logo_inverted.png` only in the preview layer unless a slide is intentionally approved with baked-in logo.
- Use shape assets from `assets/brand/shape assets/` as the main brand gesture.
- Keep all generated content outside the PNG background:
  - quiz questions and answers
  - topic and round names
  - standings table data
  - Riskuj links and timer videos
  - any Apps Script template markers

## Color and typography

- Main background: `#06091a`
- Surface: `#0a0f2e`
- Card surface: `#0d1640`
- Brand blue: `#041562`
- Sky blue: `#11468f`
- Competitive red: `#ad0000`
- Red text accent: `#e03535`
- Text: `#eeeeee`
- Bonus/live accent: `#00ffe7`
- Heading font: Be Vietnam Pro Black or ExtraBold
- Body font: Nunito Sans

## Slide notes

- `intro`: strongest brand image, large directional shape system, broad center-left safe area for title content.
- `general`: calm rules/content page with subtle shape treatment and a large readable content zone.
- `quiz-topic`: high-impact topic divider, strong shape framing, central title safe zone.
- `quiz-question`: question-safe zone in the center, Sportbud logo/watermark idea kept subtle and preferably as native overlay later.
- `quiz-question-bonus`: same structure as normal question, but with turquoise/red signal treatment for the bonus point.
- `quiz-answer`: answer reveal background, darker and more focused, native answer text stays editable.
- `round-standings`: scoreboard/data-heavy background with room for 14 teams and points columns.

## Export

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-presentation-backgrounds.ps1
```

Optional high resolution:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-presentation-backgrounds.ps1 -Width 3840 -Height 2160
```

Expected files:

- `drafts/presentation-backgrounds/intro.png`
- `drafts/presentation-backgrounds/general.png`
- `drafts/presentation-backgrounds/quiz-topic.png`
- `drafts/presentation-backgrounds/quiz-question.png`
- `drafts/presentation-backgrounds/quiz-question-bonus.png`
- `drafts/presentation-backgrounds/quiz-answer.png`
- `drafts/presentation-backgrounds/round-standings.png`

## Next typologies

After core approval, continue with:

- promo slide general
- answer-break slide
- 11teamsports topic slide
- Stern beer bonus slide
- Riskuj menu
- Riskuj question
- Riskuj answer

Riskuj backgrounds must reserve native video/timer space and clickable back/menu controls.

## Update 2026-08-17 - core batch finalized

- HTML preview was tuned after review feedback.
- PNG backgrounds were exported at `1920 x 1080` into `drafts/presentation-backgrounds/`.
- The bottom red footer line is a static brand/footer accent, not a progress indicator.
- The footer line was raised to create more spacing above the slogan.
- Sportbud favicon/watermark was removed from question and answer backgrounds; add any logo/favicon directly in Google Slides so it stays editable.
- Slogan `Sdílíme tvou sportovní vášeň` is shown as a preview placeholder in HTML, but final generated text should stay native in Google Slides.
- `intro` now uses a larger logo and less text in preview.
- `general` has a larger content area for longer rules or more bullets.
- `quiz-question` and `quiz-question-bonus` include larger safe zones, visible question number, and topic label in preview.
- `quiz-answer` no longer has the X icon; it has preview placeholders for question number, topic/question text, main answer, and a large image-safe area.

## Next implementation notes

- Continue next with promo, answer-break, 11teamsports, Stern beer bonus, and Riskuj slide typologies.
- Riskuj backgrounds must reserve native video/timer space and clickable back/menu controls.
- Keep logos, partner logos, favicons, quiz text, answers, standings values, and template markers as native Google Slides objects unless the user explicitly approves baking them into a background.
- Use `drafts/presentation-backgrounds-core.html` as the current visual source of truth for the approved core system.
- Before any future PNG export, confirm whether visible preview text should remain preview-only and hidden in export mode.
