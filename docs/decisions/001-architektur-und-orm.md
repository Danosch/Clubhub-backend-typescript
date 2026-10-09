# ADR 001: Modularer Monolith mit TypeORM

Datum: 2026-10-05

Status: Vorgeschlagene Arbeitsgrundlage. ORM-Nutzung und einheitliche Architektur
sind vom Nutzer gewünscht; die konkrete TypeORM-Auswahl ist die Empfehlung.

## Kontext

ClubHub existiert als Java-/Quarkus-Projekt mit JPA und PostgreSQL. Die Portierung
soll in kleinen, verständlichen Schritten entstehen und eine Woche gezieltes
Lernen für ein Vorstellungsgespräch unterstützen.

## Entscheidungsvorschlag

Fachliche NestJS-Module in einem modularen Monolithen. Innerhalb der Module gilt
Controller → Service → TypeORM Repository. DTOs und Entities sind getrennt.
PostgreSQL-Schemaänderungen erfolgen ausschließlich über Migrationen.

TypeORM passt als Einstieg, weil Entities, Relationen, Repositories und
Transaktionen an vorhandenes JPA-Wissen anschließen. Nest stellt dafür eine
[direkte Integration](https://docs.nestjs.com/data/typeorm) bereit.

## Betrachtete Alternativen

- Prisma: mögliche Alternative mit einem eigenen Schema und generiertem Client.
  Für dieses Lernprojekt bevorzugen wir zunächst die Nähe zur Entity-Struktur
  des Java-Originals.
- Vollständige Ports-and-Adapters-Architektur: sinnvoll bei konkretem Bedarf an
  austauschbaren Adaptern oder stark isolierter Domäne. Würde zum Einstieg mehr
  Verträge und Mapping-Code erfordern.
- Microservices: zusätzliche Deployment- und Konsistenzfragen würden bereits
  während der Sprachumstellung anfallen. Die Fachmodule können zunächst gemeinsam
  ausgeliefert werden; ein Queue-Worker kann später separat laufen.

## Konsequenzen

- Kurze, nachvollziehbare Wege vom HTTP-Request zur Datenbank.
- Service und Persistenz sind an TypeORM gekoppelt; ein ORM-Wechsel benötigt Arbeit.
- Lazy Loading, Transaktionen und Lifecycle entsprechen nicht automatisch JPA.
  SQL-Abfragen und Promise-Verhalten müssen ausdrücklich verstanden werden.
- Relationen, Constraints und Indizes werden bewusst modelliert und getestet.
- Die Wahl kann später durch eine neue ADR geändert werden.
