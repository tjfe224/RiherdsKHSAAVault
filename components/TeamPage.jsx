import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function TeamPage() {
  const { id } = useParams()
  const [team, setTeam]       = useState(null)
  const [record, setRecord]   = useState([])
  const [games, setGames]     = useState([])
  const [year, setYear]       = useState('all')
  const [loading, setLoading] = useState(true)

  // Load team info + season-by-season record
  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:3001/api/teams/${id}`).then(r => r.json()),
      fetch(`http://localhost:3001/api/teams/${id}/record`).then(r => r.json()),
    ]).then(([teamData, recordData]) => {
      setTeam(teamData)
      setRecord(recordData)
    })
  }, [id])

  // Load games whenever team or year filter changes
  useEffect(() => {
    setLoading(true)
    const url = year === 'all'
      ? `http://localhost:3001/api/teams/${id}/games`
      : `http://localhost:3001/api/teams/${id}/games?year=${year}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setGames(data); setLoading(false) })
  }, [id, year])

  if (!team) return <p className="loading">Loading...</p>

  const allTimeWins   = record.reduce((s, r) => s + r.wins,   0)
  const allTimeLosses = record.reduce((s, r) => s + r.losses, 0)

  const years = record.map(r => r.year).sort((a, b) => b - a)

  return (
    <div className="team-page">

      {/* ── Header ── */}
      <div className="team-header">
        <h2>{team.name}</h2>
        <p className="all-time">
          All-Time Record: <strong>{allTimeWins}W – {allTimeLosses}L</strong>
        </p>
      </div>

      {/* ── Season-by-season record ── */}
      <div className="record-table-wrap">
        <h3>Season Records</h3>
        <table className="record-table">
          <thead>
            <tr><th>Year</th><th>W</th><th>L</th><th>Pct</th></tr>
          </thead>
          <tbody>
            {record.map(r => (
              <tr
                key={r.year}
                className={year === r.year ? 'active-row' : ''}
                onClick={() => setYear(r.year === year ? 'all' : r.year)}
                style={{ cursor: 'pointer' }}
              >
                <td>{r.year}</td>
                <td>{r.wins}</td>
                <td>{r.losses}</td>
                <td>{r.total > 0 ? ((r.wins / r.total) * 100).toFixed(1) + '%' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Click a row to filter games by that season</p>
      </div>

      {/* ── Game log ── */}
      <div className="game-log">
        <div className="game-log-header">
          <h3>{year === 'all' ? 'All Games' : `${year} Games`}</h3>
          {year !== 'all' && (
            <button onClick={() => setYear('all')}>Show all years</button>
          )}
        </div>

        {loading
          ? <p className="loading">Loading...</p>
          : games.length === 0
            ? <p className="empty">No games found.</p>
            : games.map(g => {
                const won  = g.winner_id === parseInt(id)
                const opp  = won ? g.loser_name  : g.winner_name
                const oppId = won ? g.loser_id   : g.winner_id
                const myScore  = won ? g.winner_score : g.loser_score
                const oppScore = won ? g.loser_score  : g.winner_score

                return (
                  <div key={g.match_id} className={`game-row ${won ? 'win' : 'loss'}`}>
                    <span className={`result-badge ${won ? 'w' : 'l'}`}>
                      {won ? 'W' : 'L'}
                    </span>
                    <span className="game-score">{myScore} – {oppScore}</span>
                    <span className="game-vs">vs</span>
                    <Link to={`/team/${oppId}`} className="game-opp">{opp}</Link>
                    <span className="game-date">{g.date}</span>
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
    </div>
  )
}
