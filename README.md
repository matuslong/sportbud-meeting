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
2. V Slides sablone priprav 1 round block pre kazde kolo, ktore chces generovat.
3. Kazdy round block musi obsahovat:
   - 2x topic slide s markerom `{{QUIZ_TOPIC_SLIDE}}`
   - 9x question slide s markerom `{{QUIZ_QUESTION_SLIDE}}`
   - 0 alebo viac statickych promo slidov bez markerov
   - 9x answer slide s markerom `{{QUIZ_ANSWER_SLIDE}}`
4. Poradie v kazdom round bloku musi byt presne:
   - tema 1
   - otazky 1-4
   - tema 2
   - otazky 5-8
   - bonus otazka
   - lubovolny pocet statickych promo slidov
   - odpovede 1-8 + bonus odpoved
5. Pocet round blokov v Slides sablone musi byt rovnaky ako pocet kol v zdrojovom sheete.
6. Na tychto slidoch pouzi textove placeholdery podla potreby:
   - `{{ROUND_TITLE}}`
   - `{{TOPIC_TITLE}}`
   - `{{QUESTION_NUMBER}}`
   - `{{QUESTION_LABEL}}`
   - `{{QUESTION_TEXT}}`
   - `{{ANSWER_LABEL}}`
   - `{{ANSWER_TEXT}}`
7. Skript pri generovani skopiruje kazdy round block pre zodpovedajuce kolo, naplni ho textami a povodne template bloky z vyslednej prezentacie odstrani.
8. Staticke slidy pred prvym round blockom a po poslednom round blocku ostanu zachovane.

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
