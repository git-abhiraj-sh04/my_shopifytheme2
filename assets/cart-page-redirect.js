// Cart page redirect functionality
// Automatically opens sliding cart and redirects users away from cart page
document.addEventListener('DOMContentLoaded', function() {
  // Only run on cart page
  if (window.location.pathname === '/cart') {
    const slidingCartPanel = document.querySelector('sliding-cart-panel');
    
    if (slidingCartPanel) {
      // Open the sliding cart immediately
      slidingCartPanel.open();
    }
    
    // Redirect to home page after a short delay
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  }
});