/* =============================================================================
 *  CYBERQUIZ · JOGO DA MEMÓRIA — SONS SINTETIZADOS (WebAudio)
 *  Sem arquivos de áudio: os efeitos são gerados na hora com osciladores.
 * ============================================================================= */

const Sound = (() => {
    const STORAGE_KEY = 'cyberquiz.minigame.sound';
    const DEFAULTS = { volume: 0.06, type: 'sine' };

    let ctx = null;
    let enabled = true;

    try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (_) { /* file:// */ }

    const PRESETS = {
        flip:  [[520, 0.05]],
        match: [[660, 0.07], [880, 0.10]],
        error: [[200, 0.10], [165, 0.14]],
        click: [[430, 0.04]],
        win:   [[523, 0.11], [659, 0.11], [784, 0.13], [1046, 0.22]],
        lose:  [[392, 0.13], [311, 0.15], [233, 0.24]],
    };

    function audio() {
        if (!ctx) {
            const Ctor = window.AudioContext || window.webkitAudioContext;
            if (!Ctor) return null;
            ctx = new Ctor();
        }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        return ctx;
    }

    function note(freq, dur, type, at, volume) {
        const a = audio();
        if (!a) return;
        const osc = a.createOscillator();
        const gain = a.createGain();
        osc.type = type || DEFAULTS.type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        osc.connect(gain);
        gain.connect(a.destination);
        osc.start(at);
        osc.stop(at + dur + 0.02);
    }

    function play(name, volume) {
        if (!enabled) return;
        const preset = PRESETS[name] || PRESETS.click;
        const a = audio();
        if (!a) return;
        const vol = typeof volume === 'number' ? volume : DEFAULTS.volume;
        let at = a.currentTime;
        preset.forEach(([freq, dur, type]) => {
            note(freq, dur, type, at, vol);
            at += dur * 0.85;
        });
    }

    function setEnabled(on) {
        enabled = !!on;
        try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch (_) {}
        if (enabled) play('click');
    }

    return { play, setEnabled, get enabled() { return enabled; } };
})();
