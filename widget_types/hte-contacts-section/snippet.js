function initializeCopyButtons() {
  const copyButtons = document.querySelectorAll('.contact-icon');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const contactDetail = this.closest('.contact-detail');
      const contactText = contactDetail.querySelector('.contact-text');
      const textToCopy = contactText.textContent;
      
      // Copy to clipboard
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback
        const originalOpacity = this.style.opacity;
        this.style.opacity = '1';
        
        setTimeout(() => {
          this.style.opacity = originalOpacity;
        }, 200);
        
        console.log('Copied:', textToCopy);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  });
}

initializeCopyButtons();