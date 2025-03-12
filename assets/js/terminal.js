//Terminal.js | Opens a noskid.lol/term window

function openTerminal() {
    const termWindow = window.open('https://noskid.today/term', 'newWindow', 'width=500,height=300');

    if (termWindow) {
        log('Terminal opened successfully', 'success');
    } else {
        log('Terminal opening was blocked by the browser', 'error');
    }
}