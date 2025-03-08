import json
import asyncio
import websockets
import aiofiles

LOG_FILE = "server-log.json"
CLIENTS = set()
LOG_LIMIT = 5  # Keep only the last 5 logs

async def load_json():
    try:
        async with aiofiles.open(LOG_FILE, "r") as file:
            content = await file.read()
            return json.loads(content) if content else []
    except (json.JSONDecodeError, FileNotFoundError):
        return []

async def save_json(logs):
    async with aiofiles.open(LOG_FILE, "w") as file:
        await file.write(json.dumps(logs, indent=2))

async def notify_clients(message):
    if CLIENTS:
        disconnected_clients = set()
        for client in CLIENTS:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)

        CLIENTS.difference_update(disconnected_clients)

async def watch_json():
    prev_data = await load_json()
    print("Listening for changes...")

    while True:
        await asyncio.sleep(1)  # Check every second
        current_data = await load_json()

        if len(current_data) > len(prev_data):  
            new_entries = current_data[len(prev_data):]

            # **Keep only the last 5 logs**
            if len(current_data) > LOG_LIMIT:
                current_data = current_data[-LOG_LIMIT:]  # Remove old logs
                await save_json(current_data)  # Save only last 5 logs

            for entry in new_entries:
                await notify_clients(json.dumps(entry))

            prev_data = current_data.copy()

async def handle_client(websocket):
    CLIENTS.add(websocket)
    
    try:
        # Send latest logs (only last 5)
        logs = await load_json()
        for log in logs:
            await websocket.send(json.dumps(log))

        await websocket.wait_closed()
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CLIENTS.remove(websocket)

async def main():
    server = await websockets.serve(handle_client, "localhost", 8765)
    print("WebSocket server running on ws://localhost:8765")

    asyncio.create_task(watch_json())  # Run log watcher
    await server.wait_closed()  # Keep server alive

if __name__ == "__main__":
    asyncio.run(main())
