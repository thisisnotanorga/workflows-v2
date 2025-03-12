//Night.js | Toggle night sky (Shift + N)

let isNightSky = false;
let stars = [];
let shootingStars = [];
let starsContainer = null;

function createStar() {
  const star = document.createElement('div');
  star.className = 'star';
  const size = Math.random() * 2 + 1;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.setProperty('--twinkle-duration', `${Math.random() * 3 + 2}s`);
  return star;
}

function createShootingStar() {
  const container = document.createElement('div');
  container.className = 'shooting-star';

  const dot = document.createElement('div');
  dot.className = 'shooting-star-dot';

  const trail = document.createElement('div');
  trail.className = 'shooting-star-trail';

  container.appendChild(trail);
  container.appendChild(dot);

  const startX = Math.random() * window.innerWidth;
  const startY = -20;
  container.style.left = `${startX}px`;
  container.style.top = `${startY}px`;

  const angle = Math.PI / 4 + (Math.random() - 0.5) * (Math.PI / 6);
  
  const distance = Math.max(window.innerWidth, window.innerHeight) * 1.5;
  const endX = startX + Math.cos(angle) * distance;
  const endY = startY + Math.sin(angle) * distance;

  const duration = Math.random() * 1000 + 1500;
  
  const animation = container.animate([
    { 
      transform: 'translate(0, 0) rotate(' + (angle * 180 / Math.PI) + 'deg)',
      opacity: 1 
    },
    { 
      transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${angle * 180 / Math.PI}deg)`,
      opacity: 0 
    }
  ], {
    duration: duration,
    easing: 'linear'
  });

  animation.onfinish = () => {
    container.remove();
    const index = shootingStars.indexOf(container);
    if (index > -1) {
      shootingStars.splice(index, 1);
    }
    if (isNightSky) {
      setTimeout(addShootingStar, Math.random() * 3000);
    }
  };

  return container;
}

function addShootingStar() {
  if (!isNightSky || !starsContainer) return;
  
  const star = createShootingStar();
  starsContainer.appendChild(star);
  shootingStars.push(star);
}

function updateStarPositions() {
  stars.forEach(star => {
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
  });
}

function toggleNightMode() {
  isNightSky = !isNightSky;
  
  if (isNightSky) {
    document.body.classList.add('night-sky');
    
    starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    document.body.appendChild(starsContainer);
    
    for (let i = 0; i < 150; i++) {
      const star = createStar();
      starsContainer.appendChild(star);
      stars.push(star);
    }
    
    for (let i = 0; i < 2; i++) {
      setTimeout(addShootingStar, i * 2000);
    }
    
    window.addEventListener('resize', updateStarPositions);
    
  } else {
    document.body.classList.remove('night-sky');
    
    if (starsContainer) {
      starsContainer.remove();
      starsContainer = null;
    }
    stars = [];
    shootingStars = [];
    
    window.removeEventListener('resize', updateStarPositions);
  }

  log('Night sky toggled!', 'success');
}

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (starsContainer) {
      updateStarPositions();
    }
  }, 150);
});


toggleNightMode();