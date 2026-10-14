import { bosqueApi, describeAuthError } from "./account-api.js?v=account-connectivity-v1";
import { BosqueLibraryDb } from "./library-db.js";
import { affinityQuestions, readingPaths } from "./site-data.js";
import { recommendFromAnswers } from "./recommendation-engine.js";

const LOGIN_ENTRY_DELAY_MS = 1100;
const PROFILE_NICKNAME_PREFIX = "bosque-profile-nickname:";
const profileDatabase = new BosqueLibraryDb();
let activeUser = null;
let apiHealthState = {
    tone: "idle",
    message: "Verificando conexão do servidor..."
};
let apiHealthRequestId = 0;

const style = document.createElement("style");
style.textContent = `
    body.auth-locked { overflow: hidden; }
    body.auth-locked .site-shell,
    body.auth-locked > audio {
        filter: blur(12px) brightness(0.48);
        transform: scale(1.01);
        pointer-events: none;
        user-select: none;
    }
    .auth-gate {
        position: fixed;
        inset: 0;
        z-index: 70;
        display: grid;
        place-items: center;
        padding: 1rem;
        background:
            radial-gradient(circle at 50% 30%, rgba(240, 223, 176, 0.12), transparent 28%),
            radial-gradient(circle at 16% 74%, rgba(139, 186, 153, 0.14), transparent 24%),
            rgba(4, 8, 7, 0.88);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 560ms ease, visibility 560ms ease;
    }
    .auth-gate.is-required {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }
    .auth-gate.is-open {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }
    .auth-card {
        position: relative;
        width: min(94vw, 58rem);
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
        gap: 1rem;
        padding: 1rem;
        border: 1px solid rgba(240, 223, 176, 0.28);
        border-radius: 28px;
        background: linear-gradient(135deg, rgba(15, 31, 25, 0.96), rgba(7, 13, 11, 0.94));
        box-shadow: 0 34px 100px rgba(0, 0, 0, 0.62);
    }
    .auth-card::before {
        content: "";
        position: absolute;
        inset: -45%;
        background: conic-gradient(from 0deg, transparent, rgba(240, 223, 176, 0.16), transparent, rgba(139, 186, 153, 0.18), transparent);
        animation: authGateSpin 20s linear infinite;
        pointer-events: none;
    }
    .auth-copy,
    .auth-forms {
        position: relative;
        z-index: 1;
        border-radius: 22px;
    }
    .auth-copy {
        min-height: 28rem;
        padding: 1.5rem;
        display: grid;
        align-content: end;
        background:
            linear-gradient(180deg, transparent, rgba(5, 10, 8, 0.72)),
            url("https://commons.wikimedia.org/wiki/Special:FilePath/Rackham_elves.jpg?width=900") center/cover;
        overflow: hidden;
    }
    .auth-copy h2 {
        margin: 0;
        max-width: 10ch;
        color: #f7efdc;
        font: 600 clamp(2.4rem, 7vw, 5.2rem)/0.92 Georgia, serif;
    }
    .auth-copy p,
    .auth-status,
    .auth-note { color: #d9d4c4; }
    .auth-forms {
        padding: 1.4rem;
        display: grid;
        gap: 1rem;
        background: rgba(6, 12, 10, 0.72);
        border: 1px solid rgba(240, 223, 176, 0.14);
        backdrop-filter: blur(14px);
    }
    .auth-tabs {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    }
    .auth-tab {
        min-height: 2.7rem;
        border: 1px solid rgba(240, 223, 176, 0.18);
        border-radius: 999px;
        background: rgba(255, 247, 232, 0.05);
        color: #f7efdc;
        cursor: pointer;
    }
    .auth-tab.is-active {
        background: linear-gradient(135deg, rgba(240, 223, 176, 0.95), rgba(220, 191, 131, 0.88));
        color: #08100d;
    }
    .auth-form { display: none; gap: 0.75rem; }
    .auth-form.is-active { display: grid; }
    .auth-form input {
        width: 100%;
        min-height: 3.05rem;
        padding: 0.78rem 0.9rem;
        border-radius: 15px;
        border: 1px solid rgba(240, 223, 176, 0.18);
        background: rgba(2, 6, 5, 0.48);
        color: #f7efdc;
    }
    .auth-form input::placeholder { color: rgba(217, 212, 196, 0.72); }
    .auth-note { margin: 0; font-size: 0.9rem; }
    .auth-api-status {
        margin: 0;
        padding: 0.62rem 0.75rem;
        border: 1px solid rgba(240, 223, 176, 0.16);
        border-radius: 14px;
        background: rgba(255, 247, 232, 0.045);
        color: #d9d4c4;
        font-size: 0.86rem;
        line-height: 1.35;
    }
    .auth-api-status[data-tone="ready"] {
        border-color: rgba(139, 186, 153, 0.38);
        color: #d8f0df;
    }
    .auth-api-status[data-tone="local"] {
        border-color: rgba(240, 223, 176, 0.3);
        color: #f0dfb0;
    }
    .auth-api-status[data-tone="offline"] {
        border-color: rgba(229, 145, 126, 0.42);
        color: #ffd8cf;
    }
    .auth-loading {
        display: none;
        align-items: center;
        gap: 0.65rem;
        color: #f0dfb0;
        font-size: 0.92rem;
    }
    .auth-loading.is-visible { display: flex; }
    .auth-loading::before {
        content: "";
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 50%;
        border: 2px solid rgba(240, 223, 176, 0.22);
        border-top-color: #f0dfb0;
        animation: authLoadingSpin 800ms linear infinite;
    }
    .login-portal-overlay,
    .login-denied-overlay {
        position: fixed;
        inset: 0;
        z-index: 90;
        display: grid;
        place-items: center;
        pointer-events: none;
        opacity: 0;
    }
    .login-portal-overlay.is-open { animation: portalScene 2200ms ease both; }
    .login-portal-ring {
        position: relative;
        width: min(58vmin, 32rem);
        aspect-ratio: 1;
        border-radius: 50%;
        background:
            radial-gradient(circle, rgba(255,255,255,0.9) 0 8%, rgba(240,223,176,0.7) 9% 16%, rgba(139,186,153,0.32) 17% 34%, transparent 35%),
            conic-gradient(from 0deg, rgba(240,223,176,0), rgba(240,223,176,0.8), rgba(139,186,153,0.55), rgba(240,223,176,0));
        filter: drop-shadow(0 0 44px rgba(240, 223, 176, 0.45));
        animation: portalOpen 2200ms cubic-bezier(0.16, 0.84, 0.2, 1) both;
    }
    .login-portal-ring::before,
    .login-portal-ring::after {
        content: "";
        position: absolute;
        inset: 9%;
        border-radius: 50%;
        border: 2px solid rgba(255, 246, 210, 0.58);
        animation: portalSpin 1400ms linear infinite;
    }
    .login-portal-ring::after {
        inset: 21%;
        border-style: dashed;
        animation-direction: reverse;
    }
    .login-portal-door {
        position: fixed;
        inset-block: 0;
        width: 50vw;
        background:
            radial-gradient(circle at center, rgba(240,223,176,0.2), transparent 46%),
            linear-gradient(90deg, rgba(7,14,12,0.95), rgba(21,42,34,0.78));
    }
    .login-portal-door.left { left: 0; animation: portalLeft 2200ms ease both; }
    .login-portal-door.right { right: 0; animation: portalRight 2200ms ease both; }
    .login-denied-overlay.is-visible {
        pointer-events: auto;
        animation: deniedScene 2600ms ease both;
    }
    .login-denied-card {
        width: min(92vw, 32rem);
        padding: 1.4rem;
        border: 1px solid rgba(240, 223, 176, 0.35);
        border-radius: 22px;
        background: rgba(7, 14, 12, 0.9);
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
        color: #f7efdc;
        text-align: center;
        backdrop-filter: blur(14px);
    }
    .login-denied-card strong {
        display: block;
        margin-top: 0.8rem;
        font: 700 clamp(1.8rem, 6vw, 3.6rem)/0.95 Georgia, serif;
        color: #f0dfb0;
        text-transform: uppercase;
    }
    .wizard-sigil {
        width: min(46vw, 13rem);
        margin: 0 auto;
        color: #f0dfb0;
        filter: drop-shadow(0 0 24px rgba(240, 223, 176, 0.42));
        animation: wizardStand 900ms ease-in-out infinite alternate;
    }
    .wizard-staff-light {
        transform-origin: 124px 50px;
        animation: staffFlash 760ms ease-in-out infinite alternate;
    }
    .account-widget {
        position: relative;
        display: none;
        align-self: center;
        justify-self: end;
        width: clamp(9.6rem, 14vw, 11.8rem);
        min-width: 0;
    }
    .account-widget.is-ready {
        display: block;
    }
    .account-trigger {
        width: 100%;
        min-height: 2.9rem;
        display: inline-flex;
        align-items: center;
        gap: 0.46rem;
        padding: 0.28rem 0.5rem 0.28rem 0.32rem;
        border: 1px solid rgba(240, 223, 176, 0.16);
        border-radius: 999px;
        background:
            linear-gradient(135deg, rgba(255, 247, 232, 0.08), rgba(139, 186, 153, 0.045)),
            rgba(255, 247, 232, 0.045);
        color: #f7efdc;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
    }
    .account-trigger:hover,
    .account-trigger:focus-visible {
        transform: translateY(-2px);
        border-color: rgba(240, 223, 176, 0.42);
        background: rgba(255, 247, 232, 0.1);
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
    }
    .account-avatar {
        flex: 0 0 auto;
        width: 1.86rem;
        height: 1.86rem;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #08100d;
        background: linear-gradient(135deg, #f0dfb0, #8bba99);
        font-weight: 700;
        font-size: 0.78rem;
        letter-spacing: 0;
    }
    .account-trigger-copy {
        display: grid;
        gap: 0;
        min-width: 0;
        flex: 1 1 auto;
        text-align: left;
        line-height: 1.1;
    }
    .account-trigger-copy strong {
        max-width: 100%;
        overflow: hidden;
        color: #f7efdc;
        font-size: clamp(0.72rem, 0.8vw, 0.84rem);
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .account-trigger-copy span {
        color: #d9d4c4;
        font-size: 0.68rem;
        white-space: nowrap;
    }
    .account-panel {
        position: absolute;
        top: calc(100% + 0.75rem);
        right: 0;
        z-index: 40;
        width: min(92vw, 26rem);
        padding: 1rem;
        border: 1px solid rgba(240, 223, 176, 0.24);
        border-radius: 22px;
        background:
            linear-gradient(145deg, rgba(14, 30, 24, 0.98), rgba(5, 11, 9, 0.96)),
            rgba(7, 14, 12, 0.98);
        box-shadow: 0 28px 84px rgba(0, 0, 0, 0.55);
        color: #f7efdc;
        opacity: 0;
        transform: translateY(-0.4rem) scale(0.98);
        visibility: hidden;
        pointer-events: none;
        transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
    }
    .account-widget.is-open .account-panel {
        opacity: 1;
        transform: translateY(0) scale(1);
        visibility: visible;
        pointer-events: auto;
    }
    .account-panel::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background:
            radial-gradient(circle at 12% 0%, rgba(240, 223, 176, 0.13), transparent 36%),
            radial-gradient(circle at 100% 24%, rgba(139, 186, 153, 0.16), transparent 32%);
        pointer-events: none;
    }
    .account-panel > * {
        position: relative;
        z-index: 1;
    }
    .account-head {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.8rem;
        align-items: center;
        padding-bottom: 0.8rem;
        border-bottom: 1px solid rgba(240, 223, 176, 0.14);
    }
    .account-head .account-avatar {
        width: 3rem;
        height: 3rem;
        font-size: 1.05rem;
    }
    .account-name {
        margin: 0;
        max-width: 100%;
        overflow: hidden;
        font: 600 1.35rem/1.05 Georgia, serif;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .account-email {
        margin: 0.22rem 0 0;
        color: #c4bda8;
        font-size: 0.84rem;
        overflow-wrap: anywhere;
    }
    .account-profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
        margin-top: 0.85rem;
    }
    .account-mini-card {
        min-height: 4.85rem;
        padding: 0.75rem;
        border: 1px solid rgba(240, 223, 176, 0.14);
        border-radius: 16px;
        background: rgba(255, 247, 232, 0.045);
    }
    .account-mini-card[data-span="wide"] {
        grid-column: 1 / -1;
        min-height: auto;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        column-gap: 0.8rem;
    }
    .account-mini-card[data-span="wide"] span {
        margin-top: 0;
    }
    .account-mini-card strong {
        display: block;
        color: #f0dfb0;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .account-mini-card span,
    .account-mini-card p {
        display: block;
        margin: 0.35rem 0 0;
        color: #f7efdc;
        font-size: 0.92rem;
        line-height: 1.35;
    }
    .account-mode-badge {
        display: inline-flex;
        width: fit-content;
        margin-top: 0.45rem;
        padding: 0.24rem 0.5rem;
        border-radius: 999px;
        background: rgba(240, 223, 176, 0.13);
        color: #f0dfb0;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .account-mode-badge[data-mode="remote"] {
        background: rgba(139, 186, 153, 0.16);
        color: #d8f0df;
    }
    .account-connection-status {
        display: grid;
        gap: 0.55rem;
        margin-top: 0.9rem;
    }
    .account-connection-status .auth-api-status {
        margin: 0;
    }
    .account-connection-status .button {
        justify-self: start;
        min-height: 2.35rem;
        padding: 0.45rem 0.75rem;
        font-size: 0.82rem;
    }
    .account-nickname-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.5rem;
        margin-top: 0.85rem;
    }
    .account-nickname-row input {
        width: 100%;
        min-height: 2.6rem;
        padding: 0.6rem 0.75rem;
        border: 1px solid rgba(240, 223, 176, 0.18);
        border-radius: 14px;
        background: rgba(2, 6, 5, 0.42);
        color: #f7efdc;
    }
    .account-section {
        margin-top: 0.95rem;
    }
    .account-section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
        margin-bottom: 0.5rem;
        color: #f0dfb0;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .account-list {
        display: grid;
        gap: 0.45rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .account-list li,
    .account-empty {
        padding: 0.55rem 0.65rem;
        border-radius: 12px;
        background: rgba(255, 247, 232, 0.045);
        color: #d9d4c4;
        font-size: 0.9rem;
    }
    .account-empty {
        margin: 0;
    }
    .account-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.55rem;
        margin-top: 1rem;
    }
    .account-actions .button {
        width: 100%;
        min-height: 2.65rem;
        padding-inline: 0.8rem;
        font-size: 0.9rem;
    }
    @keyframes authGateSpin { to { transform: rotate(360deg); } }
    @keyframes authLoadingSpin { to { transform: rotate(360deg); } }
    @keyframes portalScene { 0% { opacity: 0; } 12%, 72% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes portalOpen {
        0% { transform: scale(0.18) rotate(-80deg); opacity: 0; }
        34% { transform: scale(1) rotate(60deg); opacity: 1; }
        72% { transform: scale(1.35) rotate(210deg); opacity: 1; }
        100% { transform: scale(2.2) rotate(360deg); opacity: 0; }
    }
    @keyframes portalSpin { to { transform: rotate(360deg); } }
    @keyframes portalLeft { 0%, 24% { transform: translateX(0); opacity: 0.92; } 72%, 100% { transform: translateX(-102%); opacity: 0; } }
    @keyframes portalRight { 0%, 24% { transform: translateX(0); opacity: 0.92; } 72%, 100% { transform: translateX(102%); opacity: 0; } }
    @keyframes deniedScene { 0% { opacity: 0; transform: scale(0.94); } 12%, 78% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.02); } }
    @keyframes wizardStand { from { transform: translateY(0) rotate(-0.6deg); } to { transform: translateY(-5px) rotate(0.6deg); } }
    @keyframes staffFlash { from { opacity: 0.35; transform: scale(0.82); } to { opacity: 1; transform: scale(1.18); } }
    @media (min-width: 761px) and (max-width: 1240px) {
        .account-widget {
            grid-column: 2;
            justify-self: end;
            width: clamp(9.8rem, 22vw, 12.4rem);
        }
        .account-trigger {
            min-height: 2.55rem;
        }
    }
    @media (max-width: 760px) {
        body.auth-locked .site-shell,
        body.auth-locked > audio {
            filter: brightness(0.54);
            transform: none;
        }
        .auth-gate {
            background: rgba(4, 8, 7, 0.92);
        }
        .auth-card {
            grid-template-columns: 1fr;
            border-radius: 20px;
            box-shadow: 0 18px 48px rgba(0, 0, 0, 0.48);
        }
        .auth-card::before {
            display: none;
        }
        .auth-copy { min-height: 14rem; }
        .auth-copy,
        .auth-forms {
            border-radius: 16px;
        }
        .auth-forms,
        .login-denied-card {
            backdrop-filter: none;
        }
        .account-widget {
            width: 100%;
            min-width: 0;
            justify-self: stretch;
            order: 3;
        }
        .account-trigger {
            width: 100%;
            justify-content: flex-start;
        }
        .account-panel {
            left: 0;
            right: auto;
            width: 100%;
            border-radius: 18px;
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.44);
        }
        .account-mini-card[data-span="wide"] {
            grid-template-columns: 1fr;
            row-gap: 0.2rem;
        }
        .account-profile-grid,
        .account-actions {
            grid-template-columns: 1fr;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .auth-card::before,
        .auth-loading::before,
        .login-portal-overlay,
        .login-denied-overlay,
        .login-portal-ring,
        .login-portal-door,
        .wizard-sigil,
        .wizard-staff-light { animation: none !important; }
    }
`;
document.head.append(style);

