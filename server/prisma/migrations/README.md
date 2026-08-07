# Prisma Migrations

OnePrint now uses Supabase PostgreSQL through Prisma.

Use Prisma from the `server` folder:

```bash
npm run db:generate
npm run db:push
```

Set `DATABASE_URL` and `DIRECT_URL` in `server/.env` before pushing the schema.
