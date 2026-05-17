// ==========================================================================
// 🚀 AUTOCLICKER PRO - PRINCIPAL CONTROLLER
// ==========================================================================

let pollingIntervalId = null;

// --- ⚙️ 1. REFRESCO Y PANEL DEL CONTEXTO (FAVICONS Y DOMINIO) ---
async function refrescarPanel() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // 1. Mostrar favicon
  const faviconBox = document.getElementById('favicon-box');
  faviconBox.textContent = "";
  if (tab.favIconUrl && tab.favIconUrl.startsWith('http')) {
    const img = document.createElement('img');
    img.src = tab.favIconUrl;
    img.alt = "Icon";
    faviconBox.appendChild(img);
  } else {
    faviconBox.textContent = "🌐";
  }

  // 2. Título de contexto
  const tituloContexto = document.getElementById('titulo-contexto');
  tituloContexto.innerText = "AutoClicker Pro";

  // 3. Dominio secundario
  const pageDomain = document.getElementById('page-domain');
  try {
    const urlObj = new URL(tab.url);
    pageDomain.innerText = urlObj.hostname;
  } catch (e) {
    pageDomain.innerText = "Página local / Sistema";
  }

  // 4. Cargar presets inteligentes dependiendo de la url
  autodetectarPresetsUrl(tab.url);
  
  // 5. Iniciar polling del clicker por si hay una tarea en progreso en esta pestaña
  comenzarPollingEstado(tab.id);
}

function autodetectarPresetsUrl(url) {
  const selectPreset = document.getElementById('clicker-preset');
  if (!url) return;

  if (url.includes('github.com')) {
    // Si no está ya seleccionado uno de github, sugerir Auto-Follow
    if (selectPreset.value !== 'github-follow-preset' && selectPreset.value !== 'github-unfollow-preset') {
      selectPreset.value = 'github-follow-preset';
      aplicarPresetSeleccionado();
    }
  }
}

// --- ⏱️ 2. CONTROLES DEL AUTOMÁTICO DE CLICS (CSS CLICKER) ---

// Sincronizar Sliders y Number Inputs de Intervalos
const intervalRange = document.getElementById('clicker-interval-range');
const intervalNumber = document.getElementById('clicker-interval-number');

intervalRange.addEventListener('input', (e) => {
  intervalNumber.value = e.target.value;
});

intervalNumber.addEventListener('input', (e) => {
  let val = parseInt(e.target.value);
  if (isNaN(val)) val = 100;
  if (val < 100) val = 100;
  if (val > 10000) val = 10000;
  intervalRange.value = val;
});

// Shortcuts de tiempos
document.querySelectorAll('.btn-time-shortcut').forEach(btn => {
  btn.addEventListener('click', () => {
    const ms = btn.dataset.ms;
    intervalRange.value = ms;
    intervalNumber.value = ms;
  });
});

// Manejo de Plantillas (Presets)
function aplicarPresetSeleccionado() {
  const preset = document.getElementById('clicker-preset').value;
  const inputSelector = document.getElementById('clicker-selector');
  const optionSequential = document.querySelector('input[name="clicker-strategy"][value="sequential"]');
  const optionAll = document.querySelector('input[name="clicker-strategy"][value="all"]');

  if (preset === 'github-follow-preset') {
    inputSelector.value = 'button, input[type="submit"]';
    intervalRange.value = 1500;
    intervalNumber.value = 1500;
    optionSequential.checked = true;
    escribirLogTerminal("Preset: GitHub Auto-Follow seleccionado.\nSelector: botones o submits con texto 'Follow'.");
  } else if (preset === 'github-unfollow-preset') {
    inputSelector.value = 'button, input[type="submit"]';
    intervalRange.value = 1500;
    intervalNumber.value = 1500;
    optionSequential.checked = true;
    escribirLogTerminal("Preset: GitHub Auto-Unfollow seleccionado.\nSelector: botones que dicen 'Unfollow' o 'Following'.");
  } else if (preset === 'next-button') {
    inputSelector.value = '.btn-siguiente, .btn-next, #next, button[id*="next"], button[class*="next"]';
    intervalRange.value = 1000;
    intervalNumber.value = 1000;
    optionSequential.checked = true;
    escribirLogTerminal("Preset: Botón de Siguiente/Continuar.\nÚtil para pruebas de flujo en desarrollo local.");
  } else {
    // Custom
    inputSelector.value = '';
    escribirLogTerminal("Preset Personalizado. Escribe tu propio selector CSS o usa el botón 'Apuntar'.");
  }
}

