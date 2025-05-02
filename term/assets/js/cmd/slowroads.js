// sr.js

function sr() {
    var term = this;

    term.echo('Here is it!');

    setTimeout(function () {
        var doomWindow = window.open('https://slowroads.io', '_blank', 'width=800,height=600');
        
        
        if (!doomWindow) {
            term.error('Failed to open Slowroads. Please allow pop-ups for this site.');
            var audio = new Audio("./assets/audio/Pop-upBlocked.mp3");
            audio.play();
        }
    }, 1);
}
