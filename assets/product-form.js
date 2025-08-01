if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('sliding-cart-panel');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('sliding-cart-panel')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        console.log('Product form submit handler triggered');
        evt.preventDefault();
        evt.stopImmediatePropagation(); // Prevent any other form submission handlers
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            }

            // Always try to open the sliding cart after successful add to cart
            console.log('Opening sliding cart panel after successful add to cart');
            const slidingCartPanel = document.querySelector('sliding-cart-panel');
            if (slidingCartPanel) {
              console.log('Sliding cart panel found, opening...');
              slidingCartPanel.open();
            } else {
              console.log('Sliding cart panel not found!');
            }

            const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              }).then(() => {
                CartPerformance.measureFromMarker('add:wait-for-subscribers', startMarker);
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    CartPerformance.measure("add:paint-updated-sections", () => {
                      // For sliding cart, refresh the panel and open it
                      if (this.cart) {
                        if (this.cart.refreshCartPanel) {
                          this.cart.refreshCartPanel();
                        }
                        if (this.cart.open) {
                          this.cart.open();
                        }
                      } else {
                        // Fallback: find sliding cart panel and open it
                        const slidingCartPanel = document.querySelector('sliding-cart-panel');
                        if (slidingCartPanel) {
                          if (slidingCartPanel.refreshCartPanel) {
                            slidingCartPanel.refreshCartPanel();
                          }
                          slidingCartPanel.open();
                        }
                      }
                    });
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure("add:paint-updated-sections", () => {
                // For sliding cart, refresh the panel and open it
                if (this.cart) {
                  if (this.cart.refreshCartPanel) {
                    this.cart.refreshCartPanel();
                  }
                  if (this.cart.open) {
                    this.cart.open();
                  }
                } else {
                  // Fallback: find sliding cart panel and open it
                  const slidingCartPanel = document.querySelector('sliding-cart-panel');
                  if (slidingCartPanel) {
                    if (slidingCartPanel.refreshCartPanel) {
                      slidingCartPanel.refreshCartPanel();
                    }
                    slidingCartPanel.open();
                  }
                }
              });
            }
          })
          .catch((e) => {
            console.error(e);
            // Even if there's an error, try to open the sliding cart
            const slidingCartPanel = document.querySelector('sliding-cart-panel');
            if (slidingCartPanel) {
              slidingCartPanel.open();
            }
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');

            CartPerformance.measureFromEvent("add:user-action", evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