const setStatus = (message) => {
    const status = document.getElementById("auth-status");

    if (status) {
        status.textContent = message;
    }
};

const setLoading = (isLoading, message = "Abrindo o portal...") => {
    const loading = document.getElementById("auth-loading");

    if (!loading) {
        return;
    }

    loading.textContent = message;
    loading.classList.toggle("is-visible", isLoading);
};

const setApiStatus = (message, tone = "idle") => {
    apiHealthState = { message, tone };
    for (const status of document.querySelectorAll("#auth-api-status, #account-api-status")) {
        status.textContent = message;
        status.dataset.tone = tone;
    }
};

const delay = (duration) => {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
};

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const getUserKey = (user) => {
    return user?.id || user?.email || "local";
};

const getNicknameKey = (user) => {
    return `${PROFILE_NICKNAME_PREFIX}${getUserKey(user)}`;
};

const getInitials = (name = "") => {
    const parts = String(name || "Leitor")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : parts[0]?.slice(0, 2) || "LB").toUpperCase();
};

const getCompactName = (name = "") => {
    const cleanName = String(name || "Leitor").trim().replace(/\s+/g, " ");

    if (cleanName.length <= 16) {
        return cleanName;
    }

    const parts = cleanName.split(" ");

    if (parts.length > 1) {
        const firstName = parts[0];
        const initials = parts.slice(1, 4).map((part) => `${part[0]}.`).join(" ");
        const compactName = `${firstName} ${initials}`.trim();

        return compactName.length <= 18 ? compactName : `${firstName.slice(0, 14)}...`;
    }

    return `${cleanName.slice(0, 14)}...`;
};

