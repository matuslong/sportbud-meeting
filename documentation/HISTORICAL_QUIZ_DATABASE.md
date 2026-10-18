# Databáza historických kvízových otázok

Kurátorovaný zdroj je Google Sheet `Sportbud – kontrola historických otázok`, list `Otázky`:

`https://docs.google.com/spreadsheets/d/1VPe8JKMKyCIGypZRZdOZ55W24Qr592KO5Yzndy1a8n8/edit`

List `Kontrola` zostáva iba ako auditná stopa pôvodného rozhodovania. Import ho nepoužíva a netreba ho
mazať.

Produkčná databáza, SQL migrácia, importér a technická dokumentácia sú v prepojenom repozitári:

- `C:\dev\sportbud-web\supabase\migrations\007_quiz_question_bank.sql`
- `C:\dev\sportbud-web\supabase\migrations\008_quiz_taxonomy_and_admin.sql`
- `C:\dev\sportbud-web\scripts\import-quiz-questions.mjs`
- `C:\dev\sportbud-web\scripts\classify-quiz-questions.mjs`
- `C:\dev\sportbud-web\QUIZ_QUESTION_BANK.md`

Do databázy sa importujú stavy `ok`, `approved` a `approved_media_or_visual`. Stav `excluded` zostáva
len v kontrolnom Sheete. Obrázkové poznávačky môžu mať prázdnu slovnú odpoveď, ale musia mať vyplnený
`media_description`.

Obsah otázky je oddelený od záznamu použitia. Rovnaká otázka tak existuje iba raz, pričom sa zachovajú
všetky kolá, dátumy, témy a zdrojové riadky, v ktorých bola použitá.

Nad databázou je nasadená jednoúrovňová športová taxonómia a redakčné metadáta: šport, formát
otázky, časová platnosť, typ subjektu, geografický a genderový kontext, referenčné obdobie a
vyhľadávacie kľúčové slová. Jednorazová AI klasifikácia je auditovaná v `quiz_ai_classification_runs`; web ani redakčné
vyhľadávanie AI nevolajú.

Editor je dostupný v Sanity Studio ako `Databáza otázok` (`/studio/quiz-bank`). Prihlasuje sa cez
Supabase magic link a prístup má iba e-mail uvedený v tabuľke `quiz_admins`. Vyhľadávanie zabezpečuje
funkcia `search_quiz_bank(...)` cez uložené štítky, full-text a trigram podobnosť.

## Stav (18. 10. 2026)

- **Klasifikácia je dokončená:** všetkých 1 990 otázok má štítky (140 Codex, 1 850 Claude Sonnet 5.5 cez
  `npm run quiz:classify:claude` – headless `claude -p` bez nástrojov, bez API kľúča a bez schvaľovania).
  1 536 otázok bolo automaticky schválených, 454 išlo na kontrolu, žiadna otázka nezlyhala ani nie je bez športu.
- **Návrhy ku kontrole:** každá otázka v stave `needs_review` má v `review_hint` verdikt (`ok` / `fix` /
  `unclear`), konkrétne problémové parametre, krátke vysvetlenie a navrhovanú hodnotu
  (`npm run quiz:review-hints`). Studio ich zobrazuje ako farebný box s tlačidlom „Prijať návrh a schváliť“.
- **Pohľad cez témy:** `/studio/quiz-bank` sa otvára na záložke Témy – okamžité filtrovanie 334 tém
  (názov, šport, sezóna, časť kvízu, posledné použitie, na kontrolu / aktuálne / zastarané), časová os
  použití témy a hromadná úprava otázok témy vrátane príznaku „odpoveď zastaraná“
  (`answer_outdated`). Pôvodný zoznam otázok je na záložke Otázky.
- Ručne upravené záznamy (jednotlivo aj hromadne) majú `classification_source = manual` a AI ich neprepíše.
- Migrácie `007`–`011` sú nasadené v Supabase.

## Zostáva

- Prejsť otázky na kontrolu v Studiu (najrýchlejšie po témach).
- V Supabase Auth musia byť povolené redirect URL `https://sportbud.cz/studio/quiz-bank` a
  `http://localhost:3000/studio/quiz-bank`.
- Voliteľne: rozšíriť zoznam športov (curling, korfbal, moderný päťboj, kulturistika…) a dotknuté otázky
  preklasifikovať.

Technické detaily sú v `C:\dev\sportbud-web\QUIZ_QUESTION_BANK.md`.
