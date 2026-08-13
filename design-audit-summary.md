# Sportbud Meeting - design audit summary

## Stav a zdroje

Primarna referencia pre vizualny update ma byt novy web Sportbudu (`www.sportbud.cz`) a lokalny projekt `C:\dev\sportbud-web`. Starsie prezentacie, scorekarty a brand dokumenty treba pouzit ako historicky kontext, nie ako hlavny vizualny smer.

Audit vychadza z tychto dostupnych zdrojov:

- novy web: `app/globals.css`, homepage, `Header`, `EventCard`, `EventSelectCard`, `QuizDemo`, `StandingsPreview`
- meeting projekt: `README.md`, `assets/brand/brand-colors.md`, fonty, loga, shape assety, event fotografie, stare web screenshoty
- dokumentacia: `SPORTBUD BRAND PLAYBOOK.docx`, `BRAND FOUNDATION.docx`, `WEB & PRODUCT DOCUMENTATION.docx`, `FUTURE VISION & PRODUCT EXPANSION.docx`
- Google Slides sablona: `Sportbud Meeting - template`

Canva MCP server `mcp.canva.com` v tejto session nie je dostupny. Lokalny image viewer tiez nedokazal otvorit scorecard z OneDrive cesty ani lokalne screenshoty, preto su konkretne vizualne zavery o scorekarte oznacene ako neoverene a treba ich doplnit po spristupneni suboru alebo Canvy.

## Co dnes funguje

- Brand ma jasnu podstatu: sport patri medzi ludi, Sportbud Meeting je fanusikovsky pub kviz s komunitou, rivalitou, humorom, pivnou/eventovou atmosferou a opakovanym navratom timov.
- Novy web uz dobre preklada tuto identitu do vizualneho systemu: tmavy sportovy UI zaklad, energicke cervene akcenty, tyrkysove CTA, fotky z eventov, kompaktne karty, tabulky a jasne eventove informacie.
- Paleta je stabilna napriec projektmi: `#041562`, `#11468f`, `#ad0000`, `#eeeeee`, `#00ffe7`. Web ju rozsiruje o funkcne tmave plochy `#06091a`, `#0a0f2e`, `#0d1640` a svetle opacity vrstvy.
- Typografia ma uz zmysluplnu hierarchiu: web pouziva Be Vietnam Pro pre nadpisy a Nunito Sans pre telo; starsia Google Slides sablona pouziva Nunito Sans konzistentne a tym dava dobry zaklad pre citatelnost.
- Existujuce presentation flow je funkcne: ma jasne quiz/answer/standings/riskuj slidy, placeholdery pre automatizaciu a jednoduche textove hierarchie.
- Webove komponenty `QuizDemo` a `StandingsPreview` su velmi vhodny most medzi online a offline materialmi: uz obsahuju kvizove bunky, bodovanie, tabulky, red highlight pre vitaza a tmave karty.

## Co je zastarane alebo nekonzistentne

- Starsia slide sablona posobi skor ako technicky funkcna prezentacia nez ako plnohodnotne rozsireni noveho webu. Opiera sa o Nunito Sans, navy/cervenu a fotky, ale chyba jej webova hlbka: tmave surface vrstvy, red/turquoise signalizacia, konzistentne karty a systematicky grid.
- V materialoch sa miesaju dva vizualne rezimy: starsi "navy + cervena + biele pozadie/text" a novy "dark sports UI + event photo + red accent + turquoise CTA". Pre novu sezonu by mal vyhrat druhy rezim.
- Cervena sa pouziva ako hlavny brand akcent, ale nie vzdy ma jasnu rolu. Na webe oznacuje sutaznu energiu, aktivny stav, vitaza a dolezite labely; v prezentaciach by mala mat rovnaku funkciu.
- Tyrkysova je na webe silny CTA/aktivacny signal, ale v starsich kvizovych materialoch prakticky nie je systematicky pouzita. To oslabuje jednotnost online/offline materialov.
- Presentation layouty maju viac full-slide fotografii a velke centrovane texty, no menej modularity. Pre scorekarty a tabulky treba viac strukturovany system, podobny webovym kartam a standings tabulkam.
- Historicke shape assety existuju, ale treba ich pouzivat opatrne. Na webe funguju ako subtilne smerove/posterove vrstvy, nie ako dominantna dekoracia.

## Odporucany zaklad noveho vizualneho systemu

Pouzit novy web ako hlavny design language:

- pozadie: `#06091a`
- sekcne/surface plochy: `#0a0f2e`, `#0d1640`
- primarna znackova modra: `#041562`
- sekundarna modra: `#11468f`
- sutazny akcent: `#ad0000`, svetlejsi textovy akcent `#e03535`
- text: `#eeeeee`, sekundarny text cez opacity 40-70 %
- CTA/highlight: `#00ffe7`
- border: biela s velmi nizkou opacity, typicky 5-10 %
- radius: webovo zaoblene karty a tlacidla, pri tlaci drzat skor stredny radius, aby material neposobil ako screenshot webu
- nadpisy: Be Vietnam Pro 700-900
- telo, tabulky, pravidla: Nunito Sans 400-700

## Smer 1: Web-Native Quiz System

Najsilnejsi a odporucany smer.

Paleta:

- `#06091a` ako hlavne tmave pozadie
- `#0d1640` pre karty, tabulky a odpovedove bloky
- `#ad0000` / `#e03535` pre kolo, aktivny stav, vitaza, dolezite upozornenia
- `#00ffe7` len pre najdolezitejsie CTA, casovac, live/next signal alebo bonusovy moment
- `#eeeeee` pre text, s opacity pre sekundarne informacie

