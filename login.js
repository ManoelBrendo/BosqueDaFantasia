import { bosqueApi, describeAuthError } from "./account-api.js?v=account-connectivity-v1";


const loginForm = document.querySelector("#login-form");
const feedback = document.querySelector("#feedback");

const showFeedback = (message, type) => {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
};

const setApiStatus = (message, tone) => {
    const status = document.querySelector("#api-status");
    status.textContent = message;
    status.dataset.tone = tone;
};

const syncApiStatus = async () => {
    if (!bosqueApi.canUseRemoteApi()) {
        if (bosqueApi.getMode() === "remote" && !bosqueApi.getToken().startsWith("local:")) {
            setApiStatus("Conta remota salva neste navegador, mas o endereço da API não está configurado neste site.", "offline");
            return;
        }
        setApiStatus("Modo local: esta conta fica neste navegador e não sincroniza entre dispositivos.", "local");
        return;
    }

    try {
        const health = await bosqueApi.health();
        if (health?.ok !== true) throw Object.assign(new Error("API indisponível."), { code: "API_UNAVAILABLE" });
        setApiStatus("Servidor da conta conectado.", "ready");
    } catch (error) {
        setApiStatus(error?.code === "API_UNAVAILABLE"
            ? "Servidor da conta indisponível. Contas remotas não podem entrar agora."
            : "Não foi possível confirmar o estado do servidor da conta.", "offline");
    }
};

void syncApiStatus();

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!loginForm.reportValidity()) return;
    const submit = loginForm.querySelector("button[type=submit]");
    if (submit.disabled) return;
    submit.disabled = true;
    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
        await bosqueApi.login({ email, password });
        showFeedback("Login realizado! Redirecionando...", "success");
        window.setTimeout(() => {
            window.location.href = "./index.html";
        }, 1000);
    } catch (error) {
        submit.disabled = false;
        if (error?.code === "API_UNAVAILABLE" || error?.cause?.code === "API_UNAVAILABLE") void syncApiStatus();
        showFeedback(describeAuthError(error), "error");
    }
});
