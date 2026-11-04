/* =============================================================================
 *  CELEBRAÇÃO DE MÓDULO CONCLUÍDO — O PC QUE SE MONTA SOZINHO
 * -----------------------------------------------------------------------------
 *  Sempre que o jogador atinge CONFIG.quiz.passScore (8/10), abre um diálogo
 *  com um PC em corte: cada módulo concluído vira uma peça dentro dele.
 *
 *  A montagem é PROGRESSIVA e fica salva no progresso do jogador
 *  (State.completedModules):
 *
 *    case ......... gabinete          storage ..... SSD M.2
 *    mobo ......... placa-mãe         gpu ......... placa de vídeo
 *    psu .......... fonte             network ..... placa de rede + cabo
 *    cpu .......... processador       peripherals . teclado e mouse
 *    cooling ...... cooler            ram ......... memórias
 *
 *  A peça do módulo que acabou de ser concluído "cai" no lugar com brilho; as
 *  peças dos módulos anteriores já estão lá. Com as 10 peças o PC liga
 *  (ventoinhas giram, RGB acende) e o aviso vira "PC COMPLETO".
 *
 *  Regras:
 *   - é só uma comemoração: a nota/pontos continuam na tela de trás;
 *   - fecha com o botão, com Esc ou clique no fundo, e devolve o foco;
 *   - "VER DE NOVO" reinicia as animações;
 *   - prefers-reduced-motion: desenho parado, sem piscar;
 *   - tudo é SVG inline (nenhuma imagem externa).
 * ============================================================================= */

'use strict';

/* --------------------------------------------------------------- peças do PC */

