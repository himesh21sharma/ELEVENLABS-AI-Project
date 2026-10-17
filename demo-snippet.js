/**
 * Standalone Node.js script demonstration
 * 
 * Usage:
 *   node demo-snippet.js
 */

import { ElevenLabsClient, play } from './elevenlabs-client.js';

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY || "YOUR_API_KEY";

  const elevenlabs = new ElevenLabsClient({
    apiKey: apiKey,
  });

  console.log("Synthesizing narration with ElevenLabs...");

  const audio = await elevenlabs.textToSpeech.convert(
    'JBFqnCBsd6RMkjVDRZzb', // voice_id (George - Warm British Storyteller)
    {
      text: 'The first move is what sets everything in motion.',
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128', // output_format
    }
  );

  console.log("Audio generated successfully! Audio size:", audio.size, "bytes");

  // In Node.js environment, play() or write to an mp3 file
  if (typeof window !== 'undefined') {
    await play(audio);
  } else {
    // Save to disk when run in Node
    const fs = await import('fs');
    const buffer = Buffer.from(await audio.arrayBuffer());
    fs.writeFileSync('narration_output.mp3', buffer);
    console.log("Saved audio to narration_output.mp3!");
  }
}

if (process.env.ELEVENLABS_API_KEY) {
  main().catch(console.error);
} else {
  console.log("Tip: Set ELEVENLABS_API_KEY in your environment, or run this via the web UI at http://localhost:8080");
}
