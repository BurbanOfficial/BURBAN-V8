// Products Database
let products = JSON.parse(localStorage.getItem('adminProducts')) || [
    {
        id: 1,
        name: "T-shirt Essential",
        price: 45,
        category: "t-shirts",
        gender: "men",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
        description: "T-shirt en coton bio, coupe droite minimaliste",
        sizes: ["S", "M", "L", "XL"],
        colors: ["#000000", "#FFFFFF", "#808080"],
        imagesByColor: {
            "#000000": [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"
            ],
            "#FFFFFF": [
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"
            ],
            "#808080": [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"
            ]
        }
    },
    {
        id: 2,
        name: "Hoodie Minimal",
        price: 95,
        category: "hoodies",
        gender: "men",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
        description: "Sweat à capuche oversize, 100% coton",
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: 3,
        name: "Pantalon Cargo",
        price: 85,
        category: "pants",
        gender: "men",
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800",
        description: "Pantalon cargo coupe ample, poches multiples",
        sizes: ["28", "30", "32", "34", "36"]
    },
    {
        id: 4,
        name: "T-shirt Oversize",
        price: 50,
        category: "t-shirts",
        gender: "men",
        image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
        description: "T-shirt oversize, coupe décontractée",
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: 5,
        name: "Casquette Logo",
        price: 35,
        category: "accessories",
        gender: "men",
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
        description: "Casquette brodée, ajustable",
        sizes: ["Unique"]
    },
    {
        id: 6,
        name: "Hoodie Zip",
        price: 105,
        category: "hoodies",
        gender: "women",
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
        description: "Sweat zippé, poches kangourou",
        sizes: ["XS", "S", "M", "L"]
    },
    {
        id: 7,
        name: "Jean Straight",
        price: 90,
        category: "pants",
        gender: "women",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
        description: "Jean coupe droite, denim japonais",
        sizes: ["26", "28", "30", "32"]
    },
    {
        id: 8,
        name: "Sac Tote",
        price: 40,
        category: "accessories",
        gender: "women",
        image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800",
        description: "Tote bag en toile, logo brodé",
        sizes: ["Unique"]
    },
    {
        id: 9,
        name: "T-shirt Crop",
        price: 42,
        category: "t-shirts",
        gender: "women",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
        description: "T-shirt crop top, coton bio",
        sizes: ["XS", "S", "M", "L"]
    }
];

// Sauvegarder les produits par défaut si aucun n'existe
if (!localStorage.getItem('adminProducts')) {
    localStorage.setItem('adminProducts', JSON.stringify(products));
}

// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count || 0;
    });
}

