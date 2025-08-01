class SlidingCartPanel extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#SlidingCartPanel-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
    this.initializeTabs();
    this.initializeRecentlyViewed();
    this.setupDynamicStyles();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  initializeTabs() {
    const tabs = this.querySelectorAll('.sliding-cart__tab');
    const tabContents = this.querySelectorAll('.sliding-cart__tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('sliding-cart__tab--active'));
        tabContents.forEach(content => content.classList.remove('sliding-cart__tab-content--active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('sliding-cart__tab--active');
        const targetContent = this.querySelector(`[data-tab-content="${targetTab}"]`);
        if (targetContent) {
          targetContent.classList.add('sliding-cart__tab-content--active');
        }

        // Load recently viewed products if switching to that tab
        if (targetTab === 'recently-viewed') {
          this.loadRecentlyViewed();
        }
      });
    });
  }

  initializeRecentlyViewed() {
    // Track product views
    if (window.location.pathname.includes('/products/')) {
      this.trackProductView();
    }
  }

  trackProductView() {
    const productHandle = window.location.pathname.split('/products/')[1]?.split('/')[0];
    if (!productHandle) return;

    try {
      let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      
      // Remove if already exists to avoid duplicates
      recentlyViewed = recentlyViewed.filter(handle => handle !== productHandle);
      
      // Add to beginning
      recentlyViewed.unshift(productHandle);
      
      // Keep only last 8 products
      recentlyViewed = recentlyViewed.slice(0, 8);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  async loadRecentlyViewed() {
    const container = this.querySelector('#SlidingCart-RecentlyViewed');
    if (!container) return;

    try {
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      
      if (recentlyViewed.length === 0) {
        container.innerHTML = '<p class="sliding-cart__empty-recently-viewed">No recently viewed products</p>';
        return;
      }

      container.innerHTML = '<div class="sliding-cart__loading">Loading...</div>';

      // Fetch product data for recently viewed items
      const productPromises = recentlyViewed.map(handle => 
        fetch(`/products/${handle}.js`)
          .then(response => response.json())
          .catch(() => null)
      );

      const products = await Promise.all(productPromises);
      const validProducts = products.filter(product => product !== null);

      if (validProducts.length === 0) {
        container.innerHTML = '<p class="sliding-cart__empty-recently-viewed">No recently viewed products</p>';
        return;
      }

      container.innerHTML = this.renderRecentlyViewedProducts(validProducts);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
      container.innerHTML = '<p class="sliding-cart__error">Error loading products</p>';
    }
  }

  renderRecentlyViewedProducts(products) {
    return `
      <div class="sliding-cart__recently-viewed-grid">
        ${products.map(product => `
          <div class="sliding-cart__recently-viewed-item">
            <a href="/products/${product.handle}" class="sliding-cart__recently-viewed-link">
              <div class="sliding-cart__recently-viewed-image">
                <img 
                  src="${product.featured_image}" 
                  alt="${product.title}"
                  loading="lazy"
                  width="80"
                  height="80"
                >
              </div>
              <div class="sliding-cart__recently-viewed-details">
                <h4 class="sliding-cart__recently-viewed-title">${product.title}</h4>
                <p class="sliding-cart__recently-viewed-price">${this.formatMoney(product.price)}</p>
              </div>
            </a>
          </div>
        `).join('')}
      </div>
    `;
  }

  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  }

  setupDynamicStyles() {
    const section = document.querySelector('[data-section-type="sliding-cart-panel"]');
    if (!section) return;

    // Get settings from section
    const settings = this.getThemeSettings();
    
    if (settings.animation_duration) {
      document.documentElement.style.setProperty(
        '--sliding-cart-animation-duration', 
        `${settings.animation_duration}ms`
      );
    }

    if (settings.animation_ease) {
      document.documentElement.style.setProperty(
        '--sliding-cart-animation-ease', 
        settings.animation_ease
      );
    }
  }


  getThemeSettings() {
    // This would be populated by Shopify's section settings
    // For now, return defaults
    return {
      animation_duration: 300,
      animation_ease: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    };
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    
    // Apply animation timing from settings
    this.setupDynamicStyles();
    
    setTimeout(() => {
      this.classList.add('animate', 'active');
    }, 10);

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.sliding-cart__inner-empty')
          : this.querySelector('.sliding-cart__inner');
        const focusElement = this.querySelector('.sliding-cart__close') || this.querySelector('.sliding-cart__inner');
        
        if (window.trapFocus && containerToTrapFocusOn && focusElement) {
          trapFocus(containerToTrapFocusOn, focusElement);
        }

        // Auto-scroll to show checkout button after opening
        this.scrollToCheckout();
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');

    // Update cart count in tab
    this.updateCartCount();
  }

  scrollToCheckout() {
    // Ensure checkout button is visible by scrolling the items container
    const itemsContainer = this.querySelector('.sliding-cart__items');
    const checkoutButton = this.querySelector('.sliding-cart__checkout');
    
    if (itemsContainer && checkoutButton) {
      setTimeout(() => {
        // Scroll to bottom to ensure checkout is visible
        itemsContainer.scrollTop = itemsContainer.scrollHeight;
      }, 100);
    }
  }

  close() {
    this.classList.remove('active');
    
    if (window.removeTrapFocus && this.activeElement) {
      removeTrapFocus(this.activeElement);
    }
    
    document.body.classList.remove('overflow-hidden');
  }

  updateCartCount() {
    const cartCountElement = this.querySelector('.sliding-cart__cart-count');
    if (cartCountElement) {
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          cartCountElement.textContent = cart.item_count;
        })
        .catch(error => {
          console.error('Error updating cart count:', error);
        });
    }
  }

  renderContents(parsedState) {
    this.querySelector('.sliding-cart__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#SlidingCartPanel-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'sliding-cart-panel',
        selector: '#SlidingCartPanel',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  // Order Note functionality
  openOrderNote() {
    const modal = this.querySelector('#order-note-modal');
    if (modal) {
      modal.style.display = 'flex';
      const textarea = modal.querySelector('.sliding-cart__order-note-input');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
    }
  }

  saveOrderNote() {
    const modal = this.querySelector('#order-note-modal');
    const textarea = modal.querySelector('.sliding-cart__order-note-input');
    
    if (textarea) {
      const note = textarea.value;
      
      // Save note to cart
      fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: note
        })
      })
      .then(response => response.json())
      .then(() => {
        modal.style.display = 'none';
        // Show success feedback
        this.showNotification('Order note saved successfully!', 'success');
      })
      .catch(error => {
        console.error('Error saving order note:', error);
        this.showNotification('Failed to save order note. Please try again.', 'error');
      });
    }
  }

  // Shipping functionality
  openShippingChecker() {
    const modal = this.querySelector('#shipping-modal');
    if (modal) {
      modal.style.display = 'flex';
      const input = modal.querySelector('.sliding-cart__zipcode-input');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
  }

  checkShipping() {
    const modal = this.querySelector('#shipping-modal');
    const input = modal.querySelector('.sliding-cart__zipcode-input');
    const resultDiv = modal.querySelector('#shipping-result');
    
    if (input && resultDiv) {
      const zipcode = input.value.trim();
      
      if (!zipcode) {
        this.showShippingResult('Please enter a ZIP code.', 'error');
        return;
      }

      // Simple ZIP code validation (can be enhanced based on requirements)
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(zipcode)) {
        this.showShippingResult('Please enter a valid ZIP code (e.g., 12345 or 12345-6789).', 'error');
        return;
      }

      // Simulate shipping check (replace with actual API call)
      setTimeout(() => {
        // Sample logic - you can integrate with actual shipping API
        const deliverableZips = ['10001', '10002', '90210', '60601', '30309']; // Sample deliverable zips
        const isDeliverable = deliverableZips.some(zip => zipcode.startsWith(zip.substring(0, 3)));
        
        if (isDeliverable) {
          this.showShippingResult(`✓ Great! We deliver to ${zipcode}. Estimated delivery: 3-5 business days.`, 'success');
        } else {
          this.showShippingResult(`✗ Sorry, we don't currently deliver to ${zipcode}. Please contact support for assistance.`, 'error');
        }
      }, 1000);
    }
  }

  showShippingResult(message, type) {
    const resultDiv = this.querySelector('#shipping-result');
    if (resultDiv) {
      resultDiv.textContent = message;
      resultDiv.className = `sliding-cart__shipping-result ${type}`;
    }
  }

  // Discount functionality
  openDiscountList() {
    const modal = this.querySelector('#discount-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.loadAvailableDiscounts();
      const input = modal.querySelector('.sliding-cart__discount-code-input');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
  }

  loadAvailableDiscounts() {
    const discountList = this.querySelector('#discount-list');
    if (!discountList) return;

    // Sample discount data (replace with actual API call to fetch available discounts)
    const availableDiscounts = [
      {
        code: 'WELCOME10',
        description: '10% off your first order',
        value: '10% OFF'
      },
      {
        code: 'FREESHIP',
        description: 'Free shipping on orders over $50',
        value: 'FREE SHIPPING'
      },
      {
        code: 'SUMMER20',
        description: '20% off summer collection',
        value: '20% OFF'
      }
    ];

    discountList.innerHTML = availableDiscounts.map(discount => `
      <div class="sliding-cart__discount-item" onclick="this.closest('sliding-cart-panel').selectDiscount('${discount.code}')">
        <div class="sliding-cart__discount-info">
          <div class="sliding-cart__discount-code">${discount.code}</div>
          <div class="sliding-cart__discount-description">${discount.description}</div>
        </div>
        <div class="sliding-cart__discount-value">${discount.value}</div>
      </div>
    `).join('');
  }

  selectDiscount(code) {
    const input = this.querySelector('.sliding-cart__discount-code-input');
    if (input) {
      input.value = code;
    }
  }

  applyDiscount() {
    const modal = this.querySelector('#discount-modal');
    const input = modal.querySelector('.sliding-cart__discount-code-input');
    
    if (input) {
      const discountCode = input.value.trim().toUpperCase();
      
      if (!discountCode) {
        this.showNotification('Please enter a discount code.', 'error');
        return;
      }

      // Apply discount code
      fetch('/discount/' + encodeURIComponent(discountCode), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => {
        if (response.redirected) {
          // Discount applied successfully
          modal.style.display = 'none';
          this.showNotification(`Discount code "${discountCode}" applied successfully!`, 'success');
          // Refresh cart contents
          window.location.reload();
        } else {
          throw new Error('Invalid discount code');
        }
      })
      .catch(error => {
        console.error('Error applying discount:', error);
        this.showNotification('Invalid discount code. Please try again.', 'error');
      });
    }
  }

  // Remove cart item functionality with instant UI feedback
  removeCartItem(variantId) {
    const cartItem = this.querySelector(`[data-variant-id="${variantId}"]`);
    
    // 1. INSTANTLY remove item from UI with smooth animation
    if (cartItem) {
      cartItem.style.transition = 'all 0.3s ease-out';
      cartItem.style.transform = 'translateX(100%)';
      cartItem.style.opacity = '0';
      
      // Remove from DOM after animation
      setTimeout(() => {
        cartItem.remove();
        this.updateCartDisplayAfterRemoval();
      }, 300);
    }

    // 2. INSTANTLY show success notification
    this.showNotification('Item removed from cart', 'success');

    // 3. INSTANTLY update cart count (optimistic)
    this.updateCartCountOptimistically(-1);

    // 4. Make API call in background (don't wait for response)
    const body = JSON.stringify({
      id: variantId,
      quantity: 0
    });

    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(cart => {
      // Sync actual cart count with server response
      this.updateCartCount();
      // Update cart total price
      this.updateCartTotal(cart.total_price);
    })
    .catch(error => {
      console.error('Error removing item:', error);
      
      // If API call fails, show error and restore item
      this.showNotification('Failed to remove item. Refreshing cart...', 'error');
      // Refresh cart to restore correct state
      setTimeout(() => {
        this.refreshCartPanel();
      }, 1500);
    });
  }

  // Refresh the entire cart panel by fetching updated cart data
  refreshCartPanel() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        // If cart is empty, show empty state
        if (cart.item_count === 0) {
          this.classList.add('is-empty');
          const cartItems = this.querySelector('.sliding-cart__items-wrapper');
          if (cartItems) {
            cartItems.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(var(--color-foreground), 0.6);">Your cart is empty</p>';
          }
        } else {
          // Reload the cart section
          fetch(`/?section_id=sliding-cart-panel`)
            .then(response => response.text())
            .then(html => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const newCartContent = doc.querySelector('.sliding-cart__items-wrapper');
              const currentCartContent = this.querySelector('.sliding-cart__items-wrapper');
              
              if (newCartContent && currentCartContent) {
                currentCartContent.innerHTML = newCartContent.innerHTML;
              }
            })
            .catch(error => {
              console.error('Error refreshing cart content:', error);
            });
        }
      })
      .catch(error => {
        console.error('Error fetching cart data:', error);
      });
  }

  getSectionsToRender() {
    return [
      {
        id: 'SlidingCartPanel',
        section: 'sliding-cart-panel',
        selector: '.sliding-cart__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }

  updateCartIcon(cart) {
    const cartIconBubble = document.querySelector('#cart-icon-bubble');
    if (cartIconBubble) {
      const cartCount = cartIconBubble.querySelector('.cart-count-bubble');
      if (cartCount) {
        cartCount.textContent = cart.item_count;
        cartCount.style.display = cart.item_count > 0 ? 'block' : 'none';
      }
    }

    // Update cart count in sliding cart tab
    const cartCountElement = this.querySelector('.sliding-cart__cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cart.item_count;
    }
  }

  // Utility function for notifications
  showNotification(message, type = 'info') {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = `sliding-cart__notification sliding-cart__notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
      color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  // Helper method for optimistic cart count updates
  updateCartCountOptimistically(change) {
    const cartCountElements = document.querySelectorAll('.cart-count-bubble span[aria-hidden="true"]');
    const cartTabCount = this.querySelector('.sliding-cart__cart-count');
    
    cartCountElements.forEach(element => {
      const currentCount = parseInt(element.textContent) || 0;
      const newCount = Math.max(0, currentCount + change);
      element.textContent = newCount;
      
      // Hide bubble if count is 0
      const bubble = element.closest('.cart-count-bubble');
      if (bubble) {
        if (newCount === 0) {
          bubble.style.display = 'none';
        } else {
          bubble.style.display = 'block';
        }
      }
    });
    
    // Update tab count
    if (cartTabCount) {
      const currentCount = parseInt(cartTabCount.textContent) || 0;
      const newCount = Math.max(0, currentCount + change);
      cartTabCount.textContent = newCount;
    }
  }

  // Helper method to update cart display after removal
  updateCartDisplayAfterRemoval() {
    const itemsWrapper = this.querySelector('.sliding-cart__items-wrapper');
    const remainingItems = itemsWrapper ? itemsWrapper.querySelectorAll('.sliding-cart__item') : [];
    
    // If no items left, show empty cart state
    if (remainingItems.length === 0) {
      this.classList.add('is-empty');
    }
  }

  // Helper method to update cart total
  updateCartTotal(newTotalPrice) {
    const totalElement = this.querySelector('.sliding-cart__summary-price');
    if (totalElement && typeof newTotalPrice !== 'undefined') {
      // Format price (assumes Shopify money format)
      const formattedPrice = this.formatMoney(newTotalPrice);
      totalElement.textContent = formattedPrice;
    }
  }

  // Helper method to format money (basic implementation)
  formatMoney(cents) {
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars}`;
  }
}

customElements.define('sliding-cart-panel', SlidingCartPanel);

class SlidingCartItems extends HTMLElement {
  constructor() {
    super();
    
    this.currentItemCount = parseInt(this.getAttribute('data-item-count')) || 0;
    this.addEventListener('change', this.onCartItemChange.bind(this));
    
    // Set up quantity buttons
    this.setupQuantityButtons();
  }

  setupQuantityButtons() {
  // Wait for DOM to be ready
  setTimeout(() => {
    const quantityButtons = this.querySelectorAll('.quantity__button');
    
    quantityButtons.forEach(button => {
      // Remove all existing event listeners by replacing the element
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Add only our event listener
      newButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        this.handleQuantityClick(event);
      });
    });
  }, 100);
}

handleQuantityClick(event) {
  const button = event.currentTarget;
  const input = button.closest('quantity-input').querySelector('.quantity__input');
  const isPlus = button.getAttribute('name') === 'plus';
  const currentValue = parseInt(input.value) || 0;
  
  let newValue;
  if (isPlus) {
    newValue = currentValue + 1;
  } else {
    newValue = Math.max(currentValue - 1, 0);
  }
  
  input.value = newValue;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
  
  onQuantityButtonClick(event) {
    event.preventDefault();
    event.stopPropagation(); // Stop the global handler from running
    
    const button = event.currentTarget;
    const quantityInput = button.closest('quantity-input');
    const input = quantityInput.querySelector('.quantity__input');
    
    const currentValue = parseInt(input.value) || 0;
    const step = parseInt(input.getAttribute('step')) || 1;
    const min = parseInt(input.getAttribute('data-min')) || 0;
    const max = input.getAttribute('max') ? parseInt(input.getAttribute('max')) : null;
    
    let newValue;
    
    if (button.getAttribute('name') === 'plus') {
      newValue = currentValue + step;
      if (max && newValue > max) newValue = max;
    } else if (button.getAttribute('name') === 'minus') {
      newValue = Math.max(currentValue - step, min);
    } else {
      return; // Unknown button
    }
    
    if (newValue !== currentValue) {
      input.value = newValue;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }


  onQuantityInputChange(event) {
    const input = event.target;
    const variantId = input.getAttribute('data-quantity-variant-id');
    const quantity = parseInt(input.value) || 0;

    if (quantity === 0) {
      this.removeItem(variantId);
    } else {
      this.updateQuantity(variantId, quantity);
    }
  }

  onCartItemChange(event) {
    if (event.target.classList.contains('quantity__input')) {
      this.onQuantityInputChange(event);
    }
  }

  updateQuantity(variantId, quantity) {
    // Show loading state
    const input = this.querySelector(`[data-quantity-variant-id="${variantId}"]`);
    if (input) {
      input.disabled = true;
    }

    const body = JSON.stringify({
      id: variantId,
      quantity: quantity
    });

    this.updateCart(body, variantId);
  }

  removeItem(variantId) {
    // Use the cart panel's remove method instead
    const cartPanel = document.querySelector('sliding-cart-panel');
    if (cartPanel && cartPanel.removeCartItem) {
      cartPanel.removeCartItem(variantId);
    }
  }

  updateCart(body, variantId) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(cart => {
      // Update cart icon and count
      this.updateCartIcon(cart);
      
      // Update estimated total immediately
      this.updateCartTotals(cart);
      
      // Refresh the cart panel content
      const cartPanel = document.querySelector('sliding-cart-panel');
      if (cartPanel && cartPanel.refreshCartPanel) {
        cartPanel.refreshCartPanel();
      }
      
      // Re-enable the input
      const input = this.querySelector(`[data-quantity-variant-id="${variantId}"]`);
      if (input) {
        input.disabled = false;
      }
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      
      // Reset input state on error
      const input = this.querySelector(`[data-quantity-variant-id="${variantId}"]`);
      if (input) {
        input.disabled = false;
      }
    });
  }

  refreshCartPanel() {
    const cartPanel = document.querySelector('sliding-cart-panel');
    if (cartPanel && cartPanel.refreshCartPanel) {
      cartPanel.refreshCartPanel();
    }
  }

  updateCartIcon(cart) {
    const cartIconBubble = document.querySelector('#cart-icon-bubble');
    if (cartIconBubble) {
      const cartCount = cartIconBubble.querySelector('.cart-count-bubble');
      if (cartCount) {
        cartCount.textContent = cart.item_count;
        cartCount.style.display = cart.item_count > 0 ? 'block' : 'none';
      }
    }

    // Update cart count in sliding cart tab
    const cartCountElement = document.querySelector('.sliding-cart__cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cart.item_count;
    }
  }

  updateCartTotals(cart) {
    // Update the estimated total
    const totalPriceElement = document.querySelector('.sliding-cart__summary-price');
    if (totalPriceElement && cart.total_price !== undefined) {
      totalPriceElement.textContent = this.formatMoney(cart.total_price);
    }
  }

  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  }

  getSectionsToRender() {
    return [
      {
        id: 'SlidingCartPanel',
        section: 'sliding-cart-panel',
        selector: '.sliding-cart__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('sliding-cart-items', SlidingCartItems);

// CSS for recently viewed products
const recentlyViewedStyles = `
  .sliding-cart__recently-viewed-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sliding-cart__recently-viewed-item {
    border: 1px solid rgba(var(--color-foreground), 0.08);
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .sliding-cart__recently-viewed-item:hover {
    box-shadow: 0 2px 8px rgba(var(--color-foreground), 0.1);
  }

  .sliding-cart__recently-viewed-link {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    text-decoration: none;
    color: inherit;
  }

  .sliding-cart__recently-viewed-image {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(var(--color-foreground), 0.05);
  }

  .sliding-cart__recently-viewed-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .sliding-cart__recently-viewed-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .sliding-cart__recently-viewed-title {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.3;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .sliding-cart__recently-viewed-price {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(var(--color-foreground));
    margin: 0;
  }

  .sliding-cart__empty-recently-viewed,
  .sliding-cart__error,
  .sliding-cart__loading {
    text-align: center;
    padding: 2rem;
    color: rgba(var(--color-foreground), 0.6);
    font-style: italic;
  }
`;

// Inject recently viewed styles
if (!document.querySelector('#sliding-cart-recently-viewed-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'sliding-cart-recently-viewed-styles';
  styleSheet.textContent = recentlyViewedStyles;
  document.head.appendChild(styleSheet);
}

// Initialize cart panel on page load
document.addEventListener('DOMContentLoaded', () => {
  const existingCartDrawer = document.querySelector('cart-drawer');
  if (existingCartDrawer) {
    existingCartDrawer.style.display = 'none';
  }

  // Ensure cart icon always opens sliding cart panel
  const cartIcon = document.querySelector('#cart-icon-bubble');
  if (cartIcon) {
    // Remove any existing event listeners by cloning the element
    const newCartIcon = cartIcon.cloneNode(true);
    cartIcon.parentNode.replaceChild(newCartIcon, cartIcon);
    
    // Add our sliding cart panel event listener
    newCartIcon.addEventListener('click', (event) => {
      event.preventDefault();
      const slidingCartPanel = document.querySelector('sliding-cart-panel');
      if (slidingCartPanel) {
        slidingCartPanel.open(newCartIcon);
      }
    });
    
    // Handle keyboard navigation
    newCartIcon.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE' || event.code.toUpperCase() === 'ENTER') {
        event.preventDefault();
        const slidingCartPanel = document.querySelector('sliding-cart-panel');
        if (slidingCartPanel) {
          slidingCartPanel.open(newCartIcon);
        }
      }
    });
  }
});