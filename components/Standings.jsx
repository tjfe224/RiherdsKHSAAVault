import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const YEARS = Array.from({ length: 25 }, (_, i) => 2024 - i)

export default function Standings() {
  const [year, setYear]           = useState(2024)
  const [standings, setStandings] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:3001/api/standings/${year}`)
      .then(r => r.json())
      .then(data => { setStandings(data); setLoading(false) })
  }, [year])

  return (
    <div className="standings">
      <div className="season-controls">
        <h2>{year} Standings</h2>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading
        ? <p className="loading">Loading...</p>
        : <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>School</th>
                <th>W</th>
                <th>L</th>
                <th>GP</th>
                <th>Win %</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr key={t.id}>
                  <td className="rank">{i + 1}</td>
                  <td>
                    <Link to={`/team/${t.id}`}>{t.name}</Link>
                  </td>
                  <td>{t.wins}</td>
                  <td>{t.losses}</td>
                  <td>{t.total}</td>
                  <td>{t.total > 0
                    ? ((t.wins / t.total) * 100).toFixed(1) + '%'
                    : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  )
}
