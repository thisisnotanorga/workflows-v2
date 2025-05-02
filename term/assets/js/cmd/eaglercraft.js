// ec.js

function eaglercraft() {
    var term = this;

    term.echo('Launching EaglerCraft...');

    setTimeout(function () {
        var doomWindow = window.open('./assets/html/eaglercraft/launch.html', '_blank', 'width=800,height=600');
        
        
        if (!doomWindow) {
            term.error('Failed to open EaglerCraft. Please allow pop-ups for this site.');
            var audio = new Audio("./assets/audio/Pop-upBlocked.mp3");
            audio.play();
        }
    }, 3000);
}