document.getElementById('clicker-preset').addEventListener('change', aplicarPresetSeleccionado);

// Escritura de Logs en Terminal
function escribirLogTerminal(texto, append = false) {
  const terminal = document.getElementById('terminal-logs');
  if (append) {
    terminal.innerText += "\n" + texto;
  } else {
    terminal.innerText = texto;
  }
  // Auto-scroll
  terminal.scrollTop = terminal.scrollHeight;
}

document.getElementById('btn-clear-logs').addEventListener('click', () => {
  escribirLogTerminal("Esperando que inicies el clicker...");
});

// --- 🚀 3. MOTOR CORE DEL CLICKER (INYECTABLE) ---
async function iniciarClicker() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const selector = document.getElementById('clicker-selector').value.trim();
  const intervaloMs = parseInt(intervalRange.value);
  const estrategia = document.querySelector('input[name="clicker-strategy"]:checked').value;
  const preset = document.getElementById('clicker-preset').value;
  const textFilter = window.lastTextFilter || '';

  if (!selector) {
    alert("Por favor, introduce un selector CSS válido.");
    return;
  }

  const logTextFilter = textFilter ? ` (con texto "${textFilter}")` : '';
  escribirLogTerminal(`🚀 Inicializando clicker en pestaña...\nSelector: "${selector}"${logTextFilter}\nIntervalo: ${intervaloMs}ms\nEstrategia: ${estrategia}`);

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      args: [selector, intervaloMs, estrategia, preset, textFilter],
      func: (sel, timeMs, strategy, currentPreset, targetTextFilter) => {
        // Detener previamente por seguridad
        if (window.devtoolkitClickerInterval) {
          clearInterval(window.devtoolkitClickerInterval);
        }
        if (window.devtoolkitClickerTimeout) {
          clearTimeout(window.devtoolkitClickerTimeout);
        }

        // Estructura de control global en la pestaña activa
        window.devtoolkitClicker = {
          activo: true,
          selector: sel,
          intervalo: timeMs,
          estrategia: strategy,
          preset: currentPreset,
          textFilter: targetTextFilter,
          clicksRealizados: 0,
          logs: [`[INICIO] Motor de clics listo.`]
        };

        // Helper para obtener el texto real visible de un elemento, soportando inputs y aria-labels
        const obtenerTextoElemento = (el) => {
          if (!el) return '';
          if (el.tagName && el.tagName.toLowerCase() === 'input') {
            return el.value ? el.value.trim() : '';
          }
          let txt = el.textContent ? el.textContent.trim() : '';
          if (!txt) {
            txt = el.getAttribute('aria-label') || el.value || '';
            txt = txt.trim();
          }
          return txt;
        };

        // Función para recopilar los botones correspondientes
        const obtenerElementos = () => {
          let lista = Array.from(document.querySelectorAll(sel));
          
          // Filtrar por visibilidad para evitar hacer clics en duplicados ocultos (responsivos/móviles)
          lista = lista.filter(el => {
            const rect = el.getBoundingClientRect();
            const estilo = window.getComputedStyle(el);
            return rect.width > 0 && 
                   rect.height > 0 && 
                   estilo.display !== 'none' && 
                   estilo.visibility !== 'hidden';
          });
          
          // Salvaguarda Universal Avanzada:
          // Si el preset actual NO es explícitamente para dejar de seguir (unfollow),
          // excluimos proactivamente cualquier botón cuyo texto indique que ya se le sigue.
          if (currentPreset !== 'github-unfollow-preset') {
            const palabrasBloqueadas = ['unfollow', 'unfallow', 'unfollowed', 'following', 'siguiendo', 'dejar de seguir', 'solicitado', 'requested'];
            lista = lista.filter(el => {
              const txt = obtenerTextoElemento(el).toLowerCase();
              const esUnfollowOrFollowing = palabrasBloqueadas.some(word => txt.includes(word));
              return !esUnfollowOrFollowing;
            });
          }
          
          // Filtros especiales para presets de GitHub
          if (currentPreset === 'github-follow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el);
              return texto === 'Follow' || texto === 'Seguir';
            });
          } else if (currentPreset === 'github-unfollow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el);
              return texto === 'Unfollow' || texto === 'Following' || texto === 'Siguiendo';
            });
          } else if (targetTextFilter) {
            // Filtrar dinámicamente por texto exacto del elemento apuntado visualmente
            lista = lista.filter(el => {
              return obtenerTextoElemento(el).toLowerCase() === targetTextFilter.toLowerCase();
            });
          }
          
          return lista;
        };

        const listadoBotones = obtenerElementos();
        window.devtoolkitClicker.logs.push(`[SITIO] Encontrados ${listadoBotones.length} elementos que coinciden.`);

        if (listadoBotones.length === 0) {
          window.devtoolkitClicker.logs.push(`[ERROR] No hay elementos para clickear.`);
          window.devtoolkitClicker.activo = false;
          return;
        }

        let indice = 0;

        // Lógica de Ejecución según Estrategia
        if (strategy === 'all') {
          // Simultáneo
          listadoBotones.forEach((btn, index) => {
            try {
              // Comprobar si ya fue clickeado en esta sesión para evitar duplicados
              if (btn.dataset.dtkClicked === 'true') {
                window.devtoolkitClicker.logs.push(`[OMITIDO] Fila #${index + 1} ya procesada.`);
                return;
              }

              btn.click();
              btn.dataset.dtkClicked = 'true';
              btn.style.outline = "2px dashed #39d353";
              btn.style.outlineOffset = "2px";
              window.devtoolkitClicker.clicksRealizados++;
              window.devtoolkitClicker.logs.push(`[CLICK] Clic Fila #${index + 1} realizado.`);
            } catch (err) {
              window.devtoolkitClicker.logs.push(`[ERROR] Falló clic en Fila #${index + 1}: ${err.message}`);
            }
          });
          window.devtoolkitClicker.logs.push(`[FIN] Todos los clicks se dispararon de forma simultánea.`);
          window.devtoolkitClicker.activo = false; // Finalizado
        } else {
          // Secuencial iterativo (Modo Humano Seguro con retrasos aleatorios y pausas de respiro)
          const hacerSiguienteClic = () => {
            if (!window.devtoolkitClicker || !window.devtoolkitClicker.activo) return;

            if (indice >= listadoBotones.length) {
              window.devtoolkitClicker.logs.push(`[FIN] Ejecución secuencial completada.`);
              window.devtoolkitClicker.activo = false;
              return;
            }

            const botonActual = listadoBotones[indice];
            
            // Comprobar si el botón ya cambió de estado (ej: ya se clickeó o cambió de texto)
            const textoBoton = obtenerTextoElemento(botonActual).toLowerCase();
            let yaClickeado = false;
            
            if (botonActual.dataset.dtkClicked === 'true') {
              yaClickeado = true;
            } else if (currentPreset !== 'github-unfollow-preset') {
              // Salvaguarda en vivo: si no es preset de dejar de seguir, ignorar si tiene palabras de "unfollow/siguiendo"
              const palabrasBloqueadas = ['unfollow', 'unfallow', 'unfollowed', 'following', 'siguiendo', 'dejar de seguir', 'solicitado', 'requested'];
              const esUnfollowOrFollowing = palabrasBloqueadas.some(word => textoBoton.includes(word));
              if (esUnfollowOrFollowing) {
                yaClickeado = true;
              }
            } else if (currentPreset === 'github-unfollow-preset' && (textoBoton === 'follow' || textoBoton === 'seguir')) {
              yaClickeado = true;
            }

            let delayActual = timeMs;

            if (!yaClickeado) {
              try {
                botonActual.click();
                botonActual.dataset.dtkClicked = 'true';
                botonActual.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Retroalimentación visual en vivo
                botonActual.style.outline = "2px dashed #39d353";
                botonActual.style.outlineOffset = "2px";
                
                window.devtoolkitClicker.clicksRealizados++;
                window.devtoolkitClicker.logs.push(`[CLICK] Clic secuencial #${window.devtoolkitClicker.clicksRealizados}/${listadoBotones.length} realizado.`);
              } catch (e) {
                window.devtoolkitClicker.logs.push(`[ERROR] Error en clic secuencial #${indice + 1}: ${e.message}`);
              }

              // Calcular un retraso con jitter aleatorio para parecer 100% humano (variación entre -15% y +25% del tiempo base)
              const variacion = (Math.random() * 0.4 - 0.15) * timeMs;
              delayActual = Math.max(200, Math.round(timeMs + variacion));

              // Pausa inteligente cada 10 clics (simula descanso humano de lectura)
              if (window.devtoolkitClicker.clicksRealizados > 0 && window.devtoolkitClicker.clicksRealizados % 10 === 0) {
                const pausaExtra = 4000 + Math.random() * 3000; // Entre 4 y 7 segundos adicionales
                delayActual += pausaExtra;
                window.devtoolkitClicker.logs.push(`[HUMANO] Pausa preventiva de seguridad: ${(pausaExtra / 1000).toFixed(1)}s de respiro...`);
              }
            } else {
              window.devtoolkitClicker.logs.push(`[OMITIDO] Fila #${indice + 1} ya procesada.`);
              delayActual = 100; // Si ya fue procesado, avanza rápido
            }

            indice++;

            // Programar siguiente clic con el retraso calculado
            window.devtoolkitClickerTimeout = setTimeout(hacerSiguienteClic, delayActual);
          };

          // Iniciar la secuencia recursiva
          window.devtoolkitClickerTimeout = setTimeout(hacerSiguienteClic, 100);
        }
      }
    });

    comenzarPollingEstado(tab.id);
  } catch (err) {
    escribirLogTerminal(`❌ Error al inyectar script: ${err.message}`, true);
  }
}

