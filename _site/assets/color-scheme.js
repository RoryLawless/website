// Light and dark mode. This runs in <head>, before the page paints, so a saved
// choice applies without a flash of the wrong colors. Bootstrap switches its
// colors on data-bs-theme, and assets/custom.scss covers the colors Quarto
// compiles in. Once the page has loaded, the footer control is added; without
// JavaScript the site stays light and no control appears.
(() => {
  const storageKey = 'color-scheme';
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  // Storage can be blocked, for example by some privacy settings. The choice
  // then lasts for the current page only.
  const readChoice = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === 'light' || saved === 'dark' ? saved : 'auto';
    } catch {
      return 'auto';
    }
  };
  const saveChoice = choice => {
    try {
      if (choice === 'auto') localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, choice);
    } catch {
      // Nothing to do: the choice still applies to this page.
    }
  };

  let choice = readChoice();
  let buttons = [];

  const apply = () => {
    const dark = choice === 'dark' || (choice === 'auto' && systemDark.matches);
    root.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.choice === choice));
    });
  };

  apply();

  // "Match your device" follows the operating system as it changes, including
  // automatic switching at sunset.
  systemDark.addEventListener('change', () => {
    if (choice === 'auto') apply();
  });

  // Keep other open tabs in step with a new choice.
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    choice = readChoice();
    apply();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('.nav-footer-center');
    if (!footer) return;

    const makeButton = (value, label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-scheme-choice';
      button.dataset.choice = value;
      button.textContent = label;
      button.addEventListener('click', () => {
        choice = value;
        saveChoice(value);
        apply();
      });
      return button;
    };

    const light = makeButton('light', 'light');
    const dark = makeButton('dark', 'dark');
    const auto = makeButton('auto', 'match your device');
    buttons = [light, dark, auto];

    const control = document.createElement('p');
    control.className = 'color-scheme-control';
    control.setAttribute('role', 'group');
    control.setAttribute('aria-label', 'Color scheme');
    control.append('Read in ', light, ' or ', dark, ', or ', auto, '.');
    footer.append(control);
    apply();
  });
})();
