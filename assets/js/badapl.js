//Badapl.js | Logs bad apple in the dev console on screen size change (prob cuz we went in the console)
async function playBadApl(event) {
  event.preventDefault();

  try {
    const response = await fetch('assets/vids/ba.tmov');
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const content = await response.text();
    const jsonEndIndex = content.indexOf('\n#=');
    const jsonString = content.substring(0, jsonEndIndex);
    const metadata = JSON.parse(jsonString);
    const framesContent = content.substring(jsonEndIndex + 1);

    const frames = framesContent.split(metadata.ascii.frameDelimiter || '!$$!');
    const validFrames = frames
      .filter(frame => frame.length > 0)
      .map(frame => frame.replace(/^\n+|\n+$/g, ''));

    log(`Loaded BadAPL ascii: ${validFrames.length} frames`, 'success');
    log(`Duration: ${metadata.playback.totalDurationMs / 1000}s`, 'success');
    log(`FPS: ${metadata.ascii.fps}`, 'success');

    console.clear();
    console.log('%c⚠️ EPILEPSY WARNING ⚠️', 'color: red; font-size: 24px; font-weight: bold;');
    console.log('%cThis animation contains rapidly flashing images', 'color: orange; font-size: 16px;');
    console.log('%cIf you have epilepsy or are sensitive to flashing lights,', 'color: orange; font-size: 16px;');
    console.log('%cplease close this console now.', 'color: orange; font-size: 16px;');
    console.log('%cAnimation will start in 5 seconds...', 'color: yellow; font-size: 14px;');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    const frameDuration = metadata.playback.frameDuration || (1000 / metadata.ascii.fps);
    const audio = new Audio('assets/audio/ba.mp3');

    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', () => reject('Audio failed to load'), { once: true });
    });

    let currentFrame = 0;
    let startTime = null;
    let playbackInterval = null;

    function displayFrame() {
      if (currentFrame >= validFrames.length) {
        log('BadApl console playback finished', 'success');
        if (playbackInterval) clearInterval(playbackInterval);
        return;
      }

      console.clear();
      console.log(`Frame ${currentFrame + 1}/${validFrames.length}`);
      console.log(`Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      console.log('Github -> github.com/douxxtech/noskid.today');
      console.log('Contact -> douxx@douxx.tech');
      console.log('');
      console.log(validFrames[currentFrame]);
      currentFrame++;
    }

    await new Promise((resolve, reject) => {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setTimeout(resolve, 100);
          })
          .catch(err => {
            log('Audio playback failed: ' + err, 'error');
            resolve();
          });
      } else {
        setTimeout(resolve, 200);
      }
    });

    startTime = Date.now();
    displayFrame();

    playbackInterval = setInterval(() => {
      displayFrame();
    }, frameDuration);

    return {
      stop: () => {
        if (playbackInterval) clearInterval(playbackInterval);
        audio.pause();
        audio.currentTime = 0;
        log('Console BadApl Stopped', 'success');
      },
      metadata: metadata,
      totalFrames: validFrames.length
    };

  } catch (error) {
    console.error('Error playing badapl ascii: ' + error);
    return null;
  }
}

window.addEventListener('resize', (event) => {
    playBadApl(event);
});