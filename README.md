# Football Quest V1.3 — Bundesliga + Next Matches

This version fixes the localhost CORS problem by routing browser requests through the Vite development server.

## Request flow

React:
`/api/competitions/CL/matches?status=FINISHED&limit=15`

Vite proxy:
`https://api.football-data.org/v4/competitions/CL/matches?status=FINISHED&limit=15`

The API token is added by `vite.config.js`, so it is no longer stored in React/localStorage or exposed through a `VITE_...` browser variable.

## Setup

### 1. Extract this ZIP

Open a terminal in the extracted `football-quest-v1.2-proxy` folder.

### 2. Install packages

```bash
npm install
```

### 3. Create `.env.local`

Copy `.env.example` and rename the copy to:

`.env.local`

Then replace:

`FOOTBALL_DATA_TOKEN=PASTE_YOUR_TOKEN_HERE`

with your real football-data.org API token.

Do NOT use `VITE_FOOTBALL_API_TOKEN` in V1.2.

### 4. Start the app

```bash
npm run dev
```

Open the localhost URL Vite prints in the terminal, normally:

`http://localhost:5173`

## What you should see in DevTools

In the Network tab, requests should now look like:

`http://localhost:5173/api/competitions/CL/matches?status=FINISHED&limit=15`

That is correct in V1.2.

The browser talks to Vite on the same origin. Vite then sends the server-side request to football-data.org.

## Important

The Vite proxy is a development solution. For a public deployed app, use a server/serverless API route so the API key remains private.

Football data provided by the Football-Data.org API.


## V1.2.1 correction

The `limit=15` query parameter was removed from the **competition matches** request.

The current football-data.org v4 quickstart lists these filters for:
`/v4/competitions/{id}/matches`:

- dateFrom
- dateTo
- stage
- status
- matchday
- group
- season

It does not list `limit` for this competition subresource. The app now requests all FINISHED matches for the active season, sorts them newest-first in React, and displays only the latest 15.

Expected browser request:

`http://localhost:5173/api/competitions/CL/matches?status=FINISHED`


## V1.3 additions

- Added Bundesliga (`BL1`) with the GER button.
- Added a **Next Matches** tab.
- The Next Matches tab shows the next 10 fixtures for the selected competition.
- Upcoming fixtures include both `SCHEDULED` and `TIMED` match statuses.
- Fixtures are sorted soonest-first.
- Shows kickoff date/time in the browser's local timezone and matchday when supplied.
- The existing Vite proxy remains in place to avoid the browser CORS problem.

Competitions:
- Champions League (CL)
- Premier League (PL)
- La Liga (PD)
- Serie A (SA)
- Ligue 1 (FL1)
- Bundesliga (BL1)

## V1.3.1
Corrected the UI so the **Next Matches** button and its fixture panel are actually rendered.

## V1.3.2 — competition switching fix

Fixed a state bug in Next Matches. The previous version kept the first competition's
upcoming fixtures in memory, so Champions League fixtures could appear after switching
to Premier League, La Liga, Serie A, Ligue 1, or Bundesliga.

V1.3.2 clears `upcomingMatches` every time the selected competition changes, so the
Next Matches tab fetches fixtures for the newly selected competition.

The screen also now displays `Next <competition> Matches` above the fixtures so it is
easy to verify which league is being shown.
