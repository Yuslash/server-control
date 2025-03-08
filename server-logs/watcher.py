import json
import time
import asyncio
import websockets

LOG_FILE = "server-log.json"
CLIENTS = set()

async def load_json():
    try:
        with open(LOG_FILE, "r") as file:
            return json.load(file)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

async def notify_clients(message):
    if CLIENTS:
        await asyncio.gather(*(client.send(message) for client in CLIENTS))

async def watch_json():
    prev_data = await load_json()
    print("Listening for changes...")

    while True:
        await asyncio.sleep(1)
        current_data = await load_json()

        if len(current_data) > len(prev_data):
            new_entries = current_data[len(prev_data):]
            for entry in new_entries:
                print(f"New log added: {entry}")
                await notify_clients(json.dumps(entry))

            prev_data = current_data.copy()

async def handle_client(websocket):
    CLIENTS.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        CLIENTS.remove(websocket)

async def main():
    async with websockets.serve(handle_client, "localhost", 8765):
        await watch_json()

if __name__ == "__main__":
    asyncio.run(main())
