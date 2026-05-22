// ==========================================================================
// 🚀 AUTOCLICKER PRO - CONTROLADOR PRINCIPAL Y ENTRADA (sidebar.js)
// ==========================================================================

// --- ⚙️ 1. REFRESCO Y PANEL DEL CONTEXTO (FAVICONS Y DOMINIO) ---
async function refrescarPanel() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // 1. Nombres y logos predefinidos para las plataformas principales
  let nombrePlataforma = "AutoClicker Pro";
  let urlIcono = tab.favIconUrl;
  const url = tab.url || "";

  if (url.includes('instagram.com')) {
    nombrePlataforma = "Instagram";
  } else if (url.includes('tiktok.com')) {
    nombrePlataforma = "TikTok";
  } else if (url.includes('facebook.com')) {
    nombrePlataforma = "Facebook";
  } else if (url.includes('github.com')) {
    nombrePlataforma = "GitHub";
  }

  // 2. Mostrar favicon
  const faviconBox = document.getElementById('favicon-box');
  faviconBox.textContent = "";
  
  const mostrarEmojiFallback = () => {
    faviconBox.innerHTML = "";
    if (url.includes('instagram.com')) faviconBox.textContent = "📸";
    else if (url.includes('tiktok.com')) faviconBox.textContent = "🎵";
    else if (url.includes('facebook.com')) faviconBox.textContent = "📘";
    else if (url.includes('github.com')) faviconBox.textContent = "🐙";
    else faviconBox.textContent = "🌐";
  };

  if (urlIcono && (urlIcono.startsWith('http') || urlIcono.startsWith('data:'))) {
    const img = document.createElement('img');
    img.src = urlIcono;
    img.alt = "Favicon";
    img.style.width = "18px";
    img.style.height = "18px";
    img.style.borderRadius = "4px";
    img.style.verticalAlign = "middle";
    img.onerror = mostrarEmojiFallback;
    faviconBox.appendChild(img);
  } else {
    mostrarEmojiFallback();
  }

  // 3. Título de contexto
  const tituloContexto = document.getElementById('titulo-contexto');
  tituloContexto.innerText = nombrePlataforma;

  // 4. Dominio secundario
  const pageDomain = document.getElementById('page-domain');
  try {
    const urlObj = new URL(tab.url);
    pageDomain.innerText = urlObj.hostname;
  } catch (e) {
    pageDomain.innerText = "Página local / Sistema";
  }

  // 5. Mostrar/Ocultar y configurar Acciones Rápidas (Modo Sencillo)
  const quickActionsCard = document.getElementById('simple-quick-actions');
  const quickPlatformText = document.getElementById('quick-action-platform');
  const btnFollow = document.getElementById('btn-quick-follow');
  const btnUnfollow = document.getElementById('btn-quick-unfollow');

  if (quickActionsCard) {
    if (url.includes('instagram.com') || url.includes('tiktok.com') || url.includes('facebook.com') || url.includes('github.com')) {
      quickActionsCard.style.display = '';
      if (quickPlatformText) quickPlatformText.innerText = nombrePlataforma;
      
      // Ajustar texto en FB
      if (url.includes('facebook.com')) {
        btnFollow.innerHTML = "👥 Auto-Agregar";
      } else {
        btnFollow.innerHTML = "👥 Auto-Seguir";
      }

      btnFollow.onclick = () => {
        let presetId = '';
        if (url.includes('instagram.com')) presetId = 'instagram-follow-preset';
        if (url.includes('tiktok.com')) presetId = 'tiktok-follow-preset';
        if (url.includes('facebook.com')) presetId = 'facebook-add-friend-preset';
        if (url.includes('github.com')) presetId = 'github-follow-preset';
        
        document.getElementById('clicker-preset').value = presetId;
        aplicarPresetSeleccionado();
        document.getElementById('btn-iniciar-clicker').click();
      };

      btnUnfollow.onclick = () => {
        let presetId = '';
        if (url.includes('instagram.com')) presetId = 'instagram-unfollow-preset';
        if (url.includes('tiktok.com')) presetId = 'tiktok-unfollow-preset';
        if (url.includes('facebook.com')) presetId = 'facebook-unfollow-preset';
        if (url.includes('github.com')) presetId = 'github-unfollow-preset';
        
        document.getElementById('clicker-preset').value = presetId;
        aplicarPresetSeleccionado();
        document.getElementById('btn-iniciar-clicker').click();
      };
    } else {
      quickActionsCard.style.display = 'none';
    }
  }

  // 4. Cargar presets inteligentes dependiendo de la url
  autodetectarPresetsUrl(tab.url);
  
  actualizarVisualSelectorSimple();
  
  // 5. Iniciar polling del clicker por si hay una tarea en progreso en esta pestaña
  comenzarPollingEstado(tab.id);

  // 6. Mostrar/ocultar opciones de confirmación inteligentemente según la pestaña activa
  const esInstaOFacebook = tab.url && (tab.url.includes('instagram.com') || tab.url.includes('facebook.com'));
  const presetInstagramOption = document.querySelector('#clicker-preset option[value="instagram-unfollow-preset"]');
  const presetInstagramFollowOption = document.querySelector('#clicker-preset option[value="instagram-follow-preset"]');
  const presetFacebookOption = document.querySelector('#clicker-preset option[value="facebook-unfollow-preset"]');

  if (esInstaOFacebook) {
    if (tab.url.includes('instagram.com') && presetInstagramOption) presetInstagramOption.style.display = '';
    if (tab.url.includes('instagram.com') && presetInstagramFollowOption) presetInstagramFollowOption.style.display = '';
    if (tab.url.includes('facebook.com') && presetFacebookOption) presetFacebookOption.style.display = '';
  } else {
    if (presetInstagramOption) presetInstagramOption.style.display = 'none';
    if (presetInstagramFollowOption) presetInstagramFollowOption.style.display = 'none';
    if (presetFacebookOption) presetFacebookOption.style.display = 'none';
    
    // Si el preset seleccionado actualmente es el de Instagram, pero no estamos en Instagram, resetearlo
    const selectPreset = document.getElementById('clicker-preset');
    if (selectPreset && selectPreset.value === 'instagram-unfollow-preset') {
      selectPreset.value = 'custom';
      aplicarPresetSeleccionado();
    }
  }
}

