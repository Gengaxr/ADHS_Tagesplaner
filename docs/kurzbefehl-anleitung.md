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

Adresse in **Safari** öffnen, Teilen-Menü, **Zum Home-Bildschirm**. Schalte dort **"Als Web-App öffnen" aus**, dann **Hinzufügen**.

Warum: Eine Home-Bildschirm-App hat auf dem iPhone einen eigenen Speicher, getrennt von Safari. Der Wecker öffnet die Seite in Safari. Nur wenn auch dein Symbol die Seite in Safari öffnet, sehen beide dieselben Aufgaben, Anker und denselben Namen.

## 4. Deine Google-Kalender-Termine im Briefing (optional)

Ein fertiger Kurzbefehl holt deine heutigen Termine und übergibt sie der Seite.

1. Das Google-Konto muss in der Kalender-App deines iPhones (und am Mac) eingerichtet sein.
2. Doppelklicke am Mac die Datei `docs/Planer-Briefing.shortcut` aus diesem Repository und klicke in der Kurzbefehle-App auf **Kurzbefehl hinzufügen**. Er erscheint über iCloud auch auf dem iPhone.
3. Starte ihn auf dem iPhone einmal und erlaube den Zugriff auf deinen Kalender.
4. Ändere die Automation (Automation, "Wecker wird gestoppt") so, dass sie `Planer-Briefing` statt `Briefing` ausführt. Den alten Kurzbefehl `Briefing` brauchst du dann nicht mehr.

Die Seite zeigt deine Termine mit Uhrzeit im Tagesband. Ganztägige Termine stehen ganz oben.

## 5. Bessere Stimme über einen Kurzbefehl (optional)

Safari zeigt der Seite nur die Standardstimme. Ein Kurzbefehl kann dagegen die geladenen Premium-Stimmen nutzen.

1. Doppelklicke am Mac die Datei `docs/Briefing vorlesen.shortcut` aus diesem Repository und klicke in der Kurzbefehle-App auf **Kurzbefehl hinzufügen**. Er erscheint über iCloud auch auf dem iPhone.
2. Öffne ihn auf dem iPhone, tippe in der Aktion **Text sprechen** auf den Pfeil, wähle bei **Stimme** deine Premium-Stimme und tippe auf Fertig.
3. Auf der Seite unten bei **Stimme** den Haken bei "Mit dem Kurzbefehl Briefing vorlesen" setzen und **Speichern**.

Danach startet der Knopf "Vorlesen" diesen Kurzbefehl. Safari fragt einmal, ob es Kurzbefehle öffnen darf.

## Gut zu wissen

- Die Seite öffnet sich im **Standardbrowser** deines iPhones. Der sollte **Safari** sein, denn Chrome und Safari haben je einen eigenen Speicher.
- Vorlesen geht nur nach einem **Tipp auf "Vorlesen"**, das erlaubt iOS nicht anders.
- Eine andere Stimme wählst du unten auf der Seite unter "Aufgaben und Anker", Abschnitt "Stimme". Bessere Stimmen lädst du in den iPhone-Einstellungen unter Bedienungshilfen, Gesprochene Inhalte, Stimmen, Deutsch.
- Aufgaben und Anker legst du ebenfalls unten auf der Seite an. Sie bleiben nur auf diesem iPhone.
- Zum Testen kannst du `?now=08:05&date=2026-10-14` an die Adresse hängen.
