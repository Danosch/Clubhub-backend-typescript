# ClubHub: von Java zu TypeScript in sieben Tagen

## Ziel und Ausgangslage

Ziel ist eine nachvollziehbare NestJS-Portierung, die du im Vorstellungsgespräch
starten, testen, verändern und erklären kannst. Die vollständige fachliche
Migration bleibt das Ziel; jeder Tag liefert einen überprüfbaren Zwischenstand.
Eine Woche ist für den gesamten Umfang einschließlich neuer Sprache und
Infrastruktur ambitioniert. Der Zeitplan ist eine Planung, keine Zusage.

Analysierte Quelle: `D:/dev/clubhub-backend/clubhub-backend`.
Das Original verwendet Java 21, Quarkus, JPA/Hibernate, PostgreSQL, Flyway und
MinIO. In den durchsuchten Quelldateien wurden keine Tests gefunden; im Maven-Build
sind JUnit/RestAssured-Abhängigkeiten vorhanden.

Die neun Resource-Interfaces enthalten 65 HTTP-Methodendeklarationen. Zwei davon
sind Varianten für dieselbe Post-Erstellung (JSON und Multipart), also 64
Methoden-/Pfad-Kombinationen. Die Migration muss auch Payloads, Statuscodes,
Fehlercodes, Berechtigungen und Pagination berücksichtigen.

## Inventar

| Bereich | Deklarationen | Zu übernehmende Funktionen |
| --- | ---: | --- |
| Auth | 4 | Registrierung, Login, Refresh, Logout |
| Users | 7 | Liste, eigenes Profil, Einzelprofil, Änderungen, Avatar, Passwort, Löschen |
| Clubs | 23 | Suche, CRUD, Avatar, Mitgliedschaft, Rollen, clubbezogene Posts/Threads/Events |
| Posts | 9 | Lesen, Bookmarks, Likes, Teilen, Bild hochladen/löschen |
| Comments | 6 | Liste, Erstellen, Ändern, Löschen, Like/Unlike |
| Threads | 7 | Thread lesen, Replies auflisten/erstellen, Thread-Upvote/Downvote und Entfernen |
| Replies | 6 | Reply ändern/löschen, Upvote/Downvote und Entfernen |
| Events | 2 | Einzelansicht und Teilnehmer-CSV zusätzlich zu den Club-Routen |
| Feed | 1 | Beiträge und Events der eigenen Clubs |

Zum Datenmodell gehören außerdem Interessen, Studienfächer, Umfragen mit
Antwortoptionen sowie Verknüpfungstabellen für Reaktionen und Teilnahmen.
Keine neuen Umfrage-Abstimmungsrouten erfinden: Maßstab sind die vorhandenen APIs.

## Geplante Architektur

Ein modularer Monolith mit fachlichen Nest-Modulen: `auth`, `users`, `clubs`,
`posts`, `comments`, `threads`, `replies`, `events`, `feed`. Controller nehmen
HTTP-Anfragen an, Services enthalten Fachlogik, die Datenzugriffsschicht spricht
PostgreSQL an. Das hält den Bezug zum vorhandenen Java-Projekt sichtbar.

- Node.js führt den kompilierten JavaScript-Code aus; TypeScript prüft Typen beim Entwickeln.
- NestJS organisiert Controller, Dependency Injection, Guards und Validierung.
- PostgreSQL bleibt die verbindliche Quelle für Benutzer und Fachdaten.
- TypeORM ist der vorgeschlagene Einstieg wegen der Nähe zu JPA; Migrationen explizit ausführen, kein automatisches Schema-Synchronisieren.
- Redis speichert kurzlebige Sessions mit TTL. Das ersetzt die aktuelle prozesslokale Token-Map.
- BullMQ verarbeitet als zusätzliche Übung einen asynchronen Teilnehmer-CSV-Export; der bestehende synchrone Endpunkt bleibt zunächst erhalten.
- Bilder bleiben in S3-kompatiblem Object Storage: lokal MinIO, auf AWS S3.
- Docker Compose dient der lokalen Entwicklung. Kubernetes-Manifeste beschreiben später API und Worker; AWS EKS ist das vorgesehene Cloud-Ziel.

