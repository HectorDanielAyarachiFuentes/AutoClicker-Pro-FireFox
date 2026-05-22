// ==========================================================================
// 🚀 AUTOCLICKER PRO - MÓDULO DEL INSPECTOR VISUAL (visual-inspector.js)
// ==========================================================================

// --- 🎯 INSPECTOR VISUAL DE ELEMENTOS (APUNTAR) ---
async function comenzarSeleccionVisual() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      escribirLogTerminal("⚠️ No se pudo detectar una pestaña web activa.\n👉 Haz clic en la página web primero y luego pulsa 'Apuntar Elemento' en el clicker.", true);
      return;
    }

    setInspectActive(true);
    escribirLogTerminal("🎯 Modo Inspección Activado.\nVe a la página web y haz clic en el botón o elemento que deseas automatizar.\n(La extensión detectará automáticamente todos los botones idénticos del listado)");

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
          // Evitar que la página ejecute acciones nativas (navegación, submit de form, etc.)
          e.preventDefault();
          e.stopPropagation();

          let clickedEl = e.target;
          let tempEl = clickedEl;
          
          // Buscar el ancestro interactivo más cercano
          while (tempEl && tempEl.tagName && tempEl.parentNode && tempEl.tagName.toLowerCase() !== 'body') {
            const tag = tempEl.tagName.toLowerCase();
            if (tag === 'button' || tag === 'a' || tag === 'input' || tempEl.getAttribute('role') === 'button') {
              clickedEl = tempEl;
              break;
            }
            tempEl = tempEl.parentNode;
          }
          
          cleanup();
          
          const generalizedData = getGeneralizedSelector(clickedEl);
          
          browser.runtime.sendMessage({
            type: 'DTK_ELEMENT_SELECTED',
            selector: generalizedData.selector,
            textFilter: generalizedData.textFilter,
            isGitHub: window.location.hostname.includes('github.com'),
            isInstagram: window.location.hostname.includes('instagram.com'),
            isTikTok: window.location.hostname.includes('tiktok.com'),
            isFacebook: window.location.hostname.includes('facebook.com')
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
          
          // 1. Intentar encontrar una clase de grupo compartida o única
          if (el.classList && el.classList.length > 0) {
            const validClasses = Array.from(el.classList).filter(c => {
              if (!c || isDynamicClass(c)) return false;
              
              try {
                // Medir cuántos elementos de este tipo comparten esta clase en la página
                const count = document.querySelectorAll(tagName + '.' + CSS.escape(c)).length;
                return count >= 1 && count < 250;
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
    
    // Tratamiento seguro en caso de que tab no esté definida
    let isSystemPage = false;
    try {
      const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = activeTabs[0];
      if (activeTab && activeTab.url) {
        isSystemPage = activeTab.url.startsWith('about:') || 
                       activeTab.url.startsWith('chrome:') || 
                       activeTab.url.startsWith('edge:') || 
                       activeTab.url.startsWith('view-source:');
      }
    } catch (e) {
      // Ignorar fallo secundario de tab query
    }

    if (isSystemPage || (err.message && (err.message.includes("host permission") || err.message.includes("cannot be scripted") || err.message.includes("denied") || err.message.includes("sistema")))) {
      escribirLogTerminal(`⚠️ ¡Página del sistema o protegida!\nNo se pueden inyectar scripts en páginas internas del navegador.\n\n👉 ¡Ve a tu página web real, abre la extensión allí y pulsa "Apuntar"!`, true);
    } else {
      escribirLogTerminal(`❌ Error de Selección: ${err.message || err}`, true);
    }
    
    setInspectActive(false);
  }
}

// Receptor de Mensajería Nativa (Web -> Sidebar)
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'DTK_ELEMENT_SELECTED') {
    const { selector, textFilter, isGitHub, isInstagram, isTikTok, isFacebook } = message;
    
    document.getElementById('clicker-selector').value = selector;
    window.lastTextFilter = textFilter;
    document.getElementById('clicker-text-filter').value = textFilter || '';
    
    // Auto-detección inteligente de presets de GitHub, Instagram, TikTok y Facebook
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
    } else if (isInstagram) {
      const textLower = textFilter.toLowerCase();
      if (textLower === 'seguir' || textLower === 'follow') {
        document.getElementById('clicker-preset').value = 'instagram-follow-preset';
        document.getElementById('clicker-selector').value = 'button, div[role="button"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: Instagram Auto-Follow.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else if (textLower === 'siguiendo' || textLower === 'following') {
        document.getElementById('clicker-preset').value = 'instagram-unfollow-preset';
        document.getElementById('clicker-selector').value = 'button';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: Instagram Auto-Unfollow.\n📸 Auto-confirmación inteligente de ventanas emergentes "Dejar de seguir" activada.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else {
        document.getElementById('clicker-preset').value = 'custom';
        const logTextFilter = textFilter ? ` con texto "${textFilter}"` : '';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\nSelector generalizado: "${selector}"${logTextFilter}.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      }
    } else if (isTikTok) {
      const textLower = textFilter.toLowerCase();
      if (textLower === 'seguir' || textLower === 'follow') {
        document.getElementById('clicker-preset').value = 'tiktok-follow-preset';
        document.getElementById('clicker-selector').value = 'button, div[role="button"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: TikTok Auto-Follow.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else if (textLower === 'siguiendo' || textLower === 'following' || textLower === 'unfollow') {
        document.getElementById('clicker-preset').value = 'tiktok-unfollow-preset';
        document.getElementById('clicker-selector').value = 'button, div[role="button"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: TikTok Auto-Unfollow.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else {
        document.getElementById('clicker-preset').value = 'custom';
        const logTextFilter = textFilter ? ` con texto "${textFilter}"` : '';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\nSelector generalizado: "${selector}"${logTextFilter}.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      }
    } else if (isFacebook) {
      const textLower = textFilter.toLowerCase();
      if (textLower.includes('agregar') || textLower.includes('add friend')) {
        document.getElementById('clicker-preset').value = 'facebook-add-friend-preset';
        document.getElementById('clicker-selector').value = 'div[role="button"], button, a[role="button"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: Facebook Agregar a amigos.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else if (textLower.includes('cancelar') || textLower.includes('cancel request')) {
        document.getElementById('clicker-preset').value = 'facebook-cancel-request-preset';
        document.getElementById('clicker-selector').value = 'div[role="button"], button, a[role="button"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: Facebook Cancelar solicitud.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else if (textLower === 'seguir' || textLower === 'follow') {
        document.getElementById('clicker-preset').value = 'facebook-follow-preset';
        document.getElementById('clicker-selector').value = 'div[role="button"], button, a[role="button"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: Facebook Seguir.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
      } else if (textLower.includes('siguiendo') || textLower.includes('following') || textLower === 'unfollow') {
        document.getElementById('clicker-preset').value = 'facebook-unfollow-preset';
        document.getElementById('clicker-selector').value = 'div[role="button"], button, a[role="button"]';
        escribirLogTerminal(`🎯 ¡Elemento apuntado con éxito!\n💡 Auto-detectado preset: Facebook Dejar de seguir.\n🤖 Auto-confirmación inteligente de ventanas flotantes activada.\n🤖 Iniciando secuencia de clics secuencial segura...`, true);
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
    
    setInspectActive(false);
    actualizarVisualSelectorSimple();
    
    // Iniciar el clicker de forma automática e inmediata (con 600ms de retraso para el foco)
    setTimeout(() => {
      iniciarClicker();
    }, 600);
    
  } else if (message.type === 'DTK_SELECTION_CANCELLED') {
    escribirLogTerminal("⚠️ Selección cancelada por el usuario.", true);
    setInspectActive(false);
  }
});

// --- 🛠️ HELPER STATE FOR SIMPLE/ADVANCED MODES ---
function setInspectActive(active) {
  const btnAdv = document.getElementById('btn-inspect-element');
  const btnSim = document.getElementById('btn-inspect-simple');
  
  if (active) {
    if (btnAdv) {
      btnAdv.classList.add('active-inspecting');
      btnAdv.textContent = "● Seleccionando...";
    }
    if (btnSim) {
      btnSim.classList.add('active-inspecting');
      btnSim.textContent = "● Seleccionando...";
    }
  } else {
    if (btnAdv) {
      btnAdv.classList.remove('active-inspecting');
      btnAdv.textContent = "🎯 Apuntar";
    }
    if (btnSim) {
      btnSim.classList.remove('active-inspecting');
      btnSim.textContent = "🎯 Apuntar Elemento";
    }
  }
}

function actualizarVisualSelectorSimple() {
  const selector = document.getElementById('clicker-selector').value.trim();
  const textFilter = document.getElementById('clicker-text-filter').value.trim();
  const descEl = document.getElementById('simple-target-desc');
  const iconEl = document.querySelector('.simple-target-icon');
  const titleEl = document.querySelector('.simple-target-title');
  const simpleTargetBox = document.getElementById('simple-target-status');

  if (selector) {
    if (iconEl) iconEl.textContent = "🎯";
    if (titleEl) titleEl.textContent = "¡Elemento Listo!";
    if (descEl) {
      const label = textFilter ? `Texto "${textFilter}"` : `Selector CSS "${selector}"`;
      // Construir nodos de forma 100% segura para evitar innerHTML (Rechazo de Firefox Add-ons)
      descEl.textContent = "";
      
      descEl.appendChild(document.createTextNode("Detectado: "));
      
      const strongEl = document.createElement('strong');
      strongEl.style.color = "var(--success-color)";
      strongEl.textContent = label;
      descEl.appendChild(strongEl);
      
      descEl.appendChild(document.createTextNode("."));
      descEl.appendChild(document.createElement('br'));
      
      const smallEl = document.createElement('small');
      smallEl.style.color = "var(--text-secondary)";
      smallEl.textContent = "El clicker comenzará automáticamente a pulsar este botón.";
      descEl.appendChild(smallEl);
    }
    if (simpleTargetBox) simpleTargetBox.classList.add('has-target');
  } else {
    if (iconEl) iconEl.textContent = "✨";
    if (titleEl) titleEl.textContent = "¿Qué quieres clickear?";
    if (descEl) {
      // Reconstruir de forma 100% segura para evitar innerHTML
      descEl.textContent = "";
      descEl.appendChild(document.createTextNode("Haz clic en "));
      
      const strongEl = document.createElement('strong');
      strongEl.textContent = '"Apuntar Elemento"';
      descEl.appendChild(strongEl);
      
      descEl.appendChild(document.createTextNode(" y toca el botón que quieras automatizar en la web."));
    }
    if (simpleTargetBox) simpleTargetBox.classList.remove('has-target');
  }
}
