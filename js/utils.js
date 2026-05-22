// ==========================================================================
// 🚀 AUTOCLICKER PRO - MÓDULO DE UTILIDADES GENERALES (utils.js)
// ==========================================================================

// --- 🔊 EFECTOS DE SONIDO SINTETIZADOS EN SIDEBAR ---
function reproducirSonidoArcadeSidebar() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // Sonido retro "click" de tipo arcade (pitch agudo que desciende rápidamente)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (ae) {
    console.error("Error al reproducir audio:", ae);
  }
}
