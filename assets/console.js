//Console.js | Toggle debug console
const consoleButton = document.getElementById('console-btn');

function toggleConsole(event) {
    event.preventDefault();
    try {
        
        const consoleContainer = document.getElementById("console-container");
        const wholeSite = document.getElementById("wholesite");

        if (consoleContainer.style.display === "none" || consoleContainer.style.display === "") {
            consoleContainer.style.display = "flex";
            wholeSite.style.display = "none";
            setTimeout(() => consoleContainer.style.opacity = "1", 10);
        } else {
            consoleContainer.style.opacity = "0";
            setTimeout(() => {
                consoleContainer.style.display = "none";
                wholeSite.style.display = "block";
            }, 300);
        }
        log('Console toggled!', 'success');
    } catch (e) {
        log('Error while loading console: ' + e, 'error')
    }
}

consoleButton.addEventListener('click', (e) => {
    toggleConsole(e);
});