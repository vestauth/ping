const PORT = process.env.PORT || 3000
const PINGS = []

const express = require('express')
const vestauth = require('vestauth')

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ ping: "me" })
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
