// Reviews Section Component
document.addEventListener('DOMContentLoaded', function() {
  const reviewsTrack = document.querySelector('.reviews-track');
  
  if (reviewsTrack) {
    // Клонируем карточки для создания бесконечного эффекта
    const originalCards = reviewsTrack.innerHTML;
    reviewsTrack.innerHTML = originalCards + originalCards;
    
    // Добавляем обработчик для паузы при наведении
    reviewsTrack.addEventListener('mouseenter', function() {
      this.style.animationPlayState = 'paused';
    });
    
    reviewsTrack.addEventListener('mouseleave', function() {
      this.style.animationPlayState = 'running';
    });
  }
});