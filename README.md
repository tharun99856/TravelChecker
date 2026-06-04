# TravelChecker

> Multi-modal travel comparison engine for India - aggregates flights, trains, buses, cabs, and personal vehicles across 117 cities, with multi-leg journey routing and weighted scoring.

Built as a **Model Context Protocol (MCP) server** so it can be plugged into Claude Desktop, Cursor, or any MCP-compatible AI agent as a tool. Also ships with a REST API and a web dashboard.

![Stack](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-1.29-FF6B35)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Why this exists

Most travel apps only show direct routes. Search "Khammam to Delhi" and you'll see slow trains - but never the fact that the fastest option is actually a **cab to Vijayawada airport + a flight from there**.

TravelChecker fixes this. It finds the nearest transport hub (airport / railway station) for any city and constructs complete multi-leg journeys, then ranks them all by your priorities.

---

## Features

- **5 travel modes**: Flight, Train, Bus, Cab (Ola/Uber/Auto/Rapido), Personal Vehicle (Petrol/Diesel/Bike)
- **117 Indian cities** across all 28 states + UTs
- **Multi-leg routing** - auto-finds nearest airport/station for non-hub cities
- **Live API data**:
  - Google Maps Distance Matrix (real road distances)
  - Travelpayouts/Aviasales (live flight prices + booking links)
  - IRCTC RapidAPI (live train schedules + fares)
  - AbhiBus HTTP scrape (bus options)
- **Weighted scoring**: tune price/time/comfort sliders to match your trip style
- **Smart insights**: surge warnings, fuel-vs-cab savings, train-vs-flight tradeoffs - on every option
- **Graceful fallbacks**: every provider has a modeled backup so the app never breaks when an API quota runs out
- **Production-ready**:
  - SQLite cache for Google Maps responses (saves API quota)
  - Per-IP rate limiting (30 req/min)
  - OpenAPI/Swagger docs at `/docs`
  - Per-session quota (5 searches per browser tab) to protect free-tier APIs

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR-USERNAME/travelchecker.git
cd travelchecker
npm install
```

### 2. Add API keys

```bash
cp .env.example .env
```

Then edit `.env`:

```bash
GOOGLE_MAPS_API_KEY=your_key       # console.cloud.google.com -> Distance Matrix API
TRAVELPAYOUTS_TOKEN=your_token     # travelpayouts.com -> Affiliate dashboard
TRAVELPAYOUTS_MARKER=your_marker
RAPIDAPI_KEY=your_key              # rapidapi.com -> IRCTC19 API (free tier)
```

> All four APIs have free tiers. The app works with just `GOOGLE_MAPS_API_KEY` - the others gracefully fall back to realistic modeled data.

### 3. Run

```bash
npm run start:http        # Web dashboard at http://localhost:3001
npm run start             # Stdio MCP server (for Claude Desktop)
```

Open `http://localhost:3001` for the dashboard, or `http://localhost:3001/docs` for Swagger.

---

## Use it from Claude Desktop

Add this to your `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "travelchecker": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/travelchecker/src/index.ts"
      ],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_key",
        "TRAVELPAYOUTS_TOKEN": "your_token",
        "TRAVELPAYOUTS_MARKER": "your_marker",
        "RAPIDAPI_KEY": "your_key"
      }
    }
  }
}
```

Restart Claude Desktop. Now you can ask:

> "What's the cheapest way to get from Khammam to Delhi tomorrow if I care most about price?"

Claude will call `get_routes`, then `compare_options` with your weights, then `recommend` - and reply with the top pick + alternatives.

---

## Use it from Cursor

In Cursor settings, add to your MCP config:

```json
{
  "mcpServers": {
    "travelchecker": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/travelchecker/src/index.ts"]
    }
  }
}
```

---

## Architecture

```
        ┌──────────────────────────────────┐
        │   Client (Web / Claude / Cursor) │
        └──────────────┬───────────────────┘
                       │
       ┌───────────────┼─────────────────┐
       │               │                 │
   REST API        MCP stdio         MCP SSE
       │               │                 │
       └───────────────┼─────────────────┘
                       │
              ┌────────▼─────────┐
              │   MCP Server     │
              │  (3 tools)       │
              │  get_routes      │
              │  compare_options │
              │  recommend       │
              └────────┬─────────┘
                       │
        ┌──────────────┼───────────────┐
        │              │               │
   Providers       Scoring         Hub Finder
   (5 modes)       Engine          (multi-leg)
        │
   ┌────┴────────────────────────────────┐
   │ Flight  Train  Bus  Cab  Personal   │
   │  ↓       ↓      ↓    ↓     ↓        │
   │ Live -> Live -> Scrp ->Model->Model │
   │  ↓       ↓      ↓    ↓     ↓        │
   │ Mock    Mock   Mock  -     -        │
   └─────────────────────────────────────┘
```

### Scoring model

For each option:

```
priceScore  = 100 * (1 - (fare - minFare) / (maxFare - minFare))
timeScore   = 100 * (1 - (duration - minTime) / (maxTime - minTime))
composite   = (weightPrice * priceScore)
            + (weightTime  * timeScore)
            + (weightComfort * comfortIndex)
```

Comfort index is a static table per sub-mode (e.g. `flight_business: 95`, `bus_non_ac: 35`).

### Multi-leg routing

When the origin (or destination) has no airport/station, the hub finder:

1. Scans all cities in the database
2. Filters to ones that have an airport (for flights) or station (for trains)
3. Picks the closest one within 500 km (airports) or 300 km (stations)
4. Generates a connecting cab leg, then the main transport leg, then a final cab leg if needed

Example: `Khammam -> Delhi` (flight)
- Khammam has no airport
- Nearest airport: Vijayawada (179 km)
- Final journey: `Khammam -> [cab, Rs.2228] -> Vijayawada -> [flight, Rs.4019] -> Delhi`

---

## API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze-route` | POST | Get all options + recommendation for a route |
| `/api/locations` | GET | List all 117 supported cities |
| `/api/book-flight` | POST | Generate Travelpayouts booking redirect URL |
| `/api/health` | GET | Service health + which providers are configured |
| `/api/rate-limit` | GET | Google Maps quota usage |
| `/docs` | GET | Interactive Swagger UI |
| `/sse` | GET | MCP server-sent events transport |

Full schema at `http://localhost:3001/docs` once running.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript |
| Runtime | Node.js 22 |
| Server | Express 5 |
| MCP | `@modelcontextprotocol/sdk` 1.29 |
| Validation | Zod 4 |
| Cache | better-sqlite3 |
| HTTP | axios |
| Scraping | cheerio |
| Docs | swagger-ui-express |
| Frontend | Vanilla JS, no framework |

---

## Deployment

The included `Dockerfile` works on any container host. One-click deploy options:

- **Railway**: New Project -> Deploy from GitHub repo -> add env vars -> done
- **Render**: New Web Service -> connect repo -> Docker -> add env vars

After deploy, set `TRAVELPAYOUTS_HOST` to your deployed domain - the live flight API requires it for affiliate attribution.

---

## License

MIT
