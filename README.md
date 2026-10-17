# ElevenLabs Voice Studio 🎙️

A web-based AI Narration and Speech Synthesis Studio built with **HTML5, Vanilla CSS, and JavaScript**, powered directly by the **ElevenLabs API**.

![ElevenLabs Voice Studio](https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Key Features

1. **Official SDK Style Integration (`@elevenlabs/elevenlabs-js`)**:
   Built directly around the ElevenLabs JavaScript SDK syntax:
   ```javascript
   import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';

   const elevenlabs = new ElevenLabsClient({ apiKey: "YOUR_API_KEY" });

   const audio = await elevenlabs.textToSpeech.convert(
     'JBFqnCBsd6RMkjVDRZzb', // Voice ID (e.g. George)
     {
       text: 'The first move is what sets everything in motion.',
       modelId: 'eleven_multilingual_v2',
       outputFormat: 'mp3_44100_128',
     }
   );

   await play(audio);
   ```
   Uses native HTML5 `<script type="importmap">` so `@elevenlabs/elevenlabs-js` imports run natively in modern browsers with zero bundler or build step required!

2. **Model Selection Dropdown**:
   - **Eleven Multilingual v2**: State of the art emotional range across 29 languages.
   - **Eleven Flash v2.5**: Ultra-low ~75ms latency with 32 languages.
   - **Eleven Turbo v2.5**: High quality and fast processing across 32 languages.
   - **Eleven Flash v2** & **Eleven Turbo v2**: Ultra-fast English models.
   - **Eleven Multilingual v1** & **Eleven Monolingual v1**: Classic stable models.

3. **Output Format & Quality Selector**:
   - `mp3_44100_128` (Default standard CD quality)
   - `mp3_44100_192` (High-fidelity studio quality)
   - `mp3_44100_64` (Balanced streaming)
   - `mp3_22050_32` (Ultra compressed bandwidth saver)

4. **Custom Text Input & Presets**:
   - Multi-line textarea supporting full paragraphs, stories, and scripts.
   - Live Character & Word counter.
   - One-click presets including *"The first move is what sets everything in motion"*, *Epic Story*, *Tech Demo*, *Documentary*, and *Inspirational*.
   - Paste from clipboard and Clear buttons.

5. **Voice Actor Library**:
   - Preloaded with ElevenLabs' top voices: **George (`JBFqnCBsd6RMkjVDRZzb`)**, Rachel, Adam, Antoni, Bella, Sam, Arnold, Josh, Domi, Elli, Daniel, and Dorothy.
   - **Sync Button**: Automatically queries the ElevenLabs `/v1/voices` endpoint with your API key to fetch your custom cloned voices and community voice library!

4. **Fine-Tuning Controls (Collapsible)**:
   - **Stability Slider** (Expressive vs Stable).
   - **Clarity + Similarity Slider** (High vs Low fidelity).
   - **Style Exaggeration Slider** (Natural vs Dramatic).
   - **Speaker Boost Toggle**.

5. **Audio Studio Player & Canvas Visualizer**:
   - Real-time animated audio waveform visualizer powered by the Web Audio API.
   - Interactive Scrubber timeline with click-to-seek.
   - Play / Pause, Rewind 5s, Forward 5s controls.
   - Speed Selector (0.75x, 1x, 1.25x, 1.5x, 2x).
   - Volume control and Mute toggle.
   - **Download MP3** button for saving generated speech directly.

6. **Recent Generation History**:
   - Keeps track of clips generated during your session.
   - Instant replay of previous takes without consuming additional credits.

7. **Secure Local Storage**:
   - Your ElevenLabs API key is stored securely in your browser's `localStorage`.
   - Never sent to any third-party intermediary servers.
   - Includes live validation against your ElevenLabs account showing your subscription tier and characters remaining.

---

## 🚀 How to Run the Project

### Option 1: Open Directly in Any Modern Web Browser
Simply double-click [`index.html`](file:///c:/Users/himes/OneDrive/Desktop/elevenlabs/index.html) or right-click and choose **Open with > Chrome / Edge / Firefox / Safari**.

### Option 2: Run with a Local Web Server (Recommended)
If you have Node.js / npx or Python installed, you can serve the directory:

```bash
# Using Node (npx serve or live-server)
npx -y serve .

# OR using Python
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your browser.

---

## 🔑 Getting Your ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/) and create or log in to your account.
2. Click on your profile icon in the bottom-left corner and select **API Keys** (or go to Profile Settings).
3. Click **Create API Key**, give it a name, and copy the generated key.
4. In this app, click **Setup Key** or the **API Key** button in the top right.
5. Paste your key and click **Save & Apply** (you can also click **Test Connection** to check your character limit).

---

## ⌨️ Keyboard Shortcuts
- `Ctrl + Enter` (or `Cmd + Enter` on Mac): Instantly start narration synthesis.
- `Escape`: Close open modal windows.

---

## 📁 File Structure
- [`index.html`](file:///c:/Users/himes/OneDrive/Desktop/elevenlabs/index.html): Semantic HTML5 markup, accessible controls, modals, and player.
- [`style.css`](file:///c:/Users/himes/OneDrive/Desktop/elevenlabs/style.css): Vanilla CSS styling, responsive grid, glassmorphism design system.
- [`app.js`](file:///c:/Users/himes/OneDrive/Desktop/elevenlabs/app.js): Application logic, ElevenLabs API fetch, Web Audio visualizer, and player engine.
