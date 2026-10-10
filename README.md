# Power

[![Vercel](https://vercel.com/button)](https://vercel.com/new)
![Vercel](https://vercelbadge.vercel.app/api/pratham-ak2004/power)
[![GitHub stars](https://img.shields.io/github/stars/pratham-ak2004/power?style=flat)](https://github.com/pratham-ak2004/power/stargazers)
[![GitHub watchers](https://img.shields.io/github/watchers/pratham-ak2004/power?style=flat)](https://github.com/pratham-ak2004/power/watchers)

Power is a SvelteKit application for managing electricity meters, recording meter readings, and tracking electricity bills.

## Features

- Google authentication through Better Auth
- Meter creation and selection
- Meter reading entry and history
- Electricity bill entry and history
- Bill and reading validation with Zod and Superforms
- PostgreSQL persistence through Drizzle ORM
- Sortable, filterable, paginated data tables
- Light and dark theme support

## Requirements

- Node.js 20 or later
- npm
- PostgreSQL 14 or later, or Docker
- Google OAuth credentials

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/power
ORIGIN=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Used by docker-compose.yml when running PostgreSQL with Docker
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=power
```

`ORIGIN` must match the URL configured for the local development server. Configure the Google OAuth callback URL as:

```text
http://localhost:3000/api/auth/callback/google
```

### 3. Start PostgreSQL

Use an existing PostgreSQL instance, or start the included Docker service:

```sh
docker compose up -d postgres
```

### 4. Apply the database schema

For local development, push the current schema directly to the database:

```sh
npm run db:push
```

For migration-based workflows:

```sh
npm run db:generate
npm run db:migrate
```

### 5. Start the development server

```sh
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).
