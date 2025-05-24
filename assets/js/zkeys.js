// zKeys.js | Check if any keybind / key sequences has been done

const keyBindings = [
    {
        keys: ['Shift', 'Escape'],
        action: toggleConsole,
        description: 'Shows the debug console'
    },
    {
        keys: ['Shift', 'R'],
        action: toggleRick,
        description: 'Toggle RickRoll feature'
    },
    {
        keys: ['Shift', 'H'],
        action: help,
        description: 'Show this message'
    },
    {
        keys: ['Control', 'Shift', 'I'],
        action: toggleHacker,
        description: 'Are you hacking ?'
    },
    {
        keys: ['Shift', 'S'],
        action: showStats,
        description: 'Log the website stats in the console'
    },
    {
        keys: ['Shift', 'N'],
        action: toggleNightMode,
        description: 'Toggle night sky'
    },
    {
        keys: ['Shift', 'C'],
        action: verifyCertificate,
        description: 'Check a certificate status'
    },
    {
        keys: ['Shift', 'E'],
        action: showFakeExploitScreen,
        description: 'Runs the best exploit ever created'
    },
    {
        keys: ['Shift', 'B'],
        action: spawnBrowser,
        description: 'Search inside of noskid !'
    },
    {
        keys: ['Shift', 'T'],
        action: spawnCommentSystem,
        description: 'Tell us what you think about noskid !'
    }
];

const sequences = {
    'term': {
        action: openTerminal,
        description: 'Open the terminal'
    },
    'minecraft': {
        action: launchEaglercraft,
        description: 'Launch Eaglercraft'
    },
    'awesome': {
        action: toggleAwesome,
        description: 'Toggle the awesome feature'
    },
    'ddos': {
        action: toggleHacker,
        description: 'Activate hacker mode'
    },
    'nmap': {
        action: toggleHacker,
        description: 'Activate hacker mode'
    },
    'botnet': {
        action: toggleHacker,
        description: 'Activate hacker mode'
    },
    'hack': {
        action: toggleHacker,
        description: 'Activate hacker mode'
    },
    'boom': {
        action: toggleBoom,
        description: 'Activate boom mode'
    },
    'dos': {
        action: toggleBoom,
        description: 'Activate boom mode'
    },
    'skid': {
        action: toggleBoom,
        description: 'Activate boom mode'
    },
    'downfall': {
        action: makeElementsFall,
        description: 'Makes all the elements of the website fall down'
    },
    'upfall': {
        action: resetPage,
        description: 'Makes all the elements of the website come back'
    },
    'check': {
        action: verifyCertificate,
        description: 'Check if a certificate is valid and get informations about it'
    },
    'gary': {
        action: showGary,
        description: 'Shows gary (a cat)'
    },
    'pong': {
        action: pongGame,
        description: 'Play pong !'
    },
    'again': {
        action: againAndAgain,
        description: 'A new noskid window, but why?'
    },
    'bypass': {
        action: redoQuiz,
        description: 'Bypass quiz error message to redo it'
    },
    'cool': {
        action: spawnCool,
        description: 'shows a cool thing'
    }
};

let currentSequence = '';

function checkKeyCombination(event) {
    const activeElement = document.activeElement;
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
        return;
    }

    const keysPressed = [];

    if (event.shiftKey) keysPressed.push('Shift');
    if (event.ctrlKey) keysPressed.push('Control');
    if (event.altKey) keysPressed.push('Alt');
    keysPressed.push(event.key);

    keyBindings.forEach(binding => {
        if (binding.keys.every(key => keysPressed.includes(key))) {
            log(`Combo detected: ${binding.keys.join(' + ')}`);
            binding.action(event);
            return;
        }
    });

    currentSequence += event.key;

    for (const sequence in sequences) {
        if (currentSequence.includes(sequence)) {
            log(`Sequence detected: ${sequence}`);
            sequences[sequence].action(event);
            currentSequence = '';
            break; 
        }
    }
}

document.addEventListener('keydown', checkKeyCombination);

function help() {
    log("", 'warning');
    log("=-=-= Combos =-=-=", 'warning');
    
    const sortedCombos = [...keyBindings].sort((a, b) => {
        const aKeys = a.keys.join(' + ');
        const bKeys = b.keys.join(' + ');
        return aKeys.localeCompare(bKeys);
    });
    
    sortedCombos.forEach(binding => {
        log(`Combo: ${binding.keys.join(' + ')}: ${binding.description}`, 'warning');
    });

    log("=-=-= Sequences =-=-=", 'warning');
    
    const sortedSequences = Object.keys(sequences).sort();
    
    sortedSequences.forEach(sequence => {
        log(`Sequence: '${sequence}': ${sequences[sequence].description}`, 'warning');
    });
    
    log("", 'warning');
}

help();