/* A ordem do array é a ordem de pintura (fundo -> frente). */
const PC_PIECES = [
    {
        id: 'case',
        label: 'Gabinete',
        svg: `
            <rect class="cp-case-fill" x="66" y="10" width="148" height="172" rx="8"/>
            <g transform="translate(79 54)">
                <g class="cp-fan cp-fan-front">
                    <circle class="cp-fan-bounds" r="12"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(72)"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(144)"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(216)"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(288)"/>
                    <circle class="cp-fan-hub" r="2.4"/>
                </g>
                <circle class="cp-line cp-fan-ring" r="13"/>
            </g>
            <g transform="translate(79 102)">
                <g class="cp-fan cp-fan-front">
                    <circle class="cp-fan-bounds" r="12"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(72)"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(144)"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(216)"/>
                    <path d="M0 0Q3.2 -10.35 9.55 -4Q4.8 1.6 0 0Z" transform="rotate(288)"/>
                    <circle class="cp-fan-hub" r="2.4"/>
                </g>
                <circle class="cp-line cp-fan-ring" r="13"/>
            </g>
            <rect class="cp-case" x="66" y="10" width="148" height="172" rx="8"/>
            <rect class="cp-case-front" x="66" y="10" width="13" height="172" rx="4"/>
            <path class="cp-line cp-dim" d="M80 150H198"/>
            <path class="cp-line cp-dim" d="M82 26V166"/>
            <g class="cp-fill cp-dim">
                <rect x="70" y="100" width="5" height="14" rx="2"/>
                <rect x="70" y="140" width="5" height="20" rx="2"/>
            </g>
            <g class="cp-fill cp-dim">
                <rect x="78" y="182" width="16" height="4" rx="2"/>
                <rect x="186" y="182" width="16" height="4" rx="2"/>
            </g>`,
    },
    {
        id: 'mobo',
        label: 'Placa-mãe',
        svg: `
            <rect class="cp-board" x="134" y="26" width="64" height="124" rx="3"/>
            <g class="cp-line cp-dim">
                <path d="M140 34H190"/>
                <path d="M140 40H172V48"/>
                <path d="M140 100H186"/>
                <path d="M140 144H186"/>
                <path d="M188 34V94"/>
            </g>
            <rect class="cp-line cp-dim" x="146" y="50" width="20" height="20" rx="2"/>
            <rect class="cp-line cp-dim" x="136" y="82" width="32" height="10" rx="2"/>
            <rect class="cp-line cp-dim" x="140" y="121" width="52" height="4" rx="2"/>`,
    },
    {
        id: 'psu',
        label: 'Fonte',
        svg: `
            <rect class="cp-board" x="134" y="152" width="64" height="24" rx="4"/>
            <g transform="translate(156 164)"><g class="cp-fan cp-fan-small">
                <circle class="cp-fan-bounds" r="11"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(120)"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(240)"/>
                <circle class="cp-fan-hub" r="2.2"/>
            </g></g>
            <g class="cp-line cp-dim">
                <path d="M174 158H192"/><path d="M174 164H192"/><path d="M174 170H192"/>
            </g>`,
    },
    {
        id: 'storage',
        label: 'SSD M.2',
        svg: `
            <rect class="cp-board" x="136" y="82" width="30" height="9" rx="2"/>
            <g class="cp-fill cp-dim">
                <rect x="140" y="85" width="5" height="3" rx="1"/>
                <rect x="147" y="85" width="5" height="3" rx="1"/>
                <rect x="154" y="85" width="5" height="3" rx="1"/>
            </g>
            <rect class="cp-fill cp-led" x="160" y="86" width="2" height="2" rx="1"/>`,
    },
    {
        id: 'ram',
        label: 'Memórias RAM',
        svg: `
            <g class="cp-ram">
                <rect class="cp-board" x="180" y="42" width="7" height="50" rx="1.5"/>
                <rect class="cp-board" x="190" y="42" width="7" height="50" rx="1.5"/>
                <rect class="cp-fill cp-dim" x="182" y="47" width="3" height="40" rx="1"/>
                <rect class="cp-fill cp-dim" x="192" y="47" width="3" height="40" rx="1"/>
                <rect class="cp-fill cp-dim" x="181" y="43" width="5" height="2" rx="1"/>
                <rect class="cp-fill cp-dim" x="191" y="43" width="5" height="2" rx="1"/>
            </g>`,
    },
    {
        id: 'cpu',
        label: 'Processador',
        svg: `
            <rect class="cp-chip" x="146" y="50" width="20" height="20" rx="3"/>
            <rect class="cp-fill cp-glow" x="152" y="56" width="8" height="8" rx="1.5"/>`,
    },
    {
        id: 'cooling',
        label: 'Cooler',
        svg: `
            <circle class="cp-line cp-ring" cx="156" cy="60" r="18"/>
            <g transform="translate(156 60)"><g class="cp-fan">
                <circle class="cp-fan-bounds" r="16"/>
                <path d="M0 0Q5 -14 13 -6Q6 2 0 0Z"/>
                <path d="M0 0Q5 -14 13 -6Q6 2 0 0Z" transform="rotate(72)"/>
                <path d="M0 0Q5 -14 13 -6Q6 2 0 0Z" transform="rotate(144)"/>
                <path d="M0 0Q5 -14 13 -6Q6 2 0 0Z" transform="rotate(216)"/>
                <path d="M0 0Q5 -14 13 -6Q6 2 0 0Z" transform="rotate(288)"/>
                <circle class="cp-fan-hub" r="3"/>
            </g></g>`,
    },
    {
        id: 'gpu',
        label: 'Placa de vídeo',
        svg: `
            <rect class="cp-board" x="100" y="96" width="93" height="22" rx="3"/>
            <rect class="cp-fill cp-rgb" x="104" y="94" width="85" height="3" rx="1.5"/>
            <g transform="translate(120 107)"><g class="cp-fan cp-fan-small">
                <circle class="cp-fan-bounds" r="11"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(120)"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(240)"/>
                <circle class="cp-fan-hub" r="2.2"/>
            </g></g>
            <g transform="translate(146 107)"><g class="cp-fan cp-fan-small">
                <circle class="cp-fan-bounds" r="11"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(120)"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(240)"/>
                <circle class="cp-fan-hub" r="2.2"/>
            </g></g>
            <g transform="translate(172 107)"><g class="cp-fan cp-fan-small">
                <circle class="cp-fan-bounds" r="11"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(120)"/>
                <path d="M0 0Q3.35 -8.4 9.3 -3.35Q4.65 1.67 0 0Z" transform="rotate(240)"/>
                <circle class="cp-fan-hub" r="2.2"/>
            </g></g>
            <rect class="cp-line" x="193" y="94" width="8" height="28" rx="2"/>
            <g class="cp-fill cp-dim">
                <circle cx="197" cy="98" r="1.1"/>
                <circle cx="197" cy="118" r="1.1"/>
            </g>`,
    },
    {
        id: 'network',
        label: 'Rede e cabo',
        svg: `
            <rect class="cp-board" x="146" y="126" width="50" height="9" rx="2"/>
            <rect class="cp-fill cp-dim" x="186" y="128" width="10" height="5" rx="1"/>
            <path class="cp-line" d="M196 130H218"/>
            <rect class="cp-fill cp-dim" x="214" y="126" width="4" height="8" rx="1"/>
            <circle class="cp-fill cp-pkt" cx="199" cy="130" r="2.2"/>
            <circle class="cp-green cp-led" cx="152" cy="130" r="1.8"/>`,
    },
    {
        id: 'peripherals',
        label: 'Teclado e mouse',
        svg: `
            <rect class="cp-board" x="220" y="150" width="70" height="28" rx="4"/>
            <g class="cp-fill cp-keys">
                <rect x="224" y="154" width="7" height="5" rx="1"/><rect x="233" y="154" width="7" height="5" rx="1"/>
                <rect x="242" y="154" width="7" height="5" rx="1"/><rect x="251" y="154" width="7" height="5" rx="1"/>
                <rect x="260" y="154" width="7" height="5" rx="1"/><rect x="269" y="154" width="7" height="5" rx="1"/>
                <rect x="278" y="154" width="7" height="5" rx="1"/>
                <rect x="224" y="162" width="7" height="5" rx="1"/><rect x="233" y="162" width="7" height="5" rx="1"/>
                <rect x="242" y="162" width="7" height="5" rx="1"/><rect x="251" y="162" width="7" height="5" rx="1"/>
                <rect x="260" y="162" width="7" height="5" rx="1"/><rect x="269" y="162" width="7" height="5" rx="1"/>
                <rect x="278" y="162" width="7" height="5" rx="1"/>
                <rect x="233" y="170" width="44" height="4" rx="1"/>
            </g>
            <rect class="cp-line" x="260" y="118" width="17" height="24" rx="8"/>
            <path class="cp-line cp-dim" d="M268 124V130"/>
            <circle class="cp-line cp-click" cx="268" cy="124" r="5"/>`,
    },
];

