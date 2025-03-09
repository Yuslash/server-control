import { useEffect, useState } from "react"

function App() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetch("http://localhost:5000/logs")
      .then(res => res.json())
      .then(data => setLogs(data))
  }, [])

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8765")

    socket.onopen = () => console.log("WebSocket connected!")
    socket.onmessage = event => {
      const newLog = JSON.parse(event.data)
      setLogs(prevLogs => [...prevLogs, newLog])
    }

    return () => socket.close()
  }, [])

  const getStatus = (status) => {
    if (status >= 200 && status < 300) return { text: "Success", bg: "bg-green-500" }
    if (status >= 400 && status < 500) return { text: "Failed", bg: "bg-yellow-500" }
    if (status >= 500) return { text: "Error", bg: "bg-red-500" }
    return { text: "Unknown", bg: "bg-gray-500" }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-300 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white mb-6">Server Logs</h1>

      <div className="w-full max-w-5xl space-y-4">
        {logs.map((log, index) => {
          const status = getStatus(log.responseStatus)
          return (
            <div
              key={index}
              className={`p-4 rounded-xl shadow-xl border-2 border-opacity-50 ${status.bg} bg-opacity-10 backdrop-blur-lg flex flex-col w-full`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-600">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full text-white ${status.bg}`}>
                    {status.text}
                  </span>
                  <span className="font-bold text-lg text-gray-100">{log.method}</span>
                  <span className="text-gray-400">{log.url}</span>
                </div>
                <span className="text-sm text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-4">
                <div className="text-gray-400 text-sm">
                  <span className="font-bold text-gray-200">Status Code:</span> {log.responseStatus}
                </div>
                <div className="text-gray-400 text-sm">
                  <span className="font-bold text-gray-200">Duration:</span> {log.durationMs} ms
                </div>
                <div className="text-gray-400 text-sm col-span-3">
                  <span className="font-bold text-gray-200">Response:</span> {JSON.parse(log.responseBody).message}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
