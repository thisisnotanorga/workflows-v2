//Update.js | Check for updates and notify the user

function spawnUpdate(version) {
    const updatewin = ClassicWindow.createWindow({
        title: 'Update Available',
        width: 400,
        height: 250,
        content: cs(`<p>A new version of noskid is available: <bold>${version}</bold></p>
                  <p>If you don't update, your user experience may be decreased. :]</p>

                  <button id="download-update" class="btn btn-primary">Update Noskid</button>`),
        theme: 'dark',
        x: Math.round((window.innerWidth - 400) / 2),
        y: Math.round((window.innerHeight - 250) / 2)
    });

    setTimeout(() => {
        const btn = document.getElementById('download-update');

        log('Updating resources...', 'warning');
        if (btn) {
            btn.addEventListener('click', () => {
                forceReloadResources(version);
            });
        }
    }, 0);
}

function forceReloadResources(version) {

    localStorage.lastest = version;

    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.href.split('?')[0];
        link.href = `${href}?v=${Date.now()}`;
    });

    document.querySelectorAll('script[src]').forEach(oldScript => {
        const src = oldScript.src.split('?')[0];
        const newScript = document.createElement('script');
        newScript.src = `${src}?v=${Date.now()}`;
        newScript.async = oldScript.async;
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });

    if ('caches' in window) {
        caches.keys().then(names => {
            for (let name of names) caches.delete(name);
        });
    }

    setTimeout(() => {
        window.location.reload();
    }, 1000);
}


function showUpdateNotification(version) {
    const existing = document.getElementById('notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    notification.textContent = 'New update available - Click to see more.';

    notification.addEventListener('click', () => {
        spawnUpdate(version);
        hideNotification();
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

async function checkForUpdates() {
    try {
        const storedVersion = localStorage.lastest || localStorage?.getItem?.('lastest');

        const response = await fetch('/api/lastest');

        if (!response.ok) {
            log(`Error while checking for updates: ${response.statusText}`, 'error');
            return;
        }

        const latestVersion = await response.text();

        if (storedVersion === undefined || storedVersion === null || storedVersion === '') {
            localStorage.lastest = latestVersion;
            log(`Initialized version to ${latestVersion}`, 'success');
        } else if (storedVersion !== latestVersion) {
            log('New version: ' + latestVersion, 'warning');
            showUpdateNotification(latestVersion);
        } else {
            log(`We are up to date ! (${latestVersion})`, 'success');
        }

    } catch (error) {
        log(`Error while checking for updates: ${error}`, 'error');
    }
}

checkForUpdates();