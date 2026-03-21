document.addEventListener('DOMContentLoaded', () => {
    // 1. Оновлення meta-тегу кольору для мобільних браузерів при зміні системної теми
    const metaThemeColor = document.getElementById('meta-theme-color');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    function updateMetaColor(isDark) {
        // Беремо кольори з нашого CSS
        metaThemeColor.setAttribute('content', isDark ? '#0A0A0B' : '#F4F4F0');
    }

    // Встановлюємо колір при завантаженні
    updateMetaColor(prefersDarkScheme.matches);

    // Слухаємо зміни (якщо користувач перемкнув тему в налаштуваннях ОС/браузера)
    prefersDarkScheme.addEventListener('change', (e) => {
        updateMetaColor(e.matches);
    });

    // 2. Реєстрація Service Worker (Офлайн режим)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('MULTIX PWA: ServiceWorker активний.'))
                .catch(err => console.error('Помилка ServiceWorker:', err));
        });
    }
});