// Detener Clicker
async function detenerClicker() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  escribirLogTerminal(`⏹️ Deteniendo clicker en pestaña...`, true);

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.devtoolkitClickerInterval) {
          clearInterval(window.devtoolkitClickerInterval);
        }
        if (window.devtoolkitClickerTimeout) {
          clearTimeout(window.devtoolkitClickerTimeout);
        }
        if (window.devtoolkitClicker) {
          window.devtoolkitClicker.activo = false;
          window.devtoolkitClicker.logs.push(`[PARADA] Cancelado por el usuario.`);
        }
      }
    });
    
    actualizarUIParado();
  } catch (e) {
    escribirLogTerminal(`❌ Error al detener clicker: ${e.message}`, true);
  }
}

// --- 📈 4. POLLING DE ESTADO EN TIEMPO REAL ---
function comenzarPollingEstado(tabId) {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
  }

  pollingIntervalId = setInterval(async () => {
    try {
      const resultado = await browser.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return window.devtoolkitClicker ? window.devtoolkitClicker : null;
        }
      });

      const estado = resultado[0].result;

      if (!estado) {
        actualizarUIParado();
        return;
      }

      // Actualizar contador y logs
      document.getElementById('clicks-count').innerText = estado.clicksRealizados;
      escribirLogTerminal(estado.logs.join('\n'));

      // Actualizar botones y badge de estado
      const badge = document.getElementById('status-badge');
      const btnStart = document.getElementById('btn-iniciar-clicker');
      const btnStop = document.getElementById('btn-detener-clicker');

      if (estado.activo) {
        badge.innerText = "● EJECUTANDO";
        badge.className = "badge-running";
        btnStart.disabled = true;
        btnStop.disabled = false;
      } else {
        actualizarUIParado();
      }

    } catch (e) {
      // Si ocurre error de conexión, apagamos polling
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  }, 400); // Frecuencia de refresco rápido
}

