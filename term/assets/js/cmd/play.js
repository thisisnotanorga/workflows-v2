// play.js

function play(url) {
    var term = this;

    var audio = new Audio(url);
    var isPlaying = false;
    var progressInterval;

    term.push(function (command) {
        if (command === 'pause') {
            pauseMusic();
        } else if (command === 'resume') {
            resumeMusic();
        } else if (command === 'stop') {
            stopMusic();
        }
    }, {
        prompt: 'Audio Control > ',
        completion: ['pause', 'resume', 'stop'],
    });

    function updateProgressBar() {
        var duration = audio.duration;
        var currentTime = audio.currentTime;

        if (!isNaN(duration)) {
            var progress = (currentTime / duration) * 100;
            term.set_prompt(`Audio Control [${formatTime(currentTime)} / ${formatTime(duration)}] > `);
            term.progressBar(progress);
        }
    }

    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${pad(minutes)}:${pad(seconds)}`;
    }

    function pad(value) {
        return value < 10 ? '0' + value : value;
    }

    function pauseMusic() {
        audio.pause();
        clearInterval(progressInterval);
        term.echo('Music paused.');
    }

    function resumeMusic() {
        audio.play();
        progressInterval = setInterval(updateProgressBar, 500);
        term.echo('Music resumed.');
    }

    function stopMusic() {
        audio.pause();
        audio.currentTime = 0;
        clearInterval(progressInterval);
        term.set_prompt('> ');
        term.error('Music stopped.');
        term.pop();
    }

    audio.addEventListener('ended', function () {
        clearInterval(progressInterval);
        term.set_prompt('C:\\term> ');
        term.error('Music finished.');
        term.pop();
    });

    audio.addEventListener('loadeddata', function () {
        term.echo(`Now playing: ${url}`);
        term.echo('Type "pause", "resume", or "stop" to control the music.');
        isPlaying = true;
        progressInterval = setInterval(updateProgressBar, 500);
        audio.play();
    });

    audio.addEventListener('error', function () {
        term.error('Error loading the audio file.');
        term.pop();
    });

    if (!isPlaying) {
        term.echo('Loading audio...');
        audio.load();
    }
}
