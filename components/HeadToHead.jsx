import { useState } from 'react'
import { Link } from 'react-router-dom'

function TeamSearch({ label, onSelect }) {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)

  async function handleSearch(e) {
    const val = e.target.value
    setQuery(val)
    if (val.length < 2) { setResults([]); return }
    const data = await fetch(`http://localhost:3001/api/teams?q=${val}`).then(r => r.json())
    setResults(data)
  }

  function handleSelect(team) {
    setSelected(team)
    setQuery(team.name)
    setResults([])
    onSelect(team)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    onSelect(null)
  }

  return (
    <div className="team-search-input">
      <label>{label}</label>
      <div className="search-wrap">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search a school..."
          disabled={!!selected}
        />
        {selected && (
          <button className="clear-btn" onClick={handleClear}>✕</button>
        )}
        {results.length > 0 && (
          <ul className="search-dropdown">
            {results.map(t => (
              <li key={t.id} onClick={() => handleSelect(t)}>{t.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function HeadToHead() {
  const [team1, setTeam1] = useState(null)
  const [team2, setTeam2] = useState(null)
  const [data,  setData]  = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleCompare() {
    if (!team1 || !team2) return
    setLoading(true)
    const res = await fetch(`http://localhost:3001/api/head-to-head/${team1.id}/${team2.id}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  return (
    <div className="head-to-head">
      <h2>Head to Head</h2>

      <div className="h2h-selectors">
        <TeamSearch label="Team 1" onSelect={setTeam1} />
        <span className="vs-divider">vs</span>
        <TeamSearch label="Team 2" onSelect={setTeam2} />
      </div>

      <button
        className="compare-btn"
        onClick={handleCompare}
        disabled={!team1 || !team2 || loading}
      >
        {loading ? 'Loading...' : 'Compare'}
      </button>

      {data && (
        <div className="h2h-results">

          {/* ── Summary banner ── */}
          <div className="h2h-summary">
            <div className="h2h-team">
              <Link to={`/team/${data.team1.id}`}>
                <strong>{data.team1.name}</strong>
              </Link>
              <span className="h2h-wins">
                {data.summary[data.team1.name]} wins
              </span>
            </div>
            <div className="h2h-record">
              {data.summary[data.team1.name]} – {data.summary[data.team2.name]}
            </div>
            <div className="h2h-team right">
              <Link to={`/team/${data.team2.id}`}>
                <strong>{data.team2.name}</strong>
              </Link>
              <span className="h2h-wins">
                {data.summary[data.team2.name]} wins
              </span>
            </div>
          </div>

          {/* ── Game history ── */}
          <h3>All Meetings ({data.games.length})</h3>
          {data.games.length === 0
            ? <p className="empty">These teams have never met in our records.</p>
            : data.games.map(g => {
                const t1Won = g.winner_id === data.team1.id
                return (
                  <div key={g.match_id} className="game-row">
                    <span className="game-date">{g.date}</span>
                    <span className={`result-badge ${t1Won ? 'w' : 'l'}`}>
                      {t1Won ? `${data.team1.name} won` : `${data.team2.name} won`}
                    </span>
                    <span className="game-score">
                      {g.winner_score} – {g.loser_score}
                    </span>
                    {g.tournament && (
                      <span className="tournament-badge">
                        {g.is_championship ? '🏆' : '🎯'} {g.tournament}
                      </span>
                    )}
                  </div>
                )
              })
          }
        </div>
      )}
    </div>
  )
}
