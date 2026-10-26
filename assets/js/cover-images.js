const fallbackCover = new URL("../forest-fallback.svg", import.meta.url).href;

export const loadBookCover = (image, sources, title) => {
    if (!image) {
        return;
    }

    const candidates = [...new Set((sources || []).filter(Boolean))]
        .filter(source => !(source.startsWith("data:image/svg+xml;charset=UTF-8,") && source.includes("Sem%20capa")));
    let sourceIndex = 0;

    const useFallback = () => {
        image.onerror = null;
        image.src = fallbackCover;
        image.alt = `Capa indisponível para ${title || "esta obra"}; ilustração do Bosque`;
        image.classList.add("cover-fallback");
    };

    image.classList.remove("cover-fallback");
    image.onerror = () => {
        sourceIndex += 1;

        if (sourceIndex < candidates.length) {
            image.src = candidates[sourceIndex];
            return;
        }

        useFallback();
    };

    if (candidates.length > 0) {
        image.src = candidates[0];
        return;
    }

    useFallback();
};
