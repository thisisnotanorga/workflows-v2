//Badapl.js | Logs bad apple in the dev console on screen size change (prob cuz we went in the console)

async function playBadApl(event) {
    event.preventDefault();
  try {
    const response = await fetch( 'assets/vids/ba.tmov');
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
      .map(frame => {
        return frame.replace(/^\n+|\n+$/g, '');
      });
    
    log(`Loaded BadAPL ascii: ${validFrames.length} frames`, 'success');
    log(`Duration: ${metadata.playback.totalDurationMs / 1000}s`, 'success');
    log(`FPS: ${metadata.ascii.fps}`, 'success');
    
    const frameDuration = metadata.playback.frameDuration || (1000 / metadata.ascii.fps);
    
    let currentFrame = 0;
    let startTime = Date.now();
    
    function displayFrame() {
      if (currentFrame >= validFrames.length) {
        log('BadApl console playback finished', 'success');
        return;
      }
      
      console.clear();
      console.log(`Frame ${currentFrame + 1}/${validFrames.length}`);
      console.log(`Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      console.log('');
      
      const frameContent = validFrames[currentFrame];
      
      console.log(frameContent);
      
      currentFrame++;
    }

    const audio = new Audio('assets/audio/ba.mp3');
    audio.play().catch(err => log('Audio playback failed: ' + err, 'error'));

    
    displayFrame();
    
    const playbackInterval = setInterval(() => {
      displayFrame();
      
      if (currentFrame >= validFrames.length) {
        clearInterval(playbackInterval);
      }
    }, frameDuration);
    
    return {
      stop: () => {
        clearInterval(playbackInterval);
        log('Console BadApl Stopped', 'success');
      },
      metadata: metadata,
      totalFrames: validFrames.length
    };
    
  } catch (error) {
    error('Error playing badapl ascii: ' + error, 'error');
    return null;
  }
}

window.addEventListener('resize', (event) => {
    playBadApl(event);
});