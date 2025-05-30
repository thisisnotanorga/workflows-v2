// Downfall.js | makes fall all the website elements cuz why not

let animationInProgress = false;
let revealedImage = null;

function makeElementsFall() {
    let imageUrl = "/assets/img/tusc.png";
    if (animationInProgress) return;
    animationInProgress = true;
    
    const elements = Array.from(document.body.querySelectorAll('*')).filter(el => {
        if (el === revealedImage) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el !== document.body;
    });
    
    elements.forEach(el => {
        el.dataset.originalPosition = el.style.position || '';
        el.dataset.originalTop = el.style.top || '';
        el.dataset.originalLeft = el.style.left || '';
        el.dataset.originalZIndex = el.style.zIndex || '';
        
        const rect = el.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.top = rect.top + 'px';
        el.style.left = rect.left + 'px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.zIndex = 1000;
        el.style.transition = 'all 0s';
    });
    
    if (!revealedImage) {
        revealedImage = document.createElement('img');
        revealedImage.src = imageUrl;
        revealedImage.style.position = 'fixed';
        revealedImage.style.top = 0;
        revealedImage.style.left = 0;
        revealedImage.style.width = '100vw';
        revealedImage.style.height = '100vh';
        revealedImage.style.objectFit = 'cover';
        revealedImage.style.zIndex = 0;
        revealedImage.style.opacity = 0;
        document.body.appendChild(revealedImage);
    }
    
    setTimeout(() => {
        elements.forEach((el, index) => {
            const delay = Math.random() * 800;
            const duration = 1000 + Math.random() * 1500;
            const randomX = Math.random() * 200 - 100;
            
            setTimeout(() => {
                el.style.transition = `all ${duration / 1000}s cubic-bezier(0.55, 0.085, 0.68, 0.53)`;
                el.style.transform = `rotate(${Math.random() * 360}deg)`;
                el.style.top = `${window.innerHeight + 100}px`;
                el.style.left = `${parseFloat(el.style.left) + randomX}px`;
                el.style.opacity = 0;
            }, delay);
        });
        
        setTimeout(() => {
            revealedImage.style.transition = 'opacity 1.5s ease-in';
            revealedImage.style.opacity = 1;
            
            if (typeof log === 'function') {
                log('All elements are gone <3', 'success');
            }
        }, 1500);
    }, 100);
}

function resetPage() {
    if (!animationInProgress) return;
    
    const elements = Array.from(document.body.querySelectorAll('*')).filter(el => {
        return el.dataset.originalPosition !== undefined;
    });
    
    elements.forEach(el => {
        el.style.position = el.dataset.originalPosition;
        el.style.top = el.dataset.originalTop;
        el.style.left = el.dataset.originalLeft;
        el.style.zIndex = el.dataset.originalZIndex;
        el.style.transform = '';
        el.style.opacity = '';
        el.style.transition = '';
        
        delete el.dataset.originalPosition;
        delete el.dataset.originalTop;
        delete el.dataset.originalLeft;
        delete el.dataset.originalZIndex;
    });
    
    if (revealedImage && revealedImage.parentNode) {
        revealedImage.parentNode.removeChild(revealedImage);
        revealedImage = null;
    }
    
    animationInProgress = false;
    
    if (typeof log === 'function') {
        log('all el are back, sadly :[', 'success');
    }
}