Ein AWS-Deployment ist ein eigener Abschluss-Schritt mit Account, Zugang und
Kostenrahmen. Vorbereitete YAML-Dateien sind noch kein getestetes Cloud-Deployment.

## Lern- und Bauplan

Planungsannahme: täglich etwa 5–7 konzentrierte Stunden. Bei weniger Zeit zuerst
Auth, Clubs und einen vollständigen Post-Ablauf abschließen und den restlichen
Migrationsstand ausdrücklich als offen kennzeichnen.

| Tag | Umsetzung | Lernziel | Nachweis am Tagesende |
| --- | --- | --- | --- |
| 1 | Nest-Grundgerüst, Konfiguration, PostgreSQL/Redis lokal, erster Controller | `const`/`let`, Objekte, Arrays, Typen, Imports, `Promise`, `async`/`await`, Module und DI | Anwendung startet; Request durch Controller und Service erklären |
| 2 | User-Modell, Migration, Register/Login/Refresh/Logout, Redis-Sessions | DTO vs. Entity, Laufzeitvalidierung, Hashing, Guard, Fehlerbehandlung | Auth-Ablauf mit gültigen und ungültigen Eingaben testen |
| 3 | Clubs, Suche, Join/Leave, Rollen | Relationen, Constraints, Transaktionen, Autorisierung | Doppelter Beitritt scheitert; letzter Admin kann nicht austreten |
| 4 | Posts, Kommentare, Reaktionen, Bookmarks, Feed | Pagination, Query Builder, Fremdschlüssel, Nebenläufigkeit | Nutzer A darf keine fremden Inhalte unerlaubt ändern; Likes bleiben eindeutig |
| 5 | Threads, Replies, Events, CSV, Bilder, Profilrest | Wiederverwendung fachlicher Muster, Upload-Grenzen, Object Storage | Routen-Inventar gegen Umsetzung abgleichen; Kernabläufe durchspielen |
| 6 | BullMQ-Export, Integrationstests, Docker, Kubernetes-Vorbereitung | Producer/Worker, Retries, Idempotenz, Pod/Deployment/Service, Readiness | Exportjob läuft mit echtem Redis; Fehler und Wiederholung testen |
| 7 | Verbleibende Lücken, Dokumentation, Demo und Probeinterview | Entscheidungen und Grenzen präzise erklären | Frischer Start nach README, grüne Checks, 10-Minuten-Demo |

Tests entstehen täglich. Tag 6 verbindet die Komponenten und vertieft Grenzfälle.
Bei Zeitdruck hat ein erklärbarer, getesteter Ablauf Vorrang; offene Routen bleiben
in der Checkliste sichtbar und gelten nicht als migriert.

## Bewusste Verbesserungen gegenüber dem Java-Code

Diese Punkte ergeben sich aus der ersten Code-Lektüre und benötigen bei der
Implementierung eigene Tests:

1. `AuthService` hält Tokens 15 Minuten in einer `ConcurrentHashMap`. Neustarts
   verlieren Sessions, mehrere Instanzen teilen sie nicht. Redis-TTL und atomare
   Token-Rotation lösen diese konkreten Probleme.
2. `UserService.hash` verwendet SHA-256 mit Pepper. Für neue Passwörter einen
   geeigneten Passwort-Hash wie Argon2id verwenden. Bestehende Hashes sind damit
   nicht automatisch kompatibel; ein Datenimport benötigt eine ausdrücklich
   geplante Übergangsstrategie oder Passwort-Resets.
3. In den gelesenen Benutzer-Änderungs-/Löschpfaden wird die handelnde Benutzer-ID
   nicht mit der Ziel-ID verglichen. Die Portierung soll Eigentümerrechte prüfen.
   Auch das Löschen eines Clubs braucht eine explizite Admin-Prüfung.
4. Die erste SQL-Migration hat für Mitgliedschaften nur einen nicht eindeutigen
   Index auf `(club_id, user_id)`. Ein Unique-Constraint verhindert doppelte
   Mitgliedschaften auch bei gleichzeitigen Requests.
5. Der Schutz des letzten Admins muss auch bei parallelen Änderungen halten,
   beispielsweise durch eine Transaktion mit Sperre auf den betroffenen Club.
