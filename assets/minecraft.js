//Minecraft.js | Launches an eaglercraft 1.5.2 instance

function launchEaglercraft() {

    var mcWindow = window.open('term/assets/html/eaglercraft/launch.html', 'newWindow', 'width=800,height=400');
        
        
    if (!mcWindow) {
        log('EaglerCraft opening was blocked by the browser', 'error');
    } else {
        log('EaglerCraft launched successfully', 'success');

    }

}
