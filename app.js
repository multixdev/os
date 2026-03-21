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

// === ТИМЧАСОВИЙ МОДУЛЬ СИНХРОНІЗАЦІЇ (GitHub God Mode) ===
    
    // ВАШІ ДАНІ (Жорстко задані для спрощення розробки)
    const GITHUB_OWNER = 'oleh-malakan'; // Замініть на ваш логін GitHub
    const GITHUB_REPO = 'multix';
    const BRANCH = 'main';
    
    const syncBtn = document.getElementById('sync-btn');
    const fileTree = document.getElementById('vfs-tree');
    const editor = document.getElementById('main-editor');
    
    let githubToken = localStorage.getItem('multix_github_pat');
    let currentFiles = {}; // Віртуальна файлова система в пам'яті: { шлях: { content: "...", sha: "..." } }

    // 1. Авторизація (Спрощена)
    if (!githubToken) {
        githubToken = prompt("Введіть ваш GitHub PAT (Personal Access Token) для репозиторію multix:");
        if (githubToken) localStorage.setItem('multix_github_pat', githubToken);
    }

    if (githubToken) {
        syncBtn.innerText = "Sync: Clone...";
        cloneRepository();
    }

    // 2. Функція "Clone" (Завантаження дерева і файлів)
    async function cloneRepository() {
        try {
            // Отримуємо дерево файлів (рекурсивно)
            const treeResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${BRANCH}?recursive=1`, {
                headers: { 'Authorization': `Bearer ${githubToken}` }
            });
            
            if (!treeResponse.ok) throw new Error("Помилка доступу до репозиторію");
            
            const treeData = await treeResponse.json();
            fileTree.innerHTML = ''; // Очищаємо сайдбар
            
            // Фільтруємо тільки файли (blob)
            const files = treeData.tree.filter(item => item.type === 'blob');
            
            files.forEach(file => {
                // Додаємо файл у сайдбар
                const li = document.createElement('li');
                li.className = 'file-item';
                li.innerText = file.path;
                li.onclick = () => loadFileContent(file.path, file.sha, li);
                fileTree.appendChild(li);
            });
            
            syncBtn.innerText = "Sync: Ready";
            syncBtn.className = "btn outline-green";
            
        } catch (error) {
            console.error(error);
            syncBtn.innerText = "Sync: Помилка";
            syncBtn.style.color = "red";
        }
    }

    // 3. Завантаження вмісту конкретного файлу в редактор
    async function loadFileContent(path, sha, element) {
        // Підсвітка активного файлу
        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        
        document.querySelector('.tab.active').innerText = path;
        editor.value = "Завантаження...";

        // Якщо файл вже в пам'яті (редагувався) - показуємо його
        if (currentFiles[path] && currentFiles[path].content) {
            editor.value = currentFiles[path].content;
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/blobs/${sha}`, {
                headers: { 'Authorization': `Bearer ${githubToken}` }
            });
            const data = await response.json();
            
            // GitHub віддає файли в Base64
            const content = decodeURIComponent(escape(atob(data.content)));
            
            // Зберігаємо у VFS
            currentFiles[path] = { content: content, sha: sha, isModified: false };
            editor.value = content;
            
            // Слухаємо зміни
            editor.oninput = () => {
                currentFiles[path].content = editor.value;
                currentFiles[path].isModified = true;
                syncBtn.innerText = "Sync: Commit & Push All";
                syncBtn.style.borderColor = "var(--color-amber)";
                syncBtn.style.color = "var(--color-amber)";
            };

        } catch (error) {
            editor.value = "Помилка завантаження файлу.";
        }
    }

    // 4. Функція "Push All" (Відправка змін)
    syncBtn.addEventListener('click', async () => {
        if (syncBtn.innerText !== "Sync: Commit & Push All") return;
        
        syncBtn.innerText = "Sync: Pushing...";
        // Тут буде логіка створення Blob -> Tree -> Commit -> Reference update.
        // Для спрощення розробки на першому етапі (коли ви працюєте один), 
        // можна зробити послідовні PUT запити для змінених файлів (хоча це створить кілька дрібних комітів).
        // Повноцінний масовий коміт через API вимагає трохи більше коду (ланцюжок SHA).
        
        alert("Тут буде виконано PUSH усіх змінених файлів в репозиторій " + GITHUB_REPO);
        
        // Скидаємо статус
        syncBtn.innerText = "Sync: Ready";
        syncBtn.className = "btn outline-green";
    });        
});
