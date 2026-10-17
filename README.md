# Sniply

Local-first URL shortener and analytics application (Portfolio Project #2).

Milestone 1 covers core shortening: secure link creation, short-code and custom-alias allocation, redirect handling, destination validation, and focused automated tests. Dashboard, analytics UI, and QR codes are intentionally out of scope for this milestone.

## Stack

- Next.js (App Router)
- TypeScript (strict)
- React
- Tailwind CSS
- PostgreSQL
- Prisma
- Vitest

## Features (Milestone 1)

- Create short links via `POST /api/links` or the minimal home form
- Optional custom aliases with conflict detection (`409`)
- Cryptographically random short codes when no alias is provided
- Redirect via `GET /:code` (`302`) with click event recording
- Destination validation that rejects unsafe schemes, credentials, localhost, and private/link-local network targets (including DNS-resolved addresses)

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally
- npm

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

# Create the database schema
npm run db:push

# Start the Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run Vitest suite once |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:migrate` | Create/apply Prisma migrations |

## API

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
  "createdAt": "2026-01-01T00:00:00.000Z"
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
prisma/schema.prisma          Link + Click models
src/app/api/links/route.ts    Create API
src/app/[code]/route.ts       Redirect handler
src/lib/codes.ts              Short codes + alias rules
src/lib/validate-url.ts       Destination safety checks
src/lib/links.ts              Create / resolve / click logic
tests/                        Vitest coverage for Milestone 1
```

## Verification checklist

1. `npm install`
2. Configure `.env` from `.env.example`
3. `npm run db:push`
4. `npm test`
5. `npm run dev`
6. Create a link from the home page or:

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d "{\"destination\":\"https://example.com\"}"
```

7. Open the returned `shortUrl` and confirm a `302` redirect to the destination
8. Retry the same custom alias and confirm `409`
9. Try `http://127.0.0.1/` and confirm `400`

## Out of scope (later milestones)

- Analytics dashboard / charts
- QR codes
- Authentication, Redis, Docker, paid services, public deployment
