// ==========================================================================
// 🚀 AUTOCLICKER PRO - BACKGROUND SCRIPT (MV3 compliant)
// ==========================================================================

// Al hacer clic en el botón de la barra de herramientas, alternar (toggle) la barra lateral
browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});