6. README und tatsächliche API können abweichen: Der Feed-Controller verwendet
   getrennte Post-/Event-Pagination. Für Vertragsentscheidungen Controller,
   DTOs und Implementierung gemeinsam lesen.

Zunächst eine getrennte Entwicklungsdatenbank verwenden. Eine Code-Portierung
bedeutet nicht, dass vorhandene Java-Daten bereits migriert sind.

## Teststrategie

- Unit-Tests für Fachregeln: Rollen, letzter Admin, unzulässige Statuswechsel.
- HTTP-Tests für Validierung, 401/403/404, Antwortformate und geschützte Routen.
- Integrationstests mit PostgreSQL und Redis für Constraints, Rollback,
  Session-Ablauf, atomaren Refresh und Queue-Verarbeitung.
- Ein durchgehender Ablauf: registrieren → Club anlegen → zweiter Nutzer tritt
  bei → Beitrag/Kommentar → Event/Teilnahme → Export → Logout.
- API-Vertragscheck: jede Java-Route mit Methode, Pfad, Request, Response,
  Statuscode und Berechtigung aufnehmen; Abweichungen dokumentieren.

## Java-Wissen übertragen

| Im Java-Projekt | In NestJS/TypeScript | Wichtiger Unterschied |
| --- | --- | --- |
| JAX-RS Resource, `@Path`, `@GET` | Controller, `@Controller`, `@Get` | Nest routet über Decorators |
| CDI `@Inject` | Constructor Injection | Provider muss im Modul verfügbar sein |
| `@ApplicationScoped` Service | `@Injectable()` Provider | Standardmäßig eine Instanz pro Nest-Anwendung |
| JPA Entity/Repository | TypeORM Entity/Repository | Datenbankaufrufe liefern Promises |
| `@Transactional` | Explizite ORM-Transaktion | Alle beteiligten Queries müssen denselben Transaktionskontext verwenden |
| DTO + Bean Validation | DTO-Klasse + ValidationPipe | TypeScript-Typen allein prüfen kein eingehendes JSON |
| Request-Filter | Guard | Authentifizierung von fachlichen Rechten trennen |
| ExceptionMapper | Exception Filter | Einheitliches öffentliches Fehlerformat |
| `List<T>`, Streams | `T[]`, `map`/`filter`/`find` | `find` kann `undefined` liefern |
| Maven, `pom.xml` | npm, `package.json`, Lockdatei | Laufzeit- und Entwicklungsabhängigkeiten unterscheiden |

## Fragen für das Vorstellungsgespräch

Beantworte jede Frage zuerst an einer konkreten Stelle deines Projekts:

- Warum validiert ein TypeScript-Interface keinen HTTP-Request?
- Was macht `await`, und warum blockiert eine CPU-intensive Schleife trotzdem den Event Loop?
- Warum liegen Mitgliedschaften in PostgreSQL und Sessions in Redis?
- Was unterscheidet Authentifizierung und Autorisierung?
- Warum reicht ein `if (!exists)` nicht gegen doppelte Beitritte?
- Was passiert, wenn ein Worker nach seiner Arbeit vor der Job-Bestätigung abstürzt?
- Wie verhindere ich doppelte Nebenwirkungen bei einem Retry?
- Was passiert mit einer Session, wenn Kubernetes einen Pod ersetzt?
- Welche Tests benutzen echte Infrastruktur und welche gezielte Test-Doubles?
- Welche Funktionen und Deployment-Schritte sind bereits nachgewiesen, welche noch offen?

## Offizielle Unterlagen

- [NestJS Einstieg](https://docs.nestjs.com/first-steps)
- [NestJS Datenbankintegration](https://docs.nestjs.com/techniques/database)
- [NestJS Queues mit BullMQ](https://docs.nestjs.com/techniques/queues)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Amazon EKS Einstieg](https://docs.aws.amazon.com/eks/latest/userguide/getting-started.html)

Stand: 5. Oktober 2026. Dieses Dokument beschreibt die Bestandsaufnahme und den
geplanten Weg; es behauptet keine bereits fertiggestellte TypeScript-Portierung.
