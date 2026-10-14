import { bosqueApi } from "./account-api.js?v=local-auth-v3";


const loginForm = document.querySelector("#login-form");
const feedback = document.querySelector("#feedback");

const showFeedback = (message, type) => {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
};

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
    } catch {
        submit.disabled = false;
        showFeedback("E-mail ou senha incorretos.", "error");
    }
});
