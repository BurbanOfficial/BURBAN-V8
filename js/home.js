document.addEventListener('DOMContentLoaded', async () => {
    const now = new Date();
    
    // Attendre Firebase et charger les produits
    await new Promise(resolve => {
        const check = setInterval(() => {
            if (window.firebaseReady) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
    
    // Charger les produits depuis Firestore
    await loadProductsFromFirestore();
    products = getProducts();
    
    // Récupérer les stats depuis Firestore
    let productViews = {};
    let productSales = {};
    
    try {
        const { doc, getDoc } = window.firebaseModules;
        const statsDoc = await getDoc(doc(window.firebaseDb, 'stats', 'products'));
        if (statsDoc.exists()) {
            const data = statsDoc.data();
            productViews = data.views || {};
            productSales = data.sales || {};
            console.log('Stats chargées:', { productViews, productSales });
        } else {
            console.log('Aucune stats trouvée');
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
    
    // Trier les produits par nombre de vues
    const featuredProducts = products
        .map(p => ({ ...p, views: productViews[p.id] || 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    
    console.log('Produits recommandés:', featuredProducts.map(p => ({ id: p.id, name: p.name, views: p.views })));
    
    const grid = document.getElementById('featuredProducts');
    
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
    
    // Best Sellers
    const bestSellers = products
        .map(p => ({ ...p, sales: productSales[p.id] || 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
    
    const carousel = document.getElementById('bestSellersCarousel');
    carousel.innerHTML = bestSellers.map(product => {
        if (product.promoActive && product.promoEndDate && new Date(product.promoEndDate) < now) {
            product.promoActive = false;
            product.price = product.originalPrice;
            product.originalPrice = null;
            product.promoEndDate = null;
        }
        
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
    
    // Carousel navigation
    const prevBtn = document.querySelector('.bestseller-prev');
    const nextBtn = document.querySelector('.bestseller-next');
    
    // Masquer les flèches si 5 produits ou moins
    if (bestSellers.length <= 5) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        let currentIndex = 0;
        
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentIndex < bestSellers.length - 5) {
                currentIndex++;
                updateCarousel();
            }
        });
        
        function updateCarousel() {
            carousel.style.transform = `translateX(-${currentIndex * (100 / 5)}%)`;
            carousel.style.transition = 'transform 0.3s ease';
        }
    }
});
