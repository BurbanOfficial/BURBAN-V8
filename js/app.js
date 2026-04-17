// Products Database - Charger depuis Firestore puis localStorage
async function loadProductsFromFirestore() {
    if (!window.firebaseReady) {
        console.log('Firebase pas prêt');
        return;
    }
    try {
        console.log('Chargement produits depuis Firestore...');
        const { collection, getDocs } = window.firebaseModules;
        const snapshot = await getDocs(collection(window.firebaseDb, 'products'));
        const products = snapshot.docs.map(doc => doc.data());
        console.log('Produits chargés:', products.length);
        if (products.length > 0) {
            localStorage.setItem('adminProducts', JSON.stringify(products));
            console.log('Produits sauvegardés dans localStorage');
        } else {
            console.log('Aucun produit trouvé dans Firestore');
        }
    } catch (error) {
        console.error('Erreur chargement Firestore:', error);
    }
}

function getProducts() {
    return JSON.parse(localStorage.getItem('adminProducts')) || defaultProducts;
}

const defaultProducts = [
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

// Charger depuis Firestore au démarrage
if (typeof window !== 'undefined') {
    if (window.firebaseReady) {
        loadProductsFromFirestore();
    } else {
        const waitForFirebase = setInterval(() => {
            if (window.firebaseReady) {
                clearInterval(waitForFirebase);
                loadProductsFromFirestore();
            }
        }, 100);
    }
}

// Sauvegarder les produits par défaut si aucun n'existe
if (!localStorage.getItem('adminProducts')) {
    localStorage.setItem('adminProducts', JSON.stringify(defaultProducts));
}

let products = getProducts();

// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function saveCartToFirestore() {
    if (!window.firebaseReady || !window.firebaseAuth?.currentUser) return;
    try {
        const { doc, setDoc } = window.firebaseModules;
        await setDoc(doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid), { cart }, { merge: true });
    } catch (e) {
        console.error('Erreur sauvegarde panier:', e);
    }
}

async function loadCartFromFirestore(uid) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const snap = await getDoc(doc(window.firebaseDb, 'users', uid));
        return snap.exists() ? (snap.data().cart || []) : [];
    } catch (e) {
        return [];
    }
}

function mergeCarts(savedCart, localCart) {
    const merged = [...savedCart];
    localCart.forEach(localItem => {
        const exists = merged.some(item =>
            item.id === localItem.id &&
            item.size === localItem.size &&
            item.color === localItem.color
        );
        if (!exists) merged.push(localItem);
    });
    return merged;
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count || 0;
    });
}

function addToCart(productId, size, color = null) {
    products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product || !size) return;

    const existingItem = cart.find(item => item.id === productId && item.size === size && item.color === color);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            color: color,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    saveCartToFirestore();
}

