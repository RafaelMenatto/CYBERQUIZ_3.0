/* =============================================================================
 *  QUIZ - fluxo das perguntas, pontuação e conclusão dos módulos
 * -----------------------------------------------------------------------------
 *  Regras principais:
 *    - cada acerto vale CONFIG.quiz.pointsPerQuestion pontos
 *    - o módulo só entra em "CONCLUÍDO" com CONFIG.quiz.passScore acertos
 *      ou mais (ver finishModule)
 *    - a ordem das questões e a posição das alternativas são sorteadas a
 *      cada tentativa (ver buildShuffledQuestions)
 * ============================================================================= */

/* =============================================================================
 *  SORTEIO (Fisher-Yates)
 * ============================================================================= */

/** Devolve uma cópia do array com os itens em ordem aleatória. */
function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

/**
 * Sorteia o módulo inteiro:
 *  - as 10 questões saem em ordem aleatória
 *  - as 4 alternativas de cada questão também saem embaralhadas
 *  - o índice da resposta correta (`ans`) é recalculado junto, para que o
 *    gabarito continue apontando para a alternativa certa
 *
 * Não altera o banco original em js/data.js: cada tentativa (inclusive o
 * botão "TENTAR NOVAMENTE") sorteia de novo.
 */
function buildShuffledQuestions(mod) {
    const indices = shuffleArray(mod.questions.map((_, i) => i));
    return indices.map((qi) => {
        const q = mod.questions[qi];
        // sorteia os ÍNDICES das alternativas (e não os textos) para que
        // opções iguais nunca confundam o cálculo da resposta correta
        const ordem = shuffleArray(q.opts.map((_, i) => i));
        return {
            q: q.q,
            opts: ordem.map((oi) => q.opts[oi]),
            ans: ordem.indexOf(q.ans),
            exp: q.exp,
        };
    });
}

/* =============================================================================
 *  INICIAR MÓDULO
 * ============================================================================= */
function startModule(index) {
    State.moduleIndex = index;
    State.questionIndex = 0;
    State.moduleScore = 0;
    State.answered = false;

    const mod = MODULES[State.moduleIndex];

    /* Sorteia a ordem das questões e a posição das alternativas */
    State.moduleQuestions = buildShuffledQuestions(mod);

    /* Cabeçalho do quiz */
    $('#module-badge').innerText = moduleLabel(State.moduleIndex);
    $('#module-title').innerText = mod.name.toUpperCase();

    /* Foto no quadro do módulo (fallback: ícone do módulo) */
    const iconBox = $('#module-icon-box');
    iconBox.innerHTML = `<img src="${mod.image}" alt="${mod.imageAlt}" class="w-full h-full object-cover" onload="this.nextElementSibling.style.display='none'" onerror="this.style.display='none'"><i class="fa-solid ${mod.icon}"></i>`;
    iconBox.style.borderColor = mod.color;
    iconBox.style.color = mod.color;

    /* Foto grande ao fundo do banner (fallback: ícone do módulo) */
    $('#banner-bg-icon').innerHTML = `<img src="${mod.image}" alt="" class="w-full h-full object-cover rounded-2xl" onload="this.nextElementSibling.style.display='none'" onerror="this.style.display='none'"><i class="fa-solid ${mod.icon} text-9xl"></i>`;

    /* Telas */
    showScreen('quiz-screen');

    loadQuestion();
}

/* =============================================================================
 *  CARREGAR A QUESTÃO ATUAL
 * ============================================================================= */
