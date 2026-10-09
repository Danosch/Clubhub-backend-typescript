# ClubHub Backend – TypeScript

Gemeinsame, schrittweise Portierung des bestehenden Java-/Quarkus-Backends auf
Node.js und NestJS zur Vorbereitung auf ein Backend-Vorstellungsgespräch.

Geplanter Stack: NestJS, TypeScript, TypeORM, PostgreSQL, Redis, BullMQ und
S3-kompatibler Object Storage. Lokal Docker Compose, später Kubernetes auf AWS EKS.

## Stand

Bestandsaufnahme und Architekturvorschlag sind dokumentiert. Es gibt noch keine
ausführbare NestJS-Anwendung und keine ausgeführten Anwendungstests.
Das Java-Repository bleibt die fachliche Referenz.

## Dokumentation

- [Migrationsinventar und Sieben-Tage-Plan](docs/MIGRATIONSPLAN.md)
- [Architektur und einheitliche Konventionen](docs/ARCHITEKTUR.md)
- [Entscheidung 001: modularer Monolith und TypeORM](docs/decisions/001-architektur-und-orm.md)
- [Lernjournal und erster gemeinsamer Schritt](docs/LERNJOURNAL.md)

Jeder Lernschritt besteht aus Erklärung, einer kleinen Umsetzung, einem
überprüfbaren Ergebnis und einem Eintrag in die Dokumentation.