const getDefaultNickname = (user) => {
    return String(user?.name || "Leitor do Bosque").trim().split(/\s+/)[0] || "Leitor";
};

const getSessionModeLabel = (user) => {
    if (user?.localOnly || bosqueApi.getMode() === "local") {
        return {
            mode: "local",
            label: "Modo local",
            description: "Conta, favoritos e preferências ficam apenas neste navegador."
        };
    }

    return {
        mode: "remote",
        label: "Conta no servidor",
        description: "A conta fica no servidor; favoritos e preferências continuam neste navegador."
    };
};

const getStoredNickname = (user) => {
    return localStorage.getItem(getNicknameKey(user)) || getDefaultNickname(user);
};

const saveNickname = (user, nickname) => {
    const cleanNickname = String(nickname || "").trim().slice(0, 32);

    if (!cleanNickname) {
        localStorage.removeItem(getNicknameKey(user));
        return getDefaultNickname(user);
    }

    localStorage.setItem(getNicknameKey(user), cleanNickname);
    return cleanNickname;
};

const getReadableDate = (date) => {
    if (!date) {
        return "Primeira travessia ainda sem data";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(date));
};

const readProfileData = async () => {
    const [uiState, favorites, recentQueries, books] = await Promise.all([
        profileDatabase.getState("ui-state").catch(() => null),
        profileDatabase.getState("favorites").catch(() => []),
        profileDatabase.getState("recent-queries").catch(() => []),
        profileDatabase.getAllBooks().catch(() => [])
    ]);

    return {
        uiState: uiState && typeof uiState === "object" ? uiState : {},
        favorites: Array.isArray(favorites) ? favorites : [],
        recentQueries: Array.isArray(recentQueries) ? recentQueries : [],
        books: Array.isArray(books) ? books : []
    };
};

