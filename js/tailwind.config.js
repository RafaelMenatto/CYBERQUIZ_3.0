/* =============================================================================
 *  TEMA DO TAILWIND
 * -----------------------------------------------------------------------------
 *  Aplica CONFIG.theme (cores, fontes e escalas) no Tailwind CDN.
 *  Deve ser carregado DEPOIS de js/config.js.
 * ============================================================================= */
tailwind.config = {
    theme: {
        extend: {
            colors: CONFIG.theme.colors,
            fontFamily: CONFIG.theme.fonts,
            fontSize: CONFIG.theme.fontSize,
        }
    }
};
