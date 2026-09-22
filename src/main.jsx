import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Table2, ListOrdered, Lock, CalendarDays } from "lucide-react";
import "./styles.css";

const COMPETITIONS = [
  { code: "CL", name: "Champions League", short: "UCL", flag: "ucl" },
  { code: "PL", name: "Premier League", short: "ENG", flag: "eng" },
  { code: "PD", name: "La Liga", short: "ESP", flag: "esp" },
  { code: "SA", name: "Serie A", short: "ITA", flag: "ita" },
  { code: "FL1", name: "Ligue 1", short: "FRA", flag: "fra" },
  { code: "BL1", name: "Bundesliga", short: "GER", flag: "ger" }
];

async function apiFetch(path, { unfoldGoals = false } = {}) {
  const headers = { Accept: "application/json" };

  if (unfoldGoals) {
    headers["X-Unfold-Goals"] = "true";
  }

  // Separate the football-data path from its query parameters.
  const [pathname, queryString = ""] = path.replace(/^\//, "").split("?");

  const params = new URLSearchParams(queryString);
  params.set("path", pathname);

  let response;

  try {
    response = await fetch(`/api/football?${params.toString()}`, {
      headers
    });
  } catch (error) {
    throw new Error(`Network/API error: ${error.message}`);
  }

  const raw = await response.text();

  let body = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    // Preserve raw text for diagnostics.
  }

  if (!response.ok) {
    const detail =
      body?.message ||
      body?.error ||
      raw ||
      "No details returned";

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `HTTP ${response.status}: ${detail}. Check FOOTBALL_DATA_TOKEN in Vercel.`
      );
    }

    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  return body ?? {};
}

