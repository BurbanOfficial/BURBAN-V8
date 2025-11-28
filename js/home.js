document.addEventListener('DOMContentLoaded', () => {
    const featuredProducts = products.slice(0, 4);
    const grid = document.getElementById('featuredProducts');
    
    grid.innerHTML = featuredProducts.map(product => `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${product.price} €</p>
        </div>
    `).join('');
});
