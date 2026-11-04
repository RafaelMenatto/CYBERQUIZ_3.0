/* =============================================================================
 *  CYBERQUIZ · MONTAGEM DE PC 3D — SONS SINTETIZADOS (WebAudio)
 * ============================================================================= */

const Sound = (() => {
    const STORAGE_KEY = 'cyberquiz.minigame.sound';
    const DEFAULTS = { volume: 0.06, type: 'sine' };

    let ctx = null;
    let enabled = true;

    try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (_) {}

    const PRESETS = {
        pick:  [[380, 0.05]],
        place: [[300, 0.06], [520, 0.09]],
        error: [[200, 0.10], [165, 0.14]],
        click: [[430, 0.04]],
        power: [[196, 0.10], [262, 0.10], [330, 0.12], [494, 0.20]],
        win:   [[523, 0.11], [659, 0.11], [784, 0.13], [1046, 0.22]],
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

    /** Tempo formatado mm:ss, usado também pelo builder. */
    function formatTime(ms) {
        const total = Math.floor(ms / 1000);
        return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
    }

    return { play, setEnabled, formatTime, get enabled() { return enabled; } };
})();
