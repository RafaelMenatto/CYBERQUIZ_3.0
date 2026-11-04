/* =============================================================================
 *  MARCA D'ÁGUA - texto: "desenvolvido por Tio Rafa"
 * -----------------------------------------------------------------------------
 *  Arquivo único carregado por TODAS as páginas do projeto (quiz principal,
 *  hub de minigames e os dois minigames).
 *
 *  Cada página tem um CSS diferente (Tailwind no app principal, CSS próprio
 *  nos minigames), então o estilo é injetado por aqui para a marca d'água
 *  ficar exatamente igual em todas elas.
 *
 *  Regras:
 *   - pointer-events: none  -> nunca atrapalha clique/toque em botões;
 *   - position: fixed       -> acompanha a rolagem, como uma marca d'água;
 *   - user-select: none     -> não atrapalha a seleção de texto.
 * ============================================================================= */
(function () {
    'use strict';

    const MARCA = 'Desenvolvido por Tio Rafa';
    const ID = 'cyberquiz-watermark';
    const ID_STYLE = 'cyberquiz-watermark-style';

    function aplicar() {
        // já aplicado? (evita duplicar se o script for carregado duas vezes)
        if (document.getElementById(ID)) return;

        if (!document.getElementById(ID_STYLE)) {
            const style = document.createElement('style');
            style.id = ID_STYLE;
            style.textContent = [
                '#' + ID + ' {',
                '  position: fixed;',
                '  right: 12px;',
                '  bottom: 10px;',
                '  z-index: 2147483000;',
                '  margin: 0;',
                '  padding: 2px 6px;',
                '  font-family: inherit;',
                '  font-size: 0.70rem;',
                '  line-height: 1.2;',
                '  font-weight: 600;',
                '  letter-spacing: 0.02em;',
                '  white-space: nowrap;',
                '  color: rgba(234, 249, 255, 0.52);',
                '  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);',
                '  background: none;',
                '  border: 0;',
                '  border-radius: 0;',
                '  box-shadow: none;',
                '  pointer-events: none;',
                '  user-select: none;',
                '  -webkit-user-select: none;',
                '}',
                '@media (max-width: 480px) {',
                '  #' + ID + ' { font-size: 0.64rem; right: 6px; bottom: 4px; padding: 1px 4px; }',
                '}',
                '@media print {',
                '  #' + ID + ' { display: none; }',
                '}',
            ].join('\n');
            document.head.appendChild(style);
        }

        const marca = document.createElement('div');
        marca.id = ID;
        marca.setAttribute('role', 'note');
        marca.setAttribute('aria-label', 'Desenvolvido por Tio Rafa');
        marca.textContent = MARCA;
        document.body.appendChild(marca);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicar, { once: true });
    } else {
        aplicar();
    }
})();
