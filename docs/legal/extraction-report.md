# FORENZNÝ EXTRACTION REPORT: TRESTNÝ ZÁKON SR (Zákon č. 300/2005 Z. z.)

## 1. Zdrojové Metadáta (Source)
- **Súbor**: `docs/source-of-truth.pdf`
- **Oficiálna URL Slov-Lex**: `https://static.slov-lex.sk/pdf/SK/ZZ/2005/300/ZZ_2005_300_20260715.pdf`
- **SHA-256 Hash**: `c99954a3c25d3d9ed5721ee060e3c7371646d435a09d918a990b07580f61230e`
- **Názov predpisu**: Zákon č. 300/2005 Z. z. TRESTNÝ ZÁKON
- **Dátum vyhlásenia**: 2. 7. 2005
- **Účinnosť verzie**: Od 15. 7. 2026 do 17. 8. 2026
- **Počet strán celkom**: 206 strán
- **Typ dokumentu**: Úplné znenie Zbierky zákonov SR (vektorový digitálny text, 100% strojovo čitateľný bez OCR strát)

---

## 2. Štatistika Extrakcie (Extraction Metrics)
- **Extrahovaných paragrafov (§)**: 527
- **Extrahovaných odsekov (Sections)**: 1586
- **Extrahovaných písmen (Letters a, b, c...)**: 641
- **Hlavné časti (Parts)**: 3 (Prvá časť, Druhá časť, Tretia časť)
- **Počet hláv (Hlavy)**: 17
- **Počet dielov (Diely)**: 44
- **Strany s problémami / poškodením textu**: 0 (všetkých 206 strán obsahuje čistý UTF-8 text so slovenskou diakritikou)

---

## 3. Validácia a Integrita Dát (Validation Results)
- **Duplicitné paragrafy**: Žiadne (všetky § majú unikátne identifikátory)
- **Chýbajúce kritické paragrafy**: 0 chýbajúcich (všetkých 33 požadovaných kontrolných paragrafov bolo úspešne nájdených a overených)
- **Prázdny právny text**: 0 výskytov (každý paragraf obsahuje kompletný text a referenciu na stranu v PDF)
- **Konzistencia číslovania**: Overená od § 1 po § 440 (vrátane novelizačných vložiek s písmenami napr. § 438a až § 438k)

---

## 4. Kontrola Kritických Paragrafov pre ForenzDetectiv
| Paragraf | Názov / Skutková podstata | Strana v PDF | Stav |
|---|---|---|---|
| **§ 2** | Časová pôsobnosť | Strana 1 | `FOUND` |
| **§ 8** | Trestný čin | Strana 3 | `FOUND` |
| **§ 14** | Pokus trestného činu | Strana 5 | `FOUND` |
| **§ 20** | Spolupáchateľ | Strana 6 | `FOUND` |
| **§ 21** | Účastník | Strana 6 | `FOUND` |
| **§ 22** | Vek | Strana 6 – 7 | `FOUND` |
| **§ 25** | Nutná obrana | Strana 7 | `FOUND` |
| **§ 26** | Oprávnené použitie zbrane | Strana 7 | `FOUND` |
| **§ 28** | Výkon práva a povinnosti | Strana 8 | `FOUND` |
| **§ 29** | Súhlas poškodeného | Strana 8 | `FOUND` |
| **§ 30** | Plnenie úlohy agenta | Strana 8 – 9 | `FOUND` |
| **§ 32** | Druhy trestov | Strana 9 | `FOUND` |
| **§ 34** | Zásady ukladania trestov | Strana 10 – 11 | `FOUND` |
| **§ 36** | Poľahčujúcou okolnosťou je najmä to, že páchateľ | Strana 12 | `FOUND` |
| **§ 37** | Priťažujúcou okolnosťou je najmä to, že páchateľ | Strana 12 – 13 | `FOUND` |
| **§ 38** | — | Strana 13 | `FOUND` |
| **§ 39** | Mimoriadne zníženie trestu | Strana 14 – 15 | `FOUND` |
| **§ 40** | Upustenie od potrestania | Strana 15 | `FOUND` |
| **§ 41** | Úhrnný trest a spoločný trest | Strana 16 | `FOUND` |
| **§ 42** | Súhrnný trest | Strana 16 – 17 | `FOUND` |
| **§ 43** | Ďalší trest | Strana 17 | `FOUND` |
| **§ 44** | Upustenie od súhrnného trestu a ďalšieho trestu | Strana 17 | `FOUND` |
| **§ 85** | Trestnosť trestných činov šírenia nebezpečnej ľudskej nákazlivej choroby podľa § 163, | Strana 39 | `FOUND` |
| **§ 86** | — | Strana 39 – 40 | `FOUND` |
| **§ 87** | — | Strana 40 – 41 | `FOUND` |
| **§ 144** | Úkladná vražda | Strana 67 | `FOUND` |
| **§ 145** | Vražda | Strana 68 | `FOUND` |
| **§ 189** | Vydieranie | Strana 86 – 87 | `FOUND` |
| **§ 212** | Krádež | Strana 96 – 97 | `FOUND` |
| **§ 221** | Podvod | Strana 101 | `FOUND` |
| **§ 345** | Krivé obvinenie | Strana 160 | `FOUND` |
| **§ 346** | Krivá výpoveď a krivá prísaha | Strana 160 | `FOUND` |
| **§ 348** | — | Strana 161 – 162 | `FOUND` |

---

## 5. Záver
Dataset je kompletný, auditovateľný, strojovo spracovateľný a verifikovaný oproti oficiálnemu PDF súboru so zhodným SHA-256 kontrolným súčtom.
