const puppeteer = require('puppeteer')
const cheerio   = require('cheerio')
const path      = require('path')
const fs        = require('fs')

const BASE_URL = 'https://scoreboard.12dt.com/scoreboard/khsaa'
const OUT_DIR  = './html_pages'
const DELAY_MS = 2000

const SPORTS = [
  { code: 'bsc', label: 'Boys Soccer'  },
  //{ code: 'gsc', label: 'Girls Soccer' },
]

const START_YEAR = 2000
const END_YEAR   = 2006

// Helpers

const sleep = ms => new Promise(r => setTimeout(r, ms))

const getUrl      = (code, year, date) => {
    if(year > 2006){
        return `${BASE_URL}/ky${code}${String(year).slice(-2)}/?id=${date}`;
    }else{
        return `${BASE_URL}/ky${code}${String(year).slice(-1)}/?id=${date}`;
    }
}
const getFilename = (code, year, date) => `html_pages/${year}/ky${code}_${date}.html`

// PARSER
function getPageDates(html) {
  const $ = cheerio.load(html)
  const dates = []

  $('select.date_list').find('option').each((_, option) => {
    if($(option).attr('value') != ''){
        dates.push($(option).attr('value'));
    }
  })
  return dates;
}

function buildPageList() {
  const pages = []
  for (const sport of SPORTS) {
    for (let year = START_YEAR; year <= END_YEAR; year++) {
        let yearURL = `html_pages/state/ky${sport.code}${String(year).slice(-2)}.html`;
        let dates = getPageDates(fs.readFileSync(yearURL, 'utf8'));
        if (!fs.existsSync(OUT_DIR+"/"+year)) fs.mkdirSync(OUT_DIR+"/"+year, { recursive: true })
        for (const date of dates){
            pages.push({
                url:   getUrl(sport.code, year, date),
                file:  getFilename(sport.code, String(year), date),
                label: `${sport.label} ${date}`,
            })
        }
    }
  }
  return pages
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
    const pages = buildPageList()

    console.log('\n🏟️  KHSAA 12dt Archiver')
    console.log(`   ${pages.length} pages to fetch`)
    console.log(`   Saving to: ${path.resolve(OUT_DIR)}\n`)
    console.log(pages[0].file);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    let saved = 0, skipped = 0, failed = 0

    for (const { url, file, label } of pages) {

        if (fs.existsSync(file)) {
        console.log(`  ↩  Already saved: ${label}`)
        skipped++
        continue
        }
        
        process.stdout.write(`  ⬇  Fetching: ${label}...`)

        try {
            const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })
            const status   = response.status()

            if (status === 404) {
                console.log(' 404 — no data for this year')
                failed++
            } else if (status !== 200) {
                console.log(` HTTP ${status} — skipping`)
                failed++
            } else {
                const html = await page.content()
                if (!html.includes('game_data')) {
                console.log(' ⚠️  No game data found — skipping')
                failed++
                } else {
                fs.writeFileSync(file, html, 'utf8')
                const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)
                console.log(` ✓  Saved (${kb} KB)`)
                saved++
                }
            }
        } catch (err) {
        console.log(` ✗  Error: ${err.message}`)
        failed++
        }

        await sleep(DELAY_MS)
  }

  //await browser.close()

  console.log(`\n✅ Done!`)
  console.log(`   Saved:   ${saved} pages`)
  console.log(`   Skipped: ${skipped} (already existed)`)
  console.log(`   Failed:  ${failed} (404s or no data)`)
  console.log(`\n📁 Files saved to: ${path.resolve(OUT_DIR)}`)
  console.log(`   Next: run node scrape_khsaa.js to convert to JSON\n`)
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})