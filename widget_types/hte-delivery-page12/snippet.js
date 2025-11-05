function initDeliveryPayment() {
    const deliveryPaymentItems = document.querySelectorAll('.delivery-payment-item');
    
    deliveryPaymentItems.forEach(item => {
        const header = item.querySelector('.delivery-payment-header');
        
        if (header && !header.hasAttribute('data-initialized')) {
            // Mark as initialized to avoid duplicate handlers
            header.setAttribute('data-initialized', 'true');
            
            // Add click handler
            header.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isOpen = item.getAttribute('data-open') === 'true';
                
                // Close all other items
                document.querySelectorAll('.delivery-payment-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.setAttribute('data-open', 'false');
                    }
                });
                
                // Toggle current item
                item.setAttribute('data-open', !isOpen ? 'true' : 'false');
            });
            
            // Add keyboard support
            header.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
            
            // Make header focusable
            header.setAttribute('tabindex', '0');
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', 'false');
            
            // Update aria-expanded when toggled
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-open') {
                        const isOpen = item.getAttribute('data-open') === 'true';
                        header.setAttribute('aria-expanded', isOpen);
                    }
                });
            });
            
            observer.observe(item, {
                attributes: true,
                attributeFilter: ['data-open']
            });
        }
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeliveryPayment);
} else {
    initDeliveryPayment();
}

// Also try after a short delay in case elements are added dynamically
setTimeout(initDeliveryPayment, 100);
setTimeout(initDeliveryPayment, 500);