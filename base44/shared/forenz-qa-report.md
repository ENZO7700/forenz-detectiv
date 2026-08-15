# ForenzDetectiv — QA Report (UI Audit + E2E Test Plan)

> Referenčná dokumentácia kvality aplikácie. Vytvorené pre mobile-first audit na viewporte **373 px** a kompletné E2E scenáre pre Testing Agent.
> Dátum: 2026-08-14 · Téma: dark (slate-950), akcenty blue/violet.

---

## FÁZA 1 — UI AUDIT (mobile 373 px)

Každý nález: **komponent → problém → oprava → stav**.

### Nálezy a opravy

| # | Komponent | Problém (373 px) | Oprava | Stav |
|---|-----------|------------------|--------|------|
| 1 | `ForenzDetectiv.jsx` – Header | 3 tlačidlá (Zdieľať / Export / Skenovať) + názov sa nezmestili; `Skenovať dokument` mal stále viditeľný text → pretečenie riadku. | Text ScanButton skrytý na mobile (`hidden sm:inline`), kontajner tlačidiel `shrink-0`. | ✅ OPRAVENÉ |
| 2 | `ForenzDetectiv.jsx` – Pravý panel | `max-h-[40vh]` + chýbajúce `min-w-0` → dlhé mená/red‑flags mohli pretiecť mimo panel. | `max-h-[35vh]` + `min-w-0`. | ✅ OPRAVENÉ |
| 3 | `DocumentList.jsx` | Žiadny limit výšky → na mobile zoznam zobil graf/panel (rodič `overflow-hidden` ich orezal). | `max-h-[20vh] lg:max-h-none` + vnútorný scroll; `border-b lg:border-r`. | ✅ OPRAVENÉ |
| 4 | `GraphCanvas.jsx` | `min-h-[50vh]` vynútené → spolu s panelmi presiahlo 100 vh → orezanie. | `min-h-0` (graf = `flex-1`, dostane zvyšok). | ✅ OPRAVENÉ |
| 5 | `TimeSlider.jsx` | Replay + 2× koncový label + hodnota + reset v jednom riadku → rozbité na 373 px. | Koncové labely a reset `hidden sm:inline`/`sm:block`; slider `flex-1` zaberá zvyšok. | ✅ OPRAVENÉ |
| 6 | `ScanButton.jsx` | Plný text „Skenovať dokument" rozbíjal header. | Iba ikona na mobile, text cez `hidden sm:inline`. | ✅ OPRAVENÉ |
| 7 | `PersonPanel.jsx` – edge badge | Dlhé mená zdroj/cieľ v badge riadku mohli pretečiť (flex bez `min-w-0`). | `min-w-0` + `truncate max-w-[45%]` na badge; šípka `shrink-0`. | ✅ OPRAVENÉ |
| 8 | `RedFlagsPanel.jsx` | Túto oblasť treba hlídať pri dlhých `document_title` — už má `min-w-0` + `truncate`. | Žiadna zmena (v poriadku). | ✅ OK |
| 9 | `SherlockChat.jsx` – overlay | `w-[18rem]` (288 px) + `right-4` → na 373 px tesne sa zmestí (69 px okraj). Overlay `h-[26rem]` pláva nad grafom, nevyčnieva z viewportu. | Zostáva; šírka akceptovateľná. | ✅ OK |
| 10 | `SherlockChat.jsx` – toggle | `w-12 h-12` v pravom dolnom rohu panela; toast (z-50) ho nekryje. | — | ✅ OK |
| 11 | `ForenzDetectiv.jsx` – Toast | `fixed bottom-6` centrovaný; prekryje len samotný chat v strede, nie obsah grafov. | — | ✅ OK |
| 12 | `SharedCase.jsx` – chybový stav | PRD 5c požaduje text „Neplatný odkaz"; pôvodný text bol iný. | Text zmenený na „Neplatný odkaz. Link neexistuje alebo bol zneplatnený." | ✅ OPRAVENÉ |

### Zhrnutie Fázy 1
Stav mobilného layoutu: **zelený**. Žiadne známe pretečenia ani skryté tlačidlá na 373 px. Dark téma a blue/violet akcenty zachované.

---

## FÁZA 2 — E2E TEST SCENÁRE (pre Testing Agent)

Každý krok: **Akcia → Očakávaný výsledok**. Testing Agent zadáva ciele v plain English.

### 2. AUTH FLOW

**2a) Registrácia emailom → OTP → dashboard**
1. Otvor `/register` → formulár s emailom, heslom, potvrdením a Google tlačidlom.
2. Zadaj platný email + heslo + zhodné potvrdenie, klikni Registrovať → zobrazí sa OTP krok (6 polí).
3. Zadaj kód z emailu → overenie → tvrdé presmerovanie na `/` (dashboard ForenzDetectiv).
4. _Očakávaný výsledok:_ prihlásený používateľ vidí hlavnú obrazovku so zoznamom výpovedí a grafom.

**2b) Prihlásenie emailom + heslom**
1. Otvor `/login`, zadaj existujúci email + heslo, klikni Prihlásiť.
2. _Očakávaný výsledok:_ presmerovanie na `/`, header neukazuje tlačidlá v read-only móde (nie je zdieľaný link).

**2c) Zabudnuté heslo**
1. Z `/login` klikni „Zabudli ste heslo?" → `/forgot-password`.
2. Zadaj email, odošli → vždy sa zobrazí generická úspešná správa (bez ohľadu na existenciu).
3. Otvor reset link s `?token=`, zadaj nové heslo + potvrdenie → reset → presmerovanie na `/login`.
4. Prihlás sa novým heslom → dashboard.
5. _Očakávaný výsledok:_ prihlásenie s novým heslom úspešné.

