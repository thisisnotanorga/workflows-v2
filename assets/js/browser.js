//Browser.js | Is this the pinnacle of life ?

function spawnBrowser(event) {
    event.preventDefault();

    const browser = ClassicWindow.createWindow({
        title: 'That one browser',
        width: 800,
        height: 600,
        x: Math.round((window.innerWidth - 500) / 2),
        y: Math.round((window.innerHeight - 400) / 2),
        theme: 'dark',
        icon: 'assets/img/ie.svg', //this icon is under MIT licence,
        resizable: false,
        statusText: 'NoSkidBrowser v69',
    });

    browserMainPage(browser);
}

function browserMainPage(browser) {
    const page = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noskid Browser</title>
    <style>
        h1 { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        h3 { font-size: 18px; margin-bottom: 8px; }
        input { padding: 5px; margin-right: 5px; width: 70%; }
        button { padding: 5px 10px; cursor: pointer; }
        form { display: flex; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Noskid Browser</h1>
    <hr>
    <h3>The ultimate browser</h3>
    <p>Enter a URL or something to search...</p>
    <form id="search-form">
        <input type="text" name="q" id="search-input" autocomplete="off" autofocus>
        <button type="submit" id="search-button">Go</button>
    </form>
</body>
</html>
    `;

    updateBrowser(browser, page);
    
    setTimeout(() => {
        const container = browser.querySelector('.c-cnt');
        if (!container) return;
        
        const form = container.querySelector('#search-form');
        const input = container.querySelector('#search-input');
        
        if (form && input) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    doShitWithQuery(browser, query);
                }
            });
        }
    }, 100);
}

function doShitWithQuery(win, query) {
    //check if url
    let url;
    try {
        new URL(query);
        url = query;
    } catch (_) { //use a search engine if not
        url = 'https://wiby.me/?q=' + encodeURIComponent(query);
    }

    const content = `
    <style>
        .browser-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .browser-navbar {
            padding: 8px;
            background: #f1f1f1;
            border-bottom: 1px solid #ddd;
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }
        
        .browser-navbar input {
            flex: 1;
            padding: 5px 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-right: 8px;
        }
        
        .browser-navbar button {
            padding: 5px 10px;
            background: #e0e0e0;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .browser-content {
            flex: 1;
            min-height: 0;
        }
        
        iframe {
            width: 780px;
            height: 460px;
            border: none;
            display: block;
        }
        
        .c-dark .browser-navbar {
            background: #333;
            border-bottom: 1px solid #444;
        }
        
        .c-dark .browser-navbar input {
            background: #444;
            color: #fff;
            border: 1px solid #555;
        }
        
        .c-dark .browser-navbar button {
            background: #555;
            color: #fff;
            border: 1px solid #666;
        }
    </style>
    <div class="browser-container">
        <div class="browser-navbar">
            <input type="text" id="browser-url" value="${url}">
            <button id="browser-go">Go</button>
        </div>
        <div class="browser-content">
            <iframe src="${url}"></iframe>
        </div>
    </div>
    `;

    updateBrowser(win, content);
    
    ClassicWindow.updateStatusText(win, url);
    
    setTimeout(() => {
        const container = win.querySelector('.c-cnt');
        if (!container) return;
        
        const urlInput = container.querySelector('#browser-url');
        const goButton = container.querySelector('#browser-go');
        
        if (urlInput && goButton) {
            const handleSearch = () => {
                const newQuery = urlInput.value.trim();
                if (newQuery) {
                    doShitWithQuery(win, newQuery);
                }
            };
            
            goButton.addEventListener('click', handleSearch);
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }
    }, 100);

    updateBrowser(win, content);
    
    ClassicWindow.updateStatusText(win, url);
    
    setTimeout(() => {
        const container = win.querySelector('.c-cnt');
        if (!container) return;
        
        const urlInput = container.querySelector('#browser-url');
        const goButton = container.querySelector('#browser-go');
        
        if (urlInput && goButton) {
            const handleSearch = () => {
                const newQuery = urlInput.value.trim();
                if (newQuery) {
                    doShitWithQuery(win, newQuery);
                }
            };
            
            goButton.addEventListener('click', handleSearch);
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }
    }, 100);
}

function updateBrowser(window, content) {
    const newContent = document.createElement('div');
    newContent.innerHTML = content;
    ClassicWindow.updateWindowContent(window, newContent);
}