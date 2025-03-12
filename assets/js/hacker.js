//Hacker.js | Shows you when you are 'hacking' someone

let hackElement;

function toggleHacker(event) {
    event.preventDefault();
    try {
        if (!hackElement) {
        hackElement = document.createElement('video');
        hackElement.src = "assets/vids/hacker.mp4";
        hackElement.loop = true;
        hackElement.muted = true;
        hackElement.autoplay = true;
        hackElement.style.position = 'fixed';
        hackElement.style.top = 0;
        hackElement.style.left = 0;
        hackElement.style.width = '100%';
        hackElement.style.height = '100%';
        hackElement.style.objectFit = 'cover';
        hackElement.style.width = '100vw';
        hackElement.style.height = '100vh';
        hackElement.style.objectFit = 'cover';
        hackElement.style.zIndex = -1;

        document.body.appendChild(hackElement);
        } else {
            document.body.removeChild(hackElement);
            hackElement = null;
        }
        log('Hacker bg toggled!', 'success');

    } catch (err) {
        log(`Failed to toggle hacker bg: ${err}`, 'error');

    }
    
}
