/* =============================================================================
 *  INTERFACE - renderização, navegação de telas, estatísticas e zoom
 * -----------------------------------------------------------------------------
 *  Este arquivo cuida de DESENHAR a interface. A lógica do quiz (perguntas,
 *  pontuação, aprovação) está em js/quiz.js.
 * ============================================================================= */

/* ---------- Atalhos de DOM ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/*
 * Imagens com proporções extremas (muito largas ou muito altas) são cortadas
 * pelo object-cover nos cards em 5 colunas do desktop. Nesses módulos a foto
 * aparece inteira (object-contain) a partir do breakpoint lg.
 */
const CONTAIN_IMAGE_MODULES = new Set(['storage', 'mobo', 'gpu', 'cooling']);

/* ---------- Rótulo do módulo (MÓDULO 01, MÓDULO 02, ...) ---------- */
function moduleLabel(index) {
    return `MÓDULO ${String(index + 1).padStart(2, '0')}`;
}

/* ---------- Navegação entre as telas ---------- */
let currentScreenId = 'module-selection-screen';

function showScreen(screenId) {
    currentScreenId = screenId;
    ['module-selection-screen', 'guide-screen', 'quiz-screen', 'result-screen'].forEach((id) => {
        document.getElementById(id).classList.toggle('hidden', id !== screenId);
    });
    updateModulesBtn();
    updateGuideBtn();
}

/*
 * Na tela do GUIA o próprio botão GUIA some (já estamos nela);
 * em qualquer outra tela ele volta a aparecer.
 */
function updateGuideBtn() {
    const btn = document.getElementById('guide-btn');
    if (!btn) return;
    const onGuide = currentScreenId === 'guide-screen';
    // o CSS do header no celular define display:inline-flex e venceria a
    // classe .hidden; por isso o display também é controlado inline
    btn.classList.toggle('hidden', onGuide);
    btn.style.display = onGuide ? 'none' : '';
    btn.setAttribute('aria-hidden', onGuide ? 'true' : 'false');
}

/*
 * Botão do topo: na tela de MÓDULOS ele vira atalho para os MINIGAMES;
 * nas outras telas ele volta para a grade de módulos (como sempre).
 */
function updateModulesBtn() {
    const btn = document.getElementById('modules-btn');
    if (!btn) return;
    const onModules = currentScreenId === 'module-selection-screen';
    const label = btn.querySelector('.btn-label');
    const icon = btn.querySelector('i');
    if (label) label.textContent = onModules ? 'MINIGAME' : 'MÓDULOS';
    if (icon) icon.className = 'fa-solid ' + (onModules ? 'fa-gamepad' : 'fa-cubes') + ' mr-1';
    btn.title = onModules ? 'Ir para os minigames' : 'Módulos';
    btn.setAttribute('aria-label', onModules ? 'Ir para os minigames' : 'Ver módulos');
}

/* Clique no botão: segue o link quando está na tela de módulos. */
function modulesBtnAction(ev) {
    if (currentScreenId === 'module-selection-screen') return true;
    if (ev) ev.preventDefault();
    showModuleSelection();
    return false;
}

/* ---------- Tela inicial: voltar para a grade de módulos ---------- */
function showModuleSelection() {
    showScreen('module-selection-screen');
    renderModulesGrid();
    updateGlobalStats();
}

/* =============================================================================
 *  REINICIAR PROGRESSO - modal temático + animação de purga
 * ============================================================================= */

const RESET_CONFIRM_ID = 'reset-confirm';
let resetLastFocus = null;

