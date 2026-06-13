const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;
let initializedClientId = null;
let credentialCallback = null;

export const setGoogleCredentialCallback = (handler) => {
  credentialCallback = handler;
};

export const loadGsiScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SCRIPT}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('GSI script failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GSI script failed'));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

export const initGoogleIdentityOnce = async (clientId) => {
  await loadGsiScript();

  const { google } = window;
  if (!google?.accounts?.id) {
    throw new Error('Google Identity Services unavailable');
  }

  if (initializedClientId === clientId) return;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      credentialCallback?.(response);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: false,
  });

  initializedClientId = clientId;
};

export const renderGoogleButton = (element, options) => {
  if (!element || !window.google?.accounts?.id) return;
  element.innerHTML = '';
  window.google.accounts.id.renderButton(element, options);
};

export const waitForGoogleButton = (container, maxMs = 12000) =>
  new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      const iframe = container?.querySelector('iframe');
      const roleButton = container?.querySelector('[role="button"]');
      const hasButton =
        (iframe && iframe.offsetWidth > 0 && iframe.offsetHeight > 0) ||
        (roleButton && roleButton.offsetWidth > 0);

      if (hasButton) {
        resolve();
        return;
      }

      if (Date.now() - started > maxMs) {
        reject(new Error('Google button timed out'));
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