const resolveLiteraryProfile = ({ uiState, favorites, recentQueries }) => {
    const answerEntries = Object.entries(uiState.affinityAnswers || {}).filter(([, value]) => Boolean(value));

    if (answerEntries.length >= affinityQuestions.length) {
        const recommendation = recommendFromAnswers({
            answers: new Map(answerEntries),
            questions: affinityQuestions,
            paths: readingPaths
        });

        return recommendation.bestPath?.name || "Trilha revelada pelo Oráculo";
    }

    if (favorites.length > 0) {
        return "Guardião do relicário";
    }

    if (recentQueries.length > 0) {
        return "Explorador do acervo";
    }

    return "Leitor em iniciação";
};

const getFavoriteTitles = ({ favorites, books }) => {
    return favorites
        .map((bookId) => books.find((book) => book.id === bookId)?.title)
        .filter(Boolean)
        .slice(0, 4);
};

const animateAccountEntrance = (widget) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.gsap || widget.dataset.animated === "true") {
        return;
    }

    widget.dataset.animated = "true";
    window.gsap.fromTo(widget, {
        opacity: 0,
        y: -8,
        scale: 0.96
    }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.46,
        ease: "back.out(1.6)"
    });
};

const animateAccountPanel = (widget) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.anime) {
        return;
    }

    window.anime({
        targets: widget.querySelectorAll(".account-mini-card, .account-section, .account-actions"),
        translateY: [8, 0],
        opacity: [0, 1],
        delay: window.anime.stagger(38),
        duration: 420,
        easing: "easeOutCubic"
    });
};

