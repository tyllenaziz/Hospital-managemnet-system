# Prisma Schema Sources

This Prisma schema is maintained under `backend/prisma/` and is intended to cover the combined database shape from:

- `master_schema.sql`
- `backend/schema.sql`
- `backend/diagnosis_codes.sql`
- `backend/lab_tests.sql`
- `backend/mpesa_migration.sql`
- `backend/migrations/*`
- `backend/scripts/setupDatabase.js`
- `backend/scripts/fixMissingTables.js`
- `backend/scripts/fixRadiologyTable.js`
- `backend/scripts/fix_bill_items_columns.js`
- `backend/scripts/seed_lab_tests.js`

Notes:

- `schema.prisma` is the working Prisma 7 datamodel.
- `prisma.config.ts` points to this folder and supplies the datasource URL.
- The schema includes additional hospital and lab catalog fields used by the current runtime controllers/models, even where older SQL files drifted.
