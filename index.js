const PORT = process.env.PORT || 3000
const PINGS = []
let NEXT_PING_ID = 1
const PING_TTL_MS = 60 * 1000
const MAX_PINGS = 5000

const express = require('express')
const path = require('path')
const vestauth = require('vestauth')

const app = express()
app.use(express.json())
app.use(express.static('public'))

function randomLatLng () {
  const u = Math.random()
  const v = Math.random()

  const lat = Math.asin(2 * u - 1) * (180 / Math.PI)
  const lng = 360 * v - 180

  return { lat, lng }
}

function getGeo (req) {
  const _rand = randomLatLng()
  const lat = Number(req.headers['cf-iplatitude'] || _rand.lat)
  const lng = Number(req.headers['cf-iplongitude'] || _rand.lng)
  const altitude = 200 * (0.5 + Math.random() * 0.5)

  return {
    lat,
    lng,
    altitude
    // city: req.headers['cf-ipcity'] || null,
    // region: req.headers['cf-region-code'] || null,
    // country: req.headers['cf-ipcountry'] || null,
    // timezone: req.headers['cf-timezone'] || null,
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.post('/', (req, res) => {
  const ping = getGeo(req)
  const now = Date.now()
  const enriched = {
    ...ping,
    ts: now,
    id: NEXT_PING_ID++
  }
  PINGS.push(enriched)
  res.json({ id: enriched.id, ts: enriched.ts })
})

app.get('/ping', (req, res) => {
  const ping = getGeo(req)
  const now = Date.now()
  const enriched = {
    ...ping,
    ts: now,
    id: NEXT_PING_ID++
  }
  PINGS.push(enriched)
  res.json({ id: enriched.id, ts: enriched.ts })
})

app.get('/pings', (req, res) => {
  const now = Date.now()
  const since = Number(req.query.since || 0)

  // trim old and cap size
  while (PINGS.length && now - PINGS[0].ts > PING_TTL_MS) {
    PINGS.shift()
  }
  if (PINGS.length > MAX_PINGS) {
    PINGS.splice(0, PINGS.length - MAX_PINGS)
  }

  const batch = since > 0
    ? PINGS.filter(p => p.ts > since || p.id > since)
    : PINGS.slice()

  res.json(batch)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