function addToCart(productId, size) {
    const product = products.find(p => p.id === productId);
    if (!product || !size) return;

    const existingItem = cart.find(item => item.id === productId && item.size === size);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function removeFromCart(productId, size) {
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateQuantity(productId, size, quantity) {
    const item = cart.find(item => item.id === productId && item.size === size);
    if (item) {
        item.quantity = Math.max(1, quantity);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// User Management
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function login(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function register(userData) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.find(u => u.email === userData.email)) {
        return false;
    }
    
    const newUser = {
        id: Date.now(),
        ...userData,
        orders: [],
        addresses: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
}

function updateUser(userData) {
    if (!currentUser) return false;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = users[userIndex];
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return true;
    }
    return false;
}

// Custom Modal Functions
function showMessage(message) {
    document.body.classList.add('modal-open');
    const modal = document.createElement('div');
    modal.className = 'custom-modal active';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <p>${message}</p>
            <button class="btn-primary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">OK</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showCartConfirm() {
    document.body.classList.add('modal-open');
    const modal = document.createElement('div');
    modal.className = 'custom-modal active';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <div class="modal-icon">✓</div>
            <p>Produit ajouté au panier</p>
            <div style="display: flex; gap: 16px; margin-top: 24px;">
                <button class="btn-secondary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Continuer mes achats</button>
                <button class="btn-primary" onclick="window.location.href='cart.html'">Voir le panier</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showImageZoom(imageSrc, images = [imageSrc]) {
    let currentIndex = images.indexOf(imageSrc);
    let zoomLevel = 0;
    
    const modal = document.createElement('div');
    modal.className = 'image-zoom-modal active';
    modal.innerHTML = `
        <button class="zoom-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <button class="zoom-arrow zoom-prev">←</button>
        <button class="zoom-arrow zoom-next">→</button>
        <div class="zoom-image-container">
            <img src="${imageSrc}" class="zoom-image">
        </div>
    `;
    
    const img = modal.querySelector('.zoom-image');
    const container = modal.querySelector('.zoom-image-container');
    const prevBtn = modal.querySelector('.zoom-prev');
    const nextBtn = modal.querySelector('.zoom-next');
    const closeBtn = modal.querySelector('.zoom-close');
    
    // Lock scroll
    document.body.classList.add('modal-open');
    
    // Close
    const closeModal = () => {
        document.body.classList.remove('modal-open');
        modal.remove();
    };
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });
    
    // Navigation
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        img.src = images[currentIndex];
        zoomLevel = 0;
        img.style.transform = 'scale(1)';
        img.style.cursor = 'zoom-in';
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        img.src = images[currentIndex];
        zoomLevel = 0;
        img.style.transform = 'scale(1)';
        img.style.cursor = 'zoom-in';
    });
    
    // Zoom on image click
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomLevel = (zoomLevel + 1) % 4;
        const scales = [1, 1.5, 2, 1];
        img.style.transform = `scale(${scales[zoomLevel]})`;
        img.style.cursor = zoomLevel === 3 ? 'zoom-out' : 'zoom-in';
    });
    
    // Hide arrows if only one image
    if (images.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
    
    document.body.appendChild(modal);
}

function showSizeGuide(sizeGuideId) {
    const guides = JSON.parse(localStorage.getItem('sizeGuides')) || [];
    const guide = guides.find(g => g.id === sizeGuideId);
    
    let content = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: left;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border);">
                    <th style="padding: 12px;">Taille</th>
                    <th style="padding: 12px;">Poitrine (cm)</th>
                    <th style="padding: 12px;">Longueur (cm)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 12px;">S</td>
                    <td style="padding: 12px;">94-98</td>
                    <td style="padding: 12px;">68</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 12px;">M</td>
                    <td style="padding: 12px;">98-102</td>
                    <td style="padding: 12px;">70</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 12px;">L</td>
                    <td style="padding: 12px;">102-106</td>
                    <td style="padding: 12px;">72</td>
                </tr>
                <tr>
                    <td style="padding: 12px;">XL</td>
                    <td style="padding: 12px;">106-110</td>
                    <td style="padding: 12px;">74</td>
                </tr>
            </tbody>
        </table>
    `;
    
    if (guide) {
        content = guide.content;
    }
    
    document.body.classList.add('modal-open');
    const modal = document.createElement('div');
    modal.className = 'custom-modal active';
    modal.innerHTML = `
        <div class="custom-modal-content" style="max-width: 600px;">
            <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 24px;">Tableau des tailles</h3>
            ${content}
            <button class="btn-primary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Fermer</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Update account link
    const accountLink = document.getElementById('accountLink');
    if (accountLink) {
        accountLink.href = 'account.html';
        const linkText = accountLink.querySelector('.link-text');
        if (linkText) {
            linkText.textContent = 'Account';
        }
        accountLink.setAttribute('data-text', 'Account');
    }
    
    // Mark active page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || 
            (currentPage === 'products.html' && href.includes('category=' + category)) ||
            (currentPage === 'cart.html' && link.classList.contains('cart-link')) ||
            (currentPage === 'account.html' && link.id === 'accountLink')) {
            link.classList.add('active');
        }
    });
});
