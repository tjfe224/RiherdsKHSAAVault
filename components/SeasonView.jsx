import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const YEARS = Array.from({ length: 25 }, (_, i) => 2024 - i)  // 2024 down to 2000

function GameRow({ game }) {
  const isTournament = !!game.tournament
  return (
    <div className={`game-row ${isTournament ? 'tournament' : ''}`}>
      <div className="game-teams">
        <Link to={`/team/${game.winner_id}`} className="winner">
          {game.winner_name}
        </Link>
        <span className="score">{game.winner_score} – {game.loser_score}</span>
        <Link to={`/team/${game.loser_id}`} className="loser">
          {game.loser_name}
        </Link>
      </div>
      {isTournament && (
        <span className="tournament-badge">
          {game.is_championship ? '🏆 Championship' : game.tournament}
        </span>
      )}
    </div>
  )
}

function DateGroup({ date, games }) {
  const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
  return (
    <div className="date-group">
      <h3 className="date-heading">{label}</h3>
      {games.map(g => <GameRow key={g.match_id} game={g} />)}
    </div>
  )
}

export default function SeasonView() {
  const [year, setYear]       = useState(2024)
  const [games, setGames]     = useState([])
  const [loading, setLoading] = useState(true)
  const [tourneyOnly, setTourneyOnly] = useState(false)

  useEffect(() => {
    setLoading(true)
    const url = `http://localhost:3001/api/games?year=${year}${tourneyOnly ? '&tournament=true' : ''}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setGames(data); setLoading(false) })
  }, [year, tourneyOnly])

  // Group games by date
  const byDate = games.reduce((acc, g) => {
    if (!acc[g.date]) acc[g.date] = []
    acc[g.date].push(g)
    return acc
  }, {})

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="season-view">
      <div className="season-controls">
        <h2>{year} KHSAA Boys Soccer</h2>
        <div className="controls-row">
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <label className="toggle">
            <input
              type="checkbox"
              checked={tourneyOnly}
              onChange={e => setTourneyOnly(e.target.checked)}
            />
            Tournament only
          </label>
        </div>
      </div>

      {loading
        ? <p className="loading">Loading...</p>
        : dates.length === 0
          ? <p className="empty">No games found for {year}.</p>
          : dates.map(date => (
              <DateGroup key={date} date={date} games={byDate[date]} />
            ))
      }
    </div>
  )
}
