document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('authSection');
    const accountSection = document.getElementById('accountSection');
    const { onAuthStateChanged } = window.firebaseModules;
    const auth = window.firebaseAuth;
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            authSection.style.display = 'none';
            accountSection.style.display = 'block';
            loadAccountData(user);
        } else {
            authSection.style.display = 'block';
            accountSection.style.display = 'none';
        }
    });
    
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
    document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;
        const { signInWithEmailAndPassword } = window.firebaseModules;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Erreur de connexion:', error);
            if (error.code === 'auth/user-not-found') {
                alert('Aucun compte trouvé avec cet email. Veuillez vous inscrire.');
            } else if (error.code === 'auth/wrong-password') {
                alert('Mot de passe incorrect');
            } else if (error.code === 'auth/invalid-email') {
                alert('Email invalide');
            } else if (error.code === 'auth/invalid-credential') {
                alert('Email ou mot de passe incorrect');
            } else {
                alert('Erreur de connexion: ' + error.message);
            }
        }
    });
    
    // Register
    document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = e.target[0].value;
        const lastName = e.target[1].value;
        const email = e.target[2].value;
        const password = e.target[3].value;
        const { createUserWithEmailAndPassword, updateProfile, doc, setDoc } = window.firebaseModules;
        const db = window.firebaseDb;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                firstName,
                lastName,
                email,
                phone: '',
                addresses: [],
                orders: [],
                createdAt: new Date().toISOString()
            });
            alert('Compte créé avec succès !');
        } catch (error) {
            console.error('Erreur inscription:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert('Cet email est déjà utilisé');
            } else if (error.code === 'auth/weak-password') {
                alert('Le mot de passe doit contenir au moins 6 caractères');
            } else {
                alert('Erreur lors de l\'inscription: ' + error.message);
            }
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
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { signOut } = window.firebaseModules;
        await signOut(auth);
        window.location.href = 'index.html';
    });
    
    // Profile form
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { doc, updateDoc } = window.firebaseModules;
        const db = window.firebaseDb;
        
        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value
            });
            alert('Profil mis à jour');
        } catch (error) {
            alert('Erreur: ' + error.message);
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
    
    document.getElementById('addressForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { doc, getDoc, updateDoc } = window.firebaseModules;
        const db = window.firebaseDb;
        
        const address = {
            name: e.target[0].value,
            address: e.target[1].value,
            address2: e.target[2].value,
            postal: e.target[3].value,
            city: e.target[4].value,
            country: e.target[5].value,
            phone: e.target[6].value
        };
        
        try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            const addresses = userDoc.data().addresses || [];
            addresses.push(address);
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { addresses });
            modal.classList.remove('active');
            loadAccountData(auth.currentUser);
            e.target.reset();
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    });
});

async function loadAccountData(user) {
    if (!user) return;
    const { doc, getDoc } = window.firebaseModules;
    const db = window.firebaseDb;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        document.getElementById('userName').textContent = user.displayName || 'Mon Compte';
        document.getElementById('firstName').value = userData?.firstName || '';
        document.getElementById('lastName').value = userData?.lastName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = userData?.phone || '';
        
        loadOrders(userData?.orders || []);
        loadAddresses(userData?.addresses || []);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function loadOrders(orders = []) {
    const ordersList = document.getElementById('ordersList');
    
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

function loadAddresses(addresses = []) {
    const addressesList = document.getElementById('addressesList');
    
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

async function deleteAddress(index) {
    const { doc, getDoc, updateDoc } = window.firebaseModules;
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const addresses = userDoc.data().addresses || [];
        addresses.splice(index, 1);
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { addresses });
        loadAccountData(auth.currentUser);
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

window.deleteAddress = deleteAddress;
