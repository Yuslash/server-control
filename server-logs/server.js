const express = require("express")
const mongoose = require("mongoose")
const { WebSocketServer } = require("ws")
const cors = require("cors")

const app = express()
const PORT = 5000
const WS_PORT = 8765

app.use(express.json())
app.use(cors())

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/logsDB")
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err))

// Define log schema
const logSchema = new mongoose.Schema({
    ip: String,
    time: Date,
    method: String,
    endpoint: String,
    message: String,
    statusCode: Number,
    status: String,
    statusColor: String
})
const Log = mongoose.model("Log", logSchema)

// WebSocket setup
const wss = new WebSocketServer({ port: WS_PORT })
const clients = new Set()
console.log(`✅ WebSocket server running on port ${WS_PORT}`)

wss.on("connection", async (ws) => {
    clients.add(ws)
    const recentLogs = await Log.find().sort({ _id: -1 }).limit(10)
    ws.send(JSON.stringify({ type: "RECENT_LOGS", data: recentLogs }))
    ws.on("close", () => clients.delete(ws))
})

// Notify WebSocket clients
function notifyClients(log) {
    const payload = { type: "NEW_LOG", data: log }
    clients.forEach(client => client.send(JSON.stringify(payload)))
}

// Middleware to capture response message
app.use((req, res, next) => {
    let originalWrite = res.write
    let originalEnd = res.end
    let chunks = []

    res.write = function (chunk) {
        chunks.push(Buffer.from(chunk))
        originalWrite.apply(res, arguments)
    }

    res.end = function (chunk) {
        if (chunk) chunks.push(Buffer.from(chunk))
        let rawResponse = Buffer.concat(chunks).toString("utf8")

        try {
            let parsedResponse = JSON.parse(rawResponse)
            res.locals.responseBody = parsedResponse.message || "Response Sent"
        } catch {
            res.locals.responseBody = rawResponse
        }

        originalEnd.apply(res, arguments)
    }
    next()
})

// Middleware to log requests
app.use(async (req, res, next) => {
    res.on("finish", async () => {
        let statusColor = "green-500", status = "Success"
        if (res.statusCode >= 400 && res.statusCode < 500) statusColor = "yellow-500", status = "Warning"
        else if (res.statusCode >= 500) statusColor = "red-500", status = "Error"

        const logEntry = new Log({
            ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            time: new Date(),
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

// Routes
app.get("/logs", async (req, res) => {
    const logs = await Log.find().sort({ _id: -1 }).limit(100)
    res.json({ logs, message: "Logs Fetched" })
})

app.get("/", (req, res) => res.json({ message: "Welcome to the server" }))
app.post("/submit", (req, res) => res.status(201).json({ message: "Data received" }))

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: `The route '${req.method} ${req.url}' does not exist.`,
        statusCode: 404,
        status: "Not Found"
    })
})

// Start Express server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))