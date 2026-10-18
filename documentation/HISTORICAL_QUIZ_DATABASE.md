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
vyhľadávacie kľúčové slová. Jednorazová AI klasifikácia prebieha cez auditovaný Batch import; web ani
redakčné vyhľadávanie AI nevolajú.

Editor je dostupný v Sanity Studio ako `Databáza otázok` (`/studio/quiz-bank`). Prihlasuje sa cez
Supabase magic link a prístup má iba e-mail uvedený v tabuľke `quiz_admins`. Vyhľadávanie zabezpečuje
funkcia `search_quiz_bank(...)` cez uložené štítky, full-text a trigram podobnosť.

## Stav klasifikácie (18. 10. 2026)

Prvých 140 otázok oštítkoval Codex. Zvyšok štítkuje autonómne Claude Sonnet 5.5 cez
`npm run quiz:classify:claude` v `sportbud-web` (headless `claude -p` bez nástrojov, bez API kľúča a bez
potreby schvaľovania). Checkpoint je databáza; pri vyčerpaní limitu runner sám počká a pokračuje.
Podrobnosti sú v `QUIZ_QUESTION_BANK.md`.

## Pôvodný plán

Zvolený postup nevyžaduje OpenAI API key. Codex načíta všetkých 1 990 kanonických otázok zo Supabase
po ohraničených dávkach, priamo ich klasifikuje podľa riadenej taxonómie a priebežne zapíše výsledky
späť. Jednoznačné výsledky dostanú stav `approved`, neisté alebo konfliktné výsledky `needs_review`.
Manuálne upravené záznamy sa nesmú automaticky prepísať.

Po spracovaní treba zosúladiť počty klasifikovaných, chybných a preskočených otázok s celkovým počtom
1 990, skontrolovať reprezentatívnu vzorku v Sanity Studio a povoliť produkčnú aj localhost redirect
URL pre Supabase magic-link prihlásenie. Batch skript zostáva iba ako voliteľná záložná cesta.
