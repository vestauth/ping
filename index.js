const PORT = process.env.PORT || 3000
const GEOS = []
let NEXT_GEO_ID = 1
const GEO_TTL_MS = 60 * 1000
const MAX_GEOS = 5000

const express = require('express')
const path = require('path')
const vestauth = require('vestauth')

const app = express()
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With')
  next()
})
app.options(/.*/, (req, res) => {
  res.sendStatus(204)
})

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

async function handleGeo (req, res) {
  try {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    const agent = await vestauth.tool.verify(req.method, url, req.headers)

    const geo = getGeo(req)
    const now = Date.now()
    const enriched = {
      ...geo,
      ts: now,
      id: NEXT_GEO_ID++,
      agent_id: agent.uid,
      agent_kid: agent.kid
    }
    GEOS.push(enriched)

    const json = {
      agent_uid: agent.uid,
      latitude: enriched.lat,
      longitude: enriched.lng,
      altitude_m: enriched.altitude
      // geo_id: enriched.id,
      // geo_timestamp: enriched.ts,
      // agent_well_known_url: agent.well_known_url,
      // agent_kid: agent.kid,
      // agent_public_jwk: agent.public_jwk
    }

    console.log(json)
    res.json(json)
  } catch (err) {
    res.status(401).json({ code: 401, error: { message: err.message }})
  }
}

// vestauth agent curl https://geo.vestauth.com/geo
app.post('/ping', handleGeo)
app.get('/ping', handleGeo)
app.post('/geo', handleGeo)
app.get('/geo', handleGeo)

app.get('/geos', (req, res) => {
  const now = Date.now()
  const since = Number(req.query.since || 0)

  // trim old and cap size
  while (GEOS.length && now - GEOS[0].ts > GEO_TTL_MS) {
    GEOS.shift()
  }
  if (GEOS.length > MAX_GEOS) {
    GEOS.splice(0, GEOS.length - MAX_GEOS)
  }

  const batch = since > 0
    ? GEOS.filter(p => p.ts > since || p.id > since)
    : GEOS.slice()

  res.json(batch)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
