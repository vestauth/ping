const PORT = process.env.PORT || 3000
const PINGS = [
  {
    "lat": -4.098472282215965,
    "lng": 62.38327288776679,
    "altitude": 125.71757294600654
  },
  {
    "lat": 41.891724802649605,
    "lng": -52.948633450448966,
    "altitude": 171.65974334090905
  },
  {
    "lat": 55.46306459566543,
    "lng": -167.01908595628387,
    "altitude": 109.54863004944752
  }
]

const express = require('express')
const vestauth = require('vestauth')

const app = express()
app.use(express.json())

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
  PINGS.push(ping)
  res.json(ping)
})

app.get('/pings', (req, res) => {
  const ping = PINGS.pop()
  res.json(ping ? [ping] : [])
})

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Globe</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden; }
      #globe { width: 100%; height: 100%; position: relative; }
      #scanlines {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: repeating-linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.0) 0px,
          rgba(0, 0, 0, 0.0) 2px,
          rgba(0, 0, 0, 0.25) 3px
        );
        mix-blend-mode: multiply;
      }
    </style>
  </head>
  <body>
    <div id="globe">
      <div id="scanlines"></div>
    </div>
    <script src="https://unpkg.com/globe.gl"></script>
    <script>
      const globe = Globe()
        .backgroundColor('#071A12')
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
        .pointColor(d => 'rgba(58, 255, 134, ' + (d.opacity ?? 1) + ')')
        .pointRadius(d => d.r)
        .pointAltitude(d => d.altitude)
        .pointsMerge(false)
        (document.getElementById('globe'));

      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.35;
      globe.pointOfView({ altitude: 2.6 }, 0);

      const material = globe.globeMaterial();
      material.color.set('#173d2a');
      material.emissive.set('#0a1f15');
      material.emissiveIntensity = 0.15;
      material.shininess = 0.25;
      globe.atmosphereColor('#3AFF86');
      globe.atmosphereAltitude(0.08);

      const growDuration = 200;
      const holdDurationMs = 2000;
      const fadeDurationMs = 5000;
      const maxRadius = 0.12;
      const activePoints = [];
      globe.pointsData(activePoints);

      async function pullPings() {
        try {
          const res = await fetch('/pings');
          if (!res.ok) return;
          const batch = await res.json();
          if (!Array.isArray(batch) || batch.length === 0) return;
          for (let i = 0; i < batch.length; i += 1) {
            const p = batch[i];
            activePoints.push({
              lat: p.lat,
              lng: p.lng,
              altitude: 0,
              maxAltitude: p.altitude,
              r: maxRadius,
              opacity: 1,
              grown: false,
              start: performance.now(),
              born: performance.now()
            });
          }
        } catch (error) {
          console.log(error)
          // noop
        }
      }

      pullPings();
      setInterval(pullPings, 100);

      function animate() {
        const now = performance.now();
        let updated = false;
        for (let i = 0; i < activePoints.length; i += 1) {
          const p = activePoints[i];
          const age = now - p.born;
          const totalLifespanMs = growDuration + holdDurationMs + fadeDurationMs;
          if (age >= totalLifespanMs) {
            activePoints.splice(i, 1);
            i -= 1;
            updated = true;
            continue;
          }
          const fadeStart = growDuration + holdDurationMs;
          if (age >= fadeStart) {
            const fadeT = Math.min(1, (age - fadeStart) / fadeDurationMs);
            const nextOpacity = Math.max(0, 1 - fadeT);
            if (nextOpacity !== p.opacity) {
              p.opacity = nextOpacity;
              updated = true;
            }
            const nextAltitude = Math.max(0, p.maxAltitude * (1 - fadeT));
            if (nextAltitude !== p.altitude) {
              p.altitude = nextAltitude;
              updated = true;
            }
          }
          if (!p.grown && age <= growDuration) {
            const t = Math.min(1, age / growDuration);
            const nextAltitude = Math.min(p.maxAltitude, p.maxAltitude * t);
            if (nextAltitude !== p.altitude) {
              p.altitude = nextAltitude;
              updated = true;
            }
          } else if (!p.grown) {
            p.altitude = p.maxAltitude;
            p.grown = true;
            updated = true;
          }
        }

        if (updated) globe.pointsData(activePoints.slice());
        requestAnimationFrame(animate);
      }
      animate();
    </script>
  </body>
</html>`)
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