function autodetectarPresetsUrl(url) {
  const selectPreset = document.getElementById('clicker-preset');
  if (!url) return;

  if (url.includes('github.com')) {
    if (selectPreset.value !== 'github-follow-preset' && selectPreset.value !== 'github-unfollow-preset') {
      selectPreset.value = 'github-follow-preset';
      aplicarPresetSeleccionado();
    }
  } else if (url.includes('instagram.com')) {
    if (selectPreset.value !== 'instagram-unfollow-preset' && selectPreset.value !== 'instagram-follow-preset') {
      selectPreset.value = 'instagram-follow-preset';
      aplicarPresetSeleccionado();
    }
  } else if (url.includes('tiktok.com')) {
    if (selectPreset.value !== 'tiktok-follow-preset' && selectPreset.value !== 'tiktok-unfollow-preset') {
      selectPreset.value = 'tiktok-follow-preset';
      aplicarPresetSeleccionado();
    }
  } else if (url.includes('facebook.com')) {
    if (!selectPreset.value.startsWith('facebook-')) {
      selectPreset.value = 'facebook-add-friend-preset';
      aplicarPresetSeleccionado();
    }
  } else {
    if (selectPreset.value !== 'custom' && selectPreset.value !== 'next-button') {
      selectPreset.value = 'custom';
      aplicarPresetSeleccionado();
    }
  }
}