function actualizarUIParado() {
  const badge = document.getElementById('status-badge');
  const btnStart = document.getElementById('btn-iniciar-clicker');
  const btnStop = document.getElementById('btn-detener-clicker');

  badge.innerText = "● DETENIDO";
  badge.className = "badge-stopped";
  btnStart.disabled = false;
  btnStop.disabled = true;

  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
}

// --- 🎯 5. INSPECTOR VISUAL DE ELEMENTOS (APUNTAR) ---
async function comenzarSeleccionVisual() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const btnInspect = document.getElementById('btn-inspect-element');
  btnInspect.classList.add('active-inspecting');
  btnInspect.textContent = "● Seleccionando...";
  escribirLogTerminal("🎯 Modo Inspección Activado.\nVe a la página web y haz clic en el botón o elemento que deseas automatizar.\n(La extensión detectará automáticamente todos los botones idénticos del listado)");

  try {
    // Validar proactivamente si es una página del sistema protegida
    if (tab.url && (
      tab.url.startsWith('about:') || 
      tab.url.startsWith('chrome:') || 
      tab.url.startsWith('edge:') || 
      tab.url.startsWith('view-source:')
    )) {
      throw new Error("Página del sistema protegida");
    }

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Inyectamos estilo de hover temporal
        const styleEl = document.createElement('style');
        styleEl.id = 'devtoolkit-inspect-style';
        styleEl.textContent = `
          .dtk-inspect-hover {
            outline: 2px dashed #00f2fe !important;
            outline-offset: 2px !important;
            background-color: rgba(0, 242, 254, 0.15) !important;
            cursor: crosshair !important;
            transition: outline 0.1s ease !important;
          }
          * {
            cursor: crosshair !important;
          }
        `;
        document.head.appendChild(styleEl);

        let lastEl = null;

        const onMouseMove = (e) => {
          e.stopPropagation();
          let target = e.target;
          
          // Buscar hacia arriba el contenedor cliqueable real (button, a, input, etc.)
          while (target && target.tagName && target.parentNode && target.tagName.toLowerCase() !== 'body') {
            const tag = target.tagName.toLowerCase();
            if (tag === 'button' || tag === 'a' || tag === 'input' || target.getAttribute('role') === 'button') {
              break;
            }
            target = target.parentNode;
          }
          if (!target || !target.tagName) target = e.target;

          if (target === lastEl) return;
          if (lastEl) lastEl.classList.remove('dtk-inspect-hover');
          
          target.classList.add('dtk-inspect-hover');
          lastEl = target;
        };

        const onClick = (e) => {
          if (!lastEl) return;

          let clickedEl = e.target;
          let foundClickable = false;
          while (clickedEl && clickedEl.tagName && clickedEl.parentNode && clickedEl.tagName.toLowerCase() !== 'body') {
            const tag = clickedEl.tagName.toLowerCase();
            if (tag === 'button' || tag === 'a' || tag === 'input' || clickedEl.getAttribute('role') === 'button') {
              foundClickable = true;
              break;
            }
            clickedEl = clickedEl.parentNode;
          }
          
          if (!foundClickable) {
            return;
          }
          
          cleanup();
          
          const generalizedData = getGeneralizedSelector(clickedEl);
          
          browser.runtime.sendMessage({
            type: 'DTK_ELEMENT_SELECTED',
            selector: generalizedData.selector,
            textFilter: generalizedData.textFilter,
            isGitHub: window.location.hostname.includes('github.com')
          });
        };

        const onKeyDown = (e) => {
          if (e.key === 'Escape') {
            cleanup();
            browser.runtime.sendMessage({
              type: 'DTK_SELECTION_CANCELLED'
            });
          }
        };

        const cleanup = () => {
          if (lastEl) lastEl.classList.remove('dtk-inspect-hover');
          document.removeEventListener('mousemove', onMouseMove, true);
          document.removeEventListener('click', onClick, true);
          document.removeEventListener('keydown', onKeyDown, true);
          const style = document.getElementById('devtoolkit-inspect-style');
          if (style) style.remove();
        };

        // Genera el selector generalizado para todos los botones del listado
        function getGeneralizedSelector(el) {
          if (!el || !el.tagName) {
            return { selector: 'button', textFilter: '' };
          }
          
          const tagName = el.tagName.toLowerCase();
          
          // Obtener texto compatible con inputs y aria-labels
          let text = '';
          if (tagName === 'input') {
            text = el.value ? el.value.trim() : '';
          } else {
            text = el.textContent ? el.textContent.trim() : '';
            if (!text) {
              text = el.getAttribute('aria-label') || el.value || '';
              text = text.trim();
            }
          }
          
          let bestSelector = tagName;
          
          // 1. Intentar encontrar una clase de grupo compartida
          if (el.classList && el.classList.length > 0) {
            const validClasses = Array.from(el.classList).filter(c => {
              if (!c || isDynamicClass(c)) return false;
              
              try {
                // Medir cuántos elementos de este tipo comparten esta clase en la página
                const count = document.querySelectorAll(tagName + '.' + CSS.escape(c)).length;
                return count > 1 && count < 250;
              } catch (err) {
                return false;
              }
            });
            
            if (validClasses.length > 0) {
              bestSelector = `${tagName}.${validClasses.map(c => CSS.escape(c)).join('.')}`;
            }
          }
          
          // 2. Si no tiene clases específicas pero tiene ID estructurado común
          if (bestSelector === tagName && el.id) {
            const cleanId = el.id.replace(/\d+/g, '');
            if (cleanId && cleanId.length > 2) {
              bestSelector = `${tagName}[id*="${cleanId}"]`;
            }
          }
          
          return {
            selector: bestSelector,
            textFilter: text || ''
          };
        }

        function isDynamicClass(c) {
          return /^[a-zA-Z0-9_-]+-[0-9a-fA-F]{5,10}$/.test(c) || /^(css|jss|styled|__)\w+/.test(c);
        }

        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('click', onClick, true);
        document.addEventListener('keydown', onKeyDown, true);
      }
    });
  } catch (err) {
    console.error("Error al inyectar inspector:", err);
    
    const isSystemPage = tab.url && (
      tab.url.startsWith('about:') || 
      tab.url.startsWith('chrome:') || 
      tab.url.startsWith('edge:') || 
      tab.url.startsWith('view-source:')
    );

    if (isSystemPage || (err.message && (err.message.includes("host permission") || err.message.includes("cannot be scripted") || err.message.includes("denied") || err.message.includes("sistema")))) {
      escribirLogTerminal(`⚠️ ¡Página del sistema o protegida!\nNo se pueden inyectar scripts en páginas internas del navegador.\n\n👉 ¡Ve a tu página web real, abre la extensión allí y pulsa "Apuntar"!`, true);
    } else {
      escribirLogTerminal(`❌ Error de Selección: ${err.message || err}`, true);
    }
    
    btnInspect.classList.remove('active-inspecting');
    btnInspect.textContent = "🎯 Apuntar";
  }
}

