/* =============================================================================
 *  BOOTSTRAP - inicialização da aplicação
 * -----------------------------------------------------------------------------
 *  Carregado por último. Apenas restaura o progresso salvo, prepara o estado
 *  inicial e desenha a tela.
 * ============================================================================= */

// progresso salvo (pontos, módulos concluídos, zoom e último guia)
const progressRestored = loadProgress();

// sem progresso salvo, usa o zoom inicial de CONFIG.ui.defaultZoom
if (!progressRestored) {
    State.zoomIndex = Math.max(0, CONFIG.ui.zoomLevels.indexOf(CONFIG.ui.defaultZoom));
}

document.addEventListener('DOMContentLoaded', () => {
    renderModulesGrid();   // grade de módulos com as fotos reais
    renderImageCredits();  // créditos de licença das imagens
    updateGlobalStats();   // pontos e módulos concluídos
    applyZoom();           // escala inicial da interface
    updateModulesBtn();    // na tela de módulos o botão vira "MINIGAME"
    updateGuideBtn();      // na tela do guia o botão GUIA fica oculto
});