// --- ⏱️ 2. CONTROLES DE PLANTILLAS Y PRESETS ---
function aplicarPresetSeleccionado() {
  const preset = document.getElementById('clicker-preset').value;
  const inputSelector = document.getElementById('clicker-selector');
  const optionSequential = document.querySelector('input[name="clicker-strategy"][value="sequential"]');
  const optionAll = document.querySelector('input[name="clicker-strategy"][value="all"]');

  if (preset === 'github-follow-preset') {
    inputSelector.value = 'button, input[type="submit"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: GitHub Auto-Follow seleccionado.\n[INFO] Selector: botones o submits con texto 'Follow' o 'Seguir'.");
  } else if (preset === 'github-unfollow-preset') {
    inputSelector.value = 'button, input[type="submit"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: GitHub Auto-Unfollow seleccionado.\n[INFO] Selector: botones que dicen 'Unfollow', 'Following' o 'Siguiendo'.");
  } else if (preset === 'instagram-follow-preset') {
    inputSelector.value = 'button, div[role="button"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: Instagram Auto-Follow seleccionado.\n[SITIO] Selector: botones con texto 'Seguir' o 'Follow'.");
  } else if (preset === 'instagram-unfollow-preset') {
    inputSelector.value = 'button';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    const chkSimple = document.getElementById('clicker-instagram-unfollow-simple');
    const chkAdv = document.getElementById('clicker-instagram-unfollow-advanced');
    if (chkSimple) chkSimple.checked = true;
    if (chkAdv) chkAdv.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: Instagram Auto-Unfollow seleccionado.\n[SITIO] Selector: botones con texto 'Siguiendo' o 'Following'.\n[INSTAGRAM] Auto-confirmar ventanas emergentes activado.");
  } else if (preset === 'tiktok-follow-preset') {
    inputSelector.value = 'button, div[role="button"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: TikTok Auto-Follow seleccionado.\n[SITIO] Selector: botones con texto 'Seguir' o 'Follow'.");
  } else if (preset === 'tiktok-unfollow-preset') {
    inputSelector.value = 'button, div[role="button"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: TikTok Auto-Unfollow seleccionado.\n[SITIO] Selector: botones con texto 'Siguiendo', 'Following' o 'Unfollow'.");
  } else if (preset === 'facebook-add-friend-preset') {
    inputSelector.value = 'div[role="button"], button, a[role="button"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: Facebook Agregar Amigos seleccionado.\n[SITIO] Selector: botones con texto 'Agregar a amigos' o 'Add friend'.");
  } else if (preset === 'facebook-cancel-request-preset') {
    inputSelector.value = 'div[role="button"], button, a[role="button"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: Facebook Cancelar Solicitud seleccionado.\n[SITIO] Selector: botones con texto 'Cancelar solicitud'.");
  } else if (preset === 'facebook-follow-preset') {
    inputSelector.value = 'div[role="button"], button, a[role="button"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: Facebook Seguir seleccionado.\n[SITIO] Selector: botones con texto 'Seguir' o 'Follow'.");
  } else if (preset === 'facebook-unfollow-preset') {
    inputSelector.value = 'div[role="button"], button, a[role="button"]';
    sincronizarControlesVelocidad(1500);
    optionSequential.checked = true;
    const chkSimple = document.getElementById('clicker-instagram-unfollow-simple');
    const chkAdv = document.getElementById('clicker-instagram-unfollow-advanced');
    if (chkSimple) chkSimple.checked = true;
    if (chkAdv) chkAdv.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: Facebook Dejar de Seguir seleccionado.\n[SITIO] Selector: botones con texto 'Siguiendo', 'Following'.\n[FACEBOOK] Auto-confirmar ventanas emergentes activado.");
  } else if (preset === 'next-button') {
    inputSelector.value = '.btn-siguiente, .btn-next, #next, button[id*="next"], button[class*="next"]';
    sincronizarControlesVelocidad(1000);
    optionSequential.checked = true;
    escribirLogTerminal("[SISTEMA] Preset: Botón de Siguiente/Continuar.\n[INFO] Útil para pruebas de flujo en desarrollo local.");
  } else {
    // Custom
    inputSelector.value = '';
    escribirLogTerminal("[SISTEMA] Preset Personalizado.\n[INFO] Escribe tu propio selector CSS o usa el botón 'Apuntar'.");
  }
}

// Configurar modo inicial (Sencillo vs Avanzado)
function inicializarModoInterfaz() {
  const modoGuardado = localStorage.getItem('dtk-interface-mode') || 'simple';
  setModoInterfaz(modoGuardado);
}

function setModoInterfaz(mode) {
  localStorage.setItem('dtk-interface-mode', mode);
  
  const btnSimple = document.getElementById('btn-mode-simple');
  const btnAdvanced = document.getElementById('btn-mode-advanced');
  
  if (mode === 'simple') {
    document.body.classList.remove('mode-advanced');
    document.body.classList.add('mode-simple');
    if (btnSimple) btnSimple.classList.add('active');
    if (btnAdvanced) btnAdvanced.classList.remove('active');
  } else {
    document.body.classList.remove('mode-simple');
    document.body.classList.add('mode-advanced');
    if (btnSimple) btnSimple.classList.remove('active');
    if (btnAdvanced) btnAdvanced.classList.add('active');
  }
  
  actualizarVisualSelectorSimple();
}

// --- 🛠️ 3. REGISTRO DE EVENT LISTENERS DEL DOM ---

// Sliders y Number Inputs de Intervalos
const intervalRange = document.getElementById('clicker-interval-range');
const intervalNumber = document.getElementById('clicker-interval-number');

