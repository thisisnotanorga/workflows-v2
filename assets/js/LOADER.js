//Loader.js | Loads every module, and create the logger

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        'info': 'color: white;',
        'success': 'color: green; font-weight: bold;',
        'warning': 'color: orange;',
        'error': 'color: red; font-weight: bold;'
    };
    console.log(`%c[${timestamp}] ${message}`, colors[type] || 'color: black;');
    
    const logContainers = document.querySelectorAll('.console');
    logContainers.forEach(consoleEl => {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = `[${timestamp}] ${message}`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
        setTimeout(() => line.classList.add('visible'), 50);
    });
}

class ScriptLoader {
    constructor(consoleElement) {
        this.consoleElement = consoleElement;
        this.scripts = [
            'https://cdn.jsdelivr.net/npm/typed.js@2.0.11',
            'assets/js/awesome.js',
            'assets/js/boom.js',
            'assets/js/certif.js',
            'assets/js/cheat.js',
            'assets/js/console.js',
            'assets/js/cookies.js',
            'assets/js/cursor.js',
            'assets/js/downfall.js',
            'assets/js/hacker.js',
            'assets/js/localinfo.js',
            'assets/js/minecraft.js',
            'assets/js/night.js',
            'assets/js/noskid.js',
            'assets/js/rick.js',
            'assets/js/terminal.js',
            'assets/js/track.js',
            'assets/js/warning.js',
            'assets/js/zkeys.js',
        ];
        this.loadedCount = 0;
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                log(`Already loaded: ${src}`, 'warning');
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            const startTime = performance.now();

            script.onload = () => {
                const endTime = performance.now();
                const loadTime = (endTime - startTime).toFixed(2);
                this.loadedCount++;
                log(`Loaded: ${src} in ${loadTime}ms`, 'success');
                resolve(script);
            };

            script.onerror = () => {
                reject(new Error(`Script load error: ${src}`));
            };

            document.body.appendChild(script);
        });
    }

    async loadAll() {
        log('Starting loading resources...');
        
        for (const src of this.scripts) {
            try {
                await this.loadScript(src);
            } catch (error) {
                log(`Error loading ${src}`, 'error');
                console.error(error);
            }
        }
        
        log('All resources loaded successfully!', 'success');
        
        setTimeout(() => {
            const loaderContainer = document.getElementById('loader-container');
            if (loaderContainer) {
                loaderContainer.style.opacity = '0';
                setTimeout(() => loaderContainer.style.display = 'none', 500);
            }
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const consoleElement = document.getElementById('console');
    const loader = new ScriptLoader(consoleElement);
    loader.loadAll();
});
