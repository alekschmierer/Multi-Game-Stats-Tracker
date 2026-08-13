# God Gamer

God Gamer is a multi-game stats tracker that pulls a player's competitive standing from Clash of Clans, Clash Royale, and League of Legends into a single lobby view. Each game's raw stats are normalized into a 0–100 composite score so accounts from unrelated ranking systems can be ranked against each other on one leaderboard. Player data is cached in Redis and persisted in MongoDB to stay within third-party API rate limits.

> The name is a nod to Ludwig Ahgren's God Gamer Gauntlet — same premise of settling who the best all-around gamer is, except decided by API data instead of a live competition.

## Table of Contents

- [Background](#background)
- [Scoring](#scoring)
- [Install](#install)
- [API](#api)
- [Progress Log](#progress-log)

## Background

Comparing players across different games is not a straightforward problem, because every game measures skill on its own scale. Clash of Clans reports a league tier and a Town Hall level, Clash Royale reports trophies and a Path of Legends result, and League of Legends reports a rank tier that maps to a population percentile. None of these are directly comparable, and a "who is the better gamer" question has no shared unit.

A second problem is data access. All three games are served by rate-limited third-party APIs — Supercell's for Clash of Clans and Clash Royale, and Riot's for League of Legends — and Riot requires an extra lookup step because ranked data is keyed by an internal PUUID rather than the Riot ID a player actually knows.

To solve these issues in the God Gamer project I included:

- **Score Normalization:** Each game gets its own weighted scoring function that maps its native stats onto a shared 0–100 scale. League of Legends is normalized against the real population distribution of each rank tier rather than a linear tier index, so a Diamond player scores relative to the ~2.5% of the playerbase at or above that rank.
- **Two-Tier Caching:** Redis serves as a hot in-memory cache with a one-hour TTL, and MongoDB stores a durable copy of every player document with a `lastUpdated` timestamp. A request only reaches the game's API if both the Redis key is cold and the Mongo document is older than 24 hours.
- **Identity Resolution:** Clash of Clans and Clash Royale share a `#PLAYERTAG` format and are keyed on the tag directly. League of Legends accounts are resolved from a `Name#Tag` Riot ID to a PUUID through the Riot Account API before ranked data is fetched, and the PUUID becomes the document key.
- **Upsert Writes:** Player documents are written with `updateOne(..., { upsert: true })`, so a first-time lookup and a refresh of an existing player are the same code path.

## Scoring

Each game has a weighted formula in `lib/getGameScore.ts` that returns an integer from 0 to 100. The lobby leaderboard ranks players by the sum of their three game scores, so a player who is tracked in all three games can outrank a specialist.

**Clash of Clans**

| Component | Weight |
| --- | --- |
| League tier | 50% |
| War stars (capped at 2000) | 15% |
| Clan Capital contributions (capped at 500k) | 15% |
| Builder Base trophies | 15% |
| Town Hall level | 5% |

**Clash Royale**

| Component | Weight |
| --- | --- |
| Trophies (against a 14,000 ceiling) | 40% |
| Path of Legends league number | 35% |
| Win rate | 25% |

**League of Legends**

| Component | Weight |
| --- | --- |
| Rank percentile | 95% |
| Win rate | 5% |

The rank percentile is derived from an approximate population table (Iron ≈ bottom 99%, Challenger ≈ top 0.02%), so the score reflects how rare a rank is rather than how many tiers sit below it.

## Install

### Prerequisites

* **Node.js:** Version 20+
* **Redis Server:** Reachable at `redis://localhost:6379`
* **MongoDB:** A local instance or an Atlas cluster
* **API Keys:** Supercell and Riot developer credentials (see below)

### API Keys

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `CLASH_OF_CLANS_API_TOKEN` | [developer.clashofclans.com](https://developer.clashofclans.com) | Tokens are bound to a whitelisted IP address |
| `CLASH_ROYALE_API_TOKEN` | [developer.clashroyale.com](https://developer.clashroyale.com) | Also IP-bound; a separate token from Clash of Clans |
| `RIOT_API_KEY` | [developer.riotgames.com](https://developer.riotgames.com) | Development keys expire every 24 hours |
| `MONGO_URI` | Local instance or MongoDB Atlas | Database name is `friend-stat-tracker` |

### Setup

Create a `.env.local` file in the project root:

```bash
MONGO_URI=mongodb://localhost:27017
CLASH_OF_CLANS_API_TOKEN=your_coc_token
CLASH_ROYALE_API_TOKEN=your_cr_token
RIOT_API_KEY=your_riot_key
```

Then start the dependencies and the dev server:

```bash
# Start Redis and MongoDB
sudo systemctl start redis-server
sudo systemctl start mongod

# Install dependencies and launch on port 3000
npm install
npm run dev
```

The app is available at `http://localhost:3000`.

### Usage

1. Enter your own display name and game tags in the **My Account** row.
2. Use **+ Add Friend** to add other players. Clash tags use the `#PLAYERTAG` format; League of Legends uses `Name#Tag`.
3. **God Gamer** ranks everyone in the lobby by combined score, and **Charts** compares them across metrics.

## API

#### Get Player by Clash Tag

Fetches a Clash of Clans player by tag, checking Redis and MongoDB before falling through to the Supercell API. Clash Royale shares the same `#PLAYERTAG` format, so this route can serve either game's tag lookup.

* **HTTP Method:** `GET`
* **Path:** `/api/player`
* **Query Parameters:**
  * `playerTag` (string) — The player tag to fetch, including the leading `#`.

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/player?playerTag=%23ABC123XY" \
     -H "Content-Type: application/json"
```

**Example Response (`200 OK`):**

```json
{
    "data": {
        "_id": "#ABC123XY",
        "name": "PlayerOne",
        "townHallLevel": 16,
        "trophies": 5240,
        "leagueTier": "Legend League",
        "builderBaseTrophies": 4100,
        "builderBaseLeague": "Titanium League I",
        "warStars": 1420,
        "clanCapitalContributions": 285000,
        "lastUpdated": "2026-08-05T18:22:11.043Z"
    },
    "error": null,
    "status": 200
}
```

**Example Response (`400 Bad Request`):**

```json
{
    "error": "Tag is missing from search parameters"
}
```

### Server Actions

Clash Royale and League of Legends lookups run as Next.js server actions rather than public routes, so API tokens never reach the browser. They are defined in `lib/actions.ts`:

| Action | Input | Returns |
| --- | --- | --- |
| `getPlayerByCOCTag(tag)` | `#PLAYERTAG` | Cached or freshly fetched `COCPlayer` |
| `getPlayerByCRTag(prevState, tag)` | `#PLAYERTAG` | `CRPlayer` from the Clash Royale API |
| `getPlayerCRData(prevState, formData)` | Form field `playerTag` | `CRPlayer`, served from Mongo if under 24h old |
| `getPUUIDBySummonerNameTag(prevState, riotId)` | `Name#Tag` | Riot account object containing the PUUID |
| `getPlayerRankedLoLData(prevState, formData)` | Form field `playerTag` | `LoLPlayer` ranked entry, keyed by PUUID |

Each action returns a `{ data, error, status }` shape so the calling component can render a loading, error, or success state without throwing.


Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, Chart.js, MongoDB, and Redis.

## Progress Log

<details>
<summary>Development snapshots, oldest to newest</summary>

**Barebones API requests and frontend** — initial Clash of Clans, Clash Royale, and League of Legends integration.

<img width="1910" alt="godgamer_1" src="https://github.com/user-attachments/assets/7df614d0-a8bc-462d-8fc4-81720192a504" />

**Player retrieval finished** — added a simple tabbed UI.

<img width="1910" alt="godgamer_2" src="https://github.com/user-attachments/assets/ec9a6e5f-c841-49e6-81ac-4ec177579e07" />

**Styling and stat cards.**

<img width="1905" alt="godgamer_3" src="https://github.com/user-attachments/assets/ebc7a183-7c87-41bc-b6d9-ff377ef3529d" />

**Scoring system** — first pass at the composite score. Open question: the games do not expose direct leaderboard endpoints, so ranking is computed locally from player stats.

<img width="1915" alt="godgamer_4" src="https://github.com/user-attachments/assets/e038a903-c230-45d3-8c3d-5f82a0ffdcb1" />

**Add Friend flow** — reusable form component shared by My Account and Add Friend.

<img width="1910" alt="Add friend modal" src="https://github.com/user-attachments/assets/5b59abe5-bd4f-40e8-8bea-8fbe14d09225" />

**Leaderboard.**

<img width="1913" alt="Leaderboard" src="https://github.com/user-attachments/assets/3f7c3547-d5a7-46c5-b39e-196d575737b2" />

**Exploratory charts** — score heatmap, cross-game scatter explorer, and win/loss dumbbell chart.

<img width="2550" alt="Charts" src="https://github.com/user-attachments/assets/9d325562-3907-47b9-97c7-51d9efd2e256" />

</details>
