const toggle = document.getElementById('site-menu-toggle');
const navigation = document.getElementById('primary-navigation');
const mobile = matchMedia('(max-width: 780px)');
const setMenu = open => {
    if (!toggle || !navigation) return;
    toggle.hidden = !mobile.matches;
    navigation.hidden = mobile.matches && !open;
    toggle.setAttribute('aria-expanded', String(mobile.matches && open));
    toggle.textContent = open && mobile.matches ? 'Fechar' : 'Menu';
};
if (toggle && navigation) {
    setMenu(false);
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    navigation.addEventListener('click', event => { if(event.target.closest('a')) setMenu(false); });
    mobile.addEventListener('change', () => {
        const focusWasInNavigation = navigation.contains(document.activeElement);
        setMenu(false);
        if (mobile.matches && focusWasInNavigation) toggle.focus();
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.site-header') && mobile.matches) setMenu(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && mobile.matches && toggle.getAttribute('aria-expanded') === 'true') {
            setMenu(false); toggle.focus();
        }
    });
}
document.querySelector('.skip-link')?.addEventListener('click', () => document.getElementById('main-content')?.focus());

const cursorIcons = {
    luz: `
        <svg viewBox="0 0 28 28" aria-hidden="true">
            <circle class="cursor-glow" cx="14" cy="14" r="9.5"></circle>
            <path class="cursor-stroke" d="M14 1.8v5.3M14 21v5.2M1.8 14h5.3M21 14h5.2M5.1 5.2l3.6 3.6M19.4 19.5l3.5 3.5M5.1 22.8l3.6-3.6M19.4 8.4l3.5-3.5"></path>
            <circle class="cursor-fill" cx="14" cy="14" r="3.7"></circle>
        </svg>
    `,
    cajado: `
        <svg viewBox="0 0 28 28" aria-hidden="true">
            <circle class="cursor-glow" cx="14" cy="14" r="9.5"></circle>
            <path class="cursor-stroke" d="M10.5 5.5 21.8 16.7M8.3 7.8 5.1 11l2.1 2.1 3.2-3.2M17.2 16.7l3.3 3.3M9.2 21.1 6.8 23.5"></path>
            <path class="cursor-fill" d="M10.8 5.2 22.7 17.1a1.8 1.8 0 0 1-2.5 2.5L8.3 7.7 10.8 5.2Z"></path>
            <path class="cursor-stroke" d="M9.9 20.8l-3.7 3.6"></path>
        </svg>
    `,
    escudo: `
        <svg viewBox="0 0 28 28" aria-hidden="true">
            <circle class="cursor-glow" cx="14" cy="14" r="9.5"></circle>
            <path class="cursor-fill" d="M14 4.5 22.3 7.8v8a11.8 11.8 0 0 1-8.3 9.7 11.8 11.8 0 0 1-8.3-9.7v-8L14 4.5Z"></path>
            <path class="cursor-stroke" d="M14 8.2v7.2M10.4 11.8h7.2"></path>
        </svg>
    `
};

const resolveCursorVariant = () => {
    const body = document.body;
    if (body.classList.contains('page-login')) return 'escudo';
    if (body.classList.contains('page-catalog')) return 'cajado';
    if (body.classList.contains('page-detail')) return 'luz';
    if (body.classList.contains('page-home')) return 'luz';
    return 'luz';
};

const getCursorVariantForTarget = target => {
    if (!target) return resolveCursorVariant();
    if (target.closest('#account-trigger, #auth-dismiss, .account-widget, .nav-account, [data-cursor="escudo"]')) {
        return 'escudo';
    }
    if (target.closest('input[type="search"], .search-shell, .filter-panel, .topic-card, [data-cursor="cajado"]')) {
        return 'cajado';
    }
    return resolveCursorVariant();
};

const setupCustomCursor = () => {
    if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const body = document.body;
    const cursor = document.createElement('div');
    cursor.className = 'magic-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    body.appendChild(cursor);
    body.classList.add('cursor-enabled');

    const applyVariant = () => {
        cursor.innerHTML = cursorIcons[resolveCursorVariant()] || cursorIcons.luz;
    };
    applyVariant();

    let pointerX = 0;
    let pointerY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let frame = 0;
    const move = event => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!frame) frame = requestAnimationFrame(followPointer);
    };
    const followPointer = () => {
        cursorX += (pointerX - cursorX) * 0.38;
        cursorY += (pointerY - cursorY) * 0.38;
        cursor.style.setProperty('--cursor-x', `${cursorX}px`);
        cursor.style.setProperty('--cursor-y', `${cursorY}px`);
        if (Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > 0.5) {
            frame = requestAnimationFrame(followPointer);
        } else {
            cursorX = pointerX;
            cursorY = pointerY;
            cursor.style.setProperty('--cursor-x', `${cursorX}px`);
            cursor.style.setProperty('--cursor-y', `${cursorY}px`);
            frame = 0;
        }
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', () => {
        body.classList.remove('cursor-enabled', 'cursor-hover', 'cursor-pressed');
    });
    document.addEventListener('pointerover', event => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        body.classList.add('cursor-enabled');
        const target = event.target.closest('a, button, input, select, textarea, summary, [role="button"], .topic-card');
        if (target) {
            body.classList.add('cursor-hover');
            cursor.innerHTML = cursorIcons[getCursorVariantForTarget(target)] || cursorIcons.luz;
        }
    });
    document.addEventListener('pointerout', event => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        const target = event.target.closest('a, button, input, select, textarea, summary, [role="button"], .topic-card');
        if (target && !target.contains(event.relatedTarget)) {
            body.classList.remove('cursor-hover');
            applyVariant();
        }
    });

    document.addEventListener('pointerdown', () => body.classList.add('cursor-pressed'));
    document.addEventListener('pointerup', () => body.classList.remove('cursor-pressed'));
    document.addEventListener('pointercancel', () => body.classList.remove('cursor-pressed'));

    const onThemeChange = () => {
        applyVariant();
        body.classList.remove('cursor-hover', 'cursor-pressed');
    };
    window.addEventListener('hashchange', onThemeChange);
};

setupCustomCursor();

const passwordToggle = document.getElementById('password-toggle');
passwordToggle?.addEventListener('click', () => {
    const password = document.getElementById('password');
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    passwordToggle.setAttribute('aria-pressed', String(show));
    passwordToggle.textContent = show ? 'Ocultar senha' : 'Mostrar senha';
});

// Only trap focus while the existing authentication dialog is actually open.
let activeDialog = null;
let previousFocus = null;
const focusable = root => [...root.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(element => !element.disabled && !element.closest('[hidden]') && element.getClientRects().length);
const syncDialog = () => {
    const dialog = document.querySelector('.auth-gate.is-required');
    if (dialog === activeDialog) return;
    if (dialog) {
        previousFocus = document.activeElement;
        activeDialog = dialog;
        document.querySelector('.site-shell')?.setAttribute('inert', '');
        requestAnimationFrame(() => focusable(dialog)[0]?.focus());
    } else {
        activeDialog = null;
        document.querySelector('.site-shell')?.removeAttribute('inert');
        if (previousFocus?.isConnected) previousFocus.focus();
        previousFocus = null;
    }
};
if (document.body.classList.contains('page-home')) {
    new MutationObserver(syncDialog).observe(document.body, {subtree:true,attributes:true,attributeFilter:['class'],childList:true});
    syncDialog();
}
document.addEventListener('keydown', event => {
    if (activeDialog && event.key === 'Tab') {
        const items = focusable(activeDialog);
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
        if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }
    if (event.key === 'Escape') {
        if (activeDialog) document.getElementById('auth-dismiss')?.click();
        const widget = document.querySelector('.account-widget.is-open');
        if (widget) { widget.querySelector('#account-panel').inert = true; widget.classList.remove('is-open'); const trigger=widget.querySelector('#account-trigger'); trigger?.setAttribute('aria-expanded','false'); trigger?.focus(); }
    }
});
