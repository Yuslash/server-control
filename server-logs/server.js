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
    ip: String,
    time: Date,  // Store actual timestamp
    method: String,
    endpoint: String,
    message: String,
    statusCode: Number,
    status: String,
    statusColor: String
})

const Log = mongoose.model('Log', logSchema)

// WebSocket setup
const wss = new WebSocketServer({ port: 8765 })
const clients = new Set()
console.log('✅ WebSocket server running on port 8765')

wss.on('connection', async (ws) => {
    clients.add(ws)
    const recentLogs = await Log.find().sort({ _id: -1 }).limit(10)
    ws.send(JSON.stringify({ type: "RECENT_LOGS", data: recentLogs }))
    ws.on('close', () => clients.delete(ws))
})

// Notify WebSocket clients
function notifyClients(log) {
    const payload = { type: "NEW_LOG", data: log }
    clients.forEach(client => client.send(JSON.stringify(payload)))
}

// Middleware to log requests
app.use(async (req, res, next) => {
    const start = Date.now()
    res.on('finish', async () => {
        let statusColor = "green-500", status = "Success"
        if (res.statusCode >= 400 && res.statusCode < 500) statusColor = "yellow-500", status = "Warning"
        else if (res.statusCode >= 500) statusColor = "red-500", status = "Error"

        const logEntry = new Log({
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            time: new Date(), // Store actual timestamp
            method: req.method,
            endpoint: req.url,
            message: res.locals.responseBody || "Response Sent",
            statusCode: res.statusCode,
            status,
            statusColor
        })

        await logEntry.save()
        notifyClients(logEntry)
    })
    next()
})

// Get past logs API
app.get('/logs', async (req, res) => {
    const logs = await Log.find().sort({ _id: -1 }).limit(100)
    res.json(logs)
})

// Sample routes
app.get('/', (req, res) => res.json({ message: 'Welcome to the server' }))
app.post('/submit', (req, res) => res.status(201).json({ message: 'Data received' }))

// Start Express server
app.listen(5000, () => console.log('✅ Server running on port 5000'))
