# Express Template

A production-ready **Express 5 + TypeScript** API template with validated environment config, PostgreSQL + Drizzle ORM, structured logging, and batteries-included error handling.

## Features

- **Express 5** with async-ready middleware
- **TypeScript** (ESM, `nodenext` module resolution, native `.ts` imports)
- **Environment validation** with Zod — fails fast on misconfiguration
- **Multi-stage environments** (`dev`, `test`, `staging`, `production`) with per-stage `.env` files
- **PostgreSQL** via `pg` + **Drizzle ORM** with schema migrations
- **Structured logging** with Pino + `pino-http`, automatic secret redaction
- **Security middleware**: Helmet, CORS, cookie-parser
- **Centralized error handling** with typed `AppError` classes and Zod validation error formatting
- **Health check** endpoint at `GET /api/v1/health`
- **Testing** with Vitest
- **Bun** package manager

## Project Structure

```
├── env.ts                  # Zod-validated environment config
├── drizzle.config.ts       # Drizzle Kit configuration
├── vitest.config.ts        # Test configuration
├── src/
│   ├── index.ts            # Server entrypoint
│   ├── app.ts              # Express app setup & middleware
│   ├── db/
│   │   ├── connection.ts   # PostgreSQL pool + Drizzle client
│   │   └── schema.ts       # Database schema (Drizzle)
│   ├── lib/
│   │   └── logger.ts       # Pino logger + HTTP logging
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── not-found.ts
│   ├── routes/             # API route definitions
│   └── shared/
│       └── errors.ts       # AppError base + typed HTTP errors
├── scripts/
│   └── test-db.ts          # Database connectivity check
└── tests/                  # Vitest test suites
```

## Requirements

- Node.js 20+ (or Bun)
- PostgreSQL

## Getting Started

1. Clone the repository and install dependencies:

   ```bash
   git clone <your-repo-url>
   cd express-template
   bun install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env.dev
   ```

   Then edit `.env.dev` with your values (at minimum `DATABASE_URL`).

3. Verify the database connection:

   ```bash
   bun run check-connection
   ```

4. Start the dev server:

   ```bash
   bun run dev
   ```

   The server runs at `http://localhost:3000` (or the `PORT` from your env file).

5. Hit the health check:

   ```bash
   curl http://localhost:3000/api/v1/health
   ```

## Environment Variables

| Variable       | Description                               | Default       |
| -------------- | ----------------------------------------- | ------------- |
| `HOST`         | Server host                               | `localhost`   |
| `PORT`         | Server port                               | `3000`        |
| `NODE_ENV`     | `development`, `test`, or `production`    | `development` |
| `APP_STAGE`    | `dev`, `test`, `staging`, or `production` | `dev`         |
| `CORS_ORIGIN`  | Comma-separated allowed CORS origins      | _(empty)_     |
| `DATABASE_URL` | PostgreSQL connection string              | _(required)_  |

The app loads stage-specific env files: `.env.dev`, `.env.test`, `.env.stage`, or `.env` (default/production).

## Database

Schema lives in `src/db/schema.ts`. Common commands:

```bash
# Generate migration files from schema changes
bun run db:generate

# Apply migrations to the database
bun run db:migrate

# Push schema directly (dev only)
bun run db:push
```

## Scripts

| Script                     | Description                      |
| -------------------------- | -------------------------------- |
| `bun run dev`              | Start dev server with hot reload |
| `bun run start`            | Start server (production)        |
| `bun run test`             | Run tests with Vitest            |
| `bun run test:coverage`    | Run tests with coverage report   |
| `bun run type-check`       | Type-check the project           |
| `bun run check-connection` | Verify PostgreSQL connection     |
| `bun run db:generate`      | Generate Drizzle migrations      |
| `bun run db:migrate`       | Apply Drizzle migrations         |
| `bun run db:push`          | Push schema to database (dev)    |

## License

ISC