/* Abre o modal no lugar do confirm() nativo. */
function openResetConfirm() {
    if (document.getElementById(RESET_CONFIRM_ID)) return;

    resetLastFocus = document.activeElement;

    const wrap = document.createElement('div');
    wrap.id = RESET_CONFIRM_ID;
    wrap.className = 'reset-confirm is-open';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'reset-confirm-title');
    wrap.setAttribute('aria-describedby', 'reset-confirm-text');

    wrap.innerHTML = `
        <div class="reset-backdrop" data-reset-cancel></div>
        <div class="reset-card" role="document">
            <span class="reset-scan" aria-hidden="true"></span>

            <p class="reset-kicker">
                <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                PROTOCOLO DE LIMPEZA // RESET
            </p>

            <div class="reset-icon" aria-hidden="true">
                <i class="fa-solid fa-rotate-right"></i>
            </div>

            <h2 class="reset-title" id="reset-confirm-title">REINICIAR PROGRESSO?</h2>
            <p class="reset-text" id="reset-confirm-text">
                Os pontos, módulos concluídos e melhores notas deste laboratório
                serão apagados.
            </p>

            <div class="reset-stats" aria-hidden="true">
                <div><span>PONTOS</span><strong>${State.globalScore}</strong></div>
                <div><span>CONCLUÍDOS</span><strong>${State.completedModules.size}/${MODULES.length}</strong></div>
            </div>

            <p class="reset-note">
                <i class="fa-solid fa-lock" aria-hidden="true"></i>
                Esta ação não pode ser desfeita.
            </p>

            <div class="reset-actions">
                <button type="button" class="reset-btn reset-btn-cancel" data-reset-cancel>
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i> CANCELAR
                </button>
                <button type="button" class="reset-btn reset-btn-danger" data-reset-confirm>
                    <i class="fa-solid fa-trash-can" aria-hidden="true"></i> APAGAR TUDO
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(wrap);
    document.body.classList.add('reset-open');

    const card = wrap.querySelector('.reset-card');
    const cancelBtn = wrap.querySelector('[data-reset-cancel].reset-btn');
    if (cancelBtn) cancelBtn.focus();

    const onKey = (ev) => {
        if (ev.key === 'Escape') {
            ev.preventDefault();
            if (!card.classList.contains('is-purging')) closeResetConfirm();
            return;
        }
        if (ev.key !== 'Tab') return;

        const focusable = [...wrap.querySelectorAll('button')].filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
            ev.preventDefault();
            last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
            ev.preventDefault();
            first.focus();
        }
    };
    wrap._onKey = onKey;
    document.addEventListener('keydown', onKey);

    wrap.addEventListener('click', (ev) => {
        if (card.classList.contains('is-purging')) return;
        if (ev.target.closest('[data-reset-cancel]')) {
            ev.preventDefault();
            closeResetConfirm();
        } else if (ev.target.closest('[data-reset-confirm]')) {
            ev.preventDefault();
            purgeAndReset(card);
        }
    });
}

/* Animação de purga: o cartão "glitcha" e some antes de apagar de verdade. */
function purgeAndReset(card) {
    if (!card || card.classList.contains('is-purging')) return;
    card.classList.add('is-purging');

    const title = card.querySelector('.reset-title');
    if (title) title.textContent = 'LIMPANDO DADOS...';

    const dangerBtn = card.querySelector('.reset-btn-danger');
    if (dangerBtn) {
        dangerBtn.disabled = true;
        dangerBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> APAGANDO...';
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.classList.add('is-resetting');

    window.setTimeout(() => {
        resetProgress();          // apaga estado + localStorage e volta à grade
        closeResetConfirm();      // fade-out do modal

        if (resetBtn) {
            window.setTimeout(() => resetBtn.classList.remove('is-resetting'), 700);
        }
    }, 620);
}

/* Fecha o modal (com fade-out, salvo quando `immediate`). */
function closeResetConfirm(immediate) {
    const wrap = document.getElementById(RESET_CONFIRM_ID);
    if (!wrap) return;

    if (wrap._onKey) document.removeEventListener('keydown', wrap._onKey);

    const finish = () => {
        wrap.remove();
        document.body.classList.remove('reset-open');
        if (resetLastFocus && document.contains(resetLastFocus) && resetLastFocus.offsetParent !== null) {
            resetLastFocus.focus();
        }
        resetLastFocus = null;
    };

    if (immediate) {
        finish();
        return;
    }

    wrap.classList.add('is-closing');
    window.setTimeout(finish, 220);
}

/*
 * Apaga todo o progresso do quiz (pontos, notas e módulos concluídos), limpa
 * o que está salvo e volta para a grade. O zoom é mantido, porque é um ajuste
 * de leitura e não progresso.
 */
function resetProgress() {
    State.globalScore = 0;
    State.moduleScores = {};
    State.completedModules.clear();
    State.moduleIndex = 0;
    State.questionIndex = 0;
    State.moduleQuestions = [];
    State.moduleScore = 0;
    State.answered = false;
    State.guideModuleId = MODULES[0].id;

    clearProgress();
    showModuleSelection();
}

/* =============================================================================
 *  GUIA DE ESTUDO
 *  Leitura de apoio por componente. O conteúdo fica em js/guide-data.js (GUIDE).
 * ============================================================================= */

/* Abre a tela do guia (sem argumento: reabre o último componente lido). */
function showGuide(moduleId) {
    showScreen('guide-screen');
    openGuide(moduleId || State.guideModuleId || MODULES[0].id);
}

/* Lista lateral com os 10 componentes. */
function renderGuideNav(activeId) {
    const nav = $('#guide-nav');
    nav.innerHTML = MODULES.map((mod, index) => {
        const active = mod.id === activeId;
        const done = State.completedModules.has(mod.id);

        return `
            <button onclick="openGuide('${mod.id}')" class="w-auto lg:w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${active
                ? 'bg-cyber-accent/10 border-cyber-accent text-white'
                : 'bg-cyber-dark border-gray-800 text-gray-400 hover:border-cyber-accent/60 hover:text-white'}">
                <span class="font-mono text-xs ${active ? 'text-cyber-accent' : 'text-gray-600'}">${String(index + 1).padStart(2, '0')}</span>
                <span class="guide-nav-label font-head font-bold text-sm leading-tight">${mod.name}</span>
                ${done ? '<i class="guide-nav-check fa-solid fa-check text-cyber-green text-xs"></i>' : ''}
            </button>
        `;
    }).join('');

    /* No celular a lista rola na horizontal: mantém o item ativo visível. */
    const activeBtn = nav.querySelector('button.border-cyber-accent');
    if (activeBtn && nav.scrollWidth > nav.clientWidth) {
        const navRect = nav.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        const delta = (btnRect.left - navRect.left) - (navRect.width - btnRect.width) / 2;
        nav.scrollBy({ left: delta, behavior: 'smooth' });
    }
}

/* Conteúdo do componente selecionado. */
function openGuide(moduleId) {
    const found = MODULES.findIndex((m) => m.id === moduleId);
    const index = found >= 0 ? found : 0;
    const mod = MODULES[index];
    const guide = GUIDE[mod.id] || GUIDE.cpu;
    const isCompleted = State.completedModules.has(mod.id);

    const prev = MODULES[(index - 1 + MODULES.length) % MODULES.length];
    const next = MODULES[(index + 1) % MODULES.length];

    State.guideModuleId = mod.id;
    saveProgress();
    renderGuideNav(mod.id);

    $('#guide-content').innerHTML = `
        <div class="guide-banner relative rounded-lg overflow-hidden border border-gray-800 bg-cyber-dark mb-5${CONTAIN_IMAGE_MODULES.has(mod.id) ? ' guide-contain' : ''}">
            <img src="${mod.image}" alt="${mod.imageAlt}" class="w-full h-full object-cover" decoding="async"
                 onload="this.style.display='';this.nextElementSibling.style.display='none';"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="hidden absolute inset-0 items-center justify-center" style="color:${mod.color}" data-guide-fallback aria-hidden="true">
                <i class="fa-solid ${mod.icon} text-6xl opacity-40"></i>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-cyber-card via-cyber-card/40 to-transparent"></div>
            <div class="absolute bottom-3 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <span class="text-xs font-mono text-cyber-accent tracking-widest">${moduleLabel(index)} &middot; GUIA DE ESTUDO</span>
                    <h2 class="font-head text-2xl md:text-3xl font-extrabold text-white">${mod.name}</h2>
                </div>
                <span class="text-xs font-mono px-2 py-1 rounded uppercase ${isCompleted
                    ? 'module-done-badge'
                    : 'bg-gray-900/80 text-gray-400 border border-gray-700'}">
                    ${isCompleted ? '<i class="fa-solid fa-circle-check"></i> CONCLUÍDO' : 'NÃO CONCLUÍDO'}
                </span>
            </div>
        </div>

        <p class="text-gray-200 mb-5 leading-relaxed">${guide.summary}</p>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            ${guide.facts.map((f) => `
                <div class="bg-cyber-dark border border-gray-800 rounded-lg p-3">
                    <div class="text-[0.7rem] font-mono text-gray-500 uppercase tracking-wide">${f.k}</div>
                    <div class="font-head font-bold text-white text-sm">${f.v}</div>
                </div>`).join('')}
        </div>

        <div class="space-y-4">
            ${guide.sections.map((s) => `
                <div>
                    <h3 class="font-head font-bold text-cyber-accent mb-1 flex items-center gap-2">
                        <i class="fa-solid fa-angle-right text-xs"></i>${s.t}
                    </h3>
                    <p class="text-gray-300 leading-relaxed">${s.p}</p>
                </div>`).join('')}
        </div>

        <div class="mt-6 rounded-lg border border-cyber-green/30 bg-cyber-green/5 p-4">
            <h3 class="font-head font-bold text-cyber-green mb-2"><i class="fa-solid fa-lightbulb mr-2"></i>DICAS RÁPIDAS</h3>
            <ul class="space-y-1.5 text-gray-300">
                ${guide.tips.map((t) => `<li class="flex gap-2"><span class="text-cyber-green">&bull;</span><span>${t}</span></li>`).join('')}
            </ul>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button onclick="openGuide('${prev.id}')" class="cyber-border bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-3 font-head font-bold text-xs tracking-widest uppercase transition-all">
                <i class="fa-solid fa-arrow-left mr-2"></i> ANTERIOR
            </button>
            <button onclick="startModule(${index})" class="cyber-border bg-cyber-accent hover:bg-cyan-400 text-black border border-cyber-accent px-5 py-3 font-head font-bold text-xs tracking-widest uppercase transition-all sm:mx-auto">
                <i class="fa-solid fa-play mr-2"></i> FAZER O QUIZ
            </button>
            <button onclick="openGuide('${next.id}')" class="cyber-border bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-3 font-head font-bold text-xs tracking-widest uppercase transition-all">
                PRÓXIMO <i class="fa-solid fa-arrow-right ml-2"></i>
            </button>
        </div>
    `;

    /* No celular a lista fica acima do conteúdo: rola o topo do guia para a vista */
    if (window.innerWidth < 1024) {
        $('#guide-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* =============================================================================
 *  GRADE DE MÓDULOS
 * ============================================================================= */
function renderModulesGrid() {
    const grid = $('#modules-grid');
    grid.innerHTML = '';

    MODULES.forEach((mod, index) => {
        const isCompleted = State.completedModules.has(mod.id);

        const card = document.createElement('div');
        card.className = `module-card cyber-border bg-cyber-card border border-gray-800 p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden neon-glow-hover${isCompleted ? ' is-completed' : ''}`;
        card.onclick = () => startModule(index);
        // acessível por teclado (o cartão não é um <button> para não herdar o estilo do navegador)
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.setAttribute('aria-label', 'Iniciar o quiz do módulo ' + mod.name);
        card.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                startModule(index);
            }
        });

        card.innerHTML = `
            <div class="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-white/5 rounded-full blur-xl group-hover:bg-cyber-accent/20 transition-all"></div>
            <div>
                <div class="module-media relative h-36 rounded-lg overflow-hidden mb-4 border border-gray-800 bg-cyber-dark${CONTAIN_IMAGE_MODULES.has(mod.id) ? ' media-contain' : ''}">
                    <img src="${mod.image}" alt="${mod.imageAlt}" decoding="async"
                         class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                         onload="this.style.display='';this.nextElementSibling.style.display='none';"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="hidden absolute inset-0 items-center justify-center text-4xl" style="color:${mod.color}" data-fallback>
                        <i class="fa-solid ${mod.icon}"></i>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-cyber-card via-cyber-card/10 to-transparent pointer-events-none"></div>
                    <span class="absolute top-2 right-2 text-xs font-mono px-2 py-1 rounded uppercase ${isCompleted
                        ? 'module-done-badge'
                        : 'bg-gray-900/80 text-gray-300 border border-gray-700'}">
                        ${isCompleted ? '<i class="fa-solid fa-circle-check"></i> CONCLUÍDO' : moduleLabel(index)}
                    </span>
                </div>
                <h3 class="font-head font-bold text-lg text-white group-hover:text-cyber-accent transition-colors mb-1">${mod.name}</h3>
                <p class="text-xs text-gray-400 line-clamp-2">${mod.desc}</p>
            </div>

            <div class="mt-6 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs font-mono">
                <span class="text-gray-500">${CONFIG.quiz.questionsPerModule} QUESTÕES</span>
                <span class="text-cyber-accent group-hover:translate-x-1 transition-transform flex items-center">
                    INICIAR <i class="fa-solid fa-chevron-right ml-1 text-[0.8rem]"></i>
                </span>
            </div>
        `;

        grid.appendChild(card);
    });
}

/* =============================================================================
 *  CRÉDITOS DAS IMAGENS (Wikimedia Commons)
 *  Licenças CC BY / CC BY-SA exigem atribuição - mantenha esta seção.
 * ============================================================================= */
function renderImageCredits() {
    const el = $('#image-credits');
    if (!el) return;

    el.innerHTML = MODULES.map((mod) => `
        <div class="flex flex-wrap gap-x-1">
            <span class="text-gray-500">${mod.name}:</span>
            <a href="${mod.imagePage}" target="_blank" rel="noopener noreferrer" class="inline-block py-1 text-cyber-accent/70 hover:text-cyber-accent transition-colors">${mod.imageCredit}</a>
            <span class="text-gray-600">(${mod.imageLicense})</span>
        </div>
    `).join('');
}

/* =============================================================================
 *  ESTATÍSTICAS GLOBAIS (topo da página)
 * ============================================================================= */
function updateGlobalStats() {
    $('#global-score').innerText = State.globalScore;
    $('#modules-completed').innerText = `${State.completedModules.size}/${MODULES.length}`;
    updateResetBtnVisibility();
}

/*
 * O botão REINICIAR só faz sentido quando existe algo para apagar.
 * Zoom e último componente do guia são ajustes de leitura, não progresso,
 * então não contam para a exibição do botão.
 */
function hasProgress() {
    return State.globalScore > 0
        || State.completedModules.size > 0
        || Object.keys(State.moduleScores).length > 0;
}

function updateResetBtnVisibility() {
    const wrap = document.getElementById('reset-progress-wrap');
    if (!wrap) return;
    const show = hasProgress();
    wrap.classList.toggle('hidden', !show);
    wrap.setAttribute('aria-hidden', show ? 'false' : 'true');
}

/* =============================================================================
 *  ZOOM DA INTERFACE
 *  Define o tamanho base da fonte em % (100%, 80% e 70%), reduzindo textos,
 *  espaçamentos e ícones de forma proporcional.
 * ============================================================================= */
function applyZoom() {
    const pct = CONFIG.ui.zoomLevels[State.zoomIndex];
    document.documentElement.style.fontSize = pct + '%';
    $('#zoom-label').innerText = pct + '%';
}

function cycleZoom() {
    State.zoomIndex = (State.zoomIndex + 1) % CONFIG.ui.zoomLevels.length;
    applyZoom();
    saveProgress();
}
