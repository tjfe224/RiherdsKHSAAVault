const cheerio = require('cheerio')
const fs      = require('fs')
const path    = require('path')

// ─── CONFIG ───────────────────────────────────────────────────────────────────

// Where your per-date HTML files live
// Structure: html_pages/{year}/kybsc_{YYYY-MM-DD}.html
const HTML_DIR = './html_pages'

// Where to write the JSON output
const OUT_DIR  = './data'

// ─── PARSE ONE DATE FILE ──────────────────────────────────────────────────────
// Each file covers one specific date, so we can pull the date directly
// from the filename instead of hunting for it inside the HTML.

function parseFile(filePath, date, year) {
  const html   = fs.readFileSync(filePath, 'utf8')
  const $      = cheerio.load(html)
  const games  = []

  $('tr.game_data').each((_, row) => {
    const matchId = $(row).attr('match_id')
    if (!matchId) return

    // ── Winner ──
    const wCell = $(row).find('td.winner_team')
    const wHref = wCell.find('a').attr('href') || ''
    const wIdM  = wHref.match(/\/(\d+)$/)

    // ── Loser ──
    const lCell = $(row).find('td.loser_team')
    const lHref = lCell.find('a').attr('href') || ''
    const lIdM  = lHref.match(/\/(\d+)$/)
    const lRaw  = lCell.text().trim()

    // ── Location ──
    const isAway    = lRaw.startsWith('at ')
    const isNeutral = lRaw.startsWith('vs.')
    const neutralM  = lRaw.match(/\(at (.+?)\)/)

    // ── Tournament ──
    const comments     = $(row).find('td.date_comments')
    const tournament   = comments.find('a').text().trim() || null
    const isChampionship = comments.find('b').text().toLowerCase().includes('championship')

    games.push({
      matchId,
      date,
      year,
      gender: 'boys',
      winner: {
        name:  wCell.find('a').text().trim(),
        id:    wIdM ? wIdM[1] : null,
        score: parseInt($(row).find('td.winner_score').text().trim(), 10),
      },
      loser: {
        name:  lCell.find('a').text().trim(),
        id:    lIdM ? lIdM[1] : null,
        score: parseInt($(row).find('td.loser_score').text().trim(), 10),
      },
      location:      isAway ? 'away' : isNeutral ? 'neutral' : 'home',
      neutralSite:   neutralM ? neutralM[1].trim() : null,
      tournament,
      isChampionship,
    })
  })

  return games
}

// ─── DISCOVER ALL HTML FILES ──────────────────────────────────────────────────
// Walks html_pages/{year}/kybsc_{YYYY-MM-DD}.html

function discoverFiles(baseDir) {
  const files = []

  if (!fs.existsSync(baseDir)) {
    console.error(`❌ Directory not found: ${path.resolve(baseDir)}`)
    process.exit(1)
  }

  for (const yearDir of fs.readdirSync(baseDir).sort()) {
    const yearPath = path.join(baseDir, yearDir)
    if (!fs.statSync(yearPath).isDirectory()) continue

    const year = parseInt(yearDir, 10)
    if (isNaN(year)) continue

    for (const filename of fs.readdirSync(yearPath).sort()) {
      if (!filename.endsWith('.html')) continue

      // Support both naming conventions:
      //   kybsc_2024-08-12.html  (html_pages format)
      //   2024-08-12.html        (original_html format)
      const dateMatch =
        filename.match(/(\d{4}-\d{2}-\d{2})\.html$/)

      if (!dateMatch) continue

      const date = dateMatch[1]

      files.push({
        path: path.join(yearPath, filename),
        date,
        year,
      })
    }
  }

  return files
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('\n⚽ KHSAA Scraper — Per-Date Edition')

  const files = discoverFiles(HTML_DIR)
  console.log(`   Found ${files.length} HTML files across ${new Set(files.map(f => f.year)).size} seasons\n`)

  if (files.length === 0) {
    console.error('No HTML files found. Run fetch_all_dates.cjs first.')
    process.exit(1)
  }

  // ── Parse every file, deduplicate across the whole dataset ──
  const allGames     = []
  const globalSeen   = new Set()    // deduplicate match IDs across all files
  const gamesByYear  = {}

  let totalFiles = 0
  let totalDupes = 0

  for (const { path: filePath, date, year } of files) {
    const games = parseFile(filePath, date, year)

    if (!gamesByYear[year]) gamesByYear[year] = []

    for (const game of games) {
      if (globalSeen.has(game.matchId)) {
        totalDupes++
        continue
      }
      globalSeen.add(game.matchId)
      gamesByYear[year].push(game)
      allGames.push(game)
    }

    totalFiles++
  }

  // ── Write one JSON file per year ──
  const years = Object.keys(gamesByYear).sort()
  for (const year of years) {
    const games   = gamesByYear[year]
    const outFile = path.join(OUT_DIR, `boys_soccer_${year}.json`)
    fs.writeFileSync(outFile, JSON.stringify(games, null, 2))
    console.log(`  ✓ ${year}: ${games.length} games → ${outFile}`)
  }

  // ── Write combined file ──
  const allOut = path.join(OUT_DIR, 'all_games.json')
  fs.writeFileSync(allOut, JSON.stringify(allGames, null, 2))

  // ── Summary ──
  const yearRange = `${years[0]} – ${years[years.length - 1]}`
  console.log(`
✅ Done!
   Files processed:  ${totalFiles}
   Duplicates skipped: ${totalDupes}
   Total unique games: ${allGames.length}
   Years covered:    ${yearRange}
   Output folder:    ${path.resolve(OUT_DIR)}
`)
}

run()