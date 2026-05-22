// ==========================================================================
// 🚀 AUTOCLICKER PRO - MÓDULO DEL MOTOR DE CLICS (clicker-engine.js)
// ==========================================================================

window.pollingIntervalId = null;

// --- ⚙️ SINCRONIZACIÓN DE PARÁMETROS EN TIEMPO REAL CON LA PESTAÑA OBJETIVO ---
async function sincronizarParametrosConTab() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    const msVal = parseInt(document.getElementById('clicker-interval-range').value);
    const humanMode = document.getElementById('clicker-human-mode').checked;
    const jitterLevel = document.getElementById('clicker-jitter-level').value;
    const soundMode = document.getElementById('clicker-sound-mode').checked;
    
    const esInsta = tab.url && tab.url.includes('instagram.com');
    const chkSimple = document.getElementById('clicker-instagram-unfollow-simple');
    const instagramUnfollow = (chkSimple && esInsta) ? chkSimple.checked : false;
    
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      args: [msVal, humanMode, jitterLevel, soundMode, instagramUnfollow],
      func: (nuevoIntervalo, nuevoHumanMode, nuevoJitterLevel, nuevoSoundMode, nuevoInstagramUnfollow) => {
        if (window.devtoolkitClicker) {
          const esInstaTab = window.location.hostname.includes('instagram.com');
          const esFacebookTab = window.location.hostname.includes('facebook.com');
          const esPaginaConModal = esInstaTab || esFacebookTab;
          const finalInstagramUnfollow = esPaginaConModal ? nuevoInstagramUnfollow : false;

          let cambios = [];
          if (window.devtoolkitClicker.intervalo !== nuevoIntervalo) {
            window.devtoolkitClicker.intervalo = nuevoIntervalo;
            cambios.push(`Velocidad (${nuevoIntervalo}ms)`);
          }
          if (window.devtoolkitClicker.humanMode !== nuevoHumanMode) {
            window.devtoolkitClicker.humanMode = nuevoHumanMode;
            cambios.push(`Ritmo Humano (${nuevoHumanMode ? 'Sí' : 'No'})`);
          }
          if (window.devtoolkitClicker.jitterLevel !== nuevoJitterLevel) {
            window.devtoolkitClicker.jitterLevel = nuevoJitterLevel;
            cambios.push(`Variación (${nuevoJitterLevel})`);
          }
          if (window.devtoolkitClicker.soundMode !== nuevoSoundMode) {
            window.devtoolkitClicker.soundMode = nuevoSoundMode;
            cambios.push(`Sonido (${nuevoSoundMode ? 'Sí' : 'No'})`);
          }
          if (esPaginaConModal && window.devtoolkitClicker.instagramUnfollow !== finalInstagramUnfollow) {
            window.devtoolkitClicker.instagramUnfollow = finalInstagramUnfollow;
            cambios.push(`Auto-confirmación Modales (${finalInstagramUnfollow ? 'Sí' : 'No'})`);
          }
          
          if (cambios.length > 0) {
            window.devtoolkitClicker.logs.push(`[SISTEMA] Cambios aplicados en tiempo real: ${cambios.join(', ')}.`);
          }
        }
      }
    });
  } catch (e) {
    // Ignorar si no hay pestaña o permisos
  }
}

function sincronizarControlesVelocidad(ms, ignorarTab = false) {
  const intervalRange = document.getElementById('clicker-interval-range');
  const intervalNumber = document.getElementById('clicker-interval-number');
  
  if (intervalRange) intervalRange.value = ms;
  if (intervalNumber) intervalNumber.value = ms;
  
  // Sincronizar radio del modo sencillo
  const msStr = String(ms);
  const radio = document.querySelector(`input[name="simple-speed"][value="${msStr}"]`);
  if (radio) {
    radio.checked = true;
  } else {
    // Si no coincide exactamente con 500, 1500 o 3000, desmarcar todos
    document.querySelectorAll('input[name="simple-speed"]').forEach(r => r.checked = false);
  }
  
  if (!ignorarTab) {
    sincronizarParametrosConTab();
  }
}

// --- 🚀 MOTOR CORE INYECTABLE ---
async function iniciarClicker() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const selector = document.getElementById('clicker-selector').value.trim();
  const intervalRange = document.getElementById('clicker-interval-range');
  const intervaloMs = parseInt(intervalRange.value);
  const estrategia = document.querySelector('input[name="clicker-strategy"]:checked').value;
  const preset = document.getElementById('clicker-preset').value;
  const textFilter = document.getElementById('clicker-text-filter').value.trim();
  const humanMode = document.getElementById('clicker-human-mode').checked;
  const jitterLevel = document.getElementById('clicker-jitter-level').value;
  const soundMode = document.getElementById('clicker-sound-mode').checked;
  
  const esInsta = tab.url && tab.url.includes('instagram.com');
  const esFacebook = tab.url && tab.url.includes('facebook.com');
  const esPaginaConModal = esInsta || esFacebook;
  const instagramUnfollow = esPaginaConModal && (preset.includes('-unfollow-') || preset.includes('cancel'));

  if (!selector) {
    alert("Por favor, introduce un selector CSS válido.");
    return;
  }

  // Restablecer panel de estadísticas a cero para la nueva ejecución (Consola)
  const countTerm = document.getElementById('clicks-count-term');
  const speedTerm = document.getElementById('speed-average-term');
  const savedTerm = document.getElementById('time-saved-term');
  if (countTerm) countTerm.innerText = "0";
  if (speedTerm) speedTerm.innerText = "0.00s";
  if (savedTerm) savedTerm.innerText = "0.0s";

  const logTextFilter = textFilter ? ` (con texto "${textFilter}")` : '';
  const logHuman = humanMode ? `\n[HUMANO] Ritmo Humano: Activado (${jitterLevel === 'low' ? 'Suave' : jitterLevel === 'high' ? 'Caótico' : 'Humano'})` : `\n[HUMANO] Ritmo Humano: Desactivado`;
  const logSound = soundMode ? `\n[SISTEMA] Sonido Arcade: Activado` : `\n[SISTEMA] Sonido Arcade: Desactivado`;
  const logInstagram = (instagramUnfollow && esPaginaConModal) ? `\n[SISTEMA] Auto-confirmar Ventanas: Activado` : ``;
  const logSitio = esInsta ? `\n[SITIO] Detectado Instagram.` : esFacebook ? `\n[SITIO] Detectado Facebook.` : ``;

  escribirLogTerminal(`[INICIO] Inicializando clicker en pestaña...\n[SISTEMA] Selector: "${selector}"${logTextFilter}\n[SISTEMA] Intervalo: ${intervaloMs}ms\n[SISTEMA] Estrategia: ${estrategia}${logHuman}${logSound}${logInstagram}${logSitio}`);

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      args: [selector, intervaloMs, estrategia, preset, textFilter, humanMode, jitterLevel, soundMode, instagramUnfollow],
      func: (sel, timeMs, strategy, currentPreset, targetTextFilter, isHumanMode, levelJitter, isSoundMode, instagramUnfollow) => {
        // Detener previamente por seguridad
        if (window.devtoolkitClickerInterval) {
          clearInterval(window.devtoolkitClickerInterval);
        }
        if (window.devtoolkitClickerTimeout) {
          clearTimeout(window.devtoolkitClickerTimeout);
        }

        const esPaginaInstagram = window.location.hostname.includes('instagram.com');
        const esPaginaFacebook = window.location.hostname.includes('facebook.com');
        const esPaginaConModalConfirmacion = esPaginaInstagram || esPaginaFacebook;
        const finalInstagramUnfollow = esPaginaConModalConfirmacion ? instagramUnfollow : false;

        // Estructura de control global en la pestaña activa
        window.devtoolkitClicker = {
          activo: true,
          selector: sel,
          intervalo: timeMs,
          estrategia: strategy,
          preset: currentPreset,
          textFilter: targetTextFilter,
          humanMode: isHumanMode,
          jitterLevel: levelJitter,
          clicksRealizados: 0,
          ultimoClickTime: Date.now(),
          startTime: Date.now(),
          soundMode: isSoundMode,
          instagramUnfollow: finalInstagramUnfollow,
          logs: [
            `[INICIO] Motor de clics listo.`,
            ...(esPaginaInstagram ? [`[SITIO] En Instagram: activando preset y auto-confirmación.`] : [])
          ]
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

        const buscarBotonConfirmacion = () => {
          const botones = Array.from(document.querySelectorAll('button, [role="button"], [role="dialog"] div, [role="dialog"] span, [tabindex="0"]'));
          const palabrasConfirmacion = ['dejar de seguir', 'unfollow', 'confirmar', 'confirm'];
          return botones.find(b => {
            const txt = obtenerTextoElemento(b).toLowerCase().replace(/\s+/g, ' ').trim();
            return palabrasConfirmacion.includes(txt);
          });
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

          // Priorizar elementos dentro de ventanas emergentes / modales si hay alguna abierta
          const modales = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]')).filter(m => {
            const r = m.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && window.getComputedStyle(m).display !== 'none' && window.getComputedStyle(m).visibility !== 'hidden';
          });

          if (modales.length > 0) {
            const elementosEnModal = lista.filter(el => modales.some(m => m.contains(el)));
            // Si el modal contiene los botones que buscamos, nos enfocamos 100% en el modal y descartamos el fondo
            if (elementosEnModal.length > 0) {
              lista = elementosEnModal;
            }
          }
          
          // Salvaguarda Universal Avanzada:
          // Si el preset actual NO es explícitamente para dejar de seguir (unfollow) ni cancelar
          if (!currentPreset.includes('-unfollow-') && !currentPreset.includes('cancel') && !finalInstagramUnfollow) {
            const palabrasBloqueadas = ['unfollow', 'unfallow', 'unfollowed', 'following', 'siguiendo', 'dejar de seguir', 'solicitado', 'requested', 'cancelar'];
            lista = lista.filter(el => {
              const txt = obtenerTextoElemento(el).toLowerCase();
              const esBloqueado = palabrasBloqueadas.some(word => txt.includes(word));
              return !esBloqueado;
            });
          }
          
          // Filtros especiales para presets de GitHub, Instagram, TikTok y Facebook
          if (currentPreset === 'github-follow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto === 'follow' || texto === 'seguir';
            });
          } else if (currentPreset === 'github-unfollow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto === 'unfollow' || texto === 'following' || texto === 'siguiendo';
            });
          } else if (currentPreset === 'instagram-follow-preset' && esPaginaInstagram) {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto === 'seguir' || texto === 'follow';
            });
          } else if (currentPreset === 'instagram-unfollow-preset' && esPaginaInstagram) {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto === 'siguiendo' || texto === 'following';
            });
          } else if (currentPreset === 'tiktok-follow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto === 'follow' || texto === 'seguir';
            });
          } else if (currentPreset === 'tiktok-unfollow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto === 'unfollow' || texto === 'following' || texto === 'siguiendo';
            });
          } else if (currentPreset === 'facebook-add-friend-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto.includes('agregar') || texto.includes('add friend');
            });
          } else if (currentPreset === 'facebook-cancel-request-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto.includes('cancelar') || texto.includes('cancel request');
            });
          } else if (currentPreset === 'facebook-follow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto === 'follow' || texto === 'seguir';
            });
          } else if (currentPreset === 'facebook-unfollow-preset') {
            lista = lista.filter(el => {
              const texto = obtenerTextoElemento(el).toLowerCase();
              return texto.includes('following') || texto.includes('siguiendo') || texto === 'unfollow';
            });
          } else if (targetTextFilter) {
            // Filtrar dinámicamente por texto exacto del elemento apuntado visualmente
            lista = lista.filter(el => {
              return obtenerTextoElemento(el).toLowerCase().includes(targetTextFilter.toLowerCase());
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
            
            // Acceder dinámicamente a los parámetros que pueden actualizarse en tiempo real
            const actPreset = window.devtoolkitClicker.preset || currentPreset;
            const actInstagramUnfollow = esPaginaConModalConfirmacion ? (typeof window.devtoolkitClicker.instagramUnfollow !== 'undefined' ? window.devtoolkitClicker.instagramUnfollow : instagramUnfollow) : false;
            const actHumanMode = typeof window.devtoolkitClicker.humanMode !== 'undefined' ? window.devtoolkitClicker.humanMode : isHumanMode;
            const actJitterLevel = window.devtoolkitClicker.jitterLevel || levelJitter;
            const actSoundMode = typeof window.devtoolkitClicker.soundMode !== 'undefined' ? window.devtoolkitClicker.soundMode : isSoundMode;

            let esIntentUnfollow = actPreset.includes('-unfollow-') || actPreset.includes('cancel');
            let esIntentFollow = actPreset.includes('-follow-') || actPreset.includes('add-friend');
            
            // Si es custom y el modal de auto-confirmación está activado, asumimos unfollow solo si no es explícitamente follow
            if (!esIntentUnfollow && !esIntentFollow) {
               esIntentUnfollow = actInstagramUnfollow; 
            }

            if (botonActual.dataset.dtkClicked === 'true') {
              yaClickeado = true;
            } else if (esIntentFollow) {
              // Si es un preset de follow explícito, ignorar botones que ya dicen siguiendo o unfollow
              const palabrasBloqueadas = ['unfollow', 'unfallow', 'unfollowed', 'following', 'siguiendo', 'dejar de seguir', 'solicitado', 'requested', 'cancelar', 'pendiente', 'pending'];
              if (palabrasBloqueadas.some(word => textoBoton.includes(word))) {
                yaClickeado = true;
              }
            } else if (esIntentUnfollow) {
              // Si es un preset de unfollow explícito, ignorar botones que dicen follow o seguir
              if (textoBoton === 'follow' || textoBoton === 'seguir' || textoBoton === 'agregar a amigos' || textoBoton === 'add friend') {
                yaClickeado = true;
              }
            } else {
              // Por defecto (custom genérico), proteger contra unfollow accidental por seguridad
              const palabrasBloqueadas = ['unfollow', 'unfallow', 'unfollowed', 'following', 'siguiendo', 'dejar de seguir', 'cancelar'];
              if (palabrasBloqueadas.some(word => textoBoton.includes(word))) {
                yaClickeado = true;
              }
            }

            let baseInterval = (window.devtoolkitClicker && typeof window.devtoolkitClicker.intervalo !== 'undefined') ? window.devtoolkitClicker.intervalo : timeMs;
            let delayActual = baseInterval;

            if (!yaClickeado) {
              try {
                botonActual.click();
                botonActual.dataset.dtkClicked = 'true';
                botonActual.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Retroalimentación visual en vivo
                botonActual.style.outline = "2px dashed #39d353";
                botonActual.style.outlineOffset = "2px";
                
                const ahora = Date.now();
                const tiempoTranscurrido = window.devtoolkitClicker.ultimoClickTime ? (ahora - window.devtoolkitClicker.ultimoClickTime) : 0;
                window.devtoolkitClicker.ultimoClickTime = ahora;
                
                window.devtoolkitClicker.clicksRealizados++;
                
                let logMsg = `[CLICK] Clic secuencial #${window.devtoolkitClicker.clicksRealizados}/${listadoBotones.length} realizado`;
                if (tiempoTranscurrido > 0) {
                  logMsg += ` (retraso real: ${(tiempoTranscurrido / 1000).toFixed(2)}s).`;
                } else {
                  logMsg += ` (inicio).`;
                }
                window.devtoolkitClicker.logs.push(logMsg);

                let promesaModal = Promise.resolve();

                // --- GESTIÓN DE AUTO-CONFIRMACIÓN DE MODALES (INSTAGRAM/FACEBOOK) ---
                if (actInstagramUnfollow && esPaginaConModalConfirmacion) {
                  promesaModal = new Promise(resolve => {
                    let intentos = 0;
                    const checkInterval = setInterval(() => {
                      intentos++;
                      const btnConfirmar = buscarBotonConfirmacion();
                      if (btnConfirmar) {
                        clearInterval(checkInterval);
                        btnConfirmar.click();
                        window.devtoolkitClicker.logs.push(`[SISTEMA] Ventana de confirmación detectada. Se hizo clic automáticamente.`);
                        setTimeout(resolve, 300); // 300ms de respiro para que se cierre visualmente
                      } else if (intentos >= 15) { // Máximo 3 segundos
                        clearInterval(checkInterval);
                        window.devtoolkitClicker.logs.push(`[AVISO] No se encontró el botón de confirmación en la ventana emergente tras 3s.`);
                        resolve();
                      }
                    }, 200);
                  });
                }

                // Reproducir sonido arcade si está activo
                if (actSoundMode) {
                  try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    
                    // Sonido retro "click" de tipo arcade (pitch alto que desciende rápidamente)
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
                    
                    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
                    
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.08);
                  } catch (ae) {
                    // Ignorar errores de autoplay del navegador
                  }
                }

                promesaModal.then(() => {
                  if (actHumanMode) {
                    // Rango de variación según el nivel
                    let minPercent = -0.10; // -10% por defecto (mínimo tiempo de reacción)
                    let maxPercent = 0.30;  // +30% por defecto (ligeros retrasos de atención)

                    if (actJitterLevel === 'low') {
                      minPercent = -0.05;
                      maxPercent = 0.15;
                    } else if (actJitterLevel === 'high') {
                      minPercent = -0.15;
                      maxPercent = 0.50;
                    }

                    // Calcular factor aleatorio en el rango [minPercent, maxPercent]
                    const factorAleatorio = minPercent + Math.random() * (maxPercent - minPercent);
                    delayActual = Math.round(baseInterval * (1 + factorAleatorio));

                    // Asegurar un mínimo absoluto de 150ms para no disparar alertas
                    delayActual = Math.max(150, delayActual);

                    // Pausa inteligente cada 10 clics (simula descanso humano de lectura)
                    if (window.devtoolkitClicker.clicksRealizados > 0 && window.devtoolkitClicker.clicksRealizados % 10 === 0) {
                      const pausaExtra = 3000 + Math.random() * 4000; // Entre 3 y 7 segundos adicionales
                      delayActual += pausaExtra;
                      window.devtoolkitClicker.logs.push(`[HUMANO] Pausa preventiva de seguridad: ${(pausaExtra / 1000).toFixed(1)}s de respiro...`);
                    }
                  }

                  indice++;
                  // Programar siguiente clic con el retraso calculado
                  window.devtoolkitClickerTimeout = setTimeout(hacerSiguienteClic, delayActual);
                });
                return; // Cortar el flujo síncrono aquí
              } catch (e) {
                window.devtoolkitClicker.logs.push(`[ERROR] Error en clic secuencial #${indice + 1}: ${e.message}`);
              }
            } else {
              window.devtoolkitClicker.logs.push(`[OMITIDO] Fila #${indice + 1} ya procesada.`);
              delayActual = 100; // Si ya fue procesado, avanza rápido
            }

            indice++;

            // Programar siguiente clic con el retraso calculado (solo para la rama else/catch)
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

// --- 📈 POLLING DE ESTADO EN TIEMPO REAL ---
function comenzarPollingEstado(tabId) {
  if (window.pollingIntervalId) {
    clearInterval(window.pollingIntervalId);
  }

  window.pollingIntervalId = setInterval(async () => {
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

      const countEl = document.getElementById('clicks-count-term');
      const ultimoClicks = countEl ? (parseInt(countEl.innerText) || 0) : 0;

      // Actualizar contador y logs (Consola)
      if (countEl) countEl.innerText = estado.clicksRealizados;
      escribirLogTerminal(estado.logs.join('\n'));

      // Reproducir sonido arcade si los clics aumentaron y el modo de sonido está activo
      const soundMode = document.getElementById('clicker-sound-mode').checked;
      if (soundMode && estado.clicksRealizados > ultimoClicks) {
        reproducirSonidoArcadeSidebar();
      }

      // Actualizar estadísticas avanzadas (Consola)
      const tiempoAhorrado = estado.clicksRealizados * 1.5; // Estimado de 1.5s ahorrados por click
      const timeSavedTerm = document.getElementById('time-saved-term');
      if (timeSavedTerm) timeSavedTerm.innerText = `${tiempoAhorrado.toFixed(1)}s`;

      const speedAvgTerm = document.getElementById('speed-average-term');
      if (estado.clicksRealizados > 0 && estado.startTime) {
        const tiempoTotalMs = Date.now() - estado.startTime;
        const ritmoMedio = (tiempoTotalMs / 1000) / estado.clicksRealizados;
        if (speedAvgTerm) speedAvgTerm.innerText = `${ritmoMedio.toFixed(2)}s`;
      } else {
        if (speedAvgTerm) speedAvgTerm.innerText = "0.00s";
      }

      // Actualizar botones y badge de estado
      const badgeTerm = document.getElementById('status-badge-term');
      const btnStart = document.getElementById('btn-iniciar-clicker');
      const btnStop = document.getElementById('btn-detener-clicker');

      if (estado.activo) {
        if (badgeTerm) {
          badgeTerm.innerText = "● EJECUTANDO";
          badgeTerm.className = "badge-running";
        }
        
        btnStart.disabled = true;
        btnStop.disabled = false;
        
        // Activar animación en la consola y la pestaña
        document.querySelectorAll('.terminal-box').forEach(term => term.classList.add('working'));
        const tabTerm = document.getElementById('tab-terminal');
        if (tabTerm) tabTerm.classList.add('working');
      } else {
        actualizarUIParado();
      }

    } catch (e) {
      // Si ocurre error de conexión, apagamos polling
      clearInterval(window.pollingIntervalId);
      window.pollingIntervalId = null;
    }
  }, 400); // Frecuencia de refresco rápido
}
