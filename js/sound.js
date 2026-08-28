/* ═════════════════════════════════════════════════════════════════════
   KICHAY — Efectos de Sonido Armoniosos y Relajantes
   Generados con Web Audio API (Suaves, aterciopelados y pacíficos)
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
   * Sonido de Click desactivado (silenciado a petición del usuario)
   */
  function playPeacefulClick() {
    // Silenciado
  }

  /**
   * Acorde Arpegiado Armonioso y Nostálgico para acciones de avance
   */
  function playHarmoniousChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [587.33, 739.99, 880.00, 1174.66]; // Re Mayor celestial
      notes.forEach((freq, index) => {
        const delay = index * 0.065;
        setTimeout(() => {
          try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2600, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.055 - (index * 0.008), now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

            osc.connect(gain);
            gain.connect(filter);
            filter.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.65);
          } catch (err) {}
        }, delay * 1000);
      });
    } catch (e) {}
  }

  // Exponer globalmente
  window.playPeacefulClick   = playPeacefulClick;
  window.playHarmoniousChime = playHarmoniousChime;
  window.KichaySound = {
    playSoftClick: function() {},
    playHarmoniousChime: playHarmoniousChime
  };
})();