// Receptor de Mensajería Nativa (Web -> Sidebar)
browser.runtime.onMessage.addListener((message) => {
  const btnInspect = document.getElementById('btn-inspect-element');
  
  if (message.type === 'DTK_ELEMENT_SELECTED') {
    const { selector, textFilter, isGitHub } = message;
    
    document.getElementById('clicker-selector').value = selector;
    window.lastTextFilter = textFilter;
    
    // Auto-detección inteligente de presets de GitHub
    if (isGitHub) {
      const textLower = textFilter.toLowerCase();
      if (textLower === 'follow' || textLower === 'seguir') {
        document.getElementById('clicker-preset').value = 'github-follow-preset';
        document.getElementById('clicker-selector').value = 'button, input[type="submit"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: GitHub Auto-Follow (Seguir).\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else if (textLower === 'unfollow' || textLower === 'following' || textLower === 'siguiendo') {
        document.getElementById('clicker-preset').value = 'github-unfollow-preset';
        document.getElementById('clicker-selector').value = 'button, input[type="submit"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: GitHub Auto-Unfollow.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else {
        document.getElementById('clicker-preset').value = 'custom';
        const logTextFilter = textFilter ? ` con texto "${textFilter}"` : '';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\nSelector generalizado: "${selector}"${logTextFilter}.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      }
    } else {
      document.getElementById('clicker-preset').value = 'custom';
      const logTextFilter = textFilter ? ` con texto "${textFilter}"` : '';
      escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\nSelector generalizado: "${selector}"${logTextFilter}.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
    }
    
    btnInspect.classList.remove('active-inspecting');
    btnInspect.textContent = "🎯 Apuntar";
    
    // Iniciar el clicker de forma automática e inmediata (con 600ms de retraso para el foco)
    setTimeout(() => {
      iniciarClicker();
    }, 600);
    
  } else if (message.type === 'DTK_SELECTION_CANCELLED') {
    escribirLogTerminal("⚠️ Selección cancelada por el usuario.", true);
    btnInspect.classList.remove('active-inspecting');
    btnInspect.textContent = "🎯 Apuntar";
  }
});

// Listeners principales
document.getElementById('btn-iniciar-clicker').addEventListener('click', iniciarClicker);
document.getElementById('btn-detener-clicker').addEventListener('click', detenerClicker);
document.getElementById('btn-inspect-element').addEventListener('click', comenzarSeleccionVisual);
document.getElementById('clicker-selector').addEventListener('input', () => {
  window.lastTextFilter = '';
  document.getElementById('clicker-preset').value = 'custom';
});

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

// Carga Inicial
refrescarPanel();

// --- 📁 6. CONTROL DE NAVEGACIÓN POR PESTAÑAS ---
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