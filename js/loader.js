document.addEventListener('DOMContentLoaded', function() {
    const loader = document.getElementById('loader');
    let isLoaded = false;
    
    function hideLoader() {
        if (isLoaded) return;
        isLoaded = true;
        
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 800);
        }, 800);
    }
    
    // Wait for all resources to load
    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
    }
    
    // Fallback timeout
    setTimeout(hideLoader, 4000);
});