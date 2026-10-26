const canRegisterServiceWorker = () => {
    return window.location.protocol.startsWith("http") && "serviceWorker" in navigator;
};

const setStatus = (element, text, tone = "idle") => {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.dataset.tone = tone;
};

export const initPwaFeatures = () => {
    const statusElement = document.getElementById("pwa-status");
    const installButton = document.getElementById("install-app");
    const updateNotice = document.getElementById("pwa-update-notice");
    const updateButton = document.getElementById("update-app");
    let deferredPrompt = null;
    let updateAccepted = false;
    let refreshing = false;

    const syncConnectionStatus = () => {
        if (!navigator.onLine) {
            setStatus(statusElement, "Sem rede no momento. O bosque usa o que ja foi guardado.", "offline");
            return;
        }

        if (canRegisterServiceWorker()) {
            setStatus(statusElement, "Modo offline disponivel quando a pagina terminar de guardar o necessario.", "ready");
            return;
        }

        setStatus(statusElement, "Publique no GitHub Pages para ativar o modo offline completo.", "alert");
    };

    if (installButton) {
        installButton.addEventListener("click", async () => {
            if (!deferredPrompt) {
                return;
            }

            deferredPrompt.prompt();
            await deferredPrompt.userChoice.catch(() => null);
            deferredPrompt = null;
            installButton.hidden = true;
        });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event;

        if (installButton) {
            installButton.hidden = false;
        }

        setStatus(statusElement, "O app pode ser instalado neste dispositivo.", "ready");
    });

    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;

        if (installButton) {
            installButton.hidden = true;
        }

        setStatus(statusElement, "Bosque instalado com sucesso neste dispositivo.", "ready");
    });

    window.addEventListener("online", syncConnectionStatus);
    window.addEventListener("offline", syncConnectionStatus);
    syncConnectionStatus();

    if (!canRegisterServiceWorker()) {
        return;
    }

    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
            const showUpdateNotice = () => {
                if (!registration.waiting || !navigator.serviceWorker.controller || !updateNotice || !updateButton) {
                    return;
                }

                updateNotice.hidden = false;
            };

            registration.addEventListener("updatefound", () => {
                const installingWorker = registration.installing;
                if (!installingWorker) {
                    return;
                }

                installingWorker.addEventListener("statechange", () => {
                    if (installingWorker.state === "installed") {
                        showUpdateNotice();
                    }
                });
            });

            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (!updateAccepted || refreshing) {
                    return;
                }

                refreshing = true;
                window.location.reload();
            });

            updateButton?.addEventListener("click", () => {
                if (!registration.waiting) {
                    return;
                }

                updateButton.disabled = true;
                updateButton.textContent = "Atualizando…";
                updateAccepted = true;
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
            });

            showUpdateNotice();

            if (registration.active || registration.waiting || registration.installing) {
                setStatus(statusElement, navigator.onLine
                    ? "Modo offline pronto para guardar acervo, capas e trilhas."
                    : "Sem rede no momento. O bosque usa o que ja foi guardado.", navigator.onLine ? "ready" : "offline");
            }
        } catch {
            setStatus(statusElement, "Nao foi possivel ativar o modo offline agora.", "alert");
        }
    });
};
