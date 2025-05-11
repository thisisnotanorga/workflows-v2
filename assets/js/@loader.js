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
            'assets/js/again.js',
            'assets/js/awesome.js',
            'assets/js/boom.js',
            'assets/js/browser.js',
            'assets/js/certif.js',
            'assets/js/cheat.js',
            'assets/js/check.js',
            'assets/js/comments.js',
            'assets/js/console.js',
            'assets/js/cookies.js',
            'assets/js/cursor.js',
            'assets/js/cw.js',
            'assets/js/cw.utils.js',
            'assets/js/downfall.js',
            'assets/js/exploit.js',
            'assets/js/gary.js',
            'assets/js/hacker.js',
            'assets/js/localinfo.js',
            'assets/js/minecraft.js',
            'assets/js/night.js',
            'assets/js/noskid.js',
            'assets/js/pong.js',
            'assets/js/rick.js',
            'assets/js/terminal.js',
            'assets/js/track.js',
            'assets/js/url.js',
            'assets/js/warning.js',
            'assets/js/zkeys.js',
        ];
        this.loadedCount = 0;
        
        this.pendingHashFunction = null;
        this.checkHashFunction();
    }
    
    checkHashFunction() {
        const hash = window.location.hash;
        
        if (hash && hash.length > 1) {
            const functionName = hash.substring(1);
            log(`Func found in url: ${functionName}`, 'info');
            
            this.pendingHashFunction = functionName;
        }
    }
    
    executeHashFunction() {
        if (!this.pendingHashFunction) return;
        
        const functionName = this.pendingHashFunction;
        
        try {
            const event = {
                preventDefault: function() {
                    this.defaultPrevented = true;
                },
                defaultPrevented: false,
                type: 'hashFunction',
                target: document
            };
            
            let functionToCall;
            
            if (typeof window[functionName] === 'function') {
                functionToCall = window[functionName];
            } 
            // its dangerous, but who cares
            else {
                try {
                    functionToCall = eval(functionName);
                } catch (evalError) {
                    log(`Cannot find: ${functionName}`, 'error');
                    return;
                }
            }
            
            if (typeof functionToCall === 'function') {
                functionToCall(event);
            } else {
                log(`${functionName} is not a function`, 'error');
            }
        } catch (error) {
            log(`Erreur lors de l'exécution de la fonction ${functionName}: ${error.message}`, 'error');
            console.error(error);
        }
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
        
        if (this.pendingHashFunction) {
            log(`Executing: ${this.pendingHashFunction}`, 'warning');
            this.executeHashFunction();
        }
        
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
    
    window.addEventListener('hashchange', () => {
        loader.checkHashFunction();
        if (loader.loadedCount === loader.scripts.length) {
            loader.executeHashFunction();
        }
    });
});