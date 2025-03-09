import { useEffect, useState } from "react"
const { ipcRenderer } = window.require("electron") // ✅ Import IPC Renderer

export default function GpuUsage() {
    const [ramUsage, setRamUsage] = useState(0)

    useEffect(() => {
        const fetchRamUsage = async () => {
            const usage = await ipcRenderer.invoke("get-ram-usage") // ✅ Use IPC to fetch RAM data
            setRamUsage(usage)
        }

        fetchRamUsage()
        const interval = setInterval(fetchRamUsage, 2000) // Update every 2 seconds

        return () => clearInterval(interval) // Cleanup on unmount
    }, [])

    return (
        <div className="system-logs-panel min-w-[331px] min-h-[183px] max-h-[183px] flex flex-col justify-center rounded-lg p-8">
            <div className="flex gap-3.5 items-center">
                <img className="w-8 h-8 object-cover" src="/gpu-svgrepo-com.svg" />
                <span className="panel-title">RAM Usage</span>
            </div>

            <div className="flex items-center justify-center w-full gap-2.5">
                <div className="flex items-end">
                    <span className="cpu-percentage">{ramUsage}</span>
                    <p className="cpu-symbol-percentage">%</p>
                </div>

                <div className={`health-checker text-sm border px-3 py-1 ${
                    ramUsage < 50 ? "border-green-500 text-green-500"
                    : ramUsage < 75 ? "border-yellow-500 text-yellow-500"
                    : "border-red-500 text-red-500"
                }`}>
                    {ramUsage < 50 ? "Good" : ramUsage < 75 ? "Medium" : "High"}
                </div>
            </div>
        </div>
    )
}
