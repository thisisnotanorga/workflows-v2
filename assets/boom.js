//Boom.js | Shows a boom

let boomElement;

function toggleBoom() {
    try {
        if (!boomElement) {
        boomElement = document.createElement('video');
        boomElement.src = "assets/vids/boom.mp4";
        boomElement.loop = true;
        boomElement.muted = true;
        boomElement.autoplay = true;
        boomElement.style.position = 'fixed';
        boomElement.style.top = 0;
        boomElement.style.left = 0;
        boomElement.style.width = '100%';
        boomElement.style.height = '100%';
        boomElement.style.objectFit = 'cover';
        boomElement.style.width = '100vw';
        boomElement.style.height = '100vh';
        boomElement.style.objectFit = 'cover';
        boomElement.style.zIndex = -1;

        document.body.appendChild(boomElement);
        } else {
            document.body.removeChild(boomElement);
            boomElement = null;
        }
        log('Boom bg toggled!', 'success');

    } catch (err) {
        log(`Failed to toggle boom bg: ${err}`, 'error');

    }
    
}
