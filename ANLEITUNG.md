# dressed & nested – so funktioniert die Website

## Ordner

| Ordner / Datei | Was drin ist |
|---|---|
| `content/posts/` | **Deine Beiträge.** Eine `.md`-Datei pro Beitrag. |
| `content/site.json` | Name, Autorin (Name, Vorstellung, Foto), Domain, Boards, Board der Woche, Zitat-Pins, Pinterest-Links |
| `public/bilder/` | Bilder der Beiträge |
| `assets/` | Design (`style.css`) und Interaktionen (`app.js`) |
| `build.js` | Baut aus allem die fertige Website nach `dist/` |

## Neuen Beitrag anlegen

1. Bild ins Hochformat bringen (am besten 1000 × 1500 px, JPG) und in `public/bilder/` legen.
2. In `content/posts/` eine bestehende Datei kopieren und umbenennen. **Der Dateiname wird die Adresse**:
   `herbst-mantel-guide.md` → `dressedandnested.de/herbst-mantel-guide/`
   (nur Kleinbuchstaben, Zahlen und Bindestriche, keine Umlaute: ä → ae).
3. Oben zwischen den `---` die Angaben ausfüllen:

```yaml
---
title: "Der Herbstmantel-Guide"
date: 2026-11-20
category: fashion          # interior oder fashion
board: capsule             # wohnzimmer, schlafzimmer, licht, deko, outfits, capsule, accessoires
color: braun                # braun, hellblau, schwarz, weiss  (für „Shop by Color“ und Hintergrund)
image: /bilder/herbst-mantel-guide.jpg
image_alt: "Kobaltblauer Wollmantel auf einem Bügel"
excerpt: "Ein Satz, der neugierig macht. Erscheint auf der Seite, bei Google und auf Pinterest."
products:
  - name: "Wollmantel, Kobalt"
    shop: "Zalando"
    price: "189 €"
    url: "https://dein-affiliate-link..."
---
```

4. Darunter den Text schreiben. `## Überschrift`, `- Aufzählung`, `1. Nummerierung`, `**fett**`.
5. Optional, für den persönlichen Touch:
   - `note: "…"` – handgeschriebene Notiz unter dem Titel
   - `favorite: 2` – markiert das 2. Produkt als „mein Liebling“
   - `tip: "…"` – „Ninas Tipp“-Box am Ende des Artikels
6. Optional: `pin_style: list` zeigt den Beitrag im Feed als gelbe Einkaufsliste. `draft: true` versteckt ihn.

Die neuesten Beiträge (nach `date`) stehen im Feed oben.

## Website bauen und ansehen

```bash
npm install          # einmalig
npm run build        # → dist/  (das kommt online)
npm run preview      # → dist-preview/  (zum Öffnen per Doppelklick auf index.html)
```

## Online stellen (Netlify)

1. Diesen Ordner als Repository auf GitHub hochladen.
2. Auf netlify.com „Add new site“ → „Import an existing project“ → GitHub → Repository wählen.
   Die Einstellungen stehen schon in `netlify.toml`.
3. Ab dann: Jede Änderung, die du auf GitHub speicherst, ist nach etwa einer Minute online.
   Neue Beiträge kannst du direkt auf github.com anlegen („Add file“ → „Create new file“ in `content/posts/`, Bild per „Upload files“ in `public/bilder/`).

## Vor dem Start erledigen

- [ ] In `content/site.json` die echte Domain bei `url` eintragen (wichtig für Pinterest und Google).
- [ ] Pinterest- und Instagram-Profil in `site.json` eintragen.
- [ ] Pinterest: „Website beanspruchen“ → den Code bei `pinterest_domain_verify` eintragen.
- [ ] Affiliate-Links bei `url:` in den Beiträgen eintragen (sonst steht dort „Link folgt“).
- [ ] Impressum und Datenschutz in `build.js` (Abschnitt „Rechtliche Seiten“) mit echten Angaben füllen.
- [ ] Sitemap bei der Google Search Console einreichen: `deine-domain.de/sitemap.xml`
