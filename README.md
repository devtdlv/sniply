# Sniply

Local-first URL shortener and analytics application (Portfolio Project #2).

Milestone 1 covers secure shortening, redirects, and click recording. Milestone 2 adds a link management dashboard with search, sorting, pagination, and create-flow UX. Detailed analytics charts and QR codes remain out of scope.

## Stack

- Next.js (App Router)
- TypeScript (strict)
- React
- Tailwind CSS
- PostgreSQL
- Prisma
- Vitest

## Features

### Milestone 1

- Create short links via `POST /api/links`
- Optional custom aliases with conflict detection (`409`)
- Cryptographically random short codes when no alias is provided
- Redirect via `GET /:code` (`302`) with click event recording
- Destination validation that rejects unsafe schemes, credentials, localhost, and private/link-local network targets (including DNS-resolved addresses)

### Milestone 2

- Responsive SaaS-style dashboard at `/`
- Create links from a modal with validation, conflict, success, and pending states
- List links with destination, short code, short URL, created date, and total clicks
- Search by destination URL or short code
- Sort by newest, oldest, or most clicked
- Copy short URL to clipboard with confirmation
- Paginated `GET /api/links` backed by Prisma (default 10 per page, max 50)
- Loading, empty, and error states in the UI

## Prerequisites

- **Node.js 24 LTS** (recommended). `package.json` engines require `>=24.0.0`.
- PostgreSQL 14+ running locally
- npm 10+ (ships with current Node.js releases)

## Environment variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin used when returning `shortUrl` (no trailing slash), e.g. `http://localhost:3000` |

Example:

```bash
cp .env.example .env
```

## Local setup

```bash
# Install dependencies (also runs prisma generate via postinstall)
npm install

# Apply versioned Prisma migrations
npm run db:migrate:deploy

# Start the Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard.

For local schema iteration while developing new models, prefer `npm run db:migrate` (`prisma migrate dev`) over `db:push` so changes stay in versioned migrations.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint (flat config / ESLint CLI) |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Run Vitest suite once |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:migrate:deploy` | Apply pending migrations (existing DBs / CI) |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:push` | Push schema without a migration (legacy / emergency only) |

## API

### List links

`GET /api/links`

Query parameters:

| Param | Default | Description |
| --- | --- | --- |
| `q` or `search` | _(empty)_ | Case-insensitive match on destination or short code |
| `sort` | `newest` | `newest`, `oldest`, or `most_clicked` |
| `page` | `1` | 1-based page index |
| `pageSize` | `10` | Page size (max `50`) |

**200**

```json
{
  "items": [
    {
      "id": "clx...",
      "code": "docs",
      "destination": "https://example.com/path",
      "shortUrl": "http://localhost:3000/docs",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "clickCount": 4
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1,
  "sort": "newest",
  "search": ""
}
```

**400** invalid query parameters  
**500** unexpected server error

### Create a short link

`POST /api/links`

```json
{
  "destination": "https://example.com/path",
  "alias": "docs"
}
```

`alias` is optional.

**201**

```json
{
  "id": "clx...",
  "code": "docs",
  "destination": "https://example.com/path",
  "shortUrl": "http://localhost:3000/docs",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "clickCount": 0
}
```

**400** invalid body, invalid alias, or rejected destination  
**409** alias already in use

### Redirect

`GET /:code`

- **302** to the stored destination (records a `Click`)
- **404** unknown or reserved code
- **400** empty code

## URL validation policy

At creation time Sniply:

1. Requires an absolute `http:` or `https:` URL
2. Rejects embedded credentials (`user:pass@host`)
3. Rejects localhost and `*.localhost` hostnames
4. Rejects literal loopback / private / link-local / CGNAT / metadata addresses
5. Resolves the hostname via DNS and rejects any answer in those blocked ranges
6. Does **not** fetch the destination or follow redirect chains (avoids request-based SSRF)

Limitation: a destination that later redirects browsers to an internal host is outside creation-time control. Sniply validates what it stores; it does not proxy or sanitize third-party redirect behavior.

## Project layout

```text
prisma/schema.prisma                         Link + Click models
prisma/migrations/20261017213200_init/       Initial versioned migration
src/app/api/links/route.ts                   List + create API
src/app/[code]/route.ts                      Redirect handler
src/components/dashboard/                    Dashboard UI
src/lib/codes.ts                             Short codes + alias rules
src/lib/validate-url.ts                      Destination safety checks
src/lib/list-query.ts                        List query parsing
src/lib/links.ts                             Create / resolve / list / click logic
tests/                                       Vitest coverage
```

## Verification checklist

1. `npm install`
2. Configure `.env` from `.env.example`
3. `npm run db:migrate:deploy`
4. `npm test`
5. `npm run lint`
6. `npm run typecheck`
7. `npm run build`
8. `npm run dev`
9. Open `/`, create a link, confirm it appears in the table
10. Search, sort, paginate, and copy a short URL
11. Open a short URL and confirm redirect + click count increase after refresh
12. Retry a duplicate alias and confirm a clear conflict error

## Out of scope (later milestones)

- Detailed analytics charts
- QR codes
- Authentication, Redis, Docker, paid services, public deployment
