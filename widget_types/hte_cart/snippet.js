

EventBus.subscribe('delete_items:insales:cart', function(data) {
    window.location.reload();
});

$(document).ready(function() {
    const switchers = document.querySelectorAll('.toggle-switch');
    switchers.forEach(switcher => {
        switcher.addEventListener('click', () => {
            switcher.classList.toggle('active');
        });
    });
});

