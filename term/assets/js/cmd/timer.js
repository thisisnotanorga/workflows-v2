// timer.js

function timer(duration) {
    var term = this;

    function formatTime(remainingSeconds) {
        var hours = Math.floor(remainingSeconds / 3600);
        var minutes = Math.floor((remainingSeconds % 3600) / 60);
        var seconds = remainingSeconds % 60;

        return (
            (hours > 0 ? hours + 'h ' : '') +
            (minutes > 0 ? minutes + 'm ' : '') +
            (seconds > 0 ? seconds + 's' : '')
        );
    }

    var totalSeconds = 0;
    if (duration.endsWith('s')) {
        totalSeconds = parseInt(duration);
    } else if (duration.endsWith('m')) {
        totalSeconds = parseInt(duration) * 60;
    } else if (duration.endsWith('h')) {
        totalSeconds = parseInt(duration) * 3600;
    }

    if (!isNaN(totalSeconds)) {
        term.echo(`Timer started for ${formatTime(totalSeconds)}`);

        var interval = setInterval(function () {
            totalSeconds--;

            if (totalSeconds <= 0) {
                clearInterval(interval);
                term.echo('Timer completed!');
                ala();
            } else {
                term.echo(`Time remaining: ${formatTime(totalSeconds)}`);
            }
        }, 1000);
    } else {
        term.error('Invalid duration. Please use "s", "m", or "h".');
    }

    function ala() {
        var audio = new Audio('./assets/audio/xp_installing.mp3');
        audio.play();
    }
}