function loadQuestion() {
    State.answered = false;

    const mod = MODULES[State.moduleIndex];
    const qData = State.moduleQuestions[State.questionIndex] || mod.questions[State.questionIndex];
    const total = CONFIG.quiz.questionsPerModule;

    /* Progresso e placar do módulo */
    $('#question-tracker').innerText = `${State.questionIndex + 1}/${total}`;
    $('#module-score').innerText = `${State.moduleScore} PTS`;
    $('#progress-bar').style.width = `${(State.questionIndex / total) * 100}%`;

    /* Limpa o painel de feedback e bloqueia o botão "próxima" */
    const feedbackPanel = $('#feedback-panel');
    feedbackPanel.className = 'hidden p-4 rounded-lg border transition-all duration-300';

    const nextBtn = $('#next-btn');
    nextBtn.disabled = true;
    nextBtn.className = 'cyber-border bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700 px-6 py-3 font-head font-bold text-sm tracking-widest uppercase transition-all flex items-center space-x-2';

    /* Texto da pergunta */
    $('#question-text').innerText = qData.q;

    /* Alternativas */
    const optionsContainer = $('#options-container');
    optionsContainer.innerHTML = '';

    const prefixes = ['A', 'B', 'C', 'D'];

    qData.opts.forEach((optText, i) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-4 rounded-lg bg-cyber-dark border border-gray-800 hover:border-cyber-accent text-gray-200 hover:text-white transition-all flex items-center space-x-3 group relative overflow-hidden';
        btn.onclick = () => checkAnswer(i);

        btn.innerHTML = `
            <span class="w-8 h-8 rounded bg-gray-800 group-hover:bg-cyber-accent group-hover:text-black text-gray-400 font-head font-bold text-xs flex items-center justify-center transition-colors flex-shrink-0">
                ${prefixes[i]}
            </span>
            <span class="text-sm font-medium flex-grow">${optText}</span>
            <i class="fa-solid fa-circle-notch opacity-0 group-hover:opacity-100 text-cyber-accent transition-opacity text-xs"></i>
        `;

        optionsContainer.appendChild(btn);
    });

    /* No celular, traz a nova pergunta para o topo da tela. */
    if (window.innerWidth < 640) {
        $('#quiz-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* =============================================================================
 *  VERIFICAR RESPOSTA + FEEDBACK IMEDIATO
 * ============================================================================= */
function checkAnswer(selectedIndex) {
    if (State.answered) return;
    State.answered = true;

    const mod = MODULES[State.moduleIndex];
    const qData = State.moduleQuestions[State.questionIndex] || mod.questions[State.questionIndex];
    const isCorrect = (selectedIndex === qData.ans);

    const buttons = $$('#options-container button');

    /* Marca visualmente a alternativa correta e a escolhida */
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        btn.classList.remove('hover:border-cyber-accent', 'hover:text-white');

        if (idx === qData.ans) {
            btn.classList.add('anim-correct');
            btn.querySelector('span').className = 'w-8 h-8 rounded bg-cyber-green text-black font-head font-bold text-xs flex items-center justify-center flex-shrink-0';
            btn.innerHTML += '<i class="fa-solid fa-check text-cyber-green text-lg ml-2"></i>';
        } else if (idx === selectedIndex) {
            btn.classList.add('anim-wrong');
            btn.querySelector('span').className = 'w-8 h-8 rounded bg-cyber-red text-white font-head font-bold text-xs flex items-center justify-center flex-shrink-0';
            btn.innerHTML += '<i class="fa-solid fa-xmark text-cyber-red text-lg ml-2"></i>';
        } else {
            btn.classList.add('opacity-40');
        }
    });

    /* Pontuação */
    if (isCorrect) {
        State.moduleScore += CONFIG.quiz.pointsPerQuestion;
        $('#module-score').innerText = `${State.moduleScore} PTS`;
    }

    /* Painel de feedback */
    const feedbackPanel = $('#feedback-panel');
    const feedbackIcon = $('#feedback-icon');
    const feedbackTitle = $('#feedback-title');
    const feedbackText = $('#feedback-text');

    feedbackPanel.classList.remove('hidden');

    if (isCorrect) {
        feedbackPanel.className = 'p-4 rounded-lg border bg-cyber-green/10 border-cyber-green/40 text-cyber-green block';
        feedbackIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        feedbackTitle.innerText = 'RESPOSTA CORRETA!';
    } else {
        feedbackPanel.className = 'p-4 rounded-lg border bg-cyber-red/10 border-cyber-red/40 text-cyber-red block';
        feedbackIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        feedbackTitle.innerText = 'RESPOSTA INCORRETA';
    }

    feedbackText.innerText = qData.exp;

    /* No celular, o feedback e o botão "próxima" ficam visíveis sem rolar. */
    if (window.innerWidth < 640) {
        feedbackPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* Habilita o botão "próxima" */
    const nextBtn = $('#next-btn');
    nextBtn.disabled = false;
    nextBtn.className = 'cyber-border bg-cyber-accent hover:bg-cyan-400 text-black border border-cyber-accent px-6 py-3 font-head font-bold text-sm tracking-widest uppercase transition-all flex items-center space-x-2 cursor-pointer neon-glow';
}

/* =============================================================================
 *  PRÓXIMA QUESTÃO / FIM DO MÓDULO
 * ============================================================================= */
function nextQuestion() {
    // desabilita antes de avançar: evita pular uma questão em clique duplo
    const btn = $('#next-btn');
    if (btn) btn.disabled = true;

    State.questionIndex++;

    if (State.questionIndex < CONFIG.quiz.questionsPerModule) {
        loadQuestion();
    } else {
        finishModule();
    }
}

/* =============================================================================
 *  FINALIZAR MÓDULO E MOSTRAR O RESULTADO
 * ============================================================================= */
function finishModule() {
    const mod = MODULES[State.moduleIndex];
    const correctCount = State.moduleScore / CONFIG.quiz.pointsPerQuestion;
    const passed = correctCount >= CONFIG.quiz.passScore;
    const wasCompleted = State.completedModules.has(mod.id);
    const previousBest = State.moduleScores[mod.id] || 0;

    /* O módulo só é marcado como CONCLUÍDO com a nota mínima */
    if (passed) {
        State.completedModules.add(mod.id);
        if (State.moduleScore > previousBest) {
            State.globalScore += State.moduleScore - previousBest;
            State.moduleScores[mod.id] = State.moduleScore;
        }
    }

    $('#progress-bar').style.width = '100%';

    showScreen('result-screen');

    $('#result-module-title').innerText = mod.name.toUpperCase();
    $('#result-accuracy').innerText = `${correctCount}/${CONFIG.quiz.questionsPerModule}`;
    $('#result-score').innerText = `+${State.moduleScore} PTS`;

    /* Etiqueta de status */
    const statusElement = $('#result-status');
    if (passed) {
        statusElement.innerText = 'MÓDULO CONCLUÍDO';
        statusElement.className = 'text-xs font-mono text-cyber-green tracking-widest uppercase';
    } else {
        statusElement.innerText = `MÓDULO NÃO CONCLUÍDO - MÍNIMO ${CONFIG.quiz.passScore}/${CONFIG.quiz.questionsPerModule}`;
        statusElement.className = 'text-xs font-mono text-cyber-red tracking-widest uppercase';
    }

    /* Mensagem conforme o desempenho */
    const msgElement = $('#result-message');
    if (correctCount >= CONFIG.quiz.excellentScore) {
        msgElement.innerText = 'Desempenho de nível Especialista! Seu conhecimento técnico sobre esta arquitetura é excepcional.';
    } else if (passed) {
        msgElement.innerText = `Módulo concluído! Você acertou ${correctCount} de ${CONFIG.quiz.questionsPerModule} questões e atingiu a nota mínima de ${CONFIG.quiz.passScore} acertos para concluir este módulo.`;
    } else if (correctCount >= CONFIG.quiz.almostScore) {
        msgElement.innerText = `Quase lá! Você acertou ${correctCount} de ${CONFIG.quiz.questionsPerModule}, mas o módulo exige pelo menos ${CONFIG.quiz.passScore} acertos para ser considerado concluído. Revise os conceitos e tente novamente.`;
    } else {
        msgElement.innerText = `Módulo não concluído. Você acertou ${correctCount} de ${CONFIG.quiz.questionsPerModule} e precisa de pelo menos ${CONFIG.quiz.passScore} acertos. Recomendamos revisar os conceitos técnicos deste componente.`;
    }

    updateGlobalStats();
    saveProgress();

    /* Comemoração: o PC ganha a peça do módulo recém-concluído */
    if (passed && typeof celebrateModule === 'function') {
        celebrateModule(mod, correctCount, CONFIG.quiz.questionsPerModule, !wasCompleted);
    }
}

/* =============================================================================
 *  REPETIR O MÓDULO ATUAL
 * ============================================================================= */
function retryModule() {
    startModule(State.moduleIndex);
}
