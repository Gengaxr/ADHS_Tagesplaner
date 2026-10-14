# Mein Tag

Ein kleiner Tagesplaner als Web-App fürs iPhone, gebaut für ADHS: Morgenbriefing mit dem ganzen Tag oben und dem ersten kleinen Schritt samt Timer darunter. Das Briefing lässt sich vorlesen.

- Die Seite braucht keinen Build. Sie besteht aus `index.html`, `styles.css` und `src/`.
- Aufgaben, Anker und Name liegen nur im Browser-Speicher des Geräts, nicht in diesem Repository.
- Einrichtung auf dem iPhone: [docs/kurzbefehl-anleitung.md](docs/kurzbefehl-anleitung.md)
- Tests: `npm test` (Node 20 oder neuer)

## Hinweis für Änderungen

iOS Safari speichert Dateien zwischen. Wer etwas ändert, erhöht die Versionsnummer `?v=N` in `index.html` und in den `import`-Zeilen von `src/app.js`, sonst sieht man die alte Fassung.
