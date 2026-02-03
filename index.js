const PORT = process.env.PORT || 3000
const PINGS = [
  {
    "lat": -4.098472282215965,
    "lng": 62.38327288776679,
    "altitude": 125.71757294600654,
    "ts": Date.now() - 5000,
    "id": 1
  },
  {
    "lat": 41.891724802649605,
    "lng": -52.948633450448966,
    "altitude": 171.65974334090905,
    "ts": Date.now() - 3000,
    "id": 2
  },
  {
    "lat": 55.46306459566543,
    "lng": -167.01908595628387,
    "altitude": 109.54863004944752,
    "ts": Date.now() - 1000,
    "id": 3
  }
]
let NEXT_PING_ID = 4
const PING_TTL_MS = 60 * 1000
const MAX_PINGS = 5000

const express = require('express')
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

app.get('/headers', (req, res) => {
  res.json(req.headers)
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
  res.json(enriched)
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

// app.post('/agent/auth', async (req, res) => {
//   try {
//     const authorization = req.headers.authorization // Agent PUBLIC_KEY:SIGNATURE
//     const result = await vestauth.verifyAgent(PROVIDER_PRIVATE_KEY, PROVIDER_CHALLENGE, authorization)
//
//     if (result.success) {
//       const message = String(req.body.message || '').slice(0, 280).trim()
//       const msg = {
//         public_key: result.public_key,
//         message: message,
//         created_at: new Date().toISOString()
//       }
//       MESSAGES.push(msg)
//
//       res.json(result)
//     } else {
//       res.status(401).json(result)
//     }
//   } catch (e) {
//     const error = {
//       code: 'UNKNOWN',
//       message: e.message
//     }
//     res.status(401).json({ error })
//   }
// })

// app.post('/agent/say', async (req, res) => {
//   try {
//     const authorization = req.headers.authorization // Agent PUBLIC_KEY:SIGNATURE
//     // `Open3.run('vestauth auth req.headers.authorization')` // and provider private key and provider challenge are set as environment variables
//     // vestauth provider new
//     // vestauth agent new
//     //
//     // vestauth provider auth public_key:signature
//     // vestauth agent auth --provider dotenvx
//     //
//     // vestauth agent send --agent agent_pub_1234
//     // vestauth agent recv --agent agent_pub_1234
//     //
//     // vestauth primitive keypair
//     // vestauth providers
//     // vestauth providers dotenvx set KEY value
//     // vestauth providers dotenvx get KEY value
//     //
//     const result = await vestauth.verifyAgent(PROVIDER_PRIVATE_KEY, PROVIDER_CHALLENGE, req.headers.authorization)
//
//     if (result.success) {
//       const message = String(req.body.message || '').slice(0, 280).trim()
//       const msg = {
//         public_key: result.public_key,
//         message: message,
//         created_at: new Date().toISOString()
//       }
//       MESSAGES.push(msg)
//
//       res.json(result)
//     } else {
//       res.status(401).json(result)
//     }
//   } catch (e) {
//     const error = {
//       code: 'UNKNOWN',
//       message: e.message
//     }
//     res.status(401).json({ error })
//   }
// })
// app.get('/messages', (req, res) => {
//   res.json(MESSAGES)
// })

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
