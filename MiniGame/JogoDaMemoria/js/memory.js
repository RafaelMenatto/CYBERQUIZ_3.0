/* =============================================================================
 *  CYBERQUIZ · JOGO DA MEMÓRIA
 *  ---------------------------------------------------------------------------
 *  Cada par é uma COMBINAÇÃO: a foto de um componente + a função que ele
 *  exerce no PC ("o que fornece a imagem" ⇄ placa de vídeo).
 *  Recursos: níveis, cronômetro, movimentos, estrelas, pontos e recorde.
 * ============================================================================= */

const MemoryGame = (() => {
    const CFG = MEMORY_CONFIG;

    const state = {
        level: CFG.defaultLevel,
        cards: [],
        first: null,
        second: null,
        lock: false,
        moves: 0,
        matches: 0,
        totalPairs: 0,
        maxMoves: 0,        // 0 = sem limite
        over: false,        // partida encerrada por limite de movimentos
        startedAt: 0,
        elapsed: 0,
        timerId: null,
        running: false,
        score: 0,
        flipBackId: null,   // timer do desvirar de um par errado
        round: 0,           // muda a cada partida: invalida timers antigos
    };

    let boardEl, winEl, loseEl, resetEl, movesEl, timeEl, bestEl, hintEl;
    let resetPaused = false;   // cronômetro pausado enquanto a confirmação está aberta

    /* ------------------------------------------------------------ helpers */

    function shuffle(list) {
        const arr = list.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function formatTime(ms) {
        const value = Number(ms);
        if (!isFinite(value) || value < 0) return '00:00';
        const total = Math.floor(value / 1000);
        const mm = String(Math.floor(total / 60)).padStart(2, '0');
        const ss = String(total % 60).padStart(2, '0');
        return mm + ':' + ss;
    }

    function bestRecords() {
        try { return JSON.parse(localStorage.getItem(CFG.storageKey) || '{}') || {}; }
        catch (_) { return {}; }
    }

    /** Recorde só vale se tiver os campos numéricos que o jogo usa. */
    function validRecord(rec) {
        if (!rec || typeof rec !== 'object') return null;
        const moves = Number(rec.moves);
        const time = Number(rec.time);
        if (!isFinite(moves) || moves <= 0) return null;
        if (!isFinite(time) || time < 0) return null;
        return { moves: moves, time: time, score: Number(rec.score) || 0 };
    }

    function recordOf(level) {
        return validRecord(bestRecords()[level]);
    }

    function saveRecord(level, data) {
        const all = bestRecords();
        all[level] = data;
        try { localStorage.setItem(CFG.storageKey, JSON.stringify(all)); } catch (_) {}
    }

    function levelConf(level) {
        return CFG.levels[level] || CFG.levels[CFG.defaultLevel];
    }

    /** Nível tem limite de movimentos? (Especialista em diante) */
    function hasLimit() {
        return state.maxMoves > 0;
    }

    function limitReached() {
        return hasLimit() && state.moves >= state.maxMoves;
    }

    /** Atualiza o HUD: "7" nos níveis livres ou "7 / 100" nos levels com limite. */
    function updateMoves() {
        if (!movesEl) return;
        movesEl.textContent = hasLimit()
            ? state.moves + ' / ' + state.maxMoves
            : String(state.moves);

        const stat = movesEl.closest('.stat');
        if (!stat) return;
        const restantes = hasLimit() ? state.maxMoves - state.moves : Infinity;
        stat.classList.toggle('is-warning', hasLimit() && restantes <= 10 && restantes > 0);
        stat.classList.toggle('is-out', hasLimit() && restantes <= 0);
    }

    /* -------------------------------------------------------- progressão
     *  Os níveis são liberados em sequência: o primeiro fica sempre
     *  disponível e cada nível concluído libera o seguinte.
     *  (fácil → médio → difícil)
     */

    function levelOrder() {
        return Object.keys(CFG.levels);
    }

    function completedLevels() {
        try {
            const raw = JSON.parse(localStorage.getItem(CFG.unlockStorageKey) || '[]');
            return Array.isArray(raw) ? raw.filter((k) => CFG.levels[k]) : [];
        } catch (_) { return []; }
    }

    function markCompleted(level) {
        const done = completedLevels();
        if (done.includes(level)) return;
        done.push(level);
        try { localStorage.setItem(CFG.unlockStorageKey, JSON.stringify(done)); } catch (_) { }
    }

    /** Um nível está liberado quando o ANTERIOR da sequência foi concluído. */
    function isUnlocked(level) {
        const order = levelOrder();
        const i = order.indexOf(level);
        if (i < 0) return false;
        if (i === 0) return true;
        return completedLevels().includes(order[i - 1]);
    }

    function firstUnlocked() {
        return levelOrder().find((k) => isUnlocked(k)) || levelOrder()[0];
    }

    /** Qual nível vem depois (e que por isso será liberado ao concluir). */
    function nextLevelOf(level) {
        const order = levelOrder();
        const i = order.indexOf(level);
        return (i >= 0 && i + 1 < order.length) ? order[i + 1] : null;
    }

    /* --------------------------------------------------------------- deck */

    /*
     * Cada componente vira um par de cartas de tipos diferentes:
     *   kind 'photo' → a foto da peça (quem é);
     *   kind 'func'  → a função da peça (o que ela faz).
     * O par do jogo é a combinação foto + função do mesmo componente.
     */
    function buildDeck(level) {
        const conf = levelConf(level);
        const pool = shuffle(CFG.components).slice(0, conf.pairs);
        const deck = [];
        pool.forEach((comp, i) => {
            deck.push({ uid: i + '-photo', compId: comp.id, kind: 'photo', matched: false });
            deck.push({ uid: i + '-func',  compId: comp.id, kind: 'func',  matched: false });
        });
        return shuffle(deck);
    }

    function componentOf(id) {
        return CFG.components.find((c) => c.id === id) || CFG.components[0];
    }

    /** Texto lido em voz alta / usado no aria-label de uma carta. */
    function cardLabel(card) {
        const comp = componentOf(card.compId);
        if (card.kind === 'func') return 'Carta de função: ' + comp.role;
        return 'Carta de peça: ' + comp.name;
    }

    /* ------------------------------------------------------------- render */

    function renderBoard() {
        const conf = levelConf(state.level);
        boardEl.style.setProperty('--cols', conf.columns);
        // colunas extras em telas grandes (nível de 20 cartas)
        if (conf.columnsWide) boardEl.style.setProperty('--cols-wide', conf.columnsWide);
        else boardEl.style.removeProperty('--cols-wide');
        boardEl.dataset.level = state.level;
        boardEl.innerHTML = '';

        state.cards.forEach((card, index) => {
            const comp = componentOf(card.compId);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mem-card' + (card.kind === 'func' ? ' mem-card-func' : '');
            btn.dataset.index = String(index);
            btn.dataset.kind = card.kind;
            btn.setAttribute('aria-label', 'Carta virada para baixo');
            // a frase completa da função fica no title (mouse) e no aria-label
            if (card.kind === 'func') btn.title = comp.role;

            const face = card.kind === 'func'
                ? '<span class="mem-face mem-front mem-front-func">' +
                      '<span class="mem-func">' +
                          '<i class="fa-solid ' + comp.roleIcon + '" aria-hidden="true"></i>' +
                          // texto curto: cabe na carta mesmo no celular.
                          // a frase completa fica no title da carta e na dica.
                          '<span class="mem-func-text">' + (comp.roleShort || comp.role) + '</span>' +
                      '</span>' +
                      '<span class="mem-label">' +
                          '<span class="mem-func-tag">O QUE FAZ ISSO?</span>' +
                      '</span>' +
                  '</span>'
                : '<span class="mem-face mem-front">' +
                      '<span class="mem-photo">' +
                          '<img src="' + CFG.paths.images + comp.image + '" alt="' + comp.name + '" draggable="false">' +
                      '</span>' +
                      '<span class="mem-label">' +
                          '<span class="mem-name">' + comp.short + '</span>' +
                      '</span>' +
                  '</span>';

            btn.innerHTML =
                '<span class="mem-inner">' +
                    '<span class="mem-face mem-back"><i class="fa-solid fa-microchip" aria-hidden="true"></i></span>' +
                    face +
                '</span>';
            btn.addEventListener('click', () => flip(index));
            boardEl.appendChild(btn);
        });
    }

    function cardEl(index) {
        return boardEl.querySelector('.mem-card[data-index="' + index + '"]');
    }

    function paintPair(index, matched) {
        const el = cardEl(index);
        if (!el) return;
        el.classList.add('flipped');
        if (matched) {
            el.classList.add('matched');
            el.setAttribute('aria-label', 'Par encontrado');
        }
    }

    /* -------------------------------------------------------------- timer */

    /** Tempo decorrido agora, sem depender do intervalo de 200 ms. */
    function currentElapsed() {
        if (!state.running) return state.elapsed;
        return performance.now() - state.startedAt;
    }

    function startTimer() {
        if (state.running) return;
        state.running = true;
        state.startedAt = performance.now();
        tickTimer();
    }

    /** Retoma o cronômetro de onde parou (ex.: ao cancelar o reset). */
    function resumeTimer() {
        if (state.running) return;
        state.running = true;
        state.startedAt = performance.now() - state.elapsed;
        tickTimer();
    }

    function tickTimer() {
        state.timerId = setInterval(() => {
            state.elapsed = performance.now() - state.startedAt;
            if (timeEl) timeEl.textContent = formatTime(state.elapsed);
        }, 200);
    }

    function stopTimer() {
        if (state.running) state.elapsed = performance.now() - state.startedAt;
        state.running = false;
        if (state.timerId) clearInterval(state.timerId);
        state.timerId = null;
        // o HUD estava preso no último tick de 200 ms; alinha com o tempo
        // exato mostrado no overlay de vitória/derrota
        if (timeEl) timeEl.textContent = formatTime(state.elapsed);
    }

    /** Cancela o timer do desvirar, para ele não agir sobre um tabuleiro novo. */
    function cancelFlipBack() {
        if (state.flipBackId) clearTimeout(state.flipBackId);
        state.flipBackId = null;
        state.lock = false;
    }

    /* --------------------------------------------------------------- play */

    function flip(index) {
        if (state.lock || state.over) return;
        const card = state.cards[index];
        if (!card || card.matched) return;
        if (state.first === index || state.second === index) return;

        startTimer();
        Sound.play('flip');

        const el = cardEl(index);
        if (el) {
            el.classList.add('flipped');
            el.setAttribute('aria-label', cardLabel(card));
        }

        if (state.first === null) { state.first = index; return; }
        if (state.second === null) {
            state.second = index;
            state.moves++;
            updateMoves();
            resolveTurn();
        }
    }

    function resolveTurn() {
        const a = state.cards[state.first];
        const b = state.cards[state.second];

        // par = mesma peça + tipos diferentes (foto + função)
        if (a.compId === b.compId && a.kind !== b.kind) {
            const comp = componentOf(a.compId);
            a.matched = true;
            b.matched = true;
            state.matches++;
            paintPair(state.first, true);
            paintPair(state.second, true);
            Sound.play('match');
            setHint('Par encontrado! ' + comp.name + ' — ' + comp.role.toLowerCase() + '.');
            state.first = null;
            state.second = null;
            if (state.matches === state.totalPairs) finish();
            else if (limitReached()) lose();
            return;
        }

        state.lock = true;
        setHint('Essa função não é a dessa peça. Memorize a posição!');
        const first = state.first;
        const second = state.second;
        const round = state.round;
        state.flipBackId = setTimeout(() => {
            state.flipBackId = null;
            // se uma partida nova começou nesse meio-tempo, ignora este timer
            if (round !== state.round || state.over) return;
            [first, second].forEach((i) => {
                const el = cardEl(i);
                if (el) {
                    el.classList.remove('flipped');
                    el.setAttribute('aria-label', 'Carta virada para baixo');
                }
            });
            Sound.play('error');
            state.first = null;
            state.second = null;
            state.lock = false;
            if (limitReached()) { lose(); return; }
            setHint('Escolha mais duas cartas para tentar de novo.');
        }, CFG.flipBackDelay);
    }

    /* ---------------------------------------------------------------- fim */

    function starsFor(moves, pairs) {
        if (moves <= Math.ceil(pairs * 1.5)) return 3;
        if (moves <= Math.ceil(pairs * 2.2)) return 2;
        return 1;
    }

    function scoreFor(moves, pairs) {
        const extra = Math.max(0, moves - pairs);
        const bonus = Math.max(0, CFG.maxBonus - extra * CFG.penaltyPerExtraMove);
        return pairs * CFG.pointsPerPair + bonus;
    }

    /**
     * Fim de partida por limite de movimentos.
     * Não salva recorde, não calcula pontos/estrelas e não libera o próximo nível.
     */
    function lose() {
        if (state.over) return;
        state.over = true;
        state.lock = true;
        stopTimer();
        state.elapsed = currentElapsed();
        Sound.play('lose');
        updateMoves();

        const faltam = Math.max(0, state.totalPairs - state.matches);
        setHint('Limite de ' + state.maxMoves + ' movimentos atingido. Tente de novo ou escolha outro nível.');

        if (!loseEl) return;
        const movesOut = loseEl.querySelector('[data-lose-moves]');
        const pairsOut = loseEl.querySelector('[data-lose-pairs]');
        const timeOut = loseEl.querySelector('[data-lose-time]');
        const noteOut = loseEl.querySelector('[data-lose-note]');
        if (movesOut) movesOut.textContent = state.moves + ' / ' + state.maxMoves;
        if (pairsOut) pairsOut.textContent = state.matches + ' / ' + state.totalPairs;
        if (timeOut) timeOut.textContent = formatTime(state.elapsed);
        if (noteOut) {
            noteOut.textContent = faltam === 1
                ? 'Você usou os ' + state.maxMoves + ' movimentos e ainda faltava 1 par.'
                : 'Você usou os ' + state.maxMoves + ' movimentos e ainda faltavam ' + faltam + ' pares.';
        }
        loseEl.classList.remove('hidden');
        setBackgroundInert(true);
        const again = loseEl.querySelector('[data-memory-lose-again]');
        if (again) again.focus();
    }

    function finish() {
        stopTimer();

        const elapsed = currentElapsed();     // tempo medido agora, não o do último tick
        state.elapsed = elapsed;

        state.score = scoreFor(state.moves, state.totalPairs);
        const stars = starsFor(state.moves, state.totalPairs);
        Sound.play('win');

        const prev = recordOf(state.level);
        const better = !prev || state.moves < prev.moves ||
            (state.moves === prev.moves && elapsed < prev.time);
        if (better) {
            saveRecord(state.level, { moves: state.moves, time: Math.round(elapsed), score: state.score });
        }
        // concluir um nível libera o próximo da sequência
        markCompleted(state.level);
        paintBest();
        updateLevelButtons();

        if (!winEl) return;
        winEl.querySelector('[data-win-stars]').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        winEl.querySelector('[data-win-moves]').textContent = hasLimit()
            ? state.moves + ' / ' + state.maxMoves
            : String(state.moves);
        winEl.querySelector('[data-win-time]').textContent = formatTime(elapsed);
        winEl.querySelector('[data-win-score]').textContent = String(state.score);
        winEl.querySelector('[data-win-record]').textContent = better
            ? 'NOVO RECORDE!'
            : 'Recorde: ' + prev.moves + ' mov · ' + formatTime(prev.time);

        const nextLevel = nextLevelOf(state.level);
        const nextBtn = winEl.querySelector('[data-win-next]');
        if (nextBtn) {
            nextBtn.classList.toggle('hidden', !nextLevel);
            nextBtn.dataset.next = nextLevel || '';
        }

        // aviso de nível liberado (mostra só quando o próximo nível é novo)
        const unlockMsg = winEl.querySelector('[data-win-unlock]');
        if (unlockMsg) {
            const novo = nextLevel && !completedLevels().includes(nextLevel);
            unlockMsg.hidden = true;
            unlockMsg.classList.add('hidden');

            if (nextLevel && novo) {
                unlockMsg.textContent = 'Nível ' + levelConf(nextLevel).label + ' liberado!';
                unlockMsg.hidden = false;
                unlockMsg.classList.remove('hidden');
            } else if (!nextLevel) {
                unlockMsg.textContent = 'Você liberou todos os níveis!';
                unlockMsg.hidden = false;
                unlockMsg.classList.remove('hidden');
            }
        }

        winEl.classList.remove('hidden');
        setBackgroundInert(true);
        // acessibilidade: leva o foco para dentro do diálogo de vitória
        const again = winEl.querySelector('[data-memory-again]');
        if (again) again.focus();
        setHint('Tabuleiro concluído!');
    }

    /* ------------------------------------------------------------- status */

    function paintBest() {
        if (!bestEl) return;
        const rec = recordOf(state.level);
        bestEl.textContent = rec ? rec.moves + ' mov · ' + formatTime(rec.time) : '—';
    }

    function setHint(text) {
        if (hintEl) hintEl.textContent = text;
    }

    /* ------------------------------------------------ confirmação de reset */

    function openReset() {
        if (!resetEl) return;
        resetPaused = state.running;
        if (resetPaused) stopTimer();
        resetEl.classList.remove('hidden');
        setBackgroundInert(true);
        const cancel = resetEl.querySelector('[data-memory-reset-cancel]');
        if (cancel) cancel.focus();
    }

    function closeReset() {
        if (!resetEl || resetEl.classList.contains('hidden')) return;
        resetEl.classList.add('hidden');
        setBackgroundInert(false);
        if (resetPaused) {
            resetPaused = false;
            resumeTimer();
        }
        const restart = document.querySelector('[data-memory-restart]');
        if (restart) restart.focus();
    }

    /** Apaga recordes e níveis liberados; mantém zoom e som. */
    function confirmReset() {
        try {
            localStorage.removeItem(CFG.storageKey);
            localStorage.removeItem(CFG.unlockStorageKey);
        } catch (_) { /* file:// */ }
        resetPaused = false;
        // start() esconde o modal, remove o inert e leva o foco à primeira carta
        start(levelOrder()[0]);
        setHint('Progresso apagado. Recomeçando no nível Fácil.');
    }

    /* ------------------------------------------------------ foco no diálogo */

    /** Elementos atrás do overlay: saem do Tab e da árvore de acessibilidade. */
    function backgroundEls() {
        return [
            document.querySelector('.topbar'),
            document.querySelector('.panel-head'),
            document.querySelector('.toolbar'),
            boardEl,
            hintEl,
            document.querySelector('.footer'),
        ].filter(Boolean);
    }

    function setBackgroundInert(on) {
        backgroundEls().forEach((el) => {
            if (on) el.setAttribute('inert', '');
            else el.removeAttribute('inert');
        });
    }

    function visibleOverlay() {
        if (winEl && !winEl.classList.contains('hidden')) return winEl;
        if (loseEl && !loseEl.classList.contains('hidden')) return loseEl;
        if (resetEl && !resetEl.classList.contains('hidden')) return resetEl;
        return null;
    }

    /** Mantém Tab/Shift+Tab dentro do diálogo aberto (fallback ao inert). */
    function trapFocus(ev) {
        if (ev.key === 'Escape') {
            if (resetEl && !resetEl.classList.contains('hidden')) {
                ev.preventDefault();
                closeReset();
            }
            return;
        }
        if (ev.key !== 'Tab') return;
        const dialog = visibleOverlay();
        if (!dialog) return;

        const list = Array.from(dialog.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((el) => el.getClientRects().length > 0);
        if (!list.length) return;

        const first = list[0];
        const last = list[list.length - 1];
        const inside = dialog.contains(document.activeElement);

        if (ev.shiftKey && (!inside || document.activeElement === first)) {
            ev.preventDefault();
            last.focus();
        } else if (!ev.shiftKey && (!inside || document.activeElement === last)) {
            ev.preventDefault();
            first.focus();
        }
    }

    function updateLevelButtons() {
        document.querySelectorAll('[data-memory-level]').forEach((btn) => {
            const key = btn.dataset.memoryLevel;
            const on = key === state.level;
            const unlocked = isUnlocked(key);
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', String(on));
            btn.classList.toggle('locked', !unlocked);
            btn.disabled = !unlocked;
            const conf = CFG.levels[key];
            const anterior = levelOrder()[levelOrder().indexOf(key) - 1];
            const limite = conf.maxMoves ? ' · limite de ' + conf.maxMoves + ' movimentos' : '';
            // nível já concluído ganha o "V" de confirmação no chip
            const done = completedLevels().includes(key);
            btn.classList.toggle('completed', done);
            const label = unlocked
                ? ('Nível ' + conf.label + (done ? ' — concluído' : '') + ' · ' + conf.pairs + ' pares' + limite)
                : ('Conclua o nível ' + (CFG.levels[anterior] ? CFG.levels[anterior].label : '') + ' para liberar este.');
            btn.setAttribute('title', label);
            btn.setAttribute('aria-label', label);
            // cadeado (bloqueado) ou ícone do nível; o V fica em um selo à parte
            const icon = btn.querySelector(':scope > i');
            if (icon) {
                icon.className = 'fa-solid ' + (unlocked ? conf.icon : 'fa-lock');
            }
            let check = btn.querySelector('.chip-check');
            if (done) {
                if (!check) {
                    check = document.createElement('span');
                    check.className = 'chip-check';
                    check.setAttribute('aria-hidden', 'true');
                    check.innerHTML = '<i class="fa-solid fa-check"></i>';
                    btn.appendChild(check);
                }
            } else if (check) {
                check.remove();
            }
            const small = btn.querySelector('small');
            if (small) small.textContent = unlocked ? (conf.pairs + ' pares') : 'bloqueado';
        });
    }

    /* ---------------------------------------------------------------- API */

    function start(level) {
        const want = CFG.levels[level] ? level : CFG.defaultLevel;
        // nível bloqueado: recusa e explica o que falta
        if (!isUnlocked(want)) {
            const order = levelOrder();
            const anterior = order[order.indexOf(want) - 1];
            setHint('Nível ' + levelConf(want).label + ' bloqueado — conclua o nível ' +
                (CFG.levels[anterior] ? CFG.levels[anterior].label : '') + ' primeiro.');
            return;
        }
        // veio do diálogo de vitória ou de derrota? então devolve o foco ao
        // tabuleiro no fim (antes de os overlays serem escondidos)
        const veioDoOverlay =
            !!(winEl && !winEl.classList.contains('hidden')) ||
            !!(loseEl && !loseEl.classList.contains('hidden')) ||
            !!(resetEl && !resetEl.classList.contains('hidden'));
        const conf = levelConf(want);
        state.level = want;
        state.cards = buildDeck(state.level);
        state.round++;               // invalida timers da partida anterior
        cancelFlipBack();
        state.first = null;
        state.second = null;
        state.lock = false;
        state.over = false;
        state.moves = 0;
        state.matches = 0;
        state.score = 0;
        state.totalPairs = conf.pairs;
        state.maxMoves = conf.maxMoves || 0;

        stopTimer();
        // zera depois de parar o cronômetro: stopTimer() grava o tempo da
        // partida anterior em state.elapsed quando ela ainda estava rodando
        state.elapsed = 0;
        if (winEl) winEl.classList.add('hidden');
        if (loseEl) loseEl.classList.add('hidden');
        if (resetEl) resetEl.classList.add('hidden');
        resetPaused = false;
        setBackgroundInert(false);
        updateMoves();
        if (timeEl) timeEl.textContent = '00:00';

        renderBoard();
        paintBest();
        updateLevelButtons();
        setHint(hasLimit()
            ? 'Você tem ' + state.maxMoves + ' movimentos para concluir este nível. Vire uma carta de peça e uma de função.'
            : 'Vire uma carta de peça e uma carta de função para descobrir qual faz o quê.');

        // sem "pular" para o tabuleiro no carregamento da página — só quando
        // o jogador acabou de sair do diálogo de vitória
        if (veioDoOverlay && boardEl) {
            const first = boardEl.querySelector('.mem-card');
            if (first) first.focus();
        }
    }

    function getState() {
        return {
            level: state.level,
            moves: state.moves,
            matches: state.matches,
            totalPairs: state.totalPairs,
            maxMoves: state.maxMoves,
            over: state.over,
            elapsed: currentElapsed(),
            lock: state.lock,
            running: state.running,
            score: state.score,
            cards: state.cards.map((c) => ({ compId: c.compId, kind: c.kind, matched: c.matched })),
        };
    }

    function init() {
        boardEl = document.getElementById('memory-board');
        winEl = document.getElementById('memory-win');
        loseEl = document.getElementById('memory-lose');
        resetEl = document.getElementById('memory-reset');
        movesEl = document.querySelector('[data-memory-moves]');
        timeEl = document.querySelector('[data-memory-time]');
        bestEl = document.querySelector('[data-memory-best]');
        hintEl = document.getElementById('memory-hint');

        const levelBox = document.getElementById('memory-levels');
        if (levelBox) {
            levelBox.innerHTML = '';
            Object.entries(CFG.levels).forEach(([key, conf]) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chip';
                btn.dataset.memoryLevel = key;
                btn.innerHTML = '<i class="fa-solid ' + conf.icon + '" aria-hidden="true"></i> ' + conf.label +
                    ' <small>' + conf.pairs + ' pares</small>';
                btn.addEventListener('click', () => { Sound.play('click'); start(key); });
                levelBox.appendChild(btn);
            });
        }
        const again = document.querySelector('[data-memory-again]');
        if (again) again.addEventListener('click', () => { Sound.play('click'); start(state.level); });

        const next = document.querySelector('[data-win-next]');
        if (next) next.addEventListener('click', () => {
            const lvl = next.dataset.next;
            if (lvl) { Sound.play('click'); start(lvl); }
        });

        const loseAgain = document.querySelector('[data-memory-lose-again]');
        if (loseAgain) loseAgain.addEventListener('click', () => { Sound.play('click'); start(state.level); });

        const loseLevels = document.querySelector('[data-memory-lose-levels]');
        if (loseLevels) loseLevels.addEventListener('click', () => {
            Sound.play('click');
            if (loseEl) loseEl.classList.add('hidden');
            setBackgroundInert(false);
            const active = document.querySelector('[data-memory-level].active');
            if (active) active.focus();
            setHint('Partida encerrada. Escolha um nível para jogar de novo.');
        });

        const restart = document.querySelector('[data-memory-restart]');
        if (restart) restart.addEventListener('click', () => { Sound.play('click'); openReset(); });

        const resetCancel = document.querySelector('[data-memory-reset-cancel]');
        if (resetCancel) resetCancel.addEventListener('click', () => { Sound.play('click'); closeReset(); });

        const resetConfirm = document.querySelector('[data-memory-reset-confirm]');
        if (resetConfirm) resetConfirm.addEventListener('click', () => { Sound.play('click'); confirmReset(); });

        document.addEventListener('keydown', trapFocus);

        // começa no primeiro nível liberado (fácil → médio → difícil)
        start(firstUnlocked());
    }

    return { init, start, flip, getState, formatTime, isUnlocked, completedLevels };
})();
