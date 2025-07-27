class TextMarquee {
  constructor(element) {
    this.element = element;
    this.content = element.querySelector('.text-marquee__content');
    this.texts = element.querySelectorAll('.text-marquee__text');
    
    // Get settings from data attributes
    this.speed = parseInt(element.dataset.scrollSpeed) || 30;
    this.direction = element.dataset.scrollDirection || 'right_to_left';
    this.pauseOnHover = element.dataset.pauseOnHover === 'true';
    this.font = element.dataset.font || 'theme_default';
    this.shadowDepth = parseInt(element.dataset.shadowDepth) || 0;
    this.textTransform = element.dataset.textTransform || 'uppercase';
    
    // State management
    this.isPlaying = true;
    this.isHovered = false;
    this.resizeObserver = null;
    
    this.init();
  }

  init() {
    if (!this.content || this.texts.length === 0) return;
    
    this.setupResponsiveHandling();
    this.setupHoverEffects();
    this.setupAccessibility();
    this.setupVisibilityHandling();
    this.optimizePerformance();
    
    // Initialize text width calculation
    this.calculateTextWidth();
    
    // Start the marquee
    this.play();
  }

  setupResponsiveHandling() {
    // Use ResizeObserver for efficient resize handling
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.debounce(() => {
        this.calculateTextWidth();
        this.adjustSpeed();
      }, 250));
      
      this.resizeObserver.observe(this.element);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', this.debounce(() => {
        this.calculateTextWidth();
        this.adjustSpeed();
      }, 250));
    }
  }

  setupHoverEffects() {
    if (!this.pauseOnHover) return;
    
    this.element.addEventListener('mouseenter', () => {
      this.isHovered = true;
      this.pause();
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.isHovered = false;
      if (this.isPlaying) {
        this.resume();
      }
    });
    
    // Touch device support
    this.element.addEventListener('touchstart', () => {
      this.isHovered = true;
      this.pause();
    });
    
    this.element.addEventListener('touchend', () => {
      this.isHovered = false;
      setTimeout(() => {
        if (this.isPlaying && !this.isHovered) {
          this.resume();
        }
      }, 100);
    });
  }

  setupAccessibility() {
    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.speed = Math.max(this.speed * 3, 60); // Slow down significantly
      this.updateAnimationSpeed();
    }
    
    // Add ARIA labels for screen readers
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('role', 'marquee');
    
    // Keyboard navigation support
    this.element.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.toggle();
      }
    });
    
    // Focus management
    this.element.addEventListener('focus', () => {
      this.pause();
    });
    
    this.element.addEventListener('blur', () => {
      if (this.isPlaying) {
        this.resume();
      }
    });
    
    // Make focusable if it wasn't already
    if (!this.element.hasAttribute('tabindex')) {
      this.element.setAttribute('tabindex', '0');
    }
  }

  setupVisibilityHandling() {
    // Pause when page is not visible (performance optimization)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else if (this.isPlaying && !this.isHovered) {
        this.resume();
      }
    });
    
    // Intersection Observer for performance when element is off-screen
    if (window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (this.isPlaying && !this.isHovered) {
              this.resume();
            }
          } else {
            this.pause();
          }
        });
      }, {
        threshold: 0,
        rootMargin: '50px'
      });
      
      observer.observe(this.element);
    }
  }

  optimizePerformance() {
    // Enable hardware acceleration
    if (this.content) {
      this.content.style.willChange = 'transform';
      this.content.style.transform = 'translateZ(0)';
      this.content.style.backfaceVisibility = 'hidden';
      this.content.style.perspective = '1000px';
    }
    
    // Optimize for smooth animations and effects
    this.texts.forEach(text => {
      text.style.willChange = 'transform, filter';
      text.style.backfaceVisibility = 'hidden';
      
      // Optimize gradient rendering
      if (text.style.background && text.style.background.includes('gradient')) {
        text.style.willChange += ', background-position';
      }
    });
    
    // Preload custom fonts for better performance
    this.preloadFonts();
    
    // Optimize for high DPI displays
    if (window.devicePixelRatio > 1) {
      this.element.style.transform = 'translateZ(0)';
    }
  }

  preloadFonts() {
    if (this.font === 'theme_default') return;
    
    const fontMap = {
      'orbitron': 'Orbitron',
      'exo_2': 'Exo 2',
      'rajdhani': 'Rajdhani',
      'teko': 'Teko',
      'russo_one': 'Russo One',
      'bebas_neue': 'Bebas Neue'
    };
    
    const fontFamily = fontMap[this.font];
    if (fontFamily && 'fonts' in document) {
      // Use Font Loading API if available
      const font = new FontFace(fontFamily, `url(https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;700;800;900&display=swap)`);
      font.load().then(() => {
        document.fonts.add(font);
      }).catch(err => {
        console.warn('Font loading failed:', err);
      });
    }
  }

  calculateTextWidth() {
    if (!this.texts.length) return;
    
    // Get the width of the first text element
    const firstText = this.texts[0];
    if (firstText) {
      this.textWidth = firstText.offsetWidth;
    }
  }

  adjustSpeed() {
    // Adjust speed based on container width for consistent visual speed
    const containerWidth = this.element.offsetWidth;
    const textWidth = this.textWidth || 0;
    
    if (containerWidth && textWidth) {
      // Calculate optimal speed based on text length and container size
      const ratio = textWidth / containerWidth;
      const adjustedSpeed = Math.max(this.speed * ratio, 10);
      
      this.updateAnimationSpeed(adjustedSpeed);
    }
  }

  updateAnimationSpeed(customSpeed = null) {
    const speed = customSpeed || this.speed;
    this.element.style.setProperty('--marquee-speed', `${speed}s`);
  }

  play() {
    this.isPlaying = true;
    this.resume();
  }

  pause() {
    if (this.content) {
      this.content.style.animationPlayState = 'paused';
    }
  }

  resume() {
    if (this.content && this.isPlaying) {
      this.content.style.animationPlayState = 'running';
    }
  }

  stop() {
    this.isPlaying = false;
    this.pause();
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  updateSpeed(newSpeed) {
    this.speed = newSpeed;
    this.updateAnimationSpeed();
  }

  updateDirection(newDirection) {
    this.direction = newDirection;
    const animationDirection = newDirection === 'right_to_left' ? 'reverse' : 'normal';
    this.element.style.setProperty('--marquee-direction', animationDirection);
  }

  updateText(newText, separator = ' • ') {
    if (!newText) return;
    
    // Create repeated text for seamless scrolling
    let repeatedText = '';
    for (let i = 0; i < 10; i++) {
      repeatedText += newText + separator;
    }
    
    this.texts.forEach(text => {
      text.textContent = repeatedText;
    });
    
    // Recalculate dimensions
    setTimeout(() => {
      this.calculateTextWidth();
      this.adjustSpeed();
    }, 100);
  }

  // Utility function for debouncing
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Clean up method
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Clean up styles
    if (this.content) {
      this.content.style.willChange = 'auto';
    }
    
    this.texts.forEach(text => {
      text.style.willChange = 'auto';
    });
  }
}

