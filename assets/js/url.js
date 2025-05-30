//Url.js | Change the URL every 5 seconds with a random message


const messages = [
    'can i have one chezburger please? mm chezburger', // by @danrybir on discord
    'gary', //by @.zach.o on discord
    'mateishomepage technologies', //by @bmpimg on discord
    'fun fact: thevirgindev has never left its cave (me too)', //by @thevirgindev on discord
    'my ip is 127.0.0.1, try to ddos it', //by @ayproductions5051 on discord,
    'localhost:80 ahh website', //by @giosee. on discord
    '99 percent of gotbot gamblers quit before they win big', //by @pingvortex on discord
];

let currentMessage = '';
let showedError = false;

function getRandomMessage() {
    let randomMessage;
    do {
        randomMessage = messages[Math.floor(Math.random() * messages.length)];
    } while (randomMessage === currentMessage && messages.length > 1);
    return randomMessage;
}

function changeUrl(message) {
    if (history.replaceState) {
        message = message.replace(/\s+/g, '-');
        const url = `${window.location.origin}${window.location.pathname}?${message}`;
        history.replaceState(null, '', url);
    } else {
        if (!showedError) {
            log('History API not supported, unable to change URL.', 'error');
            showedError = true;
        }
    }
}

function updateMessage() {
    const message = getRandomMessage();
    currentMessage = message;
    changeUrl(message);
}

updateMessage();

setInterval(updateMessage, 5000);