intervalRange.addEventListener('input', (e) => {
  intervalNumber.value = e.target.value;
  sincronizarControlesVelocidad(e.target.value);
});

intervalNumber.addEventListener('input', (e) => {
  let val = parseInt(e.target.value);
  if (isNaN(val)) val = 100;
  if (val < 100) val = 100;
  if (val > 10000) val = 10000;
  intervalRange.value = val;
  sincronizarControlesVelocidad(val);
});

// Shortcuts de tiempos
document.querySelectorAll('.btn-time-shortcut').forEach(btn => {
  btn.addEventListener('click', () => {
    const ms = btn.dataset.ms;
    sincronizarControlesVelocidad(ms);
  });
});

document.getElementById('clicker-preset').addEventListener('change', aplicarPresetSeleccionado);

// Listeners principales de botones
document.getElementById('btn-iniciar-clicker').addEventListener('click', iniciarClicker);
document.getElementById('btn-detener-clicker').addEventListener('click', detenerClicker);
document.getElementById('btn-inspect-element').addEventListener('click', comenzarSeleccionVisual);
document.getElementById('clicker-selector').addEventListener('input', () => {
  window.lastTextFilter = '';
  document.getElementById('clicker-preset').value = 'custom';
  actualizarVisualSelectorSimple();
});

// Sincronizar visualmente opciones de Ritmo Humano
const humanModeCheckbox = document.getElementById('clicker-human-mode');
const humanModeOptions = document.getElementById('human-mode-options');

if (humanModeCheckbox && humanModeOptions) {
  humanModeCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      humanModeOptions.style.display = 'flex';
    } else {
      humanModeOptions.style.display = 'none';
    }
  });
}

// Recargas al cambiar de pestaña activa o cambiar URL
browser.tabs.onActivated.addListener(() => {
  actualizarUIParado();
  refrescarPanel();
});
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    actualizarUIParado();
    refrescarPanel();
  }
});

// Listeners de los botones de modo (Sencillo/Avanzado)
document.getElementById('btn-mode-simple').addEventListener('click', () => setModoInterfaz('simple'));
document.getElementById('btn-mode-advanced').addEventListener('click', () => setModoInterfaz('advanced'));

// Sincronizar radio de velocidad en modo sencillo
document.querySelectorAll('input[name="simple-speed"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const val = e.target.value;
    sincronizarControlesVelocidad(val);
    escribirLogTerminal(`⚡ [Modo Sencillo] Velocidad de clics ajustada a: ${val === '500' ? 'Rápido' : val === '3000' ? 'Lento' : 'Seguro'} (${val}ms)`);
  });
});

// Listener de Apuntar en Modo Sencillo
document.getElementById('btn-inspect-simple').addEventListener('click', comenzarSeleccionVisual);

// Sincronizar checkboxes de Instagram y enviar a la pestaña
const chkSimple = document.getElementById('clicker-instagram-unfollow-simple');
const chkAdv = document.getElementById('clicker-instagram-unfollow-advanced');
if (chkSimple && chkAdv) {
  chkSimple.addEventListener('change', (e) => {
    chkAdv.checked = e.target.checked;
    sincronizarParametrosConTab();
  });
  chkAdv.addEventListener('change', (e) => {
    chkSimple.checked = e.target.checked;
    sincronizarParametrosConTab();
  });
}

// Listeners para cambios en Ritmo Humano, Jitter y Sonido Arcade
if (humanModeCheckbox) {
  humanModeCheckbox.addEventListener('change', () => {
    sincronizarParametrosConTab();
  });
}

const jitterLevelSelect = document.getElementById('clicker-jitter-level');
if (jitterLevelSelect) {
  jitterLevelSelect.addEventListener('change', () => {
    sincronizarParametrosConTab();
  });
}

const soundModeCheckbox = document.getElementById('clicker-sound-mode');
if (soundModeCheckbox) {
  soundModeCheckbox.addEventListener('change', () => {
    sincronizarParametrosConTab();
  });
}

// --- 📁 4. CONTROL DE NAVEGACIÓN POR PESTAÑAS ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Quitar clase activa de todos los botones de pestaña
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    // Quitar clase activa de todos los contenedores de contenido
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activar botón actual
    btn.classList.add('active');
    // Activar contenido correspondiente
    const targetId = btn.dataset.target;
    document.getElementById(targetId).classList.add('active');
  });
});

// --- 🚀 5. INICIALIZACIÓN ---
refrescarPanel();
inicializarModoInterfaz();