# Sportbud Meeting

Google Apps Script MVP na generovanie Google Slides prezentacie pre sportovy pub kviz zo zdrojoveho Google Sheetu.

## Subory
- `Main.gs` - menu, spustenie, orchestracia
- `Config.gs` - konstanty a pravidla
- `Parser.gs` - citanie a validacia dat zo Sheetu
- `SlidesService.gs` - tvorba Slides + presun do rovnakeho priecinka ako Sheet

## Datovy format v sheete
- Stlpec A: cislo otazky (`1`, `2`, ...) alebo `B` pre bonus
- Stlpec B: nazov temy (hlavicka) alebo text otazky
- Stlpec C: odpoved
- Kazda tema ma 4 otazky
- 2 temy + 1 bonus = 1 kolo
- Prazdne riadky sa ignoruju

## Ako to pouzit (jednoducho)
1. Otvor svoj Google Sheet.
2. Extensions -> Apps Script.
3. Vytvor subory `Config.gs`, `Main.gs`, `Parser.gs`, `SlidesService.gs` a vloz obsah.
4. Uloz projekt a obnov Sheet.
5. V menu klikni `Quiz Tools -> Generate Presentation`.

Skript vzdy vytvori novu prezentaciu a pokusi sa ju vlozit do rovnakeho Google Drive priecinka ako zdrojovy Sheet.
