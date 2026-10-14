const sortEntriesDescending = (entries) => {
    return [...entries].sort((left, right) => {
        if (right[1] !== left[1]) {
            return right[1] - left[1];
        }

        return left[0].localeCompare(right[0], "pt-BR");
    });
};

export const recommendBooksFromFavorites = ({ favorites, books, limit = 3 }) => {
    const savedIds = new Set(favorites.map((book) => book.id));
    const themeCounts = new Map();
    const filterCounts = new Map();

    favorites.forEach((book) => {
        (book.themes || []).forEach((theme) => themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1));
        Object.entries(book.filters || {}).forEach(([key, value]) => {
            const filterKey = `${key}:${value}`;
            filterCounts.set(filterKey, (filterCounts.get(filterKey) || 0) + 1);
        });
    });

    return books
        .filter((book) => !savedIds.has(book.id))
        .map((book) => {
            const themeScore = (book.themes || []).reduce((score, theme) => score + (themeCounts.get(theme) || 0), 0);
            const filterScore = Object.entries(book.filters || {}).reduce((score, [key, value]) => {
                return score + (filterCounts.get(`${key}:${value}`) || 0);
            }, 0);
            return { book, score: themeScore * 2 + filterScore };
        })
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
        .map(({ book }) => book);
};

export const recommendFromAnswers = ({ answers, questions, paths }) => {
    const scoreMap = new Map(paths.map((path) => [path.id, 0]));
    const pathSignals = new Map(paths.map((path) => [path.id, []]));

    questions.forEach((question) => {
        const selectedValue = answers.get(question.id);

        if (!selectedValue) {
            return;
        }

        const selectedOption = question.options.find((option) => option.value === selectedValue);

        if (!selectedOption) {
            return;
        }

        Object.entries(selectedOption.scores || {}).forEach(([pathId, score]) => {
            scoreMap.set(pathId, (scoreMap.get(pathId) || 0) + score);
            pathSignals.get(pathId)?.push({
                question: question.title,
                label: selectedOption.label,
                score
            });
        });
    });

    const rankedPaths = sortEntriesDescending(scoreMap.entries());
    const bestPath = paths.find((path) => path.id === rankedPaths[0]?.[0]) || paths[0];
    const runnerUp = paths.find((path) => path.id === rankedPaths[1]?.[0]) || null;
    const matchedSignals = (pathSignals.get(bestPath?.id) || [])
        .sort((left, right) => right.score - left.score);
    const reason = matchedSignals.length > 0
        ? `Esta trilha combina com suas escolhas ${matchedSignals.slice(0, 3).map((signal) => `“${signal.label}”`).join(", ")}.`
        : "Esta trilha é o ponto de partida do Oráculo; responda às perguntas para personalizar a recomendação.";

    return {
        bestPath,
        runnerUp,
        scoreMap,
        matchedSignals,
        reason
    };
};