// Auto-initialize marquees when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const marquees = document.querySelectorAll('.text-marquee');
  
  marquees.forEach(marquee => {
    new TextMarquee(marquee);
  });
});

// Re-initialize on section reload (for theme editor)
document.addEventListener('shopify:section:load', (e) => {
  const marquee = e.target.querySelector('.text-marquee');
  if (marquee) {
    new TextMarquee(marquee);
  }
});

// Handle dynamic section updates in theme editor
document.addEventListener('shopify:section:reorder', () => {
  // Re-initialize all marquees after reordering
  setTimeout(() => {
    const marquees = document.querySelectorAll('.text-marquee');
    marquees.forEach(marquee => {
      if (!marquee.marqueeInstance) {
        new TextMarquee(marquee);
      }
    });
  }, 100);
});

// Global emergency stop for accessibility (can be triggered by other scripts)
window.stopAllMarquees = function() {
  const marquees = document.querySelectorAll('.text-marquee');
  marquees.forEach(marquee => {
    marquee.classList.add('motion-stop');
  });
};

window.startAllMarquees = function() {
  const marquees = document.querySelectorAll('.text-marquee');
  marquees.forEach(marquee => {
    marquee.classList.remove('motion-stop');
  });
};

// Make TextMarquee class globally available
window.TextMarquee = TextMarquee;