const PC_PIECE_LABELS = PC_PIECES.reduce((acc, p) => { acc[p.id] = p.label; return acc; }, {});

/* Texto curto por módulo (mantém o tom do guia de estudo). */
const CELEBRATION_TAGLINES = {
    cpu: 'O cérebro do PC: bilhões de ciclos por segundo.',
    mobo: 'Tudo se conecta nela — barramentos, slots e chipset.',
    ram: 'Dados a caminho da CPU na velocidade da memória.',
    storage: 'Leitura e gravação em fluxo contínuo.',
    gpu: 'Milhares de núcleos desenhando cada frame.',
    psu: 'Energia estável para cada componente.',
    cooling: 'Temperatura sob controle, sem throttling.',
    network: 'Pacotes viajando sem perder o caminho.',
    case: 'Estrutura, fluxo de ar e estilo.',
    peripherals: 'Você no controle: teclado e mouse.',
};

/* -------------------------------------------------------------- utilidades */

const CELEBRATE_ID = 'module-celebrate';
let celebrateLastFocus = null;
let celebrateCurrent = null;

const celebrationIndex = (mod) => MODULES.findIndex((m) => m.id === mod.id);
const celebrationLabel = (index) => (typeof moduleLabel === 'function'
    ? moduleLabel(index)
    : `MÓDULO ${String(index + 1).padStart(2, '0')}`);

