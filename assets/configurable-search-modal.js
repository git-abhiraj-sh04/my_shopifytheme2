// Simple Configurable Search Modal JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const searchModals = document.querySelectorAll('.configurable-search-modal');
  
  searchModals.forEach(modal => {
    const details = modal.querySelector('details');
    const input = modal.querySelector('.search__input');
    const popularItems = modal.querySelectorAll('.configurable-search-popular__item');
    
    // Auto-focus input when modal opens
    if (details && input) {
      details.addEventListener('toggle', function() {
        if (details.open) {
          setTimeout(() => {
            input.focus();
          }, 150);
        }
      });
    }
    
    // Track popular search clicks
    popularItems.forEach(item => {
      item.addEventListener('click', function() {
        const searchTerm = this.querySelector('.configurable-search-popular__text').textContent.trim();
        console.log('Popular search clicked:', searchTerm);
        
        // Store in recent searches if localStorage is available
        if (typeof(Storage) !== "undefined") {
          let recentSearches = JSON.parse(localStorage.getItem('recent-searches') || '[]');
          recentSearches = recentSearches.filter(term => term !== searchTerm);
          recentSearches.unshift(searchTerm);
          recentSearches = recentSearches.slice(0, 8);
          localStorage.setItem('recent-searches', JSON.stringify(recentSearches));
        }
      });
    });
  });
});

// Re-initialize on section reload (for theme editor)
document.addEventListener('shopify:section:load', function(e) {
  const modal = e.target.querySelector('.configurable-search-modal');
  if (modal) {
    // Re-run initialization for this modal
    console.log('Configurable search modal section reloaded');
  }
});