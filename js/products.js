let currentGender = 'all';
let currentCategory = 'all';

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    let filtered = products;
    
    if (currentGender !== 'all') {
        filtered = filtered.filter(p => p.gender === currentGender);
    }
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    const now = new Date();
    grid.innerHTML = filtered.map(product => {
        // Check promo expiration
        if (product.promoActive && product.promoEndDate && new Date(product.promoEndDate) < now) {
            product.promoActive = false;
            product.price = product.originalPrice;
            product.originalPrice = null;
            product.promoEndDate = null;
        }
        
        // Check if new
        const publishDate = new Date(product.publishDate);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const isNew = publishDate > oneMonthAgo;
        
        const priceHTML = product.promoActive && product.originalPrice 
            ? `<span style="text-decoration: line-through; color: var(--gray); margin-right: 4px; font-size: 12px;">${product.originalPrice.toFixed(2)} €</span>${product.price.toFixed(2)} €`
            : `${product.price.toFixed(2)} €`;
        
        return `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
                <div class="product-image" style="position: relative;">
                    <img src="${product.image}" alt="${product.name}">
                    ${isNew ? '<span style="position: absolute; top: 12px; left: 12px; background: var(--black); color: var(--white); padding: 4px 12px; font-size: 11px; font-weight: 500; letter-spacing: 1px;">NOUVEAU</span>' : ''}
                </div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${priceHTML}</p>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Attendre Firebase et charger les produits
    await new Promise(resolve => {
        const check = setInterval(() => {
            if (window.firebaseReady) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
    
    await loadProductsFromFirestore();
    
    const urlParams = new URLSearchParams(window.location.search);
    const gender = urlParams.get('category');
    if (gender === 'men' || gender === 'women') {
        currentGender = gender;
    }
    
    // Load categories from localStorage
    let categories = JSON.parse(localStorage.getItem('adminCategories'));
    if (!categories) {
        categories = [
            { id: 1, name: 'T-shirts', slug: 't-shirts' },
            { id: 2, name: 'Hoodies', slug: 'hoodies' },
            { id: 3, name: 'Pantalons', slug: 'pants' },
            { id: 4, name: 'Accessoires', slug: 'accessories' }
        ];
        localStorage.setItem('adminCategories', JSON.stringify(categories));
    }
    
    const filtersContainer = document.getElementById('categoryFilters');
    if (filtersContainer) {
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.category = cat.slug;
            btn.textContent = cat.name;
            filtersContainer.appendChild(btn);
        });
    }
    
    displayProducts();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            displayProducts();
        });
    });
});
