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

Danach startet der Knopf "Vorlesen" diesen Kurzbefehl. Safari fragt einmal, ob es Kurzbefehle öffnen darf. Der Kurzbefehl öffnet zuerst die Seite und liest das Briefing dann vor, du siehst also den Plan, während gesprochen wird.

## 6. Feierabend-Check (optional, ab 23 Uhr erinnern)

Den Feierabend-Check startest du jederzeit selbst über den Knopf **Feierabend** oben auf der Seite, sobald dein Kopf müde wird. Er zeigt, was du heute geschafft hast, lässt dich Offenes auf morgen schieben oder loslassen und lässt dich Aufgaben für morgen eintragen. Danach tippst du auf **Gute Nacht**. Was du für morgen einträgst, steht im Briefing am nächsten Morgen.

Damit dich das iPhone ab 23 Uhr erinnert:

1. Doppelklicke am Mac die Datei `docs/Planer-Feierabend.shortcut` aus diesem Repository und klicke auf **Kurzbefehl hinzufügen**. Er hat nur eine Aktion: Er öffnet die Seite im Feierabend-Modus.
2. Auf dem iPhone: Kurzbefehle, **Automation**, **Plus**, **Tageszeit**, **23:00**, **Täglich**, **Weiter**.
3. **Kurzbefehl ausführen** wählen und `Planer-Feierabend` aussuchen. **Weiter**.
4. **Sofort ausführen** einschalten, "Beim Ausführen benachrichtigen" ausschalten, **Fertig**.

Ab 23 Uhr zeigt die Seite außerdem oben einen Hinweis "Es ist spät", wenn du sie öffnest.

## Gut zu wissen

- Die Seite öffnet sich im **Standardbrowser** deines iPhones. Der sollte **Safari** sein, denn Chrome und Safari haben je einen eigenen Speicher.
- Vorlesen geht nur nach einem **Tipp auf "Vorlesen"**, das erlaubt iOS nicht anders.
- Eine andere Stimme wählst du unten auf der Seite unter "Aufgaben und Anker", Abschnitt "Stimme". Bessere Stimmen lädst du in den iPhone-Einstellungen unter Bedienungshilfen, Gesprochene Inhalte, Stimmen, Deutsch.
- **Große Aufgaben zerlegen:** Tippe im Formular "Aufgabe hinzufügen" (oder im Feierabend-Check) zum Beispiel `Wohnzimmer aufräumen` ein und dann auf **In kleine Zonen zerlegen**. Du bekommst Teilaufgaben wie "Couch ordnen" oder "Schreibtisch aufräumen", wählst aus und trägst sie ein. Die Zonen für Wohnzimmer, Schlafzimmer (mit Kleiderstangen) und Bad kannst du unten unter **Zonen bearbeiten** ändern. Für andere Aufgaben schlägt die Seite drei einfache Schritte vor.
- **Besuch kommt:** Tippe oben auf **Besuch kommt**, wähle die Minuten bis zum Besuch (10 bis 60 oder eigene Zahl) und tippe auf **Starten**. Du siehst einen Countdown und immer nur einen Schritt: zuerst Couch, Boden und Sideboard mit TV, dann der Rest von Wohnzimmer und Bad. **Geschafft** zeigt den nächsten Schritt, **Überspringen** lässt einen aus. Mit **Der Besuch ist da** (oder wenn alle Schritte durch sind) siehst du, was du geschafft hast. Die Reihenfolge änderst du unten unter **Zonen bearbeiten**, Eintrag "Besuch (Reihenfolge)". Mit `?besuch=20` an der Adresse startet der Modus sofort mit 20 Minuten.
- **iPhone-Timer für den Besuch:** Die Seite zählt nur, solange sie offen ist. Wenn du zusätzlich einen Timer aus der Uhr-App willst (er läuft auf dem Sperrbildschirm und klingelt auch bei gesperrtem Handy), importiere die fünf Kurzbefehle aus `docs/timer/` (Doppelklick, **Kurzbefehl hinzufügen**): `Besuch-Timer 10`, `20`, `30`, `45` und `60`. Setze dann bei **Besuch kommt** den Haken "Auch einen iPhone-Timer starten". Das geht nur für diese fünf Zeiten. Safari fragt beim Start einmal, ob es Kurzbefehle öffnen darf. Der Kurzbefehl startet den Timer und öffnet danach die Seite wieder, dein Besuch läuft dort weiter. Kommt der Besuch früher, stoppst du den Timer in der Uhr-App. Ist das Handy ausgeschaltet, klingelt nichts.
- **Calisthenics-Training:** Montag Push, Mittwoch Pull, Freitag Beine und Core, Sonntag Ganzkörper, jeweils um 17 Uhr als Anker im Tagesband (Uhrzeit, Dauer und Tage änderst du unten unter **Trainingsplan bearbeiten**). Tippe oben auf **Training** und dann auf **Training starten**: Du siehst immer nur eine Übung, trägst nach jedem Satz ein, wie viele du geschafft hast, bekommst die Pause als Countdown und siehst am Ende, was du geschafft hast, was beim letzten Mal war und ob es Zeit für eine schwerere Stufe ist. Die Übungen sind auf Klimmzugstange, Parallettes, Knöchelgewichte und Gewichtsball ausgelegt und lassen sich unter **Trainingsplan bearbeiten** ändern, eine Übung pro Zeile als `Name | Sätze | Ziel | Pause in Sekunden`, zum Beispiel `Liegestütze auf Parallettes | 3 | 6-12 | 90` oder `Plank | 3 | 30-60 s | 60`. Die Ergebnisse bleiben auf deinem iPhone gespeichert.
- Aufgaben und Anker legst du ebenfalls unten auf der Seite an. Sie bleiben nur auf diesem iPhone.
- Zum Testen kannst du `?now=08:05&date=2026-10-14` an die Adresse hängen.
