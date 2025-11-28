let currentGender = 'all';
let currentCategory = 'all';

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    let filtered = products;
    
    if (currentGender !== 'all') {
        filtered = filtered.filter(p => p.gender === currentGender);
    }
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    grid.innerHTML = filtered.map(product => `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${product.price} €</p>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gender = urlParams.get('category');
    if (gender === 'men' || gender === 'women') {
        currentGender = gender;
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
