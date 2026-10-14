# Morgenbriefing einrichten (iPhone)

Ziel: Wenn du morgens deinen Wecker ausschaltest, öffnet sich das Briefing von selbst. Dafür brauchst du nur **eine einzige Aktion**. Die Namen der Menüpunkte in iOS 27 können leicht abweichen, such dann nach dem ähnlichsten Namen.

Die Adresse der Seite:

```
https://gengaxr.github.io/ADHS_Tagesplaner/
```

Kopiere sie genau, mit `https` und dem Schrägstrich am Ende.

## 1. Kurzbefehl anlegen (geht auch am Mac)

Ein Kurzbefehl, den du am Mac anlegst, taucht über iCloud automatisch auf dem iPhone auf.

1. Kurzbefehle-App öffnen, **Plus** (neuer Kurzbefehl).
2. Oben den Namen `Briefing` eintragen.
3. Als Aktion **URLs öffnen** suchen und hinzufügen.
4. In das Feld der Aktion die Adresse von oben einfügen.

Fertig. Teste ihn mit dem Wiedergabeknopf: Die Seite sollte aufgehen.

## 2. Beim Ausschalten des Weckers starten (nur am iPhone möglich)

Diese Automation gibt es nur auf dem iPhone, nicht am Mac.

1. Kurzbefehle-App auf dem iPhone, unten **Automation**.
2. **Plus**, dann **Wecker** auswählen.
3. **Wird gestoppt** wählen (und den Wecker, oder "Alle Wecker"), dann **Weiter**.
4. **Kurzbefehl ausführen** wählen und `Briefing` aussuchen.
5. **Weiter**, dann **Sofort ausführen** einschalten und "Beim Ausführen benachrichtigen" ausschalten.
6. **Fertig**.

## 3. Zum Home-Bildschirm hinzufügen

Adresse in **Safari** öffnen, Teilen-Menü, **Zum Home-Bildschirm**. Starte die Seite danach von dort, so bleiben deine Aufgaben und Anker sicher gespeichert.

## Gut zu wissen

- Die Seite öffnet sich im **Standardbrowser** deines iPhones. Wenn das Chrome ist, installiere die Seite am besten aus Safari.
- Vorlesen geht nur nach einem **Tipp auf "Vorlesen"**, das erlaubt iOS nicht anders.
- Eine andere Stimme wählst du unten auf der Seite unter "Aufgaben und Anker", Abschnitt "Stimme". Bessere Stimmen lädst du in den iPhone-Einstellungen unter Bedienungshilfen, Gesprochene Inhalte, Stimmen, Deutsch.
- Aufgaben und Anker legst du ebenfalls unten auf der Seite an. Sie bleiben nur auf diesem iPhone.
- Deine Google-Kalender-Termine zeigt die Seite noch nicht automatisch. Das kommt später, mit einem fertigen Kurzbefehl zum Importieren.
- Zum Testen kannst du `?now=08:05&date=2026-10-14` an die Adresse hängen.
