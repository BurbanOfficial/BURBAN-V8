function updateQuantity(productId, size, newQuantity, color = null) {
    if (newQuantity <= 0) {
        removeFromCart(productId, size, color);
        return;
    }
    
    // Vérifier le stock
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const product = products.find(p => p.id === productId);
    if (product) {
        const variantKey = `${color}-${size}`;
        const stock = product.stockByVariant?.[variantKey] || 0;
        if (newQuantity > stock) {
            showMessage(`Stock insuffisant. Seulement ${stock} disponible(s)`);
            return;
        }
    }
    
    const itemIndex = cart.findIndex(item => 
        item.id === productId && 
        item.size === size && 
        item.color === color
    );
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }
}

function removeFromCart(productId, size, color = null) {
    cart = cart.filter(item => {
        return !(item.id === productId && item.size === size && item.color === color);
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function displayCart() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.querySelector('.cart-summary');
    const cartLayout = document.querySelector('.cart-layout');
    
    // Filter out invalid items
    cart = cart.filter(item => item && item.id && item.name && item.price);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart-message">
                <p class="empty-cart">Votre panier est vide</p>
                <p style="color: var(--gray); margin-bottom: 24px;">Découvrez notre collection</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="products.html?category=men" class="btn-primary">Men</a>
                    <a href="products.html?category=women" class="btn-primary">Women</a>
                </div>
            </div>
        `;
        cartSummary.style.display = 'none';
        cartLayout.classList.add('empty');
        updateCartCount();
        return;
    }
    
    cartSummary.style.display = 'block';
    cartLayout.classList.remove('empty');
    
    cartItems.innerHTML = cart.map(item => {
        const colorParam = item.color ? `'${item.color}'` : 'null';
        return `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>Taille: ${item.size}</p>
                ${item.color ? `<p style="display: flex; align-items: center; gap: 8px;">Couleur: <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background: ${item.color}; border: 1px solid ${item.color === '#FFFFFF' ? '#e0e0e0' : item.color};"></span></p>` : ''}
                <p>${item.price} €</p>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-selector">
                    <button onclick="updateQuantity(${item.id}, '${item.size}', ${item.quantity - 1}, ${colorParam}); displayCart();">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, '${item.size}', ${item.quantity + 1}, ${colorParam}); displayCart();">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id}, '${item.size}', ${colorParam}); displayCart();">Retirer</button>
            </div>
        </div>
    `}).join('');
    
    const total = getCartTotal();
    document.getElementById('subtotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('total').textContent = `${total.toFixed(2)} €`;
}

document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showMessage('Votre panier est vide');
            return;
        }
        
        // Attendre que Firebase soit prêt
        const checkAuth = () => {
            if (!window.firebaseReady || !window.firebaseAuth) {
                setTimeout(checkAuth, 100);
                return;
            }
            
            const auth = window.firebaseAuth;
            if (!auth.currentUser) {
                const total = getCartTotal();
                const points = Math.floor(total * 10);
                
                document.body.classList.add('modal-open');
                const modal = document.createElement('div');
                modal.className = 'custom-modal active';
                modal.innerHTML = `
                    <div class="custom-modal-content" style="max-width: 500px;">
                        <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 16px;">Gagnez des points de fidélité !</h3>
                        <p style="margin-bottom: 24px;">Connectez-vous ou créez un compte pour gagner <strong>${points} points</strong> avec cet achat.</p>
                        <p style="font-size: 14px; color: var(--gray); margin-bottom: 24px;">1€ dépensé = 10 points</p>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button class="btn-secondary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove(); window.location.href='checkout.html';">Continuer sans compte</button>
                            <button class="btn-primary" onclick="window.location.href='account.html';">Se connecter</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            } else {
                window.location.href = 'checkout.html';
            }
        };
        
        checkAuth();
    });
});
