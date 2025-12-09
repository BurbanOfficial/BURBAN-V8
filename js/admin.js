let currentUser = null;
let userRole = null;
let totpInstance = null;

// Login avec Firebase
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const error = document.getElementById('loginError');
    
    try {
        const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuth();
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        
        const { doc, getDoc } = window.firebaseModules;
        const crewDoc = await getDoc(doc(window.firebaseDb, 'crew', currentUser.uid));
        
        if (!crewDoc.exists()) {
            error.textContent = 'Accès non autorisé';
            auth.signOut();
            return;
        }
        
        const isBlocked = await window.securityLogger.checkBlockedUser(currentUser.uid);
        if (isBlocked) {
            window.securityLogger.showBlockedScreen();
            return;
        }
        
        userRole = crewDoc.data().role;
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('userId', currentUser.uid);
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userFirstname', crewDoc.data().firstname || '');
        sessionStorage.setItem('userLastname', crewDoc.data().lastname || '');
        
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('admin2FA').style.display = 'block';
        error.textContent = '';
        
        initializeTOTP();
    } catch (err) {
        error.textContent = 'Email ou mot de passe incorrect';
    }
});

// Initialize TOTP (Google Authenticator)
function initializeTOTP() {
    const email = currentUser.email;
    const secretKey = `totp_secret_${currentUser.uid}`;
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
document.getElementById('twoFAForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('twoFACode').value;
    const error = document.getElementById('twoFAError');
    
    if (!totpInstance) {
        error.textContent = 'Erreur d\'initialisation';
        return;
    }
    
    const delta = totpInstance.validate({ token: code, window: 1 });
    const twoFASuccess = delta !== null;
    
    if (twoFASuccess) {
        const userId = sessionStorage.getItem('userId');
        const email = sessionStorage.getItem('userEmail');
        const role = sessionStorage.getItem('userRole');
        const firstname = sessionStorage.getItem('userFirstname');
        const lastname = sessionStorage.getItem('userLastname');
        
        const securityScore = await window.securityLogger.logLogin(userId, email, role, firstname, lastname, true);
        
        if (securityScore < 40) {
            window.securityLogger.showBlockedScreen();
            return;
        } else if (securityScore >= 40 && securityScore <= 70) {
            await window.securityLogger.showSuspiciousWarning(email);
        }
        
        sessionStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminAuthExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
        document.getElementById('admin2FA').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        applyRolePermissions();
        loadDashboard();
        error.textContent = '';
    } else {
        error.textContent = 'Code incorrect ou expiré';
        document.getElementById('twoFACode').value = '';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const userId = sessionStorage.getItem('userId');
    const email = sessionStorage.getItem('userEmail');
    const role = sessionStorage.getItem('userRole');
    
    if (userId && window.securityLogger) {
        await window.securityLogger.logLogout(userId, email, role);
    }
    
    sessionStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');
    window.location.reload();
});

// Logger la déconnexion lors de la fermeture de l'onglet
window.addEventListener('beforeunload', () => {
    const userId = sessionStorage.getItem('userId');
    const email = sessionStorage.getItem('userEmail');
    const role = sessionStorage.getItem('userRole');
    
    if (userId && sessionStorage.getItem('adminAuth') === 'true' && window.securityLogger) {
        navigator.sendBeacon(
            'https://firestore.googleapis.com/v1/projects/burban-fidelity/databases/(default)/documents/login_history',
            JSON.stringify({
                fields: {
                    userId: { stringValue: userId },
                    email: { stringValue: email },
                    role: { stringValue: role },
                    timestamp: { stringValue: new Date().toISOString() },
                    event: { stringValue: 'logout' },
                    securityScore: { integerValue: 100 }
                }
            })
        );
    }
});

// Check auth on load
const authExpiry = localStorage.getItem('adminAuthExpiry');
if (sessionStorage.getItem('adminAuth') === 'true' && authExpiry && Date.now() < parseInt(authExpiry)) {
    userRole = sessionStorage.getItem('userRole');
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('admin2FA').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    applyRolePermissions();
    loadDashboard();
} else {
    sessionStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');
}

// Appliquer les permissions selon le rôle
function applyRolePermissions() {
    const role = userRole || sessionStorage.getItem('userRole');
    
    if (role === 'customer_support') {
        // Masquer sections
        document.querySelector('[data-section="categories"]').style.display = 'none';
        document.querySelector('[data-section="users"]').style.display = 'none';
        document.querySelector('[data-section="history"]').style.display = 'none';
        document.querySelector('[data-section="settings"]').style.display = 'none';
        
        // Désactiver modifications produits
        document.querySelectorAll('#productsSection .admin-btn-delete, #productsSection .admin-btn, #addProductBtn, #addSizeGuideBtn').forEach(el => el.style.display = 'none');
    } else if (role === 'limited_operator') {
        // Masquer sections
        document.querySelector('[data-section="orders"]').style.display = 'none';
        document.querySelector('[data-section="clients"]').style.display = 'none';
        document.querySelector('[data-section="users"]').style.display = 'none';
        document.querySelector('[data-section="history"]').style.display = 'none';
        document.querySelector('[data-section="settings"]').style.display = 'none';
    }
}

// Menu navigation
document.querySelectorAll('.admin-menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.admin-menu-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        document.getElementById(link.dataset.section + 'Section').classList.add('active');
        
        if (link.dataset.section === 'clients' && typeof loadClients === 'function') {
            loadClients();
        } else if (link.dataset.section === 'users' && typeof loadCrewUsers === 'function') {
            loadCrewUsers();
        } else if (link.dataset.section === 'history' && typeof loadHistory === 'function') {
            loadHistory();
        }
    });
});

// Load Dashboard
function loadDashboard() {
    loadProducts();
    loadOrders();
    if (typeof loadClients === 'function') loadClients();
    if (typeof loadCrewUsers === 'function') loadCrewUsers();
    if (typeof loadSizeGuides === 'function') loadSizeGuides();
}

// Products Management
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const products = JSON.parse(localStorage.getItem('adminProducts')) || window.products || [];
    const role = sessionStorage.getItem('userRole');
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}"></td>
            <td>${product.name}</td>
            <td>${product.price} €</td>
            <td>${product.category}</td>
            <td>${product.gender === 'men' ? 'Homme' : 'Femme'}</td>
            <td>
                ${role === 'customer_support' ? '<span style="color: var(--gray);">Lecture seule</span>' : `
                <div class="admin-actions">
                    <button class="admin-btn" onclick="editProduct(${product.id})">Modifier</button>
                    <button class="admin-btn admin-btn-delete" onclick="deleteProduct(${product.id})">Supprimer</button>
                </div>
                `}
            </td>
        </tr>
    `).join('');
}

// Add Product
document.getElementById('addProductBtn').addEventListener('click', () => {
    const role = sessionStorage.getItem('userRole');
    if (role === 'customer_support') {
        alert('Vous n\'avez pas les permissions pour ajouter des produits');
        return;
    }
    
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
    const role = sessionStorage.getItem('userRole');
    if (role === 'customer_support') {
        alert('Vous n\'avez pas les permissions pour modifier les produits');
        return;
    }
    
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
    const role = sessionStorage.getItem('userRole');
    if (role === 'customer_support') {
        alert('Vous n\'avez pas les permissions pour supprimer les produits');
        return;
    }
    
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

// Bouton ajouter crew user
document.getElementById('addCrewUserBtn')?.addEventListener('click', () => {
    window.open('create-crew.html', '_blank');
});

// Modal close
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
});

// Settings Form
document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Paramètres enregistrés avec succès');
});
