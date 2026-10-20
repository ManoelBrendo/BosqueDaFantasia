export const createAffinityRenderers = ({ escapeHtml, buildBookMarkup }) => {
    const buildQuestionMarkup = (question) => `
        <article class="affinity-question-card">
            <div class="affinity-question-head">
                <span class="book-ribbon">Pergunta</span>
                <h3>${escapeHtml(question.title)}</h3>
            </div>
            <div class="affinity-choice-grid">
                ${question.options.map((option) => `
                    <button
                        class="affinity-choice"
                        type="button"
                        data-question-id="${escapeHtml(question.id)}"
                        data-option-value="${escapeHtml(option.value)}"
                    >
                        <strong>${escapeHtml(option.label)}</strong>
                        <span>${escapeHtml(option.description)}</span>
                    </button>
                `).join("")}
            </div>
        </article>
    `;

    const renderQuestions = ({ element, questions }) => {
        element.innerHTML = questions.map(buildQuestionMarkup).join("");
    };

    const renderChoices = ({ elements, answers, questions }) => {
        elements.affinityQuestions.querySelectorAll(".affinity-choice").forEach((button) => {
            const isSelected = answers.get(button.dataset.questionId) === button.dataset.optionValue;
            button.classList.toggle("is-selected", isSelected);
        });

        elements.affinityProgress.textContent = `${answers.size}/${questions.length} respostas escolhidas`;
    };

    const renderMap = ({ element, paths, scoreMap = new Map() }) => {
        const scores = paths.map((path) => ({
            ...path,
            score: scoreMap.get(path.id) || 0
        }));
        const maxScore = Math.max(...scores.map((entry) => entry.score), 1);

        element.innerHTML = scores.map((entry) => {
            const fill = entry.score > 0 ? `${Math.max(14, (entry.score / maxScore) * 100)}%` : "6%";

            return `
                <article class="affinity-lane">
                    <div class="affinity-lane-head">
                        <strong>${escapeHtml(entry.name)}</strong>
                        <span>${escapeHtml(entry.score)} pontos</span>
                    </div>
                    <div class="affinity-track">
                        <div class="affinity-fill" style="--fill: ${fill}; --accent: ${escapeHtml(entry.accent)};"></div>
                    </div>
                </article>
            `;
        }).join("");
    };

    const renderHistory = ({ element, history, paths }) => {
        element.innerHTML = history.length > 0
            ? `<h4>Trilhas recentes</h4>${history.map((entry, index) => {
                const path = paths.find((item) => item.id === entry.pathId);
                if (!path) return "";
                const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(entry.savedAt);
                return `<button class="affinity-history-button" type="button" data-recommendation-history="${index}">${escapeHtml(path.name)} <span>${escapeHtml(date)}</span></button>`;
            }).join("")}`
            : "";
    };

    const renderIdleResult = ({ elements, paths }) => {
        elements.affinityResult.dataset.state = "idle";
        elements.affinityResultName.textContent = "Responda as quatro perguntas";
        elements.affinityResultDescription.textContent = "O Oráculo de Afinidade vai sugerir uma trilha de leitura coerente com seu gosto.";
        elements.affinityResultReason.textContent = "Escolha um portal, um ritmo, uma forma de magia e uma paisagem.";
        elements.affinityResultAlt.textContent = "Se houver uma segunda trilha compativel, ela aparece aqui como caminho complementar.";
        elements.affinityResultBooks.innerHTML = "";
        elements.affinityExplore.disabled = true;
        renderMap({ element: elements.affinityMap, paths });
    };

    const renderResult = ({ elements, recommendation, books, paths }) => {
        elements.affinityResult.dataset.state = "ready";
        elements.affinityResultName.textContent = recommendation.bestPath.name;
        elements.affinityResultDescription.textContent = recommendation.bestPath.description;
        elements.affinityResultReason.textContent = recommendation.reason;
        elements.affinityResultAlt.textContent = recommendation.runnerUp
            ? `Se quiser um segundo caminho sem perder o clima principal, experimente também ${recommendation.runnerUp.name.toLowerCase()}.`
            : "Esta leitura ficou bem definida; o Oráculo não encontrou uma segunda trilha tão forte quanto a principal.";
        elements.affinityResultBooks.innerHTML = books.map(buildBookMarkup).join("");
        elements.affinityExplore.disabled = false;
        elements.affinityExplore.dataset.query = recommendation.bestPath.focusQuery;
        elements.affinityExplore.dataset.label = recommendation.bestPath.focusLabel;
        elements.affinityExplore.textContent = `Explorar ${recommendation.bestPath.focusLabel}`;
        renderMap({
            element: elements.affinityMap,
            paths,
            scoreMap: recommendation.scoreMap
        });
    };

    return {
        renderChoices,
        renderHistory,
        renderIdleResult,
        renderQuestions,
        renderResult
    };
};
