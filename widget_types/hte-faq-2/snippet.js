// Initialize FAQ accordion functionality
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    
    if (header) {
      header.addEventListener('click', function() {
        const isOpen = item.getAttribute('data-open') === 'true';
        
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.setAttribute('data-open', 'false');
          }
        });
        
        // Toggle current item
        item.setAttribute('data-open', !isOpen);
      });
    }
  });
  
  // Add keyboard support for accessibility
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    
    if (header) {
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

initFAQ();