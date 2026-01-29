# rainbow-timetravel-ts

A simple TypeScript/Express API to manage versioned records with SQLite.  
Supports storing historical versions of records and retrieving them by version or point-in-time.

---

## Features

- Create and update records while preserving version history
- Retrieve the latest version or a specific version
- Retrieve a record as of a specific timestamp
- List all versions of a record
- SQLite backend with `better-sqlite3`

---

## Setup

1. **Clone the repo**

```bash
git clone <your-repo-url>
cd rainbow-timetravel-ts
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment**

- Copy `.env.sample` to `.env`:

```bash
cp .env.sample .env
```

- Set `DB_PATH` in `.env` to the location of your SQLite database file (e.g., `./db/timetravel.db`). Optionally set `PORT` (default is `8000`):

```env
PORT=8000
DB_PATH=./db/timetravel.db
```

4. **Ensure database folder exists**

```bash
mkdir -p ./db
```

5. **Run locally**

```bash
npm run dev
```

The API will start at `http://localhost:<PORT>` (default `8000`).

---

## Project Structure

```
src/
├─ api/
│  ├─ records.ts       # v1 endpoints
│  └─ recordsV2.ts     # v2 endpoints with versioning
├─ middleware/
│  └─ validators.ts    # request validation
├─ utils/
│  ├─ db.ts            # SQLite connection & schema
│  └─ envconfig.ts     # environment configuration
```

---

## API Overview

### v1 Endpoints

- `GET /records/:id` – retrieve latest record (legacy)
- `POST /records/:id` – create or update record (legacy)

### v2 Endpoints

- `GET /records/:id` – latest version, optionally `?timestamp=<ISO>` to retrieve as of a point in time
- `GET /records/:id/versions` – list all versions of a record
- `GET /records/:id/versions/:version` – retrieve a specific version
- `POST /records/:id` – create a new version of a record

---

## Notes

- `records_versioned` table stores all historical versions
- v1 endpoints continue to work with legacy structure
- v2 endpoints allow querying by version or timestamp
- All POST requests create new versions in `records_versioned` while preserving history
- `created_at` is automatically set to SQLite `datetime('now')` on inserts
