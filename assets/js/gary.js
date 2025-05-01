function toggleGary() {
    log('toggleGary function called');

    let garyEl = document.getElementById('garyFullscreen');

    if (garyEl) {
        log('Removing existing Gary element');
        document.body.removeChild(garyEl); // NOOOO GARY
        return;
    }

    log('Creating new Gary element');
    garyEl = document.createElement('div');
    garyEl.id = 'garyFullscreen';
    garyEl.style.position = 'fixed';
    garyEl.style.top = '0';
    garyEl.style.left = '0';
    garyEl.style.width = '100%';
    garyEl.style.height = '100%';
    garyEl.style.backgroundColor = 'black';
    garyEl.style.zIndex = '9999';
    garyEl.style.display = 'flex';
    garyEl.style.justifyContent = 'center';
    garyEl.style.alignItems = 'center'; // i love creating css in javascript

    const garyImage = document.createElement('img');
    garyImage.style.maxWidth = '100%';
    garyImage.style.maxHeight = '100%';
    garyImage.style.objectFit = 'contain';

    const loadingText = document.createElement('div');
    loadingText.textContent = 'gary is so BIG that the image takes time to load';
    loadingText.style.color = 'white';
    loadingText.style.fontSize = '24px';
    garyEl.appendChild(loadingText);

    document.body.appendChild(garyEl); // a new gary is born
    log('Gary element added to the body');

    document.addEventListener('fullscreenchange', handleFullscreenExit); //when we exit full screen
    document.addEventListener('webkitfullscreenchange', handleFullscreenExit);
    document.addEventListener('mozfullscreenchange', handleFullscreenExit); //fuck firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenExit); //fuck ms

    function handleFullscreenExit() {
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            if (document.getElementById('garyFullscreen')) {
                log('Exiting fullscreen, removing Gary element');
                document.body.removeChild(document.getElementById('garyFullscreen')); // /kill gary childs
            }

            document.removeEventListener('fullscreenchange', handleFullscreenExit);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenExit);
            document.removeEventListener('mozfullscreenchange', handleFullscreenExit);
            document.removeEventListener('MSFullscreenChange', handleFullscreenExit);
        }
    }

    fetch('https://api.garythe.cat/gary')
        .then(response => response.json())
        .then(data => {
            log('Gary image fetched successfully');
            garyEl.removeChild(loadingText);
            garyEl.appendChild(garyImage);

            garyImage.src = data.url;

            garyImage.onload = () => {
                log('Gary image loaded, requesting fullscreen');
                if (garyEl.requestFullscreen) {
                    garyEl.requestFullscreen();
                } else if (garyEl.webkitRequestFullscreen) {
                    garyEl.webkitRequestFullscreen();
                } else if (garyEl.mozRequestFullScreen) {
                    garyEl.mozRequestFullScreen();
                } else if (garyEl.msRequestFullscreen) {
                    garyEl.msRequestFullscreen();
                }
            };
        })
        .catch(error => {
            log('Failed to show Gary :(((( : ' + error, 'error');
            if (document.getElementById('garyFullscreen')) {
                document.body.removeChild(document.getElementById('garyFullscreen')); // /kill gary childs
            }
        });
}
