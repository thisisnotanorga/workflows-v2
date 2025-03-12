//Rick.js | Set a rickroll in bg

let videoElement;

function toggleRick() {
    try {
        if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.src = "assets/vids/rick.mp4";
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.style.position = 'fixed';
        videoElement.style.top = 0;
        videoElement.style.left = 0;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100vw';
        videoElement.style.height = '100vh';
        videoElement.style.objectFit = 'cover';
        videoElement.style.zIndex = -1;

        document.body.appendChild(videoElement);
        } else {
            document.body.removeChild(videoElement);
            videoElement = null;
        }
        log('Rick bg toggled!', 'success');

    } catch (err) {
        log(`Failed to toggle rick bg: ${err}`, 'error');

    }
    
}
