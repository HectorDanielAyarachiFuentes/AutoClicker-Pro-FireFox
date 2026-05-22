// ==========================================================================
// 🚀 AUTOCLICKER PRO - MÓDULO DE CONSOLA TERMINAL (terminal.js)
// ==========================================================================

// Escritura de Logs en Terminal (Segura, programática y color-coded sin innerHTML)
function escribirLogTerminal(texto, append = false) {
  const terminal = document.getElementById('terminal-logs');
  if (!terminal) return;

  if (!append) {
    terminal.textContent = "";
  }

  const lineas = texto.split('\n');
  lineas.forEach(linea => {
    if (!linea.trim()) return;

    const div = document.createElement('div');
    div.className = 'log-line';

    // Buscar si empieza por corchetes, ej: [CLICK] o [SISTEMA]
    const match = linea.match(/^\[([^\]]+)\](.*)$/);
    if (match) {
      const tipo = match[1].trim();
      const mensaje = match[2];

      div.classList.add(`log-type-${tipo.toLowerCase()}`);

      const spanPrefix = document.createElement('span');
      spanPrefix.className = 'log-prefix';
      spanPrefix.textContent = `[${tipo}]`;

      const spanMsg = document.createElement('span');
      spanMsg.className = 'log-msg';
      spanMsg.textContent = mensaje;

      div.appendChild(spanPrefix);
      div.appendChild(spanMsg);
    } else {
      div.classList.add('log-type-default');
      const spanMsg = document.createElement('span');
      spanMsg.className = 'log-msg';
      spanMsg.textContent = linea;
      div.appendChild(spanMsg);
    }

    terminal.appendChild(div);
  });

  // Auto-scroll
  terminal.scrollTop = terminal.scrollHeight;
}

async function obtenerMensajeEspera() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const esInsta = tab && tab.url && tab.url.includes('instagram.com');
    if (esInsta) {
      return "[SISTEMA] Esperando que inicies el clicker...\n[SITIO] En Instagram. Auto-confirmación de ventana emergente y preset especial de Dejar de seguir listos.";
    }
  } catch (e) {
    // Ignorar errores de consulta de pestañas
  }
  return "[SISTEMA] Esperando que inicies el clicker...";
}

async function actualizarUIParado() {
  const badgeTerm = document.getElementById('status-badge-term');
  const btnStart = document.getElementById('btn-iniciar-clicker');
  const btnStop = document.getElementById('btn-detener-clicker');

  if (badgeTerm) {
    badgeTerm.innerText = "● DETENIDO";
    badgeTerm.className = "badge-stopped";
  }

  btnStart.disabled = false;
  btnStop.disabled = true;

  // Desactivar animación en la consola y la pestaña
  document.querySelectorAll('.terminal-box').forEach(term => term.classList.remove('working'));
  const tabTerm = document.getElementById('tab-terminal');
  if (tabTerm) tabTerm.classList.remove('working');

  if (window.pollingIntervalId) {
    clearInterval(window.pollingIntervalId);
    window.pollingIntervalId = null;
  }

  // Preservar la consola si ya tiene logs de ejecución (no borrar al detener)
  const terminal = document.getElementById('terminal-logs');
  const tieneLogs = terminal && terminal.textContent.trim() !== "" && !terminal.textContent.includes('Esperando que inicies');
  
  if (!tieneLogs) {
    const msg = await obtenerMensajeEspera();
    escribirLogTerminal(msg);
  }
}

// Configurar el listener de limpieza
document.getElementById('btn-clear-logs').addEventListener('click', async () => {
  const msg = await obtenerMensajeEspera();
  escribirLogTerminal(msg);
  
  // Limpiar también las estadísticas del panel superior
  const countTerm = document.getElementById('clicks-count-term');
  const speedTerm = document.getElementById('speed-average-term');
  const savedTerm = document.getElementById('time-saved-term');
  if (countTerm) countTerm.innerText = "0";
  if (speedTerm) speedTerm.innerText = "0.00s";
  if (savedTerm) savedTerm.innerText = "0.0s";
});
