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
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>Taille: ${item.size}</p>
                <p>${item.price} €</p>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-selector">
                    <button onclick="updateQuantity(${item.id}, '${item.size}', ${item.quantity - 1}); displayCart();">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, '${item.size}', ${item.quantity + 1}); displayCart();">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id}, '${item.size}'); displayCart();">Retirer</button>
            </div>
        </div>
    `).join('');
    
    const total = getCartTotal();
    document.getElementById('subtotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('total').textContent = `${total.toFixed(2)} €`;
}

document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Votre panier est vide');
            return;
        }
        window.location.href = 'checkout.html';
    });
});
