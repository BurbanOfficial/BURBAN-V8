// Admin credentials
const ADMIN_CREDENTIALS = {
    email: 'direction@burbanofficial.com',
    password: 'CMS_TEAM_BURBAN'
};

let isAuthenticated = false;
let twoFAVerified = false;
let totpInstance = null;

// Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const error = document.getElementById('loginError');
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        isAuthenticated = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('admin2FA').style.display = 'block';
        error.textContent = '';
        
        // Initialize TOTP
        initializeTOTP();
    } else {
        error.textContent = 'Email ou mot de passe incorrect';
    }
});

// Initialize TOTP (Google Authenticator)
function initializeTOTP() {
    const email = ADMIN_CREDENTIALS.email;
    const secretKey = 'totp_secret_burban_cms';
    let secretBase32 = localStorage.getItem(secretKey);
    
    if (!secretBase32) {
        const secret = new OTPAuth.Secret({ size: 20 });
        secretBase32 = secret.base32;
        localStorage.setItem(secretKey, secretBase32);
        
        totpInstance = new OTPAuth.TOTP({
            issuer: 'BURBAN CMS',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secret
        });
        
        const uri = totpInstance.toString();
        const qrSection = document.getElementById('qrCodeSection');
        const qrDiv = document.getElementById('qrcode');
        
        qrSection.style.display = 'block';
        qrDiv.innerHTML = '';
        
        new QRCode(qrDiv, {
            text: uri,
            width: 250,
            height: 250,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        document.getElementById('codePrompt').textContent = 'Scannez le QR code puis entrez le code généré';
    } else {
        document.getElementById('qrCodeSection').style.display = 'none';
        document.getElementById('codePrompt').textContent = 'Entrez le code de votre application';
        
        totpInstance = new OTPAuth.TOTP({
            issuer: 'BURBAN CMS',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secretBase32)
        });
    }
}

// Vérifier le code TOTP
document.getElementById('twoFAForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('twoFACode').value;
    const error = document.getElementById('twoFAError');
    
    if (!totpInstance) {
        error.textContent = 'Erreur d\'initialisation';
        return;
    }
    
    // Vérifier le code (avec fenêtre de tolérance de ±1 période)
    const delta = totpInstance.validate({ token: code, window: 1 });
    
    if (delta !== null) {
        twoFAVerified = true;
        sessionStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminAuthExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
        document.getElementById('admin2FA').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadDashboard();
        error.textContent = '';
    } else {
        error.textContent = 'Code incorrect ou expiré';
        document.getElementById('twoFACode').value = '';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');
    window.location.reload();
});

// Check auth on load
const authExpiry = localStorage.getItem('adminAuthExpiry');
if (sessionStorage.getItem('adminAuth') === 'true' && authExpiry && Date.now() < parseInt(authExpiry)) {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('admin2FA').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadDashboard();
} else {
    sessionStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');
}

// Menu navigation
document.querySelectorAll('.admin-menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.admin-menu-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        document.getElementById(link.dataset.section + 'Section').classList.add('active');
    });
});

// Load Dashboard
function loadDashboard() {
    loadProducts();
    loadOrders();
    loadUsers();
    if (typeof loadSizeGuides === 'function') loadSizeGuides();
}

// Products Management
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const products = JSON.parse(localStorage.getItem('adminProducts')) || window.products || [];
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}"></td>
            <td>${product.name}</td>
            <td>${product.price} €</td>
            <td>${product.category}</td>
            <td>${product.gender === 'men' ? 'Homme' : 'Femme'}</td>
            <td>
                <div class="admin-actions">
                    <button class="admin-btn" onclick="editProduct(${product.id})">Modifier</button>
                    <button class="admin-btn admin-btn-delete" onclick="deleteProduct(${product.id})">Supprimer</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Add Product
document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('active');
});

// Product Form
document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const products = JSON.parse(localStorage.getItem('adminProducts')) || window.products || [];
    const id = document.getElementById('productId').value;
    
    const product = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        gender: document.getElementById('productGender').value,
        image: document.getElementById('productImage').value,
        sizes: document.getElementById('productSizes').value.split(',').map(s => s.trim()),
        colors: document.getElementById('productColors').value.split(',').map(c => c.trim())
    };
    
    if (id) {
        const index = products.findIndex(p => p.id === parseInt(id));
        products[index] = product;
    } else {
        products.push(product);
    }
    
    localStorage.setItem('adminProducts', JSON.stringify(products));
    window.products = products;
    loadProducts();
    document.getElementById('productModal').classList.remove('active');
});

function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('adminProducts')) || window.products || [];
    const product = products.find(p => p.id === id);
    
    if (product) {
        document.getElementById('productModalTitle').textContent = 'Modifier le produit';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productGender').value = product.gender;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productSizes').value = product.sizes.join(', ');
        document.getElementById('productColors').value = product.colors.join(', ');
        document.getElementById('productModal').classList.add('active');
    }
}

function deleteProduct(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        let products = JSON.parse(localStorage.getItem('adminProducts')) || window.products || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem('adminProducts', JSON.stringify(products));
        window.products = products;
        loadProducts();
    }
}

// Orders Management
function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const orders = [];
    
    users.forEach(user => {
        if (user.orders) {
            user.orders.forEach(order => {
                orders.push({
                    ...order,
                    userName: `${user.firstName} ${user.lastName}`,
                    userEmail: user.email
                });
            });
        }
    });
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gray);">Aucune commande</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.userName}<br><small style="color: var(--gray);">${order.userEmail}</small></td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>${order.total.toFixed(2)} €</td>
            <td><span style="color: green;">Confirmée</span></td>
        </tr>
    `).join('');
}

// Users Management
function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--gray);">Aucun utilisateur</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.orders ? user.orders.length : 0}</td>
            <td>${new Date(user.id).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Modal close
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
});

// Settings Form
document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Paramètres enregistrés avec succès');
});
