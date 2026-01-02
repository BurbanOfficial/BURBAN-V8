const searchBtn = document.getElementById('searchBtn');
const searchBtnMobile = document.getElementById('searchBtnMobile');
const searchModal = document.getElementById('searchModal');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

const openSearch = () => {
    searchModal.classList.add('active');
    document.body.classList.add('modal-open');
    searchInput.focus();
};

searchBtn?.addEventListener('click', openSearch);
searchBtnMobile?.addEventListener('click', openSearch);

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

searchInput?.addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    
    // Recherche avancée avec scoring
    const scored = products.map(p => {
        let score = 0;
        const name = p.name.toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const gender = (p.gender || '').toLowerCase();
        const colors = (p.colors || []).map(c => c.toLowerCase());
        const sizes = (p.sizes || []).map(s => s.toLowerCase());
        
        // Correspondance exacte nom (priorité max)
        if (name === query) score += 100;
        else if (name.startsWith(query)) score += 50;
        else if (name.includes(query)) score += 30;
        
        // Mots du nom
        const nameWords = name.split(' ');
        const queryWords = query.split(' ');
        queryWords.forEach(qw => {
            if (nameWords.some(nw => nw.startsWith(qw))) score += 20;
        });
        
        // Catégorie
        if (cat.includes(query)) score += 25;
        
        // Genre
        if (gender.includes(query)) score += 15;
        
        // Description
        if (desc.includes(query)) score += 10;
        
        // Couleurs
        if (colors.some(c => c.includes(query))) score += 15;
        
        // Tailles
        if (sizes.some(s => s.includes(query))) score += 10;
        
        // Prix (si recherche numérique)
        const numQuery = parseFloat(query);
        if (!isNaN(numQuery) && Math.abs(p.price - numQuery) < 10) score += 20;
        
        return { ...p, score };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);
    
    if (scored.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">Aucun produit trouvé</div>';
        return;
    }
    
    searchResults.innerHTML = scored.slice(0, 8).map(product => `
        <div class="search-result-item" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="search-result-image">
                <img src="${product.image || product.images?.[0]}" alt="${product.name}">
            </div>
            <div class="search-result-info">
                <h4>${product.name}</h4>
                <p>${product.price.toFixed(2)} € ${product.category ? '· ' + product.category : ''}</p>
            </div>
        </div>
    `).join('');
});