function removeFromCart(productId, size, color = null) {
    cart = cart.filter(item => {
        return !(item.id === productId && item.size === size && item.color === color);
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    saveCartToFirestore();
}

function updateQuantity(productId, size, quantity, color = null) {
    if (quantity <= 0) {
        removeFromCart(productId, size, color);
        return;
    }
    
    const itemIndex = cart.findIndex(item => 
        item.id === productId && 
        item.size === size && 
        item.color === color
    );
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        saveCartToFirestore();
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

function showStockError(stock) {
    document.body.classList.add('modal-open');
    const modal = document.createElement('div');
    modal.className = 'custom-modal active';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            </div>
            <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 16px;">Stock limité</h3>
            <p style="margin-bottom: 24px;">Vous avez déjà ${stock} article${stock > 1 ? 's' : ''} dans votre panier. C'est le stock maximum disponible pour cette variante.</p>
            <button class="btn-primary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Compris</button>
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

async function showSizeGuide(sizeGuideId) {
    // Charger depuis Firestore en priorité
    let guide = null;
    if (window.firebaseReady && window.firebaseModules) {
        try {
            const { doc, getDoc } = window.firebaseModules;
            const snap = await getDoc(doc(window.firebaseDb, 'sizeGuides', `${sizeGuideId}`));
            if (snap.exists()) {
                guide = snap.data();
                if (typeof guide.rows === 'string') guide.rows = JSON.parse(guide.rows);
            }
        } catch (e) {
            console.error('Erreur chargement guide Firestore:', e);
        }
    }
    if (!guide) {
        const guides = JSON.parse(localStorage.getItem('sizeGuides')) || [];
        guide = guides.find(g => g.id == sizeGuideId);
    }
    
    // Identifier les colonnes numériques (dimensions) pour la conversion
    // Une cellule est numérique si elle contient uniquement des chiffres, tirets et points
    function isNumeric(val) {
        return /^[\d.,\-]+$/.test(String(val).trim());
    }
    
    function convertCell(val, toInch) {
        if (!toInch) return val;
        // Gère les plages "94-98"
        return String(val).replace(/[\d.]+/g, n => (parseFloat(n) / 2.54).toFixed(1));
    }
    
    function buildTable(guide, toInch) {
        if (!guide || !guide.columns || !guide.rows) return buildDefaultTable(toInch);
        
        // Détecter quelles colonnes sont numériques (hors première colonne Taille)
        const numericCols = guide.columns.map((col, i) => {
            if (i === 0) return false;
            return guide.rows.some(row => isNumeric(row[i]));
        });
        
        const headers = guide.columns.map((col, i) => {
            if (!numericCols[i]) return col;
            // Remplacer (cm) par (in) si besoin
            return toInch ? col.replace(/\(cm\)/gi, '(in)') : col.replace(/\(in\)/gi, '(cm)');
        });
        
        return `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border);">
                        ${headers.map(col => `<th style="padding: 12px;">${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${guide.rows.map((row, index) => `
                        <tr style="${index < guide.rows.length - 1 ? 'border-bottom: 1px solid var(--border);' : ''}">
                            ${row.map((cell, i) => `<td style="padding: 12px;">${numericCols[i] ? convertCell(cell, toInch) : cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    function buildDefaultTable(toInch) {
        const unit = toInch ? 'in' : 'cm';
        const rows = [
            ['S', '94-98', '68'],
            ['M', '98-102', '70'],
            ['L', '102-106', '72'],
            ['XL', '106-110', '74']
        ];
        return `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <th style="padding: 12px;">Taille</th>
                        <th style="padding: 12px;">Poitrine (${unit})</th>
                        <th style="padding: 12px;">Longueur (${unit})</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((row, i) => `
                        <tr style="${i < rows.length - 1 ? 'border-bottom: 1px solid var(--border);' : ''}">
                            <td style="padding: 12px;">${row[0]}</td>
                            <td style="padding: 12px;">${toInch ? row[1].replace(/[\d.]+/g, n => (parseFloat(n)/2.54).toFixed(1)) : row[1]}</td>
                            <td style="padding: 12px;">${toInch ? (parseFloat(row[2])/2.54).toFixed(1) : row[2]}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    let isInch = false;
    
    document.body.classList.add('modal-open');
    const modal = document.createElement('div');
    modal.className = 'custom-modal active';
    modal.innerHTML = `
        <div class="custom-modal-content" style="max-width: 600px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                <h3 style="font-size: 20px; font-weight: 400; margin: 0;">Tableau des tailles</h3>
                <button id="unitToggleBtn" class="btn-sizeguide" style="font-size: 13px; padding: 6px 14px;">Afficher en pouces (in)</button>
            </div>
            <div id="sizeGuideTableContainer">${buildTable(guide, false)}</div>
            <button class="btn-primary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Fermer</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#unitToggleBtn').addEventListener('click', function() {
        isInch = !isInch;
        modal.querySelector('#sizeGuideTableContainer').innerHTML = buildTable(guide, isInch);
        this.textContent = isInch ? 'Afficher en cm' : 'Afficher en pouces (in)';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Écouter l'état de connexion Firebase pour synchroniser le panier
    const waitForAuth = setInterval(() => {
        if (window.firebaseReady && window.firebaseAuth && window.firebaseModules?.onAuthStateChanged) {
            clearInterval(waitForAuth);
            const { onAuthStateChanged } = window.firebaseModules;
            onAuthStateChanged(window.firebaseAuth, async (user) => {
                if (user) {
                    // Connexion : fusionner panier local + panier Firestore
                    const localCart = [...cart];
                    const savedCart = await loadCartFromFirestore(user.uid);
                    const merged = mergeCarts(savedCart, localCart);
                    cart = merged;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    await saveCartToFirestore();
                }
                // Déconnexion : on garde le localStorage tel quel (vidé par account.js)
            });
        }
    }, 100);

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
    
    // Hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
});