/* Monta o SVG do PC no estado atual. A peça recém-concluída recebe .is-new. */
function renderPcScene(justId) {
    const done = State.completedModules;
    const pieces = PC_PIECES.map((piece) => {
        const installed = done.has(piece.id);
        const cls = 'cp-piece' + (installed ? ' is-done' : ' is-off') +
            (piece.id === justId ? ' is-new' : '');
        return `<g class="${cls}" data-piece="${piece.id}">${piece.svg}</g>`;
    }).join('');

    const complete = PC_PIECES.every((p) => done.has(p.id));
    const caseDone = done.has('case');
    return `
        <svg class="ce-svg cp-svg${complete ? ' is-complete' : ''}" viewBox="0 0 300 190"
             focusable="false" aria-hidden="true">
            <defs>
                <linearGradient id="cp-sheen" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="rgba(255,255,255,.16)"/>
                    <stop offset="45%" stop-color="rgba(255,255,255,.02)"/>
                    <stop offset="100%" stop-color="rgba(255,255,255,.10)"/>
                </linearGradient>
            </defs>
            <rect class="cp-ghost" x="66" y="10" width="148" height="172" rx="8"/>
            ${pieces}
            <g class="cp-fx${caseDone ? ' is-done' : ' is-off'}">
                <rect class="cp-glass" x="80" y="16" width="118" height="160" rx="4"/>
                <g class="cp-tower-leds">
                    <circle class="cp-green cp-led" cx="72.5" cy="30" r="2.6"/>
                    <circle class="cp-green cp-led" cx="72.5" cy="38" r="2.6" style="animation-delay:.25s"/>
                    <circle class="cp-green cp-led" cx="72.5" cy="46" r="2.6" style="animation-delay:.5s"/>
                </g>
            </g>
        </svg>`;
}

function buildCelebrationMarkup(mod, correct, total, isNew) {
    const index = celebrationIndex(mod);
    const installed = PC_PIECES.filter((p) => State.completedModules.has(p.id)).length;
    const complete = installed === PC_PIECES.length;
    const tagline = CELEBRATION_TAGLINES[mod.id] || 'Componente instalado no PC.';

    const dots = MODULES.map((m) => {
        const has = State.completedModules.has(m.id);
        const isCurrent = m.id === mod.id;
        return `<span class="celebrate-dot${has ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}"
                      title="${PC_PIECE_LABELS[m.id] || m.name}"></span>`;
    }).join('');

    const justLabel = PC_PIECE_LABELS[mod.id] || mod.name;
    const just = complete
        ? `<p class="celebrate-just is-complete"><i class="fa-solid fa-power-off" aria-hidden="true"></i> PC COMPLETO — ${installed}/${PC_PIECES.length} peças. Ele ligou!</p>`
        : `<p class="celebrate-just"><i class="fa-solid fa-plus" aria-hidden="true"></i> Peça instalada: <strong>${justLabel}</strong> &nbsp;·&nbsp; ${installed}/${PC_PIECES.length} no PC</p>`;

    return `
        <div class="celebrate-backdrop" data-celebrate-close></div>
        <div class="celebrate-card" role="document">
            <button type="button" class="celebrate-x" data-celebrate-close aria-label="Fechar animação">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <p class="celebrate-kicker">
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                ${celebrationLabel(index)} CONCLUÍDO
                ${isNew ? '<span class="celebrate-new">NOVO</span>' : ''}
            </p>

            <div class="celebrate-stage" aria-hidden="true">${renderPcScene(mod.id)}</div>

            ${just}

            <h2 id="celebrate-title" class="celebrate-title">${mod.name}</h2>
            <p class="celebrate-score">
                <span class="celebrate-accuracy">${correct}/${total} acertos</span>
                <span class="celebrate-points" style="color:${mod.color}">+${correct * CONFIG.quiz.pointsPerQuestion} PTS</span>
            </p>
            <p class="celebrate-tagline">${tagline}</p>

            <div class="celebrate-progress" role="img"
                 aria-label="${installed} de ${PC_PIECES.length} peças instaladas no PC">${dots}</div>

            <div class="celebrate-actions">
                <button type="button" class="celebrate-btn celebrate-btn-ghost" data-celebrate-replay>
                    <i class="fa-solid fa-rotate-right" aria-hidden="true"></i> VER DE NOVO
                </button>
                <button type="button" class="celebrate-btn" data-celebrate-close>
                    CONTINUAR <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </button>
            </div>
        </div>`;
}

