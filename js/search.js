const searchBtn = document.getElementById('searchBtn');
const searchModal = document.getElementById('searchModal');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchBtn?.addEventListener('click', () => {
    searchModal.classList.add('active');
    document.body.classList.add('modal-open');
    searchInput.focus();
});

searchClose?.addEventListener('click', () => {
    searchModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    searchInput.value = '';
    searchResults.innerHTML = '';
});

searchModal?.addEventListener('click', (e) => {
    if (e.target === searchModal) {
        searchModal.classList.remove('active');
        document.body.classList.remove('modal-open');
        searchInput.value = '';
        searchResults.innerHTML = '';
    }
});

searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    
    if (filtered.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">Aucun produit trouvé</div>';
        return;
    }
    
    searchResults.innerHTML = filtered.slice(0, 8).map(product => `
        <div class="search-result-item" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="search-result-image">
                <img src="${product.image || product.images?.[0]}" alt="${product.name}">
            </div>
            <div class="search-result-info">
                <h4>${product.name}</h4>
                <p>${product.price.toFixed(2)} €</p>
            </div>
        </div>
    `).join('');
});
