/**
 * ElevenLabs Client & Play SDK
 * Universal browser-compatible implementation of @elevenlabs/elevenlabs-js
 * Supports:
 * - window.ElevenLabsClient & window.play (standard script tags without CORS module blockers)
 * - elevenlabs.textToSpeech.convert(voiceId, options)
 * - elevenlabs.voices.getAll()
 * - elevenlabs.user.getSubscription()
 * - play(audio) function with Web Audio API support
 */

(function(global) {
  'use strict';

  const API_BASE = 'https://api.elevenlabs.io/v1';

  /**
   * Event target for broadcasting audio events
   */
  const audioEvents = new EventTarget();

  /**
   * ElevenLabs Client Class
   */
  class ElevenLabsClient {
    constructor({ apiKey } = {}) {
      this.apiKey = apiKey || '';
      
      // Text to Speech module
      this.textToSpeech = {
        convert: async (voiceId, options = {}) => {
          if (!this.apiKey || !this.apiKey.trim()) {
            throw new Error('ElevenLabs API key is missing. Please save your API key in the Setup Key bar.');
          }

          const {
            text,
            modelId = 'eleven_multilingual_v2',
            model_id,
            outputFormat = 'mp3_44100_128',
            output_format,
            voiceSettings,
            voice_settings
          } = options;

          if (!text || !text.trim()) {
            throw new Error('Text is required for narration synthesis.');
          }

          const effectiveModelId = modelId || model_id || 'eleven_multilingual_v2';
          const effectiveFormat = outputFormat || output_format || 'mp3_44100_128';

          const requestBody = {
            text: text.trim(),
            model_id: effectiveModelId
          };

          const settings = voiceSettings || voice_settings;
          if (settings) {
            requestBody.voice_settings = {
              stability: settings.stability !== undefined ? settings.stability : 0.5,
              similarity_boost: settings.similarityBoost !== undefined ? settings.similarityBoost : (settings.similarity_boost !== undefined ? settings.similarity_boost : 0.75),
              style: settings.style !== undefined ? settings.style : 0.0,
              use_speaker_boost: settings.useSpeakerBoost !== undefined ? settings.useSpeakerBoost : (settings.use_speaker_boost !== undefined ? settings.use_speaker_boost : true)
            };
          }

          const url = `${API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(effectiveFormat)}`;

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'xi-api-key': this.apiKey.trim(),
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`;
            try {
              const errData = await response.json();
              if (errData?.detail?.message) {
                errorMessage = errData.detail.message;
              } else if (errData?.detail?.status) {
                errorMessage = `${errData.detail.status}: ${errData.detail.message || ''}`;
              } else if (typeof errData?.detail === 'string') {
                errorMessage = errData.detail;
              }
            } catch (_) {}
            throw new Error(errorMessage);
          }

          const blob = await response.blob();
          blob.voiceId = voiceId;
          blob.modelId = effectiveModelId;
          blob.text = text;
          blob.outputFormat = effectiveFormat;
          return blob;
        }
      };

      // Voices module
      this.voices = {
        getAll: async () => {
          if (!this.apiKey || !this.apiKey.trim()) {
            throw new Error('API Key required to fetch voices.');
          }

          const response = await fetch(`${API_BASE}/voices`, {
            headers: { 'xi-api-key': this.apiKey.trim() }
          });

          if (!response.ok) {
            let errText = `Failed to fetch voices (${response.status})`;
            try {
              const errJson = await response.json();
              if (errJson?.detail?.message) errText = errJson.detail.message;
            } catch (_) {}
            throw new Error(errText);
          }

          const data = await response.json();
          return data.voices || [];
        }
      };

      // User / Subscription module
      this.user = {
        getSubscription: async () => {
          if (!this.apiKey || !this.apiKey.trim()) {
            throw new Error('API Key required to fetch subscription details.');
          }

          const response = await fetch(`${API_BASE}/user`, {
            headers: { 'xi-api-key': this.apiKey.trim() }
          });

          if (!response.ok) {
            let errText = `Invalid API key (${response.status})`;
            try {
              const errJson = await response.json();
              if (errJson?.detail?.message) errText = errJson.detail.message;
            } catch (_) {}
            throw new Error(errText);
          }

          return await response.json();
        }
      };
    }
  }

  let sharedAudioElement = null;

  function getSharedAudioElement() {
    if (!sharedAudioElement) {
      sharedAudioElement = document.getElementById('audioElement') || new Audio();
    }
    return sharedAudioElement;
  }

  /**
   * play(audio) function matching the official ElevenLabs SDK
   */
  async function play(audio) {
    const audioEl = getSharedAudioElement();

    let audioUrl;
    if (typeof audio === 'string') {
      audioUrl = audio;
    } else if (audio instanceof Blob) {
      audioUrl = URL.createObjectURL(audio);
    } else if (audio && typeof audio.blob === 'function') {
      const b = await audio.blob();
      audioUrl = URL.createObjectURL(b);
    } else {
      throw new Error('Unsupported audio format passed to play()');
    }

    audioEl.src = audioUrl;

    audioEvents.dispatchEvent(new CustomEvent('audioplay', {
      detail: {
        audio,
        url: audioUrl,
        element: audioEl
      }
    }));

    try {
      await audioEl.play();
    } catch (err) {
      console.warn('Audio auto-play prevented by browser policy (user gesture needed):', err);
    }

    return audioEl;
  }

  // Export to global scope for browser compatibility
  global.ElevenLabsClient = ElevenLabsClient;
  global.play = play;
  global.audioEvents = audioEvents;
  global.getSharedAudioElement = getSharedAudioElement;

})(typeof window !== 'undefined' ? window : globalThis);
