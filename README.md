# RaceHub

League of Legends race tracker built with Next.js App Router, Prisma and PostgreSQL.

## Railway

Required environment variables:

```env
DATABASE_URL=postgresql://...
RIOT_API_KEY=...
SYNC_SECRET=...
DATA_PROVIDER=riot
```

Build:

```bash
npm install
npm run build
```

Start:

```bash
npm run start
```

The build script explicitly runs `prisma generate` before `next build`, so Railway does not depend on npm lifecycle hooks for Prisma generation.

After PostgreSQL is attached, initialize the database from Railway Shell:

```bash
npx prisma db push
npx prisma db seed
```

Health check:

```text
/api/health
```

## Project structure

```text
app/
  api/
  players/
  races/
  globals.css
  layout.tsx
  page.tsx
lib/
  db.ts
  providers/riot.ts
prisma/
  schema.prisma
  seed.ts
```
