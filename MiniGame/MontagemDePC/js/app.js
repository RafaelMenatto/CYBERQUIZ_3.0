/* =============================================================================
 *  CYBERQUIZ · MONTAGEM DE PC 3D — INICIALIZAÇÃO
 * ============================================================================= */

(function () {
    'use strict';

    const ZOOM_KEY = 'cyberquiz.minigame.build.zoom';
    const ZOOM_STEPS = [100, 80, 70];

    /* Zoom de página: 100% -> 80% -> 70% -> 100%. Reduz a interface inteira
       (inclusive a cena 3D) e só vale no desktop; a preferência é salva. */
    function setupZoom() {
        const btn = document.getElementById('zoom-btn');
        if (!btn) return;

        const desktop = window.matchMedia('(min-width: 641px)');
        let pct = 100;
        try {
            const saved = Number(localStorage.getItem(ZOOM_KEY));
            if (ZOOM_STEPS.includes(saved)) pct = saved;
        } catch (_) { /* file:// */ }

        function paint() {
            const on = desktop.matches;
            document.body.classList.toggle('ui-zoom-80', on && pct === 80);
            document.body.classList.toggle('ui-zoom-70', on && pct === 70);
            btn.title = 'Reduzir tamanho da interface (até 70%)';
            btn.setAttribute('aria-label', btn.title);
            btn.innerHTML = '<i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true"></i>' +
                '<span>' + pct + '%</span>';
            // a cena 3D dimensiona o canvas por getBoundingClientRect
            window.dispatchEvent(new Event('resize'));
        }

        btn.addEventListener('click', () => {
            if (!desktop.matches) return;
            pct = ZOOM_STEPS[(ZOOM_STEPS.indexOf(pct) + 1) % ZOOM_STEPS.length];
            try { localStorage.setItem(ZOOM_KEY, String(pct)); } catch (_) { /* file:// */ }
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
        setupZoom();
        setupSound();

        try { window.PCMBuilder.init(); } catch (err) { console.error('[3D]', err); }

        const reset = document.getElementById('build-reset');
        if (reset) reset.addEventListener('click', () => { Sound.play('click'); window.PCMBuilder.reset(); });

        const rotate = document.getElementById('build-rotate');
        if (rotate) rotate.addEventListener('click', () => { Sound.play('click'); window.PCMBuilder.rotate(); });

        const again = document.querySelector('[data-build-again]');
        if (again) again.addEventListener('click', () => { Sound.play('click'); window.PCMBuilder.reset(); });

        // botão LIGAR — aparece quando o PC fica completo
        const power = document.getElementById('build-power');
        if (power) {
            power.addEventListener('click', () => {
                if (power.disabled) return;
                window.PCMBuilder.powerOn();
            });
        }

        // "ver o PC ligado": esconde o resumo para admirar o PC aceso
        const view = document.querySelector('[data-build-view]');
        if (view) {
            view.addEventListener('click', () => {
                Sound.play('click');
                const win = document.getElementById('build-win');
                if (win) win.classList.add('hidden');
                // o foco estava dentro do resumo que acabou de sumir
                const rot = document.getElementById('build-rotate');
                if (rot) rot.focus();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // atalho: R gira o gabinete
    document.addEventListener('keydown', (ev) => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;      // Ctrl+R = recarregar
        const alvo = ev.target;
        if (alvo && alvo.closest && alvo.closest('input, textarea, select, [contenteditable="true"]')) return;
        if ((ev.key === 'r' || ev.key === 'R') && window.PCMBuilder) window.PCMBuilder.rotate();
    });
})();
