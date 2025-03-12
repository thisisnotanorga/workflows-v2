//Awesome.js | Same thing as youtube' awesome easteregg

let intervalId = null;

function getRandomColor() {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    return randomColor;
}

function toggleAwesome() {
    try {
        const strikeElement = document.getElementById('strike');
        const links = [document.getElementById('footer-link1'), document.getElementById('footer-link2')];

        if (intervalId) {
            clearInterval(intervalId);
            strikeElement.style.textDecorationColor = '#ff6666';
            links.forEach(link => {
                link.style.color = '#ff6666';
            });

            log('Awesome toggled!', 'success');
            intervalId = null;
            return;
        }

        log('Awesome toggled!', 'success');

        intervalId = setInterval(() => {
            const color = getRandomColor();
            strikeElement.style.textDecorationColor = color;
            links.forEach(link => {
                link.style.color = color;
            });
        }, 50);
    } catch (err) {
        log(`Failed to toggle awesome: ${err}`, 'error');
    }
}
