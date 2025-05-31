//Update.js | Check for updates and notify the user

function showUpdateNotification(version) {
    const existing = document.getElementById('notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    notification.innerHTML = `Noskid updated to version <strong>${version}</strong>`;

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
            localStorage.lastest = latestVersion;
            showUpdateNotification(latestVersion);
        } else {
            log(`We are up to date ! (${latestVersion})`, 'success');
        }

    } catch (error) {
        log(`Error while checking for updates: ${error}`, 'error');
    }
}

checkForUpdates();