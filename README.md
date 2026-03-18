# Sportbud Meeting

Google Apps Script na naplnenie Google Slides prezentacie zo zdrojoveho Google Sheetu pomocou pripravenej Slides sablony.

## Subory
- `Main.gs` - menu, spustenie, orchestracia
- `Config.gs` - konstanty, template ID, marker tokeny
- `Parser.gs` - citanie a validacia dat zo Sheetu
- `SlidesService.gs` - kopia Slides sablony a nahradenie placeholderov
- `appsscript.json` - Apps Script manifest pre `clasp`

## Datovy format v sheete
- Stlpec A: cislo otazky (`1`, `2`, ...) alebo `B` pre bonus
- Stlpec B: nazov temy (hlavicka) alebo text otazky
- Stlpec C: odpoved
- Kazda tema ma 4 otazky
- 2 temy + 1 bonus = 1 kolo
- Prazdne riadky sa ignoruju

## Konfiguracia sablony
1. Do `Config.gs` nastav `TEMPLATE_PRESENTATION_ID` na ID tvojej master Google Slides sablony.
2. V Slides sablone priprav presne 3 vzorove slidy:
   - 1x topic slide s markerom `{{QUIZ_TOPIC_SLIDE}}`
   - 1x question slide s markerom `{{QUIZ_QUESTION_SLIDE}}`
   - 1x answer slide s markerom `{{QUIZ_ANSWER_SLIDE}}`
3. Na tychto vzorovych slidoch pouzi textove placeholdery podla potreby:
   - `{{ROUND_TITLE}}`
   - `{{TOPIC_TITLE}}`
   - `{{QUESTION_NUMBER}}`
   - `{{QUESTION_LABEL}}`
   - `{{QUESTION_TEXT}}`
   - `{{ANSWER_LABEL}}`
   - `{{ANSWER_TEXT}}`
4. Skript tieto 3 vzorove slidy pri generovani skopiruje podla potreby, naplni ich textami a povodne template slidy z vyslednej prezentacie odstrani.
5. Vzorove slidy odporucane drz pohromade na mieste, kde sa ma v prezentacii zacat generovany blok. Staticke a komercne slidy mimo tohto bloku ostanu zachovane.

## Clasp workflow
`clasp` je bezplatne CLI pre Google Apps Script. V tomto repozitari je uz nastavene lokalne cez `npm`.

1. Prihlas sa do Google uctu:
   - `npm run clasp:login`
2. V Apps Script editore otvor `Project Settings` a skopiruj `Script ID`.
3. V repozitari vytvor lokalny `.clasp.json`:
   - `npm run clasp:setup -- PASTE_SCRIPT_ID_HERE`
4. Skontroluj spojenie:
   - `npm run clasp:status`
5. Nahraj lokalne subory do Apps Script projektu:
   - `npx clasp push -f`
6. Ak si chces otvorit Apps Script projekt v browseri:
   - `npm run clasp:open`

Poznamky:
- `.clasp.json` a `.clasprc.json` su ignorovane v gite, aby sa necommitovali lokalne prihlasenia a ID projektu.
- Ak ide o container-bound script pripojeny k Google Sheetu, `Script ID` najdes stale v Apps Script projekte, nie v URL sheetu.
- `clasp` v tomto repozitari pushuje `.js` subory do Apps Script projektu. `.gs` subory ostavaju lokalny zdroj pravdy a pred pushom ich treba zosuladit.

## Pouzitie
Po `clasp push` otvor prislusny Google Sheet a spusti `Quiz Tools -> Generate Presentation`.

Skript vzdy vytvori kopiu master sablony, zo 3 vzorovych slidov vygeneruje potrebny pocet tematickych, otazkovych a odpovedovych slidov a vyslednu prezentaciu presunie do rovnakeho Google Drive priecinka ako zdrojovy Sheet.
