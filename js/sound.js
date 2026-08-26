/* ═════════════════════════════════════════════════════════════════════
   KICHAY — Efectos de Sonido Armoniosos y Relajantes
   Generados con Web Audio API (Cálidos, nostálgicos y pacíficos)
═════════════════════════════════════════════════════════════════════ */

(function () {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Sonido de Click Pacífico (Campana de viento / Kalimba andina)
   * Tono cálido con armónicos suaves y caída exponencial que transmite paz
   */
  function playPeacefulClick(pitchFactor = 1.0) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const baseFreq = 587.33 * pitchFactor; // Nota D5 (Re) nostálgica y dulce

      // Oscilador principal ( fundamental suave )
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.98, now + 0.35);

      // Oscilador armónico dulce ( octava suave + quinta )
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.96, now + 0.25);

      // Filtro paso bajo para calidez analógica
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.4);

      // Envolvente de ganancia (ataque suave, resonancia y desvanecimiento)
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.linearRampToValueAtTime(0.06, now + 0.012);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      // Conexiones de audio
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio click no disponible aún:", e);
    }
  }

  /**
   * Acorde Arpegiado Armonioso para botones de acción principal (Continuar / Comenzar)
   */
  function playHarmoniousChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6 (Acorde Re Mayor celestial)
      notes.forEach((freq, index) => {
        const delay = index * 0.07;
        setTimeout(() => {
          try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3200, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.14 - (index * 0.02), now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

            osc.connect(gain);
            gain.connect(filter);
            filter.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.75);
          } catch (err) {}
        }, delay * 1000);
      });
    } catch (e) {}
  }

  // Exponer globalmente
  window.playPeacefulClick  = playPeacefulClick;
  window.playHarmoniousChime = playHarmoniousChime;

  // Auto-enlazar el sonido a todos los clics de elementos interactivos
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, .nav-item, .subject-card, .sex-btn, .edad-btn, .btn-primary, .btn-continuar, .btn-comenzar, [onclick]');
      if (target) {
        if (target.classList.contains('btn-continuar') || target.classList.contains('btn-comenzar')) {
          playHarmoniousChime();
        } else {
          playPeacefulClick();
        }
      }
    }, true);
  });
})();
