/* =============================================================================
 *  CYBERQUIZ · JOGO DA MEMÓRIA — INICIALIZAÇÃO
 * ============================================================================= */

(function () {
    'use strict';

    const ZOOM_KEY = 'cyberquiz.minigame.memory.zoom';

    /* Botão de 70%: só existe no desktop (a partir de 1024px). A preferência
       é salva e reaplicada quando a janela volta para o layout de desktop. */
    function setupPageZoom() {
        const btn = document.getElementById('page-zoom-btn');
        if (!btn) return;

        const desktop = window.matchMedia('(min-width: 1024px)');
        let compact = false;
        try { compact = localStorage.getItem(ZOOM_KEY) === '70'; } catch (_) { /* file:// */ }

        function paint() {
            const on = compact && desktop.matches;
            document.body.classList.toggle('ui-compact', on);
            btn.setAttribute('aria-pressed', String(on));
            btn.title = on ? 'Voltar a página para 100%' : 'Reduzir a página para 70%';
            btn.setAttribute('aria-label', btn.title);
            btn.innerHTML =
                '<i class="fa-solid ' + (on ? 'fa-magnifying-glass-plus' : 'fa-magnifying-glass-minus') + '" aria-hidden="true"></i>' +
                '<span>' + (on ? '70%' : '100%') + '</span>';
        }

        btn.addEventListener('click', () => {
            if (!desktop.matches) return;
            compact = !compact;
            try { localStorage.setItem(ZOOM_KEY, compact ? '70' : '100'); } catch (_) { /* file:// */ }
            paint();
            Sound.play('click');
        });

        if (desktop.addEventListener) desktop.addEventListener('change', paint);
        else desktop.addListener(paint);

        paint();
    }

    function setupSound() {
        const btn = document.getElementById('sound-btn');
        if (!btn) return;

        function paint() {
            const on = Sound.enabled;
            btn.setAttribute('aria-pressed', String(on));
            btn.classList.toggle('muted', !on);
            btn.innerHTML = '<i class="fa-solid ' + (on ? 'fa-volume-high' : 'fa-volume-xmark') + '" aria-hidden="true"></i>' +
                '<span>' + (on ? 'SOM ON' : 'SOM OFF') + '</span>';
        }

        btn.addEventListener('click', () => { Sound.setEnabled(!Sound.enabled); paint(); });
        paint();
    }

    function boot() {
        setupPageZoom();
        setupSound();
        try { MemoryGame.init(); } catch (err) { console.error('[memória]', err); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
