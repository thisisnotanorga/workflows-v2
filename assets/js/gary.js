//Gary.js | Shows a random image of gary the cat > suggestion by @Zach11111 on github 

function showGary() {

    const loadingContent = '<div style="text-align:center;color:white">Gary is so BIG that the image takes time to load</div>';

    const win = ClassicWindow.createWindow({
      title: 'Gary the Cat',
      content: loadingContent,
      width: 500,
      height: 400,
      x: Math.round((window.innerWidth - 500) / 2),
      y: Math.round((window.innerHeight - 400) / 2),
      icon: 'assets/img/gary.png',
      statusText: 'Loading gary...'
    });

    fetch('https://api.garythe.cat/gary')
      .then(response => response.json())
      .then(data => {
        const garyImage = document.createElement('img');
        garyImage.src = data.url;
        garyImage.style.maxWidth = '100%';
        garyImage.style.maxHeight = '100%';
        garyImage.style.objectFit = 'contain';
        garyImage.style.display = 'block';
        garyImage.style.margin = 'auto';

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.height = '100%';
        container.appendChild(garyImage);

        ClassicWindow.updateWindowContent(win, container);
        ClassicWindow.updateStatusText(win, 'Gary is here!');
        log('Gary is here !', 'success');
      })
      .catch(error => {
        ClassicWindow.updateWindowContent(win, '<div style="color:red;text-align:center">Failed to load Gary :(</div>');
        ClassicWindow.updateStatusText(win, 'Error: ' + error.message);
        log('Gary ?... : ' + error.message, 'error');
      });
  }