const ensureAccountWidget = () => {
    let widget = document.getElementById("account-widget");

    if (widget) {
        return widget;
    }

    const topbarInner = document.querySelector(".site-header-inner") || document.querySelector(".topbar-inner");

    if (!topbarInner) {
        return null;
    }

    widget = document.createElement("div");
    widget.id = "account-widget";
    widget.className = "account-widget";
    widget.innerHTML = `
        <button id="account-trigger" class="account-trigger" type="button" aria-expanded="false" aria-controls="account-panel">
            <span id="account-trigger-avatar" class="account-avatar" aria-hidden="true">LB</span>
            <span class="account-trigger-copy">
                <strong id="account-trigger-name">Minha conta</strong>
                <span>Perfil literário</span>
            </span>
        </button>
        <aside id="account-panel" class="account-panel" inert aria-label="Painel da conta"></aside>
    `;
    topbarInner.append(widget);

    widget.querySelector("#account-trigger")?.addEventListener("click", async () => {
        await renderAccountWidget(activeUser || bosqueApi.getStoredUser(), { refresh: true });
        const isOpen = widget.classList.toggle("is-open");
        widget.querySelector("#account-panel").inert = !isOpen;
        widget.querySelector("#account-trigger")?.setAttribute("aria-expanded", String(isOpen));

        if (isOpen) {
            animateAccountPanel(widget);
        }
    });

    document.addEventListener("click", (event) => {
        if (!widget.contains(event.target)) {
            widget.classList.remove("is-open");
            widget.querySelector("#account-panel").inert = true;
            widget.querySelector("#account-trigger")?.setAttribute("aria-expanded", "false");
        }
    });

    return widget;
};

const closeAccountWidget = () => {
    const widget = document.getElementById("account-widget");
    widget?.classList.remove("is-open", "is-ready");
    if (widget) widget.querySelector("#account-panel").inert = true;
    widget?.querySelector("#account-trigger")?.setAttribute("aria-expanded", "false");
};