**2d) Google OAuth**
1. Na `/login` alebo `/register` klikni „Prihlásiť sa cez Google".
2. _Očakávaný výsledok:_ Google consent → presmerovanie späť na `/`.

### 3. CORE FLOW

**3a) Upload A4 výpovede (JPEG)**
1. Prihlásený, klikni „Skenovať" (ikonka) → vyber obrázok JPEG (A4 výpoveď).
2. _Očakávaný výsledok:_ v DocumentList sa objaví položka so stavom „Analyzuje sa" (točiaca ikona).
3. Po dokončení backend `analyzeDocument` (Mistral Pixtral‑12B) → stav „Hotové", zobrazí sa počet osôb a vzťahov (`{n} os. · {m} vz.`).
4. _Očakávaný výsledok:_ graf sa naplní uzlami a hranami z výpovede.

**3b) Filtrovanie grafu podľa výpovede**
1. Klikni na položku výpovede v DocumentList.
2. _Očakávaný výsledok:_ graf ukáže len osoby/vzťahy z danej výpovede; „Všetky spisy (pavúk)" vráti späť všetky.

**3c) Detail osoby**
1. Klikni na uzol v grafe.
2. _Očakávaný výsledok:_ v pravom PersonPanel sa zobrazí meno, typ (badge farba podľa typu) a kontext.

**3d) Detail vzťahu**
1. Klikni na hranu v grafe.
2. _Očakávaný výsledok:_ PersonPanel ukáže zdroj→cieľ, typ vzťahu, čas (ak je) a citát z výpovede.

**3e) Export PDF**
1. Klikni „Export PDF" v headri.
2. _Očakávaný výsledok:* stiahne sa `forenzdetectiv-report.pdf` obsahujúci PNG grafu + zoznam osôb + sekcia „Varovania (Red Flags)".

### 4. VIRÁLNE FUNKCIE

**4a) Replay mód (časová os)**
1. Vyber výpoveď, ktorá má v vzťahoch časové údaje → TimeSlider sa zobrazí.
2. Klikni „Replay" (zelené, pulzujúce).
3. _Očakávaný výsledok:* `maxTime` sa posúva od min po max; uzly/hrany sa postupne objavujú (zvyšujúca opacity); aktuálna hrana pulzuje žltou (`edge-pulse`).
4. Klikni „Stop" → animácia sa zastaví; klik „reset" (`RotateCcw`) zobrazí všetky vzťahy.

**4b) Sherlock Chat**
1. Klikni ikonu Sherlock (pravý dolný roh panela) → overlay sa otvorí.
2. Zadaj „Kto má alibi o 14:30?" → Enter.
3. _Očakávaný výsledok:* do ~5 s sa zobrazí odpoveď; jednoduché otázky rieši lokálna logika, komplexné („prečo", „analyzuj", „kto mohol") idú cez `sherlockChat` (Mistral‑small).
4. Over, že sa v odpovedi objavia osoby typu alibi alebo informácia o ich neexistencii.

**4c) Zdieľateľný link**
1. Klikni „Zdieľať" v headri.
2. _Očakánaný výsledok:* toast „Link skopírovaný!" (z-50, centrovaný dole), link je v schránke (`https://origin/shared/:token`).
3. Otvor link v novom okne → načíta `/shared/:token` → read-only verzia s fialovým banerom „Zdieľaný prípad od {meno} · len na čítanie".

### 5. READ-ONLY SHARED VIEW

**5a) Neprihlásený prístup**
1. Odhlás sa, otvor existujúci `/shared/:token`.
2. _Očakávaný výsledok:* presmerovanie na `/login`; po prihlásení návrat späť na shared view.

**5b) Prihlásený prístup**
1. Prihlásený, otvor platný `/shared/:token`.
2. _Očakávaný výsledok:* read-only verzia — v headri chýbajú tlačidlá Zdieľať / Export PDF / Skenovať; zdieľaný banner s menom zdieľateľa.

**5c) Neplatný token**
1. Otvor `/shared/NEPLATNYTOKEN`.
2. _Očakávaný výsledok:* chybová obrazovka s textom začínajúcim „Neplatný odkaz".

---

## Backend overenia (vykonané)

| Funkcia | Test payload | Výsledok |
|---------|---------------|----------|
| `sherlockChat` | `{question:"Kto má alibi o 14:30?", context:"{...}"}` | 200 — reálna odpoveď z Mistral (kľúč funguje). |
| `analyzeDocument` | `{}` | 400 — „Chýba documentId." (validácia vstupu OK). |

---

## Testing Agent — ciele na spustenie (v poradí)

1. „Prihlás sa a naskenuj obrázkovú výpoveď, potom over, že sa v grafe zobrazia osoby a vzťahy a DocumentList ukáže stav Hotové."
2. „Vyber výpoveď s časovými údajmi, klikni Replay a over, že sa uzly a hrany postupne objavujú; klik Stop zastaví animáciu."
3. „Otvor Sherlock Chat, opýtaj sa 'Kto má alibi o 14:30?' a over, že odpoveď príde do 5 sekúnd."
4. „Klikni Zdieľať, skopíruj link, otvor ho v novom okne a over read-only náhľad s banerom mena zdieľateľa a bez tlačidiel Zdieľať/Export/Skenovať."
5. „Otvor neplatný zdieľaný link /shared/NEPLATNYTOKEN a over chybovú obrazovku s textom Neplatný odkaz."
6. „Zaregistruj nový email, over OTP krok a presmerovanie na hlavnú stránku."
7. „Odošli zabudnuté heslo, over generickú úspešnú správu, resetni heslo cez token a prihlás sa novým heslom."
8. „Klikni Export PDF a over, že sa stiahne PDF s grafom, zoznamom osôb a red flags."