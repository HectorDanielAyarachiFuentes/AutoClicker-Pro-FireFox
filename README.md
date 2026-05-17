# ⚡ AutoClicker Pro

<p align="center">
  <img src="assets/icon.svg" width="128" height="128" alt="AutoClicker Pro Logo" />
</p>

**AutoClicker Pro** es una extensión premium para Firefox diseñada para automatizar flujos de clics basados en selectores CSS con precisión quirúrgica, un entorno visual cyber-dark espectacular y un motor de simulación de comportamiento humano hiperseguro.

---

## 🚀 Características Principales

* **🎯 Apuntar y Capturar (Visual CSS Inspector):** Olvídate de adivinar el código de la página. Haz clic en "Apuntar", selecciona el botón directamente en la pantalla de la web y la extensión deducirá el selector CSS generalizado óptimo de forma automática.
* **⏱️ Modo Humano Seguro (Anti-Ban / Anti-Spam):**
  * **Jitter Dinámico:** Introduce un ritmo de clic asincrónico variable (entre -15% y +25% del tiempo base) para imitar los tiempos de reacción de un dedo humano real, rompiendo la regularidad matemática que buscan los algoritmos de detección de bots.
  * **Pausas de Respiro:** Cada 10 clics exitosos, la extensión se detiene automáticamente durante un lapso aleatorio de **4 a 7 segundos** para simular descanso y lectura de pantalla.
* **🛡️ Salvaguarda Universal de Texto:** Cuenta con protección activa contra errores. Si estás en modo de seguimiento (o personalizado), la extensión filtrará e ignorará automáticamente cualquier botón que contenga palabras como `"Unfollow"`, `"Siguiendo"` o `"Following"`, previniendo que dejes de seguir a alguien por accidente.
* **📋 Plantillas Inteligentes Integradas:** Accesos rápidos optimizados para GitHub (Auto-Follow / Auto-Unfollow) y botones comunes de flujo de navegación ("Siguiente / Continuar").
* **💻 Consola Hacker en Tiempo Real:** Un log en vivo estilo terminal neón que reporta detalladamente cada acción, omisión y pausa humana preventiva del script.

---

## 📂 Estructura del Proyecto

El código está organizado siguiendo los más altos estándares de desarrollo y orden profesional:

```
devtoolkit_pro/
├── manifest.json             # Configuración oficial de la extensión de Firefox
├── README.md                 # Esta documentación
├── 📂 assets/
│   └── icon.svg              # Isotipo vectorial de neón escalable (blanco de mira + clic)
├── 📂 css/
│   └── sidebar.css           # Estilos de interfaz Cyber-Dark premium con animaciones
├── 📂 js/
│   └── sidebar.js            # Lógica core, inspector visual y motor de clics
└── 📂 views/
    └── sidebar.html          # Interfaz visual del panel lateral (Sidebar Action)
```

---

## 🛠️ Instalación en Firefox (Modo Desarrollador)

Para probar la extensión localmente en tu navegador Firefox, sigue estos sencillos pasos:

1. Abre Firefox y escribe `about:debugging` en la barra de direcciones.
2. Haz clic en **"Este Firefox"** (This Firefox) en el menú lateral.
3. Haz clic en el botón **"Cargar complemento temporal..."** (Load Temporary Add-on...).
4. Navega hasta tu directorio `devtoolkit_pro` y selecciona el archivo `manifest.json`.
5. ¡Listo! Abre la barra lateral (`Ctrl + Shift + Y` o desde el menú de extensiones) y selecciona **AutoClicker Pro**.

---

## 🩺 Cuidado de la Salud y Ergonomía (O por qué tu dedo índice nos ama)

> [!IMPORTANT]
> **Aviso de Terapia Ocupacional Preventiva e Innovación Articular**
> 
> En **AutoClicker Pro** nos tomamos la salud de tus articulaciones extremadamente en serio. Sabemos lo peligroso que es el mundo exterior digital:
> 
> * **Prevención del Síndrome del Túnel Carpiano:** Hacer clic 100 veces seguidas para seguir a desarrolladores en GitHub o rellenar formularios repetitivos puede desgastar los cartílagos de tu dedo índice a niveles catastróficos. Esta extensión actúa como tu **terapeuta digital personal**, absorbiendo el impacto de los microclics para que tú puedas descansar tu mano sobre una taza de café caliente.
> * **Fatiga del Clic Repetitivo (RSI):** ¿Por qué arriesgarte a una tendinitis aguda por culpa de los botones responsivos de GitHub cuando nuestro algoritmo "Modo Humano" puede imitar tu cansancio biológico? Nuestro script se toma pausas de respiro cada 10 clics no porque se canse el ordenador, sino para solidarizarse con la fatiga muscular de tu mano.
> * **Ayuda Humanitaria para Manos Cansadas:** Si sufres de pereza digital crónica, fatiga de lunes por la mañana o debilidad articular generalizada ante el spam manual, esta extensión es la ortopedia ergonómica definitiva.
> 
> *¡Salva tus tendones, deja que AutoClicker Pro haga los clics por ti!*

---

## ⚖️ Licencia y Derechos de Autor (Copyright)

Este software, sus archivos de código fuente, interfaz visual, diseño de iconos y documentación son propiedad intelectual exclusiva de **Ayarachi Fuentes Hector Daniel**.

### © Copyright (c) 2026 Ayarachi Fuentes Hector Daniel. Todos los derechos reservados.

Queda prohibida la redistribución, copia, modificación o sublicencia no autorizada de este software sin el consentimiento expreso y por escrito del autor. Para más detalles, consulta el archivo [LICENSE](LICENSE) en la raíz del proyecto.

### 🚀 Buenas Prácticas de Uso
Toda la automatización se ejecuta de manera local en el entorno de pruebas del usuario (`activeTab`). Esta herramienta ha sido diseñada con fines educativos, de desarrollo, pruebas de software y accesibilidad ergonómica. Por favor, utilízala con moderación y sentido común para respetar los límites normales de uso de cada sitio web.
