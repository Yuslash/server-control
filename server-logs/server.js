const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(express.json())

const logFilePath = path.join(__dirname, 'server-log.json')

// Middleware to log all requests & responses
app.use((req, res, next) => {
    const start = Date.now()
    const { method, url, headers, body } = req

    res.on('finish', () => { // Fires only once when response is sent
        const logEntry = {
            timestamp: new Date().toISOString(),
            method,
            url,
            headers,
            body,
            responseStatus: res.statusCode,
            durationMs: Date.now() - start
        }

        // Read existing logs, append new log, and write back to file
        let logs = []
        if (fs.existsSync(logFilePath)) {
            const fileContent = fs.readFileSync(logFilePath, 'utf8')
            if (fileContent.trim()) {
                logs = JSON.parse(fileContent)
            }
        }

        logs.push(logEntry)

        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8')
    })

    next()
})

// Sample routes
app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the server' })
})

app.post('/submit', (req, res) => {
    res.status(201).json({ message: 'Data received', data: req.body })
})

// Start server
app.listen(3000, () => console.log('Server running on port 3000'))
