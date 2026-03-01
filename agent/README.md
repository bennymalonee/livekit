# LivKit Voice Agent

Voice AI agent that connects to your LiveKit server. Uses [@livekit/agents](https://docs.livekit.io/agents/) (AgentsJS) with OpenAI (STT, LLM, TTS) and Silero VAD.

## Prerequisites

- **Node.js** 18+
- **LiveKit server** (same as your dashboard: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`)
- **OpenAI API key** (for STT/LLM/TTS): `OPENAI_API_KEY`

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | Yes | LiveKit server URL (e.g. `wss://your-livekit.example.com`) |
| `LIVEKIT_API_KEY` | Yes | LiveKit API key |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key for speech and LLM |

Create a `.env` file in the `agent/` directory or export them before running.

## Run locally

```bash
cd agent
npm install
npm run start
```

For development with watch mode:

```bash
npm run dev
```

The agent registers with the name **`livkit-voice-agent`**. To have it join a room, use **explicit dispatch** from the dashboard (Agents page: "Dispatch agent to room") or via the LiveKit API.

## Deploy (optional)

Run the agent as a separate process on your VPS (e.g. systemd, Docker, or Coolify). Use the same env vars as above. The dashboard can dispatch this agent to rooms when it is running and connected to your LiveKit server.

## Get a token and join a room

1. In the dashboard, open **Vault** and generate a token for a room (e.g. `my-room`).
2. Use the LiveKit client (e.g. [Meet](https://meet.livekit.io) or your app) with that token and URL to join the room.
3. From the dashboard **Agents** page, click "Dispatch agent to room" and enter the same room name. The agent will join and greet you.
