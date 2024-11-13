## ValueSet SQL Dump Information

In order to make the dev process as low-lift as possible, we want to avoid executing the `db-creation` scripts when booting up the application in dev mode via `npm run dev`. To that end, we've created a `pg_dump` file containing all the valusets, concepts, and foreign key mappings that would be extracted from a fresh pull of the eRSD and processed through our creation functions. This file, `vs_dump.sql` has been mounted into the docker volume of our postgres DB when running in dev mode as an entrypoint script. This means it will be automatically executed when the DB is freshly spun up. You shouldn't need to do anything to facilitate this mounting or file running.

## Updating the pg_dump

If the DB extract file ever needs to be updated, you can use the following simple process:

1. Start up the application on your local machine using a regular `docker compose up`, and wait for the DB to be ready.
2. Load the eRSD and valuesets into the DIBBs DB by using the `Create DB` button on the `/queryBuilding` page. Optionally, use DBeaver to verify that valuesets exist in the database.
3. In a fresh terminal window, run

```
pg_dump -U postgres -f vs_dump.sql -h localhost -p 5432 tefca_db
```

If the above doesn't work, try replacing `localhost` with `0.0.0.0`.
4. Enter the DB password when prompted.
5. The extract file should now be created. It should automatically be located in `/query-connector`, but if itsn't, put it there.