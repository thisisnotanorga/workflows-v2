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
    'cheat': {
        action: autoCompleteQuiz,
        description: 'Automatically complete the quiz'
    },
    'downfall': {
        action: makeElementsFall,
        description: 'Makes all the elements of the website fall down'
    },
    'upfall': {
        action: resetPage,
        description: 'Makes all the elements of the website come back'
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
    keyBindings.forEach(binding => {
        log(`Combo: ${binding.keys.join(' + ')}: ${binding.description}`, 'warning');
    });

    log("=-=-= Sequences =-=-=", 'warning');
    for (const sequence in sequences) {
        log(`Sequence: '${sequence}': ${sequences[sequence].description}`, 'warning');
    }
    log("", 'warning');
}

help();
