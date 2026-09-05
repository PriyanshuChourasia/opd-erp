# Database Backups & Restore

## Why this exists

`apps/api/docker-entrypoint.sh` self-heals on startup: if `prisma migrate
deploy` or the `--fresh` seed fails, it runs `prisma migrate reset --force`,
which **drops and recreates the entire database**. That self-heal is kept by
design (a drift between `schema.prisma` and the migration history would
otherwise leave the API unable to start), but it can destroy real data if it
ever fires on a deployment with live records.

So, **before any migrate/seed/reset runs, the entrypoint takes a `pg_dump`
snapshot** of the database. If a push goes wrong, the previous state is always
one command away.

> ⚠️ The auto-reset-on-failure behavior itself is intentionally **not** changed
> here. Reconsidering whether auto-reset is right for production deployments is
> a separate follow-up task.

## What happens on every `api` start

1. `api` container starts (any path: `docker compose up`, rebuild, crash
   restart — all of them).
2. `docker-entrypoint.sh` runs `pg_dump -Fc` (custom format) against the
   `postgres_db` service using `DATABASE_URL`, writing e.g.
   `opd_db_20260903T101500Z.dump` into the `db_backups` named volume
   (mounted at `/app/apps/api/backups` in `api` and `/backups` in
   `postgres_db`).
3. Only after the dump **succeeds** does the script proceed to
   `migrate deploy` / seed / self-heal reset.
4. If the dump itself fails (disk full, postgres unreachable), the entrypoint
   prints a FATAL error and exits — the API refuses to start rather than touch
   the database without a backup.

## Retention policy

Backups are never pruned before a new one is written. After each successful
dump, only the newest `BACKUP_KEEP` dumps are kept — **24 by default**, which
is about a day of deploy/restart churn at typical frequency.

- Override with the `BACKUP_KEEP` environment variable on the `api` service.
- Backups older than the keep-count are deleted from the `db_backups` volume.
- Dumps are custom-format (`-Fc`), so a full dump of a small clinic DB is
  typically well under a megabyte — 24 of them is negligible.

## Listing available backups

```bash
docker compose exec postgres_db sh -c 'ls -lt /backups'
```

## Restoring from a backup

The database must not be written to while restoring, so stop the API first.

```bash
# 1. Stop the API so it can't write (or self-heal!) mid-restore
docker compose stop api

# 2. Pick a dump — e.g. the newest one
docker compose exec postgres_db sh -c 'ls -lt /backups | head'

# 3. Restore it. --clean drops existing objects first; --if-exists keeps it
#    idempotent; --no-owner avoids permission errors under POSTGRES_USER.
docker compose exec -T postgres_db sh -c \
  'pg_restore --clean --if-exists --no-owner \
     -U "$POSTGRES_USER" -d "$POSTGRES_DB" /backups/opd_db_20260903T101500Z.dump'

# 4. Start the API again. Its entrypoint will take a fresh backup, then run
#    migrate deploy against the restored data (safe — it applies only
#    migrations missing from the restored DB).
docker compose start api
```

Notes:

- Because the dump is taken right before migrate/seed, a restored database may
  be missing the latest migrations — that is fine: the next `api` start runs
  `migrate deploy` (non-destructive) to bring it forward. If that migrate ever
  fails and the self-heal reset fires, a **fresh** backup of the restored data
  will already exist from that same startup.
- To restore to a completely empty slate instead (e.g. fresh demo data), the
  entrypoint's existing self-heal already does that — just delete the volume or
  run `prisma migrate reset` intentionally.
- Backups live only on the Docker host's `db_backups` named volume. For
  disaster recovery beyond the host, copy dumps off-box periodically
  (`docker compose cp api:/app/apps/api/backups/<file> .`).

## Testing the backup step

End-to-end (exercises the real startup path — safe; a backup is cheap):

```bash
docker compose up -d --build api
# Expect, in order: "Taking pre-deploy database backup", "Backup complete",
# then the usual migrate/seed/start lines.
docker compose logs api | grep -i backup
# Confirm the dump landed on the volume:
docker compose exec postgres_db sh -c 'ls -lt /backups | head'
```

Failure behavior (backup must be fatal — never proceed without a snapshot):

```bash
# Stop the database, then start only the api container:
docker compose stop postgres_db
docker compose start api
# The api container must log FATAL: pre-deploy database backup FAILED and
# exit — NOT run migrate/seed/reset. Restart the database afterwards.
docker compose start postgres_db
docker compose logs api | tail
```