const renderAccountWidget = async (user, { refresh = false } = {}) => {
    activeUser = user || null;
    const widget = ensureAccountWidget();

    if (!widget) {
        return;
    }

    if (!activeUser) {
        closeAccountWidget();
        return;
    }

    const nickname = getStoredNickname(activeUser);
    const profileData = refresh ? await readProfileData() : {
        uiState: {},
        favorites: [],
        recentQueries: [],
        books: []
    };
    const profileName = resolveLiteraryProfile(profileData);
    const favoriteTitles = getFavoriteTitles(profileData);
    const recentLabels = profileData.recentQueries
        .map((entry) => entry.label || entry.query)
        .filter(Boolean)
        .slice(0, 4);
    const sessionMode = getSessionModeLabel(activeUser);

    widget.classList.add("is-ready");
    animateAccountEntrance(widget);
    widget.querySelector("#account-trigger-avatar").textContent = getInitials(activeUser.name);
    widget.querySelector("#account-trigger-name").textContent = getCompactName(nickname);
    widget.querySelector("#account-trigger-name").title = nickname;

    const panel = widget.querySelector("#account-panel");
    panel.innerHTML = `
        <div class="account-head">
            <span class="account-avatar" aria-hidden="true">${escapeHtml(getInitials(activeUser.name))}</span>
            <div>
                <h2 class="account-name">${escapeHtml(activeUser.name || "Leitor do Bosque")}</h2>
                <p class="account-email">${escapeHtml(activeUser.email || "")}</p>
                <span class="account-mode-badge" data-mode="${escapeHtml(sessionMode.mode)}">${escapeHtml(sessionMode.label)}</span>
            </div>
        </div>
        <div class="account-profile-grid">
            <div class="account-mini-card">
                <strong>Apelido</strong>
                <span id="account-current-nickname">${escapeHtml(nickname)}</span>
            </div>
            <div class="account-mini-card">
                <strong>Perfil literário</strong>
                <span>${escapeHtml(profileName)}</span>
            </div>
            <div class="account-mini-card">
                <strong>Relicário</strong>
                <span>${profileData.favorites.length} livros guardados</span>
            </div>
            <div class="account-mini-card">
                <strong>Entrada</strong>
                <span>${escapeHtml(getReadableDate(activeUser.createdAt))}</span>
            </div>
            <div class="account-mini-card" data-span="wide">
                <strong>Conexão</strong>
                <span>${escapeHtml(sessionMode.description)}</span>
            </div>
        </div>
        <div class="account-connection-status">
            <p id="account-api-status" class="auth-api-status" data-tone="${escapeHtml(apiHealthState.tone)}" role="status" aria-live="polite">${escapeHtml(apiHealthState.message)}</p>
            <button id="account-check-api" class="button ghost" type="button">Verificar conexão</button>
        </div>
        <div class="account-nickname-row">
            <input id="account-nickname-input" type="text" maxlength="32" value="${escapeHtml(nickname)}" aria-label="Editar apelido">
            <button id="account-save-nickname" class="button ghost" type="button">Salvar</button>
        </div>
        <section class="account-section" aria-labelledby="account-seen-title">
            <div id="account-seen-title" class="account-section-title">O que você já viu</div>
            ${recentLabels.length > 0
                ? `<ul class="account-list">${recentLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}</ul>`
                : `<p class="account-empty">Suas buscas recentes aparecerão aqui.</p>`}
        </section>
        <section class="account-section" aria-labelledby="account-books-title">
            <div id="account-books-title" class="account-section-title">Livros guardados</div>
            ${favoriteTitles.length > 0
                ? `<ul class="account-list">${favoriteTitles.map((title) => `<li>${escapeHtml(title)}</li>`).join("")}</ul>`
                : `<p class="account-empty">Guarde livros na estante para montar seu perfil.</p>`}
        </section>
        <div class="account-actions">
            <a class="button secondary" href="#relicario">Meu relicário</a>
            <button id="account-logout" class="button ghost" type="button">Sair da conta</button>
        </div>
    `;

    panel.querySelector("#account-save-nickname")?.addEventListener("click", () => {
        const input = panel.querySelector("#account-nickname-input");
        const nextNickname = saveNickname(activeUser, input?.value);
        panel.querySelector("#account-current-nickname").textContent = nextNickname;
        widget.querySelector("#account-trigger-name").textContent = getCompactName(nextNickname);
        widget.querySelector("#account-trigger-name").title = nextNickname;
    });

    panel.querySelector("#account-check-api")?.addEventListener("click", () => {
        syncApiHealth();
    });

    panel.querySelector("#account-logout")?.addEventListener("click", () => {
        bosqueApi.clearSession();
        activeUser = null;
        closeAccountWidget();
        lockSite();
        setStatus("Faça login para atravessar o portal.");
    });
};

