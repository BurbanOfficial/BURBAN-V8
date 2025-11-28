document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('authSection');
    const accountSection = document.getElementById('accountSection');
    
    if (currentUser) {
        authSection.style.display = 'none';
        accountSection.style.display = 'block';
        loadAccountData();
    } else {
        authSection.style.display = 'block';
        accountSection.style.display = 'none';
    }
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
        });
    });
    
    // Login
    document.getElementById('loginFormElement').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;
        
        if (login(email, password)) {
            window.location.reload();
        } else {
            alert('Email ou mot de passe incorrect');
        }
    });
    
    // Register
    document.getElementById('registerFormElement').addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            firstName: e.target[0].value,
            lastName: e.target[1].value,
            email: e.target[2].value,
            password: e.target[3].value
        };
        
        if (register(userData)) {
            window.location.reload();
        } else {
            alert('Cet email est déjà utilisé');
        }
    });
    
    // Account navigation
    document.querySelectorAll('.account-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.account-nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.account-panel').forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.dataset.section + 'Panel').classList.add('active');
        });
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        window.location.href = 'index.html';
    });
    
    // Profile form
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };
        
        if (updateUser(userData)) {
            alert('Profil mis à jour');
        }
    });
    
    // Address modal
    const modal = document.getElementById('addressModal');
    document.getElementById('addAddressBtn')?.addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    document.querySelector('.modal-close')?.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    document.getElementById('addressForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const address = {
            name: e.target[0].value,
            address: e.target[1].value,
            address2: e.target[2].value,
            postal: e.target[3].value,
            city: e.target[4].value,
            country: e.target[5].value,
            phone: e.target[6].value
        };
        
        const addresses = currentUser.addresses || [];
        addresses.push(address);
        updateUser({ addresses });
        modal.classList.remove('active');
        loadAddresses();
        e.target.reset();
    });
});

function loadAccountData() {
    if (!currentUser) return;
    
    document.getElementById('userName').textContent = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Mon Compte';
    document.getElementById('firstName').value = currentUser.firstName || '';
    document.getElementById('lastName').value = currentUser.lastName || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('phone').value = currentUser.phone || '';
    
    loadOrders();
    loadAddresses();
}

function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    const orders = currentUser.orders || [];
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="empty-state">Aucune commande pour le moment</p>';
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <strong>Commande #${order.id}</strong>
                    <p>${new Date(order.date).toLocaleDateString()}</p>
                </div>
                <strong>${order.total.toFixed(2)} €</strong>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.name} (${item.size}) x${item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function loadAddresses() {
    const addressesList = document.getElementById('addressesList');
    const addresses = currentUser.addresses || [];
    
    if (addresses.length === 0) {
        addressesList.innerHTML = '<p class="empty-state">Aucune adresse enregistrée</p>';
        return;
    }
    
    addressesList.innerHTML = addresses.map((address, index) => `
        <div class="address-card">
            <button onclick="deleteAddress(${index})">Supprimer</button>
            <strong>${address.name}</strong>
            <p>${address.address}</p>
            ${address.address2 ? `<p>${address.address2}</p>` : ''}
            <p>${address.postal} ${address.city}</p>
            <p>${address.country}</p>
            <p>${address.phone}</p>
        </div>
    `).join('');
}

function deleteAddress(index) {
    const addresses = currentUser.addresses || [];
    addresses.splice(index, 1);
    updateUser({ addresses });
    loadAddresses();
}
