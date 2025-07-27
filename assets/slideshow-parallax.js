document.addEventListener('DOMContentLoaded', function() {
  const heroImages = document.querySelectorAll('#shopify-section-slideshow_DnXFPR .slideshow__media img');
  if (heroImages.length === 0) return;
  
  function parallax() {
    const scrollY = window.scrollY || window.pageYOffset;
    const parallaxSpeed = 0.3;
    
    heroImages.forEach(function(img) {
      img.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
    });
  }
  
  // Throttle scroll events for better performance
  let ticking = false;
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(parallax);
      ticking = true;
    }
  }
  
  function onScroll() {
    ticking = false;
    requestTick();
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
}); 