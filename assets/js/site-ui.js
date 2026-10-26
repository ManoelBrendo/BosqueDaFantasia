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