const ensureAuthGate = () => {
    let gate = document.querySelector(".auth-gate");

    if (gate) {
        return gate;
    }

    gate = document.createElement("section");
    gate.className = "auth-gate";
    gate.setAttribute("aria-labelledby", "auth-title");
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.innerHTML = `
        <div class="auth-card">
            <button id="auth-dismiss" class="auth-dismiss" type="button" aria-label="Fechar acesso à conta">Fechar ×</button>
            <div class="auth-copy">
                <div>
                    <p class="eyebrow">Portal de entrada</p>
                    <h2 id="auth-title">Entre no Bosque.</h2>
                    <p>Entre para acessar sua conta. Você também pode continuar explorando o acervo sem entrar.</p>
                </div>
            </div>
            <div class="auth-forms">
                <div class="auth-tabs" role="group" aria-label="Escolher entrar ou criar conta">
                    <button class="auth-tab is-active" type="button" data-auth-tab="login">Entrar</button>
                    <button class="auth-tab" type="button" data-auth-tab="register">Criar conta</button>
                </div>
                <p id="auth-status" class="auth-status">Faça login para atravessar o portal.</p>
                <p id="auth-api-status" class="auth-api-status" data-tone="idle">Preparando acesso...</p>
                <div id="auth-loading" class="auth-loading" aria-live="polite">Abrindo o portal...</div>
                <form id="login-form" class="auth-form is-active">
                    <input name="email" type="email" aria-label="E-mail" placeholder="E-mail" autocomplete="email" required>
                    <input name="password" type="password" aria-label="Senha" placeholder="Senha" autocomplete="current-password" required>
                    <button class="button primary" type="submit">Abrir portal</button>
                </form>
                <form id="register-form" class="auth-form">
                    <input name="name" type="text" aria-label="Nome" placeholder="Nome" autocomplete="name" required>
                    <input name="email" type="email" placeholder="E-mail" autocomplete="email" required>
                    <input name="password" type="password" aria-label="Senha com pelo menos 6 caracteres" placeholder="Senha com 6+ caracteres" autocomplete="new-password" required>
                    <button class="button secondary" type="submit">Criar conta e entrar</button>
                </form>
                <p class="auth-note">Sua conta e suas preferências ficam salvas neste dispositivo quando você usa o acesso local.</p>
            </div>
        </div>
    `;
    document.body.prepend(gate);
    gate.querySelector("#auth-dismiss").addEventListener("click", () => unlockSite());
    return gate;
};

