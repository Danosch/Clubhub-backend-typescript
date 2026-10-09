# Lernjournal

## Arbeitsweise

Pro Schritt: Ziel erklären → Bezug zu Java herstellen → wenige Dateien umsetzen →
Ergebnis ausführen und prüfen → mit eigenen Worten erklären → dokumentieren.

## 2026-10-05: Bestandsaufnahme

- Java-Quelle gefunden: `D:/dev/clubhub-backend/clubhub-backend`.
- Stack im Original: Java 21, Quarkus, JPA/Hibernate, PostgreSQL, Flyway, MinIO.
- Fachbereiche und erste Unterschiede zwischen Code und README erfasst.
- Gewünschte Arbeitsweise: gemeinsam lernen, einheitliches Pattern, ORM und Dokumentation.
- Architekturvorschlag: modularer Monolith, Controller/Service/Repository, TypeORM.
- Lokal geprüft: Node.js `v24.18.0`, npm über `npm.cmd` `12.0.2`, Docker CLI `29.8.1`.
- PowerShell blockiert `npm.ps1`; `npm.cmd` funktioniert ohne Änderung der
  Execution Policy. Eine Docker-CLI-Version bestätigt noch keinen laufenden Docker-Daemon.
- Noch keine Pakete installiert, Anwendung implementiert oder Anwendungstests ausgeführt.

## Nächster gemeinsamer Schritt: die erste Nest-Anfrage

Ziel: Ein kleines Nest-Grundgerüst mit `GET /api/health`, dessen Weg durch Modul,
Controller und Service du erklären kannst. Dieser erste Endpunkt meldet nur,
dass der HTTP-Prozess antwortet; Datenbank-/Redis-Readiness ergänzen wir gesondert.

Zuerst erklären wir:

| Datei | Aufgabe | Bezug zum Java-Projekt |
| --- | --- | --- |
| `package.json` | Scripts und Abhängigkeiten | Teile der Aufgaben von `pom.xml` |
| `tsconfig.json` | Compiler-Einstellungen | Compiler-Konfiguration |
| `src/main.ts` | Anwendung starten und konfigurieren | Bootstrap der Anwendung |
| `src/app.module.ts` | Module und Provider verbinden | Explizite DI-Konfiguration |
| Health-Controller | GET-Anfrage annehmen | JAX-RS Resource |
| Health-Service | Ergebnis bereitstellen | CDI Service |

Anschließend verbinden wir PostgreSQL über TypeORM und führen die erste
Migration aus. Erst danach portieren wir einen fachlichen Anwendungsfall.

## Vorlage für weitere Einträge

### Datum – Thema

- Ziel:
- Geänderte Dateien:
- Was ich jetzt mit eigenen Worten erklären kann:
- Unterschied zum Java-Code:
- Ausgeführte Befehle und beobachtete Ergebnisse:
- Testfälle und ihr Zweck:
- Offene Fragen:
- Nächster kleiner Schritt:
