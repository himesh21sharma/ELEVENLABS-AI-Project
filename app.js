/**
 * ElevenLabs Voice Studio — Main Application Script
 * 
 * Works 100% offline, locally via file://, and over http://localhost:8080
 * Uses universal ElevenLabsClient & play()
 */

(function () {
  'use strict';

  // Grab global ElevenLabsClient and play
  const ElevenLabsClient = window.ElevenLabsClient;
  const play = window.play;
  const audioEvents = window.audioEvents;
  const getSharedAudioElement = window.getSharedAudioElement;

  const STORAGE_KEY = 'elevenlabs_api_key';

  /**
   * Bulletproof storage that never throws in restricted file:// or private windows
   */
  const safeStorage = {
    getItem(key) {
      try {
        const val = localStorage.getItem(key);
        if (val) return val;
      } catch (_) {}
      return window.__memStorage?.[key] || '';
    },
    setItem(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch (_) {}
      if (!window.__memStorage) window.__memStorage = {};
      window.__memStorage[key] = val;
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
      if (window.__memStorage) delete window.__memStorage[key];
    }
  };

  // Preset text samples
  const SAMPLE_TEXTS = {
    motion: "The first move is what sets everything in motion.",
    story: "Deep within the silent reaches of the ancient forest, beneath trees older than memory itself, a quiet light began to pulse. It was not fire, nor dawn, but a forgotten magic stirring once again after ten thousand years of slumber.",
    tech: "Introducing ElevenLabs Studio: an ultra-realistic, low-latency narration synthesis engine designed for modern creators, developers, and storytellers. Transform any text into breathtakingly lifelike speech with a single click.",
    nature: "Beneath the obsidian swells of the Arctic Sea, silence is not the absence of sound, but a vast, resonant acoustic chamber where the distant calls of humpback whales travel across hundreds of leagues of icy water.",
    quotes: "The future does not belong to the faint-hearted. It belongs to the brave, the curious, and those who dare to build what others can only imagine."
  };

  // Model metadata details
  const MODEL_INFO = {
    eleven_multilingual_v2: {
      tag: "Multilingual v2",
      desc: "Cutting-edge flagship model supporting 29 languages with unmatched emotional depth and nuance."
    },
    eleven_flash_v2_5: {
      tag: "Flash v2.5 ⚡",
      desc: "Ultra-low ~75ms latency with 32 languages. Tailored for conversational AI and real-time streaming."
    },
    eleven_turbo_v2_5: {
      tag: "Turbo v2.5 🚀",
      desc: "High quality and fast processing across 32 languages. Excellent balance of speed and fidelity."
    },
    eleven_flash_v2: {
      tag: "Flash v2",
      desc: "Fast, efficient English narration model."
    },
    eleven_turbo_v2: {
      tag: "Turbo v2",
      desc: "Low-latency English-only synthesis."
    },
    eleven_multilingual_v1: {
      tag: "Multilingual v1",
      desc: "Classic multilingual model supporting 10+ languages."
    },
    eleven_monolingual_v1: {
      tag: "Monolingual v1",
      desc: "Original standard English voice synthesis model."
    }
  };

  // Application State
  const state = {
    apiKey: safeStorage.getItem(STORAGE_KEY) || '',
    currentAudioBlob: null,
    currentAudioUrl: null,
    isPlaying: false,
    isGenerating: false,
    history: [],
    voices: [],
    audioContext: null,
    analyser: null,
    sourceNode: null,
    visualizerAnimationId: null
  };

  // DOM Elements Cache
  const el = {
    // API Banner & Controls
    apiKeyBanner: document.getElementById('apiKeyBanner'),
    bannerApiKeyInput: document.getElementById('bannerApiKeyInput'),
    bannerSaveBtn: document.getElementById('bannerSaveBtn'),
    bannerSetupBtn: document.getElementById('bannerSetupBtn'),
    bannerKeyStatusBadge: document.getElementById('bannerKeyStatusBadge'),
    bannerDesc: document.getElementById('bannerDesc'),

    // API Modal
    toggleApiKeyModalBtn: document.getElementById('toggleApiKeyModalBtn'),
    closeApiKeyModalBtn: document.getElementById('closeApiKeyModalBtn'),
    apiKeyModal: document.getElementById('apiKeyModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleApiKeyVisibility: document.getElementById('toggleApiKeyVisibility'),
    eyeIcon: document.getElementById('eyeIcon'),
    testApiKeyBtn: document.getElementById('testApiKeyBtn'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    testSpinner: document.getElementById('testSpinner'),
    keyValidationStatus: document.getElementById('keyValidationStatus'),
    accountInfoBox: document.getElementById('accountInfoBox'),
    userTier: document.getElementById('userTier'),
    userCharRemaining: document.getElementById('userCharRemaining'),
    headerKeyDot: document.getElementById('headerKeyDot'),
    headerKeyLabel: document.getElementById('headerKeyLabel'),

    // Text Input & Presets
    textInput: document.getElementById('textInput'),
    pasteBtn: document.getElementById('pasteBtn'),
    clearBtn: document.getElementById('clearBtn'),
    charCount: document.getElementById('charCount'),
    wordCount: document.getElementById('wordCount'),
    samplePills: document.querySelectorAll('.sample-pill'),

    // Configuration Selectors
    modelSelect: document.getElementById('modelSelect'),
    modelInfoTag: document.getElementById('modelInfoTag'),
    modelDescription: document.getElementById('modelDescription'),
    voiceSelect: document.getElementById('voiceSelect'),
    voiceDescription: document.getElementById('voiceDescription'),
    outputFormatSelect: document.getElementById('outputFormatSelect'),
    formatInfoTag: document.getElementById('formatInfoTag'),
    refreshVoicesBtn: document.getElementById('refreshVoicesBtn'),
    toggleSettingsBtn: document.getElementById('toggleSettingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),

    // Voice Dynamics Sliders
    stabilitySlider: document.getElementById('stabilitySlider'),
    stabilityVal: document.getElementById('stabilityVal'),
    similaritySlider: document.getElementById('similaritySlider'),
    similarityVal: document.getElementById('similarityVal'),
    styleSlider: document.getElementById('styleSlider'),
    styleVal: document.getElementById('styleVal'),
    speakerBoostToggle: document.getElementById('speakerBoostToggle'),

    // Action Button
    narrateBtn: document.getElementById('narrateBtn'),
    narrateBtnText: document.getElementById('narrateBtnText'),

    // Player & Visualizer
    audioElement: getSharedAudioElement(),
    visualizerCanvas: document.getElementById('visualizerCanvas'),
    visualizerPlaceholder: document.getElementById('visualizerPlaceholder'),
    playbackDot: document.getElementById('playbackDot'),
    playerStatusBadge: document.getElementById('playerStatusBadge'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIconSvg: document.getElementById('playIconSvg'),
    pauseIconSvg: document.getElementById('pauseIconSvg'),
    rewindBtn: document.getElementById('rewindBtn'),
    forwardBtn: document.getElementById('forwardBtn'),
    playbackSpeedSelect: document.getElementById('playbackSpeedSelect'),
    volumeSlider: document.getElementById('volumeSlider'),
    muteBtn: document.getElementById('muteBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    scrubberBar: document.getElementById('scrubberBar'),
    scrubberProgress: document.getElementById('scrubberProgress'),
    scrubberHandle: document.getElementById('scrubberHandle'),
    currentTime: document.getElementById('currentTime'),
    totalDuration: document.getElementById('totalDuration'),
    metaVoice: document.getElementById('metaVoice'),
    metaModel: document.getElementById('metaModel'),
    metaDuration: document.getElementById('metaDuration'),

    // History
    historyToggleBtn: document.getElementById('historyToggleBtn'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    historyCount: document.getElementById('historyCount'),

    // Toast container
    toastContainer: document.getElementById('toastContainer')
  };

  /**
   * Format Seconds to M:SS
   */
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Toast notification system
   */
  function showToast(message, type = 'info', duration = 4000) {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Update API Key UI State everywhere
   */
  function updateApiKeyStatus() {
    const hasKey = Boolean(state.apiKey && state.apiKey.trim().length > 3);
    
    if (el.apiKeyInput) el.apiKeyInput.value = state.apiKey;
    if (el.bannerApiKeyInput) el.bannerApiKeyInput.value = state.apiKey;

    if (hasKey) {
      if (el.apiKeyBanner) el.apiKeyBanner.classList.add('connected');
      if (el.bannerKeyStatusBadge) {
        el.bannerKeyStatusBadge.textContent = 'Key Active ✓';
        el.bannerKeyStatusBadge.className = 'status-badge-inline valid';
      }
      if (el.bannerDesc) {
        el.bannerDesc.textContent = 'API Key is active and saved locally in your browser. Ready for synthesis!';
      }
      if (el.headerKeyDot) el.headerKeyDot.classList.add('active');
      if (el.headerKeyLabel) el.headerKeyLabel.textContent = 'API Connected';
      if (el.keyValidationStatus) {
        el.keyValidationStatus.textContent = 'Key Saved ✓';
        el.keyValidationStatus.className = 'status-indicator valid';
      }
    } else {
      if (el.apiKeyBanner) el.apiKeyBanner.classList.remove('connected');
      if (el.bannerKeyStatusBadge) {
        el.bannerKeyStatusBadge.textContent = 'Not Configured';
        el.bannerKeyStatusBadge.className = 'status-badge-inline';
      }
      if (el.bannerDesc) {
        el.bannerDesc.textContent = 'Paste your ElevenLabs API key below to unlock lifelike narration. Stored safely in your browser.';
      }
      if (el.headerKeyDot) el.headerKeyDot.classList.remove('active');
      if (el.headerKeyLabel) el.headerKeyLabel.textContent = 'Setup Key';
      if (el.keyValidationStatus) {
        el.keyValidationStatus.textContent = 'Not configured';
        el.keyValidationStatus.className = 'status-indicator invalid';
      }
    }
  }

  /**
   * Save API Key
   */
  function saveApiKey(explicitVal) {
    let val = explicitVal;
    if (typeof val !== 'string') {
      val = (el.bannerApiKeyInput?.value || el.apiKeyInput?.value || '').trim();
    } else {
      val = val.trim();
    }

    if (!val) {
      showToast('Please paste a valid ElevenLabs API key.', 'error');
      return;
    }

    state.apiKey = val;
    safeStorage.setItem(STORAGE_KEY, val);
    updateApiKeyStatus();
    closeApiKeyModal();

    showToast('ElevenLabs API Key saved & active! ✓', 'success');
    fetchVoices();
  }

  /**
   * Test API Key with ElevenLabs
   */
  async function testApiKey(key) {
    const testKey = (key || el.apiKeyInput.value || el.bannerApiKeyInput.value || state.apiKey || '').trim();
    
    if (!testKey) {
      showToast('Please enter an API key to test.', 'error');
      return false;
    }

    el.testApiKeyBtn.classList.add('loading');
    el.testSpinner.style.display = 'inline-block';
    el.keyValidationStatus.textContent = 'Verifying with ElevenLabs...';
    el.keyValidationStatus.className = 'status-indicator';

    try {
      const client = new ElevenLabsClient({ apiKey: testKey });
      const userData = await client.user.getSubscription();

      el.accountInfoBox.classList.remove('hidden');
      const tier = userData?.subscription?.tier || userData?.tier || 'Standard';
      const charLimit = userData?.subscription?.character_limit || userData?.character_limit || 0;
      const charUsed = userData?.subscription?.character_count || userData?.character_count || 0;
      const charRemaining = Math.max(0, charLimit - charUsed);

      el.userTier.textContent = String(tier).toUpperCase();
      el.userCharRemaining.textContent = `${charRemaining.toLocaleString()} / ${charLimit.toLocaleString()}`;

      el.keyValidationStatus.textContent = 'Valid Key Connected ✓';
      el.keyValidationStatus.className = 'status-indicator valid';
      
      // Auto-save verified key
      saveApiKey(testKey);
      return true;
    } catch (err) {
      el.accountInfoBox.classList.add('hidden');
      el.keyValidationStatus.textContent = 'Verification failed ✗';
      el.keyValidationStatus.className = 'status-indicator invalid';
      showToast(err.message || 'Verification failed. Please check your key.', 'error');
      return false;
    } finally {
      el.testApiKeyBtn.classList.remove('loading');
      el.testSpinner.style.display = 'none';
    }
  }

  /**
   * Fetch live voices from account
   */
  async function fetchVoices(force = false) {
    if (!state.apiKey) return;

    if (el.refreshVoicesBtn) el.refreshVoicesBtn.classList.add('spinning');

    try {
      const client = new ElevenLabsClient({ apiKey: state.apiKey });
      const voices = await client.voices.getAll();

      if (Array.isArray(voices) && voices.length > 0) {
        state.voices = voices;
        populateVoicesDropdown(voices);
        if (force) showToast(`Loaded ${voices.length} voices from your account!`, 'success');
      }
    } catch (err) {
      console.warn('Could not sync remote voices:', err);
      if (force) showToast('Could not sync voices: ' + err.message, 'error');
    } finally {
      if (el.refreshVoicesBtn) el.refreshVoicesBtn.classList.remove('spinning');
    }
  }

  /**
   * Populate voices dropdown
   */
  function populateVoicesDropdown(voices) {
    if (!el.voiceSelect) return;
    const currentVal = el.voiceSelect.value;
    el.voiceSelect.innerHTML = '';

    voices.forEach(voice => {
      const opt = document.createElement('option');
      opt.value = voice.voice_id;
      const desc = voice.labels ? Object.values(voice.labels).join(', ') : (voice.category || '');
      opt.textContent = `${voice.name} ${desc ? `(${desc})` : ''}`;
      el.voiceSelect.appendChild(opt);
    });

    if (currentVal && [...el.voiceSelect.options].some(o => o.value === currentVal)) {
      el.voiceSelect.value = currentVal;
    }

    updateVoiceDescription();
  }

  /**
   * Character and word counter
   */
  function updateTextStats() {
    if (!el.textInput) return;
    const text = el.textInput.value || '';
    const charLen = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    if (el.charCount) el.charCount.textContent = charLen.toLocaleString();
    if (el.wordCount) el.wordCount.textContent = words.toLocaleString();
  }

  /**
   * Update Model description
   */
  function updateModelDescription() {
    if (!el.modelSelect) return;
    const modelId = el.modelSelect.value;
    const info = MODEL_INFO[modelId] || { tag: 'Selected Model', desc: 'Custom ElevenLabs synthesis model.' };
    if (el.modelInfoTag) el.modelInfoTag.textContent = info.tag;
    if (el.modelDescription) el.modelDescription.textContent = info.desc;
    if (el.metaModel) el.metaModel.textContent = info.tag.replace(/[^a-zA-Z0-9\s\.]/g, '').trim();
  }

  /**
   * Update Voice description
   */
  function updateVoiceDescription() {
    if (!el.voiceSelect) return;
    const selectedOpt = el.voiceSelect.options[el.voiceSelect.selectedIndex];
    if (selectedOpt) {
      if (el.voiceDescription) el.voiceDescription.textContent = `Selected Voice: ${selectedOpt.text}`;
      if (el.metaVoice) el.metaVoice.textContent = selectedOpt.text.split('(')[0].trim();
    }
  }

  /**
   * Update Output format tag
   */
  function updateOutputFormat() {
    if (!el.outputFormatSelect || !el.formatInfoTag) return;
    const val = el.outputFormatSelect.value;
    el.formatInfoTag.textContent = val.split('_').slice(0, 2).join(' ');
  }

  /**
   * Start Narration using ElevenLabsClient & play(audio)
   */
  async function generateNarration() {
    const text = (el.textInput?.value || '').trim();

    if (!text) {
      showToast('Please enter or paste some text to narrate.', 'error');
      el.textInput?.focus();
      return;
    }

    // Auto-grab key from banner input if state was empty
    if (!state.apiKey && el.bannerApiKeyInput?.value) {
      saveApiKey(el.bannerApiKeyInput.value);
    }

    if (!state.apiKey) {
      showToast('Please enter your ElevenLabs API key first.', 'error');
      if (el.bannerApiKeyInput) {
        el.bannerApiKeyInput.focus();
        el.bannerApiKeyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        openApiKeyModal();
      }
      return;
    }

    const voiceId = el.voiceSelect.value;
    const modelId = el.modelSelect.value;
    const outputFormat = el.outputFormatSelect.value;
    const stability = parseFloat(el.stabilitySlider.value);
    const similarity = parseFloat(el.similaritySlider.value);
    const style = parseFloat(el.styleSlider.value);
    const speakerBoost = el.speakerBoostToggle.checked;

    // Loading UI state
    state.isGenerating = true;
    el.narrateBtn.disabled = true;
    el.narrateBtn.classList.add('loading');
    el.narrateBtnText.textContent = 'Synthesizing with SDK...';
    el.playerStatusBadge.textContent = 'Synthesizing...';
    el.playerStatusBadge.className = 'player-status-badge generating';

    try {
      // 1. Initialize client
      const elevenlabs = new ElevenLabsClient({
        apiKey: state.apiKey.trim()
      });

      // 2. Synthesize audio with convert()
      const audio = await elevenlabs.textToSpeech.convert(
        voiceId,
        {
          text: text,
          modelId: modelId,
          outputFormat: outputFormat,
          voiceSettings: {
            stability: stability,
            similarityBoost: similarity,
            style: style,
            useSpeakerBoost: speakerBoost
          }
        }
      );

      // 3. Play audio via SDK play()
      state.currentAudioBlob = audio;
      initWebAudioVisualizer();
      await play(audio);

      // Update player UI state
      el.playPauseBtn.disabled = false;
      el.downloadBtn.disabled = false;
      el.visualizerPlaceholder.classList.add('hidden');
      el.playerStatusBadge.textContent = 'Playing';
      el.playerStatusBadge.className = 'player-status-badge playing';

      const selectedVoiceName = el.voiceSelect.options[el.voiceSelect.selectedIndex].text.split('(')[0].trim();
      const selectedModelName = el.modelSelect.options[el.modelSelect.selectedIndex].text.split('(')[0].trim();

      // Add to session history
      addHistoryItem({
        id: Date.now(),
        text: text,
        voiceName: selectedVoiceName,
        modelName: selectedModelName,
        voiceId: voiceId,
        blob: audio,
        url: el.audioElement.src,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      showToast('Narration synthesized & playing via ElevenLabs SDK!', 'success');
    } catch (err) {
      console.error('Narration generation error:', err);
      showToast(err.message || 'Narration synthesis failed.', 'error', 6000);
      el.playerStatusBadge.textContent = 'Error';
      el.playerStatusBadge.className = 'player-status-badge';
    } finally {
      state.isGenerating = false;
      el.narrateBtn.disabled = false;
      el.narrateBtn.classList.remove('loading');
      el.narrateBtnText.textContent = 'Start Narration';
    }
  }

  /**
   * Handle audio play event emitted by play()
   */
  if (audioEvents) {
    audioEvents.addEventListener('audioplay', (e) => {
      state.currentAudioUrl = e.detail.url;
      state.isPlaying = true;
      updatePlayPauseIcons();
    });
  }

  /**
   * Web Audio API & Visualizer Setup
   */
  function initWebAudioVisualizer() {
    if (!state.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      state.audioContext = new AudioCtx();
    }

    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    if (!state.sourceNode) {
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 128;
      state.analyser.smoothingTimeConstant = 0.8;

      state.sourceNode = state.audioContext.createMediaElementSource(el.audioElement);
      state.sourceNode.connect(state.analyser);
      state.analyser.connect(state.audioContext.destination);
    }

    startVisualizerLoop();
  }

  /**
   * Realtime Canvas Visualizer Loop
   */
  function startVisualizerLoop() {
    if (state.visualizerAnimationId) {
      cancelAnimationFrame(state.visualizerAnimationId);
    }

    const canvas = el.visualizerCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = state.analyser ? state.analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      state.visualizerAnimationId = requestAnimationFrame(draw);

      if (state.analyser && state.isPlaying) {
        state.analyser.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(0, dataArray[i] * 0.92 - 1);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#4f46e5');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#06b6d4');

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * (canvas.height * 0.85) + 3;

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = state.isPlaying ? 8 : 2;

        const y = (canvas.height - barHeight) / 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth - 3, barHeight, 4);
        } else {
          ctx.rect(x, y, barWidth - 3, barHeight);
        }
        ctx.fill();

        x += barWidth;
      }
    }

    draw();
  }

  /**
   * Play / Pause Toggle
   */
  function togglePlayPause() {
    if (!el.audioElement.src) return;

    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    if (el.audioElement.paused) {
      el.audioElement.play();
      state.isPlaying = true;
      el.playerStatusBadge.textContent = 'Playing';
      el.playerStatusBadge.className = 'player-status-badge playing';
    } else {
      el.audioElement.pause();
      state.isPlaying = false;
      el.playerStatusBadge.textContent = 'Paused';
      el.playerStatusBadge.className = 'player-status-badge';
    }
    updatePlayPauseIcons();
  }

  /**
   * Update Play/Pause Icon state
   */
  function updatePlayPauseIcons() {
    if (state.isPlaying) {
      el.playIconSvg.classList.add('hidden');
      el.pauseIconSvg.classList.remove('hidden');
      el.playbackDot.classList.add('playing');
    } else {
      el.playIconSvg.classList.remove('hidden');
      el.pauseIconSvg.classList.add('hidden');
      el.playbackDot.classList.remove('playing');
    }
  }

  /**
   * Audio Timeline & Scrubber handlers
   */
  function onAudioTimeUpdate() {
    const cur = el.audioElement.currentTime;
    const dur = el.audioElement.duration || 0;

    el.currentTime.textContent = formatTime(cur);

    if (dur > 0) {
      const pct = (cur / dur) * 100;
      el.scrubberProgress.style.width = `${pct}%`;
      el.scrubberHandle.style.left = `${pct}%`;
    }
  }

  function onAudioLoadedMetadata() {
    const dur = el.audioElement.duration || 0;
    el.totalDuration.textContent = formatTime(dur);
    el.metaDuration.textContent = formatTime(dur);
  }

  function onAudioEnded() {
    state.isPlaying = false;
    updatePlayPauseIcons();
    el.playerStatusBadge.textContent = 'Finished';
    el.playerStatusBadge.className = 'player-status-badge';
    el.scrubberProgress.style.width = '0%';
    el.scrubberHandle.style.left = '0%';
  }

  function handleScrubberClick(e) {
    if (!el.audioElement.duration) return;
    const rect = el.scrubberBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    el.audioElement.currentTime = pct * el.audioElement.duration;
  }

  /**
   * Download Audio File
   */
  function downloadCurrentAudio() {
    if (!state.currentAudioBlob) return;
    const voiceName = el.metaVoice.textContent.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `elevenlabs_${voiceName}_${Date.now()}.mp3`;

    const a = document.createElement('a');
    a.href = el.audioElement.src || state.currentAudioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading ${filename}`, 'info');
  }

  /**
   * History Management
   */
  function addHistoryItem(item) {
    state.history.unshift(item);
    renderHistory();
  }

  function renderHistory() {
    if (!el.historyCount) return;
    el.historyCount.textContent = state.history.length;

    if (state.history.length === 0) {
      el.historyEmpty.classList.remove('hidden');
      return;
    }

    el.historyEmpty.classList.add('hidden');
    el.historyList.innerHTML = '';

    state.history.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      if (item.url === el.audioElement.src) itemEl.classList.add('active');

      const textSnippet = item.text.length > 55 ? item.text.substring(0, 52) + '...' : item.text;

      itemEl.innerHTML = `
        <div class="history-info">
          <div class="history-text" title="${item.text.replace(/"/g, '&quot;')}">"${textSnippet}"</div>
          <div class="history-tags">
            <span><strong>${item.voiceName}</strong></span>
            <span>&bull;</span>
            <span>${item.modelName}</span>
            <span>&bull;</span>
            <span>${item.timestamp}</span>
          </div>
        </div>
        <div class="history-actions">
          <button class="history-play-btn" title="Replay Narration" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
      `;

      itemEl.querySelector('.history-play-btn').addEventListener('click', () => {
        loadHistoryItem(index);
      });

      el.historyList.appendChild(itemEl);
    });
  }

  async function loadHistoryItem(index) {
    const item = state.history[index];
    if (!item) return;

    state.currentAudioBlob = item.blob;
    el.metaVoice.textContent = item.voiceName;
    el.metaModel.textContent = item.modelName;
    el.playPauseBtn.disabled = false;
    el.downloadBtn.disabled = false;
    el.visualizerPlaceholder.classList.add('hidden');

    initWebAudioVisualizer();
    await play(item.blob || item.url);
    el.playerStatusBadge.textContent = 'Playing';
    el.playerStatusBadge.className = 'player-status-badge playing';

    renderHistory();
    showToast(`Playing narration by ${item.voiceName}`, 'info');
  }

  function clearAllHistory() {
    state.history = [];
    renderHistory();
    showToast('Narration history cleared.', 'info');
  }

  /**
   * Modal Open/Close
   */
  function openApiKeyModal() {
    if (el.apiKeyInput) el.apiKeyInput.value = state.apiKey;
    if (el.apiKeyModal) {
      el.apiKeyModal.classList.remove('hidden');
      el.apiKeyInput?.focus();
    }
  }

  function closeApiKeyModal() {
    if (el.apiKeyModal) el.apiKeyModal.classList.add('hidden');
  }

  /**
   * Setup Event Listeners
   */
  function initEventListeners() {
    // Banner Quick Save
    if (el.bannerSaveBtn) {
      el.bannerSaveBtn.addEventListener('click', () => saveApiKey(el.bannerApiKeyInput.value));
    }
    if (el.bannerApiKeyInput) {
      el.bannerApiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveApiKey(el.bannerApiKeyInput.value);
      });
    }

    // Modal triggers
    if (el.toggleApiKeyModalBtn) el.toggleApiKeyModalBtn.addEventListener('click', openApiKeyModal);
    if (el.bannerSetupBtn) el.bannerSetupBtn.addEventListener('click', openApiKeyModal);
    if (el.closeApiKeyModalBtn) el.closeApiKeyModalBtn.addEventListener('click', closeApiKeyModal);
    if (el.apiKeyModal) {
      el.apiKeyModal.addEventListener('click', (e) => {
        if (e.target === el.apiKeyModal) closeApiKeyModal();
      });
    }

    // Password visibility toggle
    if (el.toggleApiKeyVisibility) {
      el.toggleApiKeyVisibility.addEventListener('click', () => {
        const isPassword = el.apiKeyInput.type === 'password';
        el.apiKeyInput.type = isPassword ? 'text' : 'password';
        el.eyeIcon.innerHTML = isPassword 
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      });
    }

    // Test & Save Key from Modal
    if (el.testApiKeyBtn) {
      el.testApiKeyBtn.addEventListener('click', () => testApiKey(el.apiKeyInput.value));
    }
    if (el.saveApiKeyBtn) {
      el.saveApiKeyBtn.addEventListener('click', () => saveApiKey(el.apiKeyInput.value));
    }
    if (el.apiKeyInput) {
      el.apiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveApiKey(el.apiKeyInput.value);
      });
    }

    // Text inputs & buttons
    if (el.textInput) el.textInput.addEventListener('input', updateTextStats);
    if (el.clearBtn) {
      el.clearBtn.addEventListener('click', () => {
        el.textInput.value = '';
        updateTextStats();
        el.textInput.focus();
      });
    }

    if (el.pasteBtn) {
      el.pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          el.textInput.value = text;
          updateTextStats();
          showToast('Text pasted from clipboard!', 'info');
        } catch (_) {
          showToast('Unable to read clipboard. Please paste manually.', 'error');
        }
      });
    }

    // Preset sample buttons
    el.samplePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const type = pill.dataset.type;
        if (SAMPLE_TEXTS[type]) {
          el.textInput.value = SAMPLE_TEXTS[type];
          updateTextStats();
          showToast(`Loaded "${type}" preset!`, 'info');
        }
      });
    });

    // Selectors
    if (el.modelSelect) el.modelSelect.addEventListener('change', updateModelDescription);
    if (el.voiceSelect) el.voiceSelect.addEventListener('change', updateVoiceDescription);
    if (el.outputFormatSelect) el.outputFormatSelect.addEventListener('change', updateOutputFormat);
    if (el.refreshVoicesBtn) el.refreshVoicesBtn.addEventListener('click', () => fetchVoices(true));

    // Advanced settings accordion
    if (el.toggleSettingsBtn) {
      el.toggleSettingsBtn.addEventListener('click', () => {
        const isCollapsed = el.settingsPanel.classList.toggle('collapsed');
        el.toggleSettingsBtn.classList.toggle('expanded', !isCollapsed);
      });
    }

    // Sliders
    if (el.stabilitySlider) {
      el.stabilitySlider.addEventListener('input', (e) => {
        el.stabilityVal.textContent = `${Math.round(e.target.value * 100)}%`;
      });
    }
    if (el.similaritySlider) {
      el.similaritySlider.addEventListener('input', (e) => {
        el.similarityVal.textContent = `${Math.round(e.target.value * 100)}%`;
      });
    }
    if (el.styleSlider) {
      el.styleSlider.addEventListener('input', (e) => {
        el.styleVal.textContent = `${Math.round(e.target.value * 100)}%`;
      });
    }

    // Primary Narrate Button
    if (el.narrateBtn) el.narrateBtn.addEventListener('click', generateNarration);

    // Audio Element events
    if (el.audioElement) {
      el.audioElement.addEventListener('timeupdate', onAudioTimeUpdate);
      el.audioElement.addEventListener('loadedmetadata', onAudioLoadedMetadata);
      el.audioElement.addEventListener('ended', onAudioEnded);
    }

    // Scrubber click
    if (el.scrubberBar) el.scrubberBar.addEventListener('click', handleScrubberClick);

    // Playback control buttons
    if (el.playPauseBtn) el.playPauseBtn.addEventListener('click', togglePlayPause);
    if (el.rewindBtn) {
      el.rewindBtn.addEventListener('click', () => {
        el.audioElement.currentTime = Math.max(0, el.audioElement.currentTime - 5);
      });
    }
    if (el.forwardBtn) {
      el.forwardBtn.addEventListener('click', () => {
        el.audioElement.currentTime = Math.min(el.audioElement.duration || 0, el.audioElement.currentTime + 5);
      });
    }

    // Playback speed
    if (el.playbackSpeedSelect) {
      el.playbackSpeedSelect.addEventListener('change', (e) => {
        el.audioElement.playbackRate = parseFloat(e.target.value);
      });
    }

    // Volume & Mute
    if (el.volumeSlider) {
      el.volumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        el.audioElement.volume = vol;
        el.audioElement.muted = vol === 0;
      });
    }

    if (el.muteBtn) {
      el.muteBtn.addEventListener('click', () => {
        el.audioElement.muted = !el.audioElement.muted;
        if (el.audioElement.muted) {
          el.volumeSlider.dataset.prevVal = el.volumeSlider.value;
          el.volumeSlider.value = 0;
        } else {
          el.volumeSlider.value = el.volumeSlider.dataset.prevVal || 1;
          el.audioElement.volume = parseFloat(el.volumeSlider.value);
        }
      });
    }

    // Download button
    if (el.downloadBtn) el.downloadBtn.addEventListener('click', downloadCurrentAudio);

    // History controls
    if (el.clearHistoryBtn) el.clearHistoryBtn.addEventListener('click', clearAllHistory);
    if (el.historyToggleBtn) {
      el.historyToggleBtn.addEventListener('click', () => {
        el.historySection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateNarration();
      }

      if (e.key === 'Escape' && el.apiKeyModal && !el.apiKeyModal.classList.contains('hidden')) {
        closeApiKeyModal();
      }
    });
  }

  /**
   * Application Initialization
   */
  function init() {
    updateApiKeyStatus();
    updateModelDescription();
    updateVoiceDescription();
    updateOutputFormat();
    updateTextStats();
    initEventListeners();

    if (el.textInput && !el.textInput.value) {
      el.textInput.value = SAMPLE_TEXTS.motion;
      updateTextStats();
    }

    if (state.apiKey) {
      fetchVoices();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
