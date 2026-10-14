# Morgenbriefing einrichten (iPhone)

Das Briefing ist eine Web-Seite. Ein Kurzbefehl holt morgens deine Termine aus dem Kalender, gibt sie an die Seite weiter und öffnet sie, sobald du deinen Wecker ausschaltest. Die Namen der Menüpunkte in iOS 27 können leicht von dieser Anleitung abweichen. Such dann nach dem ähnlichsten Namen.

Die Adresse der Seite steht im Folgenden als `ADRESSE` und lautet `https://gengaxr.github.io/ADHS_Tagesplaner/`. Kopiere sie genau, mit `https`, und achte auf den Schrägstrich am Ende.

## 1. Voraussetzung

In den iPhone-Einstellungen unter Kalender, Accounts muss dein Google-Konto eingerichtet sein und "Kalender" eingeschaltet haben. Nur dann sieht der Kurzbefehl deine Google-Termine.

## 2. Kurzbefehl "Briefing" anlegen

Kurzbefehle-App, Plus oben rechts, Name: `Briefing`. Aktionen in dieser Reihenfolge:

1. **Kalenderereignisse suchen**: Filter "Startdatum ist heute", sortiert nach Startdatum.
2. **Wiederholen mit jedem Element** aus dem Ergebnis. Darin:
   1. **Wenn** "Ganztägig" ist ja: **Text** `ganztag|` plus Titel des Ereignisses.
   2. **Sonst**: **Datum formatieren** (Startdatum, eigenes Format `HH:mm`), **Datum formatieren** (Enddatum, eigenes Format `HH:mm`), dann **Text**: `Start-Zeit`, Bindestrich, `Ende-Zeit`, senkrechter Strich `|`, Titel des Ereignisses.
   3. **Ende Wenn**, **Ende Wiederholen**.
3. **Text kombinieren**: Ergebnis der Wiederholung, Trennzeichen "Benutzerdefiniert", Semikolon `;`.
4. **URL-Codierung** auf diesen kombinierten Text anwenden.
5. **Text**: `ADRESSE?events=` plus das codierte Ergebnis.
6. **URLs öffnen** mit diesem Text.

Teste ihn einmal mit dem Wiedergabeknopf. Die Seite sollte aufgehen und deine heutigen Termine zeigen.

## 3. Beim Ausschalten des Weckers starten

Kurzbefehle, unten "Automation", Plus, **Wecker**, **Wird gestoppt**, dann **Kurzbefehl ausführen**: `Briefing`. Schalte **Sofort ausführen** ein und "Beim Ausführen benachrichtigen" aus.

## 4. Zum Home-Bildschirm hinzufügen

Seite im Browser öffnen, Teilen-Menü, **Zum Home-Bildschirm**. Starte die Seite danach von dort. Damit bleiben deine Aufgaben und Anker sicher gespeichert.

## Gut zu wissen

- Die Seite öffnet sich im **Standardbrowser** deines iPhones. Wenn das Chrome ist, installiere die Seite am besten aus Safari, oder stelle Safari als Standardbrowser ein.
- Vorlesen geht nur nach einem **Tipp auf "Vorlesen"**, das erlaubt iOS nicht anders.
- Eine bessere Stimme findest du unter Einstellungen, Bedienungshilfen, Gesprochene Inhalte, Stimmen, Deutsch: Lade eine "Erweitert"- oder "Premium"-Stimme.
- Aufgaben und Anker legst du unten auf der Seite unter "Aufgaben und Anker" an. Sie bleiben nur auf diesem iPhone.
- Zum Testen kannst du `&now=08:05&date=2026-10-14` an die Adresse hängen.
