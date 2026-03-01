/**
 * LivKit voice agent entrypoint.
 * Uses LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET (and OPENAI_API_KEY for STT/LLM/TTS).
 * Run: npm run start (or npm run dev). Dispatch from dashboard with agent name "livkit-voice-agent".
 */
import { defineAgent, cli, voice, ServerOptions } from "@livekit/agents";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as openai from "@livekit/agents-plugin-openai";
import * as silero from "@livekit/agents-plugin-silero";

export const AGENT_NAME = "livkit-voice-agent";

export default defineAgent({
  entry: async (ctx) => {
    await ctx.connect();

    const session = new voice.AgentSession({
      vad: await silero.VAD.load(),
      stt: new openai.STT({ model: "gpt-4o-transcribe" }),
      llm: new openai.LLM({ model: "gpt-4o-mini" }),
      tts: new openai.TTS({ model: "gpt-4o-mini-tts", voice: "ash" }),
    });

    const agent = new voice.Agent({
      instructions:
        "You are a friendly voice assistant for the LivKit dashboard. Keep responses brief and helpful.",
    });

    await session.start({ agent, room: ctx.room });
    await session.generateReply({
      instructions: "Greet the user briefly and ask how you can help.",
    });
  },
});

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  cli.runApp(
    new ServerOptions({
      agent: __filename,
      agentName: AGENT_NAME,
    })
  );
}