function formatDate(utcDate) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(utcDate));
}
function getCountryCode(nationality) {
  const codes = {
    England: "gb-eng",
    Scotland: "gb-sct",
    Wales: "gb-wls",
    "Northern Ireland": "gb-nir",

    France: "fr",
    Germany: "de",
    Spain: "es",
    Italy: "it",
    Portugal: "pt",
    Netherlands: "nl",
    Belgium: "be",
    Norway: "no",
    Sweden: "se",
    Denmark: "dk",
    Finland: "fi",
    Switzerland: "ch",
    Austria: "at",
    Poland: "pl",
    Ukraine: "ua",
    Croatia: "hr",
    Serbia: "rs",
    Slovenia: "si",
    Slovakia: "sk",
    Czechia: "cz",
    Hungary: "hu",
    Romania: "ro",
    Greece: "gr",
    Turkey: "tr",

    "Bosnia-Herzegovina": "ba",
    "Bosnia and Herzegovina": "ba",
    Guinea: "gn",

    Brazil: "br",
    Argentina: "ar",
    Uruguay: "uy",
    Colombia: "co",
    Ecuador: "ec",
    Chile: "cl",

    USA: "us",
    "United States": "us",
    Canada: "ca",
    Mexico: "mx",

    Japan: "jp",
    "South Korea": "kr",
    Australia: "au",

    Morocco: "ma",
    Algeria: "dz",
    Tunisia: "tn",
    Egypt: "eg",
    Senegal: "sn",
    Ghana: "gh",
    Nigeria: "ng",
    Cameroon: "cm",
    "Ivory Coast": "ci",
    "Côte d’Ivoire": "ci",
  };

  return codes[nationality];
}
function MatchCard({ match }) {
  const home = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
  const away = match.awayTeam?.shortName || match.awayTeam?.name || "Away";
  const score = match.score?.fullTime || {};
  const goals = Array.isArray(match.goals) ? match.goals : [];

  return (
    <article className="match-card">
      <div className="match-date">{formatDate(match.utcDate)}</div>
      <div className="teams">
        <div>{home}</div>
        <strong>{score.home ?? "-"} – {score.away ?? "-"}</strong>
        <div>{away}</div>
      </div>

      {goals.length > 0 && (
        <div className="goal-list">
          {goals.map((goal, index) => (
            <div
              className="goal-row"
              key={`${match.id}-${goal.minute}-${index}`}
            >
              ⚽ {goal.minute ? `${goal.minute}' ` : ""}
              {goal.scorer?.name || goal.player?.name || "Goal"}
              {goal.team?.name ? ` (${goal.team.name})` : ""}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function UpcomingCard({ match }) {
  const home = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
  const away = match.awayTeam?.shortName || match.awayTeam?.name || "Away";

  return <article className="match-card upcoming-card">
    <div className="match-date">{formatDate(match.utcDate)}</div>
    <div className="upcoming-teams">
      <div>{home}</div>
      <strong>VS</strong>
      <div>{away}</div>
    </div>
    {match.matchday ? <div className="muted small matchday">Matchday {match.matchday}</div> : null}
  </article>;
}

function Standings({ standings }) {
  if (!standings?.length) {
    return <p className="muted">No table data returned.</p>;
  }

  const total = standings.find((item) => item.type === "TOTAL") || standings[0];

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>MP</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {(total?.table || []).map((row) => (
            <tr key={row.team.id}>
              <td>{row.position}</td>
              <td className="team-name">{row.team.shortName || row.team.name}</td>
              <td>{row.playedGames}</td>
              <td>{row.won}</td>
              <td>{row.draw}</td>
              <td>{row.lost}</td>
              <td>{row.goalDifference}</td>
              <td><strong>{row.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scorers({ scorers, error }) {
  if (error) {
    return (
      <div className="locked">
        <Lock size={22} />
        <div>
          <strong>Scorer data unavailable</strong>
          <p className="muted small">{error}</p>
        </div>
      </div>
    );
  }

  if (!scorers?.length) {
    return <p className="muted">No scorer data returned.</p>;
  }

  return (
    <div>
      {scorers.map((item, index) => (
        <div className="scorer-row" key={item.player?.id || index}>
          <span className="rank">{index + 1}</span>
          <span>{item.player?.name || "Unknown"}
            <small className="player-country">
              {getCountryCode(item.player?.nationality) && (
                <img
                  className="player-flag"
                  src={`https://flagcdn.com/w40/${getCountryCode(
                    item.player.nationality
                  )}.png`}
                  alt={item.player.nationality}
                  title={item.player.nationality}
                />
              )}
            </small>

          </span>
          <strong>{item.goals ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [competition, setCompetition] = useState("CL");
  const [tab, setTab] = useState("matches");

  const [matches, setMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState(null);
  const [standings, setStandings] = useState(null);
  const [scorers, setScorers] = useState(null);

  const [loading, setLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState("");
  const [scorerError, setScorerError] = useState("");

  const current = useMemo(
    () => COMPETITIONS.find((item) => item.code === competition),
    [competition]
  );

  async function loadMatches() {
    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const data = await apiFetch(
        `/competitions/${competition}/matches?status=FINISHED`,
        { unfoldGoals: true }
      );

      const finished = (data.matches || [])
        .filter((match) => match.status === "FINISHED")
        .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));

      setMatches(finished.slice(0, 15));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUpcomingMatches() {
    setSectionLoading(true); setError("");
    try {
      const data = await apiFetch(`/competitions/${competition}/matches`);
      const upcoming = (data.matches || [])
        .filter(m => m.status === "SCHEDULED" || m.status === "TIMED")
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
        .slice(0, 10);
      setUpcomingMatches(upcoming);
    } catch (e) { setError(e.message); }
    finally { setSectionLoading(false); }
  }

  async function loadStandings() {
    setSectionLoading(true);
    setError("");

    try {
      const data = await apiFetch(`/competitions/${competition}/standings`);
      setStandings(data.standings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSectionLoading(false);
    }
  }

  async function loadScorers() {
    setSectionLoading(true);
    setScorerError("");

    try {
      const data = await apiFetch(`/competitions/${competition}/scorers?limit=10`);
      setScorers(data.scorers || []);
    } catch (err) {
      setScorerError(err.message);
      setScorers(null);
    } finally {
      setSectionLoading(false);
    }
  }

  useEffect(() => {
    setTab("matches");
    setUpcomingMatches(null);
    setStandings(null);
    setScorers(null);
    setScorerError("");
    setError("");
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition]);

  useEffect(() => {
    if (tab === "next" && !upcomingMatches) loadUpcomingMatches();
    if (tab === "table" && !standings) loadStandings();
    if (tab === "scorers" && !scorers && !scorerError) loadScorers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">ROMAN’S FOOTBALL HUB</div>
          <h1>European Football</h1>
          <p className="subtitle">Recent results, league tables and scorers.</p>
        </div>
      </header>

      <main>
        <div className="competition-row">
          {COMPETITIONS.map((item) => (
            <button
              key={item.code}
              className={`competition-btn ${competition === item.code ? "active" : ""}`}
              onClick={() => setCompetition(item.code)}
            >
              <span className={`league-badge ${item.flag}`}>
                {item.short}
              </span>
              <small>{item.name}</small>
            </button>
          ))}
        </div>

    
        <nav className="tabs">
          <button className={tab === "matches" ? "active" : ""} onClick={() => setTab("matches")}>
            Matches
          </button>
          <button className={tab === "next" ? "active" : ""} onClick={() => setTab("next")}>
            <CalendarDays size={16} /> Next Matches
          </button>
          <button className={tab === "table" ? "active" : ""} onClick={() => setTab("table")}>
            <Table2 size={16} /> Table
          </button>
          <button className={tab === "scorers" ? "active" : ""} onClick={() => setTab("scorers")}>
            <ListOrdered size={16} /> Top scorers
          </button>
        </nav>

        {error && (
          <div className="error">
            <strong>API error</strong>
            <div>{error}</div>
          </div>
        )}

        {tab === "matches" && (
          loading ? (
            <div className="loading">Loading matches…</div>
          ) : matches.length ? (
            <div className="match-grid">
              {matches.map((match) => <MatchCard key={match.id} match={match} />)}
            </div>
          ) : !error ? (
            <div className="empty">No finished matches were returned.</div>
          ) : null
        )}

        {tab === "next" && (
        <section>
          <div className="section-heading">
            <h3>Next {current.name} Matches</h3>
            <span className="muted small">Next 10 scheduled fixtures</span>
          </div>
          {sectionLoading && !upcomingMatches ? (
            <div className="loading">Loading next matches…</div>
          ) : upcomingMatches?.length ? (
            <div className="match-grid">
              {upcomingMatches.map((match) => (
                <UpcomingCard key={match.id} match={match} />
              ))}
            </div>
          ) : !error ? (
            <div className="empty">No upcoming matches were returned for {current.name}.</div>
          ) : null}
        </section>
      )}

        {tab === "table" && (
          <section className="panel">
            {sectionLoading && !standings
              ? <div className="loading">Loading table…</div>
              : <Standings standings={standings} />}
          </section>
        )}

        {tab === "scorers" && (
          <section className="panel">
            {sectionLoading && !scorers && !scorerError
              ? <div className="loading">Loading scorers…</div>
              : <Scorers scorers={scorers} error={scorerError} />}
          </section>
        )}

        <footer>
          Football data provided by the Football-Data.org API.
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
