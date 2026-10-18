# Sniply

Local-first URL shortener and analytics application (Portfolio Project #2).

Milestone 1 covers secure shortening, redirects, and click recording. Milestone 2 adds a link management dashboard. Milestone 3 adds click analytics and downloadable QR codes.

## Stack

- Next.js (App Router)
- TypeScript (strict)
- React
- Tailwind CSS
- PostgreSQL
- Prisma
- Vitest
- `qrcode` (local QR generation, no external service)

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

### Milestone 3

- Dashboard analytics overview: total links, total clicks, clicks in range, and a responsive bar chart
- Date filters: `7d`, `30d`, and `all`
- Per-link analytics page at `/links/:code` with destination, short URL, created date, totals, and chart
- Local QR preview and PNG download for each short URL
- Server-side click aggregation from existing `Click` rows (no schema changes)

## Analytics timezone convention

All analytics day buckets and range windows use **UTC calendar days**.

- Day keys are `YYYY-MM-DD` in UTC
- `7d` / `30d` include today (UTC) and the previous 6 / 29 UTC days
- `all` spans from the first click day through today (UTC); empty when there are no clicks
- API responses include `"timezone": "UTC"`

## Prerequisites

- **Node.js 24 LTS** (recommended). `package.json` engines require `>=24.0.0`.
- PostgreSQL 14+ running locally
- npm 10+ (ships with current Node.js releases)

## Environment variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin used when returning `shortUrl` and encoding QR codes (no trailing slash), e.g. `http://localhost:3000` |

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

### Overview analytics

`GET /api/analytics?range=7d|30d|all`

Returns totals plus a UTC day series:

```json
{
  "timezone": "UTC",
  "range": "7d",
  "totalLinks": 12,
  "totalClicks": 40,
  "rangeClicks": 9,
  "series": [{ "date": "2026-03-09", "clicks": 2 }]
}
```

### Per-link analytics

`GET /api/analytics/:code?range=7d|30d|all`

Returns link metadata, totals, and the UTC day series for that link.

### QR code PNG

`GET /api/links/:code/qr`

- **200** `image/png` attachment encoding the short URL
- **404** unknown or reserved code

### Create a short link

`POST /api/links`

```json
{
  "destination": "https://example.com/path",
  "alias": "docs"
}
```

`alias` is optional.

**201** returns `id`, `code`, `destination`, `shortUrl`, `createdAt`, `clickCount`.

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
src/app/api/analytics/                       Overview + per-link analytics
src/app/api/links/[code]/qr/                 QR PNG download
src/app/links/[code]/page.tsx                Per-link analytics + QR UI
src/components/dashboard/                    Dashboard UI
src/components/analytics/                    Charts and range filters
src/components/qr/                           QR preview card
src/lib/analytics.ts                         UTC aggregation helpers
src/lib/qr.ts / qr-encode.ts                 QR URL validation + encoding
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
9. Open `/`, create a link, confirm analytics overview updates after clicks
10. Open **Analytics** on a row, change date ranges, download the QR PNG
11. Scan or open the short URL and confirm click counts increase after refresh

## Out of scope (later milestones)

- Authentication
- Referrer / device / geo breakdowns
- Redis, Docker, paid services, public deployment
