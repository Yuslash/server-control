const express = require('express')
const mongoose = require('mongoose')
const { WebSocketServer } = require('ws')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/logsDB')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err))

// Define log schema
const logSchema = new mongoose.Schema({
    timestamp: String,
    method: String,
    url: String,
    headers: String,
    body: String,
    responseStatus: Number,
    responseBody: String,
    durationMs: Number
})

const Log = mongoose.model('Log', logSchema)

// WebSocket setup
const wss = new WebSocketServer({ port: 8765 })
const clients = new Set()
console.log('✅ WebSocket server running on port 8765')

wss.on('connection', (ws) => {
    clients.add(ws)
    ws.on('close', () => clients.delete(ws))
})

// Notify WebSocket clients
function notifyClients(log) {
    clients.forEach(client => client.send(JSON.stringify(log)))
}

// Middleware to log requests
app.use(async (req, res, next) => {
    const start = Date.now()

    let oldSend = res.send
    res.send = function (data) {
        try {
            let response = typeof data === 'object' ? JSON.stringify(data) : String(data)
            res.locals.responseBody = response.length > 10000 ? JSON.stringify({ message: "Response too large" }) : response
        } catch (error) {
            res.locals.responseBody = JSON.stringify({ message: "Invalid response" })
        }
        oldSend.apply(res, arguments)
    }

    res.on('finish', async () => {
        const logEntry = new Log({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            headers: JSON.stringify(req.headers),
            body: JSON.stringify(req.body),
            responseStatus: res.statusCode,
            responseBody: res.locals.responseBody,
            durationMs: Date.now() - start
        })

        await logEntry.save()
        notifyClients(logEntry)
    })

    next()
})

// Get past logs API
app.get('/logs', async (req, res) => {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100)
    res.json(logs)
})

// Sample routes
app.get('/', (req, res) => res.json({ message: 'Welcome to the server' }))
app.post('/submit', (req, res) => res.status(201).json({ message: 'Data received', data: req.body }))

// Start Express server
app.listen(5000, () => console.log('✅ Server running on port 5000'))
