const PORT = process.env.PORT || 3000
const PINGS = []

const express = require('express')
const vestauth = require('vestauth')

const app = express()
app.use(express.json())

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
        .pointColor(() => '#3AFF86')
        .pointRadius(d => d.r)
        .pointAltitude(d => d.alt)
        .pointsMerge(true)
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

      const maxAlt = 0.25;
      const lifespanMs = 8000;
      const fadeDurationMs = 3000;
      const maxRadius = 0.08;
      const growDuration = 500;
      const allPoints = Array.from({ length: 500 }, () => ({
        lat: Math.random() * 180 - 90,
        lng: Math.random() * 360 - 180
      }));

      const initialCount = 10;
      const activePoints = allPoints.slice(0, initialCount).map(p => ({
        ...p,
        alt: maxAlt,
        r: maxRadius,
        start: 0,
        born: performance.now()
      }));
      globe.pointsData(activePoints);

      let shown = initialCount;
      const interval = setInterval(() => {
        if (shown >= allPoints.length) {
          clearInterval(interval);
          return;
        }
        const p = allPoints[shown];
        activePoints.push({
          ...p,
          alt: 0,
          r: maxRadius,
          start: performance.now(),
          born: performance.now()
        });
        shown += 1;
      }, 100);

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animate() {
        const now = performance.now();
        let updated = false;
        for (let i = 0; i < activePoints.length; i += 1) {
          const p = activePoints[i];
          const age = now - p.born;
          if (age >= lifespanMs) {
            activePoints.splice(i, 1);
            i -= 1;
            updated = true;
            continue;
          }
          const fadeStart = Math.max(0, lifespanMs - fadeDurationMs);
          const nextRadius = age <= fadeStart
            ? maxRadius
            : Math.max(0, maxRadius * (1 - (age - fadeStart) / fadeDurationMs));
          if (nextRadius !== p.r) {
            p.r = nextRadius;
            updated = true;
          }
          if (p.alt < maxAlt) {
            const t = Math.min(1, (now - p.start) / growDuration);
            const nextAlt = maxAlt * easeOutCubic(t);
            if (nextAlt !== p.alt) {
              p.alt = nextAlt;
              updated = true;
            }
          }
        }
        if (updated) globe.pointsData(activePoints);
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