const ensurePortalOverlay = () => {
    let overlay = document.querySelector(".login-portal-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "login-portal-overlay";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
            <div class="login-portal-door left"></div>
            <div class="login-portal-ring"></div>
            <div class="login-portal-door right"></div>
        `;
        document.body.append(overlay);
    }

    return overlay;
};

const openLoginPortal = () => {
    const overlay = ensurePortalOverlay();
    overlay.classList.remove("is-open");
    void overlay.offsetWidth;
    overlay.classList.add("is-open");
    window.setTimeout(() => overlay.classList.remove("is-open"), 2300);
};

const ensureDeniedOverlay = () => {
    let overlay = document.querySelector(".login-denied-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "login-denied-overlay";
        overlay.setAttribute("role", "alert");
        overlay.innerHTML = `
            <article class="login-denied-card">
                <svg class="wizard-sigil" viewBox="0 0 180 180" aria-hidden="true">
                    <path d="M88 14 68 55h40L88 14Z" fill="currentColor" opacity=".9"/>
                    <circle cx="88" cy="70" r="18" fill="currentColor" opacity=".82"/>
                    <path d="M55 160c5-50 16-80 33-80s28 30 33 80H55Z" fill="currentColor" opacity=".62"/>
                    <path d="M122 154V36" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
                    <circle class="wizard-staff-light" cx="122" cy="34" r="17" fill="currentColor" opacity=".7"/>
                    <path d="M48 112c26 18 54 18 80 0" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
                    <path d="M60 88h12m34 0h12" stroke="#09120f" stroke-width="6" stroke-linecap="round"/>
                </svg>
                <strong>You shall not pass!</strong>
            </article>
        `;
        document.body.append(overlay);
    }

    return overlay;
};

const showDeniedLogin = () => {
    const overlay = ensureDeniedOverlay();
    overlay.classList.remove("is-visible");
    void overlay.offsetWidth;
    overlay.classList.add("is-visible");
    window.setTimeout(() => overlay.classList.remove("is-visible"), 2700);
};

const lockSite = () => {
    document.body.classList.add("auth-locked");
    ensureAuthGate().classList.remove("is-open");
    ensureAuthGate().classList.add("is-required");
};

const unlockSite = ({ withPortal = false } = {}) => {
    const gate = ensureAuthGate();
    gate.classList.remove("is-required");

    if (withPortal) {
        openLoginPortal();
    }

    window.setTimeout(() => {
        gate.classList.add("is-open");
        document.body.classList.remove("auth-locked");
    }, withPortal ? 620 : 0);
};

const bindTabs = () => {
    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.authTab;
            document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
                tab.classList.toggle("is-active", tab === button);
            });
            document.getElementById("login-form")?.classList.toggle("is-active", target === "login");
            document.getElementById("register-form")?.classList.toggle("is-active", target === "register");
            setStatus(target === "login" ? "Faça login para atravessar o portal." : "Crie sua conta para liberar o Bosque.");
        });
    });
};

const bindForms = () => {
    document.getElementById("login-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        try {
            setLoading(true, "Conferindo as runas de acesso...");
            const { user, mode } = await bosqueApi.login({
                email: form.get("email"),
                password: form.get("password")
            });
            setStatus(mode === "local"
                ? `Bem-vindo de volta, ${user.name}. Conta local neste navegador; seus dados não foram sincronizados.`
                : `Bem-vindo de volta, ${user.name}.`);
            setLoading(true, "Portal autorizado. Preparando travessia...");
            await delay(LOGIN_ENTRY_DELAY_MS);
            unlockSite({ withPortal: true });
        } catch (error) {
            setLoading(false);
            if (error?.code === "API_UNAVAILABLE" || error?.cause?.code === "API_UNAVAILABLE") void syncApiHealth();
            setStatus(describeAuthError(error));
            showDeniedLogin();
        }
    });

    document.getElementById("register-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        try {
            setLoading(true, "Gravando seu nome no livro do Bosque...");
            const { user, mode } = await bosqueApi.register({
                name: form.get("name"),
                email: form.get("email"),
                password: form.get("password")
            });
            setStatus(mode === "local"
                ? `Conta local criada para ${user.name}.`
                : `Conta criada para ${user.name}.`);
            setLoading(true, "Conta criada. Preparando travessia...");
            await delay(LOGIN_ENTRY_DELAY_MS);
            unlockSite({ withPortal: true });
        } catch (error) {
            setLoading(false);
            setStatus(describeAuthError(error));
        }
    });
};

const syncApiHealth = async () => {
    const requestId = ++apiHealthRequestId;
    if (!bosqueApi.canUseRemoteApi()) {
        if (bosqueApi.getMode() === "remote" && !bosqueApi.getToken().startsWith("local:")) {
            setApiStatus("A conta remota está salva, mas este site não está configurado com o endereço da API. A sessão não foi verificada.", "offline");
            return;
        }
        setApiStatus("Modo local: contas, favoritos e preferências ficam neste navegador e não sincronizam entre dispositivos.", "local");
        return;
    }

    setApiStatus("Verificando acesso à conta...", "idle");

    try {
        const health = await bosqueApi.health();
        if (requestId !== apiHealthRequestId) return;
        if (health?.ok !== true) {
            throw Object.assign(new Error("A verificação de saúde da API não confirmou disponibilidade."), { code: "API_UNAVAILABLE" });
        }
        setApiStatus("Servidor da conta conectado. Favoritos e preferências continuam salvos neste navegador.", "ready");
    } catch (error) {
        if (requestId !== apiHealthRequestId) return;
        setApiStatus(error?.code === "API_UNAVAILABLE"
            ? "Servidor da conta indisponível. A experiência pública continua; contas remotas podem não autenticar."
            : "Não foi possível confirmar o estado do servidor. Tente verificar novamente.", "offline");
    }
};

const initAuthGate = async () => {
    ensureAuthGate();
    ensureAccountWidget();
    bindTabs();
    bindForms();
    void syncApiHealth();
    window.setInterval(() => {
        if (document.visibilityState === "visible") void syncApiHealth();
    }, 60_000);
    window.addEventListener("online", () => void syncApiHealth());
    window.addEventListener("offline", () => {
        if (bosqueApi.canUseRemoteApi()) {
            apiHealthRequestId += 1;
            setApiStatus("Sem conexão de rede. A conta remota não pode ser verificada; recursos públicos e dados locais continuam disponíveis.", "offline");
        }
    });
    window.addEventListener("bosque:session", (event) => {
        renderAccountWidget(event.detail?.user || null, { refresh: Boolean(event.detail?.user) }).catch(() => null);
    });

    if (!bosqueApi.getToken()) {
        closeAccountWidget();
        unlockSite();
        return;
    }

    renderAccountWidget(bosqueApi.getStoredUser(), { refresh: false }).catch(() => null);

    try {
        const { user } = await bosqueApi.me();
        unlockSite();
        renderAccountWidget(user, { refresh: true }).catch(() => null);
    } catch (error) {
        if (error?.code === "API_UNAVAILABLE" || error?.code === "API_ERROR") {
            unlockSite();
            try {
                await renderAccountWidget(bosqueApi.getStoredUser(), { refresh: true });
            } catch (profileError) {
                console.error("Não foi possível carregar o perfil local enquanto a API está indisponível.", profileError);
            }
            return;
        }
        if (error?.code === "SESSION_EXPIRED") {
            bosqueApi.clearSession();
            closeAccountWidget();
            lockSite();
            setStatus("Sua sessão expirou. Entre novamente.");
            return;
        }
        throw error;
    }
};

initAuthGate();
