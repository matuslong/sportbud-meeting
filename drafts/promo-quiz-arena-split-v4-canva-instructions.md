# Canva manual build - Sportbud Meeting promo V4

## Co je pripravene

PNG vrstvy su transparentne overlaye bez fotky, textu, loga a boxov:

- `drafts/promo-quiz-arena-split-v4/fb-rubin-overlay.png`
- `drafts/promo-quiz-arena-split-v4/fb-arena-overlay.png`
- `drafts/promo-quiz-arena-split-v4/ig-brno-overlay.png`

V Canve bude poradie vrstiev:

1. Fotka eventu - editovatelna a vymenitelna.
2. Transparentny overlay PNG - zamknuty.
3. Editovatelne Canva boxy.
4. Editovatelne texty.
5. Logo a CTA prvky.

## FB event cover setup

1. V Canve vytvor novy design `Custom size`.
2. Nastav rozmery `1920 x 1005 px`.
3. Nahraj fotku eventu.
4. Vloz fotku na celu plochu.
5. Cropni fotku tak, aby ludia a atmosfera boli v strede alebo mierne vlavo. Boky sa mozu stratit v mobile.
6. Nahraj a vloz `fb-rubin-overlay.png` alebo `fb-arena-overlay.png`.
7. Natiahni overlay na celu plochu `1920 x 1005`.
8. Zamkni fotku aj overlay.

Safe zone pre FB:

- Centralna bezpecna sirka: od `x 360` po `x 1560`.
- Kriticky text, logo, datum a CTA drz v tejto zone.
- Spodnych cca `260 px` nechaj bez kritickych informacii.

## FB editovatelne prvky

Logo:

- Subor: `assets/brand/logo/meeting_logo_inverted.png`.
- Pozicia: `x 388`, `y 80`.
- Sirka: `220 px`.

Pill:

- Text: `Novy tym poprve zdarma`.
- Pozicia: `x 1120`, `y 80`.
- Velkost: cca `330 x 42 px`.
- Tvar: rounded pill.
- Fill: `#00ffe7` s opacity `12-18 %`, alebo tmavy fill s tyrkys borderom.
- Border: `#00ffe7`, opacity `35 %`.
- Text: `#00ffe7`, Nunito Sans Bold, `24-28 px`, uppercase.

Headline blok:

- Pozicia: `x 388`, `y 240`.
- Sirka: cca `600 px`.
- Eyebrow: `Sportovni pub kviz v Brne`.
- Eyebrow font: Nunito Sans Bold, `30-34 px`, `#e03535`.
- Headline: `Fotbalovy special`.
- Headline font: Be Vietnam Pro Black, `78-88 px`, `#eeeeee`.
- Lead: `Sloz tym 3-8 hracu a prijdi zazit sport mimo stadion.`
- Lead font: Nunito Sans Bold, `32-38 px`, `#eeeeee`, opacity cca `80 %`.

Event panel:

- Pozicia: `x 1025`, `y 196`.
- Velkost: cca `530 x 535 px`.
- Radius: `18 px`.
- Fill: `#0d1640`, opacity `88-94 %`.
- Border: `#eeeeee`, opacity `10-12 %`.
- Lava cervena linka: samostatny obdlznik `5 x 535 px`, farba `#ad0000`, zarovnat na lavy okraj panelu.

Text v paneli:

- Padding panelu: cca `36 px`.
- Label: `Facebook event`, Nunito Sans Bold, `22-24 px`, `#e03535`, uppercase.
- Venue: `Rubin` alebo `Arena`, Be Vietnam Pro Black, `58-64 px`, `#eeeeee`.
- Riadky:
  - `Datum` + `Dopln datum`
  - `Start` + `19:00`
  - `Misto` + `Brno`
- Label riadkov: Nunito Sans Bold, `20-22 px`, `#eeeeee`, opacity `52 %`, uppercase.
- Hodnoty: Be Vietnam Pro ExtraBold, `30-34 px`, `#eeeeee`.
- Medzi riadkami pouzi linku `#eeeeee`, opacity `9-10 %`.

CTA a web:

- CTA text: `Rezervuj misto`.
- CTA pozicia v paneli dole vlavo.
- CTA fill: `#00ffe7`.
- CTA text: `#041562`, Nunito Sans Bold, `22-24 px`, uppercase.
- Web: `sportbud.cz`, Nunito Sans Bold, `22-24 px`, `#eeeeee`, opacity `72 %`.

Proof copy:

- Pozicia: `x 388`, `y 785`.
- Sirka: cca `760 px`.
- Text: `Prvni kviz je pro nove tymy zdarma. Prijd si to vyzkouset bez zavazku.`
- Font: Nunito Sans Bold, `24-28 px`, `#eeeeee`, opacity `72 %`.
- Vlavo pridaj cervenu linku `46 x 4 px`, farba `#ad0000`.
- Ak FB nahlad prekryva spodok, proof copy kludne vypni.

## Instagram setup

1. Vytvor design `1080 x 1350 px`.
2. Vloz fotku na celu plochu.
3. Cropni tak, aby hlavna atmosfera bola v hornej polovici.
4. Vloz `ig-brno-overlay.png` na celu plochu.
5. Zamkni fotku a overlay.

IG prvky:

- Logo: `x 76`, `y 70`, sirka `235 px`.
- Pill: vpravo hore, text `Poprve zdarma`.
- Copy blok: `x 76`, `y 486`, sirka cca `780 px`.
- Headline: `Fotbalovy special`, Be Vietnam Pro Black, `86-96 px`.
- Lead: `Vyber misto, sloz tym a prijdi si zahrat.`, Nunito Sans Bold, `30-34 px`.
- Event panel: `x 76`, `y 830`, velkost cca `928 x 445 px`.
- Panel ma rovnaky styl ako FB, len cervena linka je hore ako `928 x 5 px`.

IG venue cards:

- V paneli vytvor 2 karty vedla seba.
- Kazda karta cca `430 x 166 px`.
- Fill: biela s opacity `4-5 %`.
- Border: `#eeeeee`, opacity `12 %`.
- Radius: `14 px`.
- Karta 1: `Rubin`, `Dopln datum`, `19:00`.
- Karta 2: `Arena`, `Dopln datum`, `19:00`.

## Efektivny Canva workflow

1. Vytvor najprv FB Rubín ako master.
2. Po doladeni layoutu duplikuj stránku.
3. V duplikáte zmeň iba overlay `fb-arena-overlay.png`, venue a prípadne lead.
4. Z FB masteru nekopíruj priamo IG layout; IG má inú kompozíciu. Vytvor IG podľa rozmerov vyššie.
5. Zoskup texty v paneli, ale nezoskupuj ich s overlay PNG.
6. Zamkni len fotku a overlay, aby sa pri úpravách neposúvali.
7. Pri každej novej fotke najprv skontroluj čitateľnosť headline a panelu na 25 % zoome.
8. Exportuj z Canvy ako PNG, pre FB event použi `1920 x 1005`.

## Co nedavat do PNG

- Fotku.
- Logo.
- Texty.
- Event panel.
- CTA.
- Venue/date boxy.

PNG overlay sluzi len na jednotne stmavenie fotky a brand atmosferu.