/* ------------------------------------------------------------------- abrir */

function celebrateModule(mod, correct, total, isNew) {
    if (!mod || !document.body) return;

    const previous = document.getElementById(CELEBRATE_ID);
    if (previous) {
        if (previous._onKey) document.removeEventListener('keydown', previous._onKey);
        previous.remove();
    }

    const index = celebrationIndex(mod);
    const wrap = document.createElement('div');
    wrap.id = CELEBRATE_ID;
    wrap.className = 'celebrate is-open';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'celebrate-title');
    wrap.style.setProperty('--c', mod.color || '#00f0ff');
    wrap.dataset.module = mod.id;
    wrap.dataset.installed = String(PC_PIECES.filter((p) => State.completedModules.has(p.id)).length);
    wrap.innerHTML = buildCelebrationMarkup(mod, correct, total, !!isNew);

    celebrateCurrent = { mod, correct, total, isNew: !!isNew };
    celebrateLastFocus = document.activeElement;

    document.body.appendChild(wrap);
    document.body.classList.add('celebrate-open');

    const card = wrap.querySelector('.celebrate-card');
    const primary = card.querySelector('.celebrate-actions .celebrate-btn:not(.celebrate-btn-ghost)');
    if (primary) primary.focus();

    const onKey = (ev) => {
        if (ev.key === 'Escape') {
            ev.preventDefault();
            closeCelebration();
        } else if (ev.key === 'Tab') {
            const focusable = [...card.querySelectorAll('button, [href]')]
                .filter((el) => el.offsetParent !== null);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (ev.shiftKey && document.activeElement === first) {
                ev.preventDefault(); last.focus();
            } else if (!ev.shiftKey && document.activeElement === last) {
                ev.preventDefault(); first.focus();
            }
        }
    };
    wrap._onKey = onKey;
    document.addEventListener('keydown', onKey);

    wrap.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-celebrate-close]')) {
            ev.preventDefault();
            closeCelebration();
        } else if (ev.target.closest('[data-celebrate-replay]')) {
            replayCelebration();
        }
    });

    document.dispatchEvent(new CustomEvent('celebrate:open', {
        detail: { module: mod.id, installed: Number(wrap.dataset.installed) },
    }));
}

/* ------------------------------------------------------------------ fechar */

function closeCelebration() {
    const wrap = document.getElementById(CELEBRATE_ID);
    if (!wrap) return;
    if (wrap._onKey) document.removeEventListener('keydown', wrap._onKey);
    wrap.remove();
    document.body.classList.remove('celebrate-open');

    const back = (celebrateLastFocus && celebrateLastFocus !== document.body &&
        document.contains(celebrateLastFocus) && celebrateLastFocus.offsetParent !== null)
        ? celebrateLastFocus
        : document.querySelector('#result-screen button');
    if (back) back.focus();
    document.dispatchEvent(new CustomEvent('celebrate:close'));
}

/* ---------------------------------------------------------------- repetir */

function replayCelebration() {
    const wrap = document.getElementById(CELEBRATE_ID);
    const stage = wrap && wrap.querySelector('.celebrate-stage');
    if (!stage || !celebrateCurrent) return;
    stage.innerHTML = renderPcScene(celebrateCurrent.mod.id);
    const primary = wrap.querySelector('.celebrate-actions .celebrate-btn:not(.celebrate-btn-ghost)');
    if (primary) primary.focus();
}

/* ------------------------------------------------------------ API pública */

window.CyberCelebrate = {
    show: celebrateModule,
    close: closeCelebration,
    replay: replayCelebration,
    isOpen: () => !!document.getElementById(CELEBRATE_ID),
    pieces: () => PC_PIECES.map((p) => p.id),
    labels: () => ({ ...PC_PIECE_LABELS }),
};