Typografia:

- Be Vietnam Pro ExtraBold/Black pre nazvy kol, temy, velke otazky a vysledkove titulky
- Nunito Sans Regular/SemiBold/Bold pre pravidla, odpovede, tabulky a drobne labely

Layout:

- prezentacia: tmave slidy s webovymi kartami, jasna horna alebo lava hierarchia, mensi uppercase label, hlavny text, spodny meta/footer
- scorekarta: tmavy alebo biely print variant so scoreboard gridom, cervenym lavym akcentom, jasnym polom pre tim a body
- standings: tabulkova logika z webu, vitaz/zvyrazneny riadok cervenym tintom, body v silnej pravostranej typografii

Preco nadvazuje na historiu:

- nechava povodne Sportbud farby a fanusikovsku energiu, ale prenasa ich do aktualneho weboveho systemu
- robi prezentacie, scorekarty a web okamzite rozpoznatelne ako jeden brand
- je najpraktickejsi pre automatizovane Google Slides sablony aj rucne Canva layouty

## Smer 2: Stadium Scoreboard

Data-heavy smer pre scorekarty, vysledky a Riskuj.

Paleta:

- viac `#041562` a `#0d1640` ploch
- cervena pre score, rank, aktivne kolo a vitazny stav
- tyrkysova iba ako maly live/bonus indikacny prvok

Typografia:

- Be Vietnam Pro Black pre cisla, body, ranky a nazvy tem
- Nunito Sans pre popisy, pravidla a pomocne texty

Layout:

- pevne gridy, score bunky, tabulkove bloky, vyrazne numericke stlpce
- menej fotografii, viac sportoveho broadcast/scoreboard pocitu
- vhodne pre scorecards, standings, Riskuj menu a finalove slidy

Preco nadvazuje na historiu:

- posilnuje sutaznu cast Sportbud Meetingu, ktora je v dokumentacii klucova
- nadvazuje na existujuce tabulky a bodovanie, ale robi ich modernejsie a citatelnejsie
- je velmi prakticky pre tlac, ale moze byt menej atmosfericky pri promo/intro slidoch

## Smer 3: Matchday Atmosphere

Najviac eventovy a fotograficky smer.

Paleta:

- foto pozadie s navy/cervenym overlayom
- `#eeeeee` pre velke titulky
- `#e03535` pre sportovy claim alebo nazov segmentu
- `#00ffe7` len ako maly signal alebo CTA

Typografia:

- Be Vietnam Pro ExtraBold/Black pre posterove titulky
- Nunito Sans pre kratke supporting texty

Layout:

- full-bleed event fotografie, gradient overlaye, velke jednoduche hesla
- diagonalne/chevron shape assety iba ako jemne vrstvy podobne homepage
- dobre pre intro, intermission, promo a partner slidy
- menej vhodne pre scorekarty a husty quiz obsah

Preco nadvazuje na historiu:

- zachovava atmosferu pub kvizov a komunitnych eventov
- dobre komunikuje "sport zazivas aj mimo stadion"
- treba ho kombinovat s Web-Native alebo Scoreboard systemom, aby materialy neboli prilis posterove a malo pouzitelne

## Odporucanie

Pre novu sezonu zvolit ako hlavny smer **Web-Native Quiz System** a pre scorekarty/standings pouzit jeho datovo hustsi podtyp **Stadium Scoreboard**. **Matchday Atmosphere** nechat ako doplnkovy rezim pre uvodne, promo a prestavkove slidy.

Tento mix najlepsie splna ciel: prezentacie, scorekarty, web a kampanove vystupy budu posobit ako jeden system, no kazdy format dostane vhodnu mieru atmosfery alebo funkcnosti.

## Canva build spec pre prvy draft

Kedze Canva MCP momentalne nie je dostupny, toto je pripraveny manualny alebo buduci MCP spec pre prvy draft.

Preferovany draft: **scorecard A4 alebo A5 print layout** v smere Web-Native Quiz System + Stadium Scoreboard.

Struktura:

- tmave pozadie `#06091a`
- hlavicka s `meeting_logo_inverted.png`, sezonou a kolom
- cerveny uppercase label `SPORTBUD MEETING`
- velky nadpis Be Vietnam Pro Black: `Scorecard`
- pole `Nazev tymu` ako svetla alebo tmava karta s bielym borderom
- 4 bloky kol po 8 otazkach alebo sekcie podla aktualnej mechaniky
- samostatny bonusovy blok s tyrkysovym detailom
- pravy/stredny vysledkovy sumar s velkym polom `Celkem`
- spodny footer: `Sdilime tvou sportovni vasen` + web/IG

Ak sa namiesto scorecard zvoli slide:

- 16:9 tmavy slide
- lavy horny label `1. KOLO`
- hlavny nadpis/otazka v Be Vietnam Pro
- karta s obsahom v `#0d1640`, border `white/5`
- cerveny akcent pre temu alebo cislo otazky
- tyrkysovy signal iba pre bonus/live/action
- logo v spodnom rohu alebo headeri podla typu slidu

## Otvorene body pred Canvou

- spristupnit Canva MCP server alebo potvrdit manualny Canva postup
- potvrdit vybrany smer; odporucany je **Web-Native Quiz System**
- dodat alebo presunut scorecard image do workspace, ak ma byt prvy draft presne naviazany na existujucu scorekartu
