document.addEventListener('DOMContentLoaded', () => {
    const featuredProducts = products.slice(0, 4);
    const grid = document.getElementById('featuredProducts');
    const now = new Date();
    
    grid.innerHTML = featuredProducts.map(product => {
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
});
