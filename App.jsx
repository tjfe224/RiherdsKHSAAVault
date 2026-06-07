import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import SeasonView  from './components/SeasonView'
import TeamPage    from './components/TeamPage'
import Standings   from './components/Standings'
import HeadToHead  from './components/HeadToHead'
import './App.css'

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  async function handleSearch(e) {
    const val = e.target.value
    setQuery(val)
    if (val.length < 2) { setResults([]); return }
    const data = await fetch(`http://localhost:3001/api/teams?q=${val}`).then(r => r.json())
    setResults(data)
  }

  function handleSelect(team) {
    setQuery('')
    setResults([])
    navigate(`/team/${team.id}`)
  }

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">⚽ The Vault</Link>

      <div className="nav-search">
        <input
          type="text"
          placeholder="Search a school..."
          value={query}
          onChange={handleSearch}
        />
        {results.length > 0 && (
          <ul className="search-dropdown">
            {results.map(t => (
              <li key={t.id} onClick={() => handleSelect(t)}>{t.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="nav-links">
        <Link to="/">Scores</Link>
        <Link to="/standings">Standings</Link>
        <Link to="/h2h">Head to Head</Link>
      </div>
    </nav>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="main">
        <Routes>
          <Route path="/"           element={<SeasonView />} />
          <Route path="/team/:id"   element={<TeamPage />}   />
          <Route path="/standings"  element={<Standings />}  />
          <Route path="/h2h"        element={<HeadToHead />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
