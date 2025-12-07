document.addEventListener('DOMContentLoaded', () => {
    // Animation des personnages
    const authForms = document.querySelectorAll('.auth-form');
    const characters = document.querySelectorAll('.character');
    
    authForms.forEach(form => {
        form.addEventListener('mouseenter', () => {
            characters.forEach(char => {
                char.classList.add('impressed');
                char.querySelectorAll('.face-normal').forEach(f => f.style.display = 'none');
                char.querySelectorAll('.face-impressed').forEach(f => f.style.display = 'block');
                char.querySelectorAll('.face-sad').forEach(f => f.style.display = 'none');
            });
        });
        
        form.addEventListener('mouseleave', () => {
            characters.forEach(char => {
                char.classList.remove('impressed');
                char.querySelectorAll('.face-normal').forEach(f => f.style.display = 'block');
                char.querySelectorAll('.face-impressed').forEach(f => f.style.display = 'none');
                char.querySelectorAll('.face-sad').forEach(f => f.style.display = 'none');
            });
        });
    });
    
    // Fonction pour afficher la tête triste
    window.showSadCharacters = () => {
        characters.forEach(char => {
            char.classList.remove('impressed');
            char.classList.add('sad');
            char.querySelectorAll('.face-normal').forEach(f => f.style.display = 'none');
            char.querySelectorAll('.face-impressed').forEach(f => f.style.display = 'none');
            char.querySelectorAll('.face-sad').forEach(f => f.style.display = 'block');
            
            setTimeout(() => {
                char.classList.remove('sad');
                char.querySelectorAll('.face-normal').forEach(f => f.style.display = 'block');
                char.querySelectorAll('.face-sad').forEach(f => f.style.display = 'none');
            }, 2000);
        });
    };
    
    const waitForFirebase = setInterval(() => {
        if (!window.firebaseReady) return;
        clearInterval(waitForFirebase);
        
        const authSection = document.getElementById('authSection');
        const accountSection = document.getElementById('accountSection');
        const { onAuthStateChanged } = window.firebaseModules;
        const auth = window.firebaseAuth;
        
        console.log('Firebase chargé, initialisation compte...');
        
        // Phone formatting
        const phoneFormats = {
            '+213': { placeholder: '551 23 45 67', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') },
            '+49': { placeholder: '151 23456789', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{8})/, '$1 $2') },
            '+966': { placeholder: '50 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+61': { placeholder: '412 345 678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') },
            '+43': { placeholder: '664 123456', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{6})/, '$1 $2') },
            '+32': { placeholder: '470 12 34 56', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') },
            '+55': { placeholder: '(11) 91234-5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') },
            '+1': { placeholder: '(555) 123-4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') },
            '+86': { placeholder: '138 0013 8000', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3') },
            '+82': { placeholder: '010-1234-5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
            '+45': { placeholder: '20 12 34 56', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') },
            '+20': { placeholder: '100 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+971': { placeholder: '50 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+34': { placeholder: '612 34 56 78', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') },
            '+358': { placeholder: '041 234 5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+33': { placeholder: '6 12 34 56 78', format: (v) => v.replace(/\D/g, '').replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5') },
            '+30': { placeholder: '691 234 5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+36': { placeholder: '20 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+91': { placeholder: '81234 56789', format: (v) => v.replace(/\D/g, '').replace(/(\d{5})(\d{5})/, '$1 $2') },
            '+62': { placeholder: '812-3456-7890', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
            '+353': { placeholder: '085 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+39': { placeholder: '312 345 6789', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+81': { placeholder: '90-1234-5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3') },
            '+352': { placeholder: '628 123 456', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') },
            '+60': { placeholder: '12-345 6789', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2 $3') },
            '+212': { placeholder: '650-123456', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{6})/, '$1-$2') },
            '+52': { placeholder: '222 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+47': { placeholder: '406 12 345', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{3})/, '$1 $2 $3') },
            '+64': { placeholder: '021 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+31': { placeholder: '6 12345678', format: (v) => v.replace(/\D/g, '').replace(/(\d{1})(\d{8})/, '$1 $2') },
            '+63': { placeholder: '905 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+48': { placeholder: '512 345 678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') },
            '+351': { placeholder: '912 345 678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') },
            '+420': { placeholder: '601 123 456', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') },
            '+40': { placeholder: '712 345 678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') },
            '+44': { placeholder: '7400 123456', format: (v) => v.replace(/\D/g, '').replace(/(\d{4})(\d{6})/, '$1 $2') },
            '+7': { placeholder: '912 345-67-89', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2-$3-$4') },
            '+65': { placeholder: '8123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{4})(\d{4})/, '$1 $2') },
            '+46': { placeholder: '70-123 45 67', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1-$2 $3 $4') },
            '+41': { placeholder: '78 123 45 67', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4') },
            '+66': { placeholder: '081 234 5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+216': { placeholder: '20 123 456', format: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3') },
            '+90': { placeholder: '501 234 5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+84': { placeholder: '091 234 5678', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
            '+27': { placeholder: '071 123 4567', format: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
        };
        
        const phoneCodeSelect = document.getElementById('regPhoneCode');
        const phoneInput = document.getElementById('regPhone');
        
        function updatePhoneFormat() {
            const code = phoneCodeSelect.value;
            const format = phoneFormats[code];
            if (format) {
                phoneInput.placeholder = format.placeholder;
            }
        }
        
        phoneCodeSelect?.addEventListener('change', () => {
            phoneInput.value = '';
            updatePhoneFormat();
        });
        
        phoneInput?.addEventListener('input', (e) => {
            const code = phoneCodeSelect.value;
            const format = phoneFormats[code];
            if (format) {
                const cursorPos = e.target.selectionStart;
                const oldLength = e.target.value.length;
                e.target.value = format.format(e.target.value);
                const newLength = e.target.value.length;
                e.target.setSelectionRange(cursorPos + (newLength - oldLength), cursorPos + (newLength - oldLength));
            }
        });
        
        updatePhoneFormat();
        
        onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', user ? 'Connecté' : 'Déconnecté');
        if (user) {
            authSection.style.display = 'none';
            accountSection.style.display = 'block';
            loadAccountData(user);
        } else {
            authSection.style.display = 'block';
            accountSection.style.display = 'none';
        }
        });
        
        // Auth tabs with loader
        document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Show mini loader
            const miniLoader = document.createElement('div');
            miniLoader.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <img src="https://i.imgur.com/Kl9kTBg.png" style="width: 60px; filter: brightness(0) invert(1);">
                        <div style="display: flex; gap: 6px;">
                            <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite;"></div>
                            <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                            <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.4s;"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(miniLoader);
            
            setTimeout(() => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
                miniLoader.remove();
            }, 500);
        });
    });
    
    // Login
    document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = e.target[1].value;
        const { signInWithEmailAndPassword } = window.firebaseModules;
        
        // Show loader
        const loginLoader = document.createElement('div');
        loginLoader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    <img src="https://i.imgur.com/Kl9kTBg.png" style="width: 60px; filter: brightness(0) invert(1);">
                    <div style="display: flex; gap: 6px;">
                        <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite;"></div>
                        <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                        <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.4s;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(loginLoader);
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginLoader.remove();
        } catch (error) {
            loginLoader.remove();
            console.error('Erreur de connexion:', error);
            if (error.code === 'auth/user-not-found') {
                showMessage('Aucun compte trouvé avec cet email. Veuillez vous inscrire.');
            } else if (error.code === 'auth/wrong-password') {
                showMessage('Mot de passe incorrect');
            } else if (error.code === 'auth/invalid-email') {
                showMessage('Email invalide');
            } else if (error.code === 'auth/invalid-credential') {
                showMessage('Email ou mot de passe incorrect');
            } else {
                showMessage('Erreur de connexion: ' + error.message);
            }
        }
    });
    
    // Forgot Password
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', async () => {
        let email = document.getElementById('loginEmail').value;
        
        if (!email) {
            showPrompt('Entrez votre adresse email :', async (inputEmail) => {
                if (inputEmail) {
                    await sendResetEmail(inputEmail);
                }
            });
        } else {
            showConfirm(`Envoyer un email de réinitialisation à : ${email} ?`, async () => {
                await sendResetEmail(email);
            });
        }
    });
    
    async function sendResetEmail(email) {
        const { sendPasswordResetEmail } = window.firebaseModules;
        const auth = window.firebaseAuth;
        try {
            await sendPasswordResetEmail(auth, email);
            showMessage('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
        } catch (error) {
            console.error('Erreur:', error);
            if (error.code === 'auth/user-not-found') {
                showMessage('Aucun compte trouvé avec cet email.');
            } else if (error.code === 'auth/invalid-email') {
                showMessage('Adresse email invalide.');
            } else {
                showMessage('Erreur: ' + error.message);
            }
        }
    }
    
    function showPrompt(message, callback) {
        document.body.classList.add('modal-open');
        const modal = document.createElement('div');
        modal.className = 'custom-modal active';
        modal.innerHTML = `
            <div class="custom-modal-content">
                <p>${message}</p>
                <input type="email" id="promptInput" style="width: 100%; margin: 16px 0; padding: 12px; border: 1px solid var(--border);" placeholder="Email">
                <div style="display: flex; gap: 12px;">
                    <button class="btn-secondary" style="flex: 1;" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Annuler</button>
                    <button class="btn-primary" style="flex: 1;" id="promptOk">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const input = modal.querySelector('#promptInput');
        input.focus();
        modal.querySelector('#promptOk').onclick = () => {
            callback(input.value);
            document.body.classList.remove('modal-open');
            modal.remove();
        };
    }
    
    function showConfirm(message, callback) {
        document.body.classList.add('modal-open');
        const modal = document.createElement('div');
        modal.className = 'custom-modal active';
        modal.innerHTML = `
            <div class="custom-modal-content">
                <p>${message}</p>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button class="btn-secondary" style="flex: 1;" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Annuler</button>
                    <button class="btn-primary" style="flex: 1;" id="confirmOk">Confirmer</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#confirmOk').onclick = () => {
            callback();
            document.body.classList.remove('modal-open');
            modal.remove();
        };
    }
    
    // Register
    document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('regFirstName').value;
        const lastName = document.getElementById('regLastName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const phoneCode = document.getElementById('regPhoneCode').value;
        const phoneNumber = document.getElementById('regPhone').value;
        const birthday = document.getElementById('regBirthday').value;
        const { createUserWithEmailAndPassword, updateProfile, doc, setDoc } = window.firebaseModules;
        const db = window.firebaseDb;
        
        // Show loader
        const registerLoader = document.createElement('div');
        registerLoader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    <img src="https://i.imgur.com/Kl9kTBg.png" style="width: 60px; filter: brightness(0) invert(1);">
                    <div style="display: flex; gap: 6px;">
                        <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite;"></div>
                        <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                        <div style="width: 8px; height: 8px; background-image: url('https://i.imgur.com/2vSFewG.png'); background-size: contain; filter: brightness(0) invert(1); animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.4s;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(registerLoader);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });
            const { arrayUnion } = window.firebaseModules;
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                firstname: firstName,
                lastname: lastName,
                email,
                phone: phoneNumber ? `${phoneCode}${phoneNumber}` : '',
                birthday,
                country: 'France',
                newsletter: false,
                favorites: [],
                points: 100,
                pointsHistory: [
                    {
                        points: 100,
                        description: 'Bonus d\'inscription',
                        date: new Date().toISOString()
                    }
                ],
                addresses: [],
                orders: [],
                createdAt: new Date()
            });
            registerLoader.remove();
            showMessage('Compte créé avec succès ! Vous avez reçu 100 points de bienvenue.');
        } catch (error) {
            registerLoader.remove();
            console.error('Erreur inscription:', error);
            if (error.code === 'auth/email-already-in-use') {
                showMessage('Cet email est déjà utilisé');
            } else if (error.code === 'auth/weak-password') {
                showMessage('Le mot de passe doit contenir au moins 6 caractères');
            } else {
                showMessage('Erreur lors de l\'inscription: ' + error.message);
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
                firstname: document.getElementById('firstName').value,
                lastname: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value
            });
            showMessage('Profil mis à jour');
        } catch (error) {
            showMessage('Erreur: ' + error.message);
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
            firstName: e.target[1].value,
            lastName: e.target[2].value,
            email: e.target[3].value,
            phone: e.target[4].value,
            address: e.target[5].value,
            address2: e.target[6].value,
            postal: e.target[7].value,
            city: e.target[8].value,
            country: e.target[9].value
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
            showMessage('Erreur: ' + error.message);
        }
        });
    }, 100);
});

async function loadAccountData(user) {
    if (!user) return;
    const { doc, getDoc } = window.firebaseModules;
    const db = window.firebaseDb;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        document.getElementById('userName').textContent = user.displayName || 'Mon Compte';
        document.getElementById('firstName').value = userData?.firstname || '';
        document.getElementById('lastName').value = userData?.lastname || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = userData?.phone || '';
        
        loadLoyalty(userData?.points || 0, userData?.pointsHistory || []);
        loadFavorites(userData?.favorites || []);
        loadOrders(userData?.orders || []);
        loadAddresses(userData?.addresses || []);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function loadFavorites(favoriteIds = []) {
    const favoritesList = document.getElementById('favoritesList');
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    
    if (favoriteIds.length === 0) {
        favoritesList.innerHTML = '<p class="empty-state" style="grid-column: 1 / -1; text-align: center;">Aucun favori pour le moment</p>';
        return;
    }
    
    const favoriteProducts = products.filter(p => favoriteIds.includes(p.id));
    
    favoritesList.innerHTML = favoriteProducts.map(product => `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${product.price.toFixed(2)} €</p>
        </div>
    `).join('');
}

async function loadOrders(orderNumbers = []) {
    const ordersList = document.getElementById('ordersList');
    
    if (orderNumbers.length === 0) {
        ordersList.innerHTML = '<p class="empty-state">Aucune commande pour le moment</p>';
        return;
    }
    
    try {
        const { doc, getDoc } = window.firebaseModules;
        const orders = [];
        
        for (const orderNumber of orderNumbers) {
            const orderDoc = await getDoc(doc(window.firebaseDb, 'orders', orderNumber));
            if (orderDoc.exists()) {
                orders.push(orderDoc.data());
            }
        }
        
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        ordersList.innerHTML = orders.map(order => {
            const statusStep = order.status === 'cancelled' ? 0 : order.status === 'processing' ? 1 : order.status === 'shipped' ? 2 : 3;
            return `
            <div style="background: white; border: 1px solid ${order.status === 'cancelled' ? '#ef4444' : 'var(--border)'}; margin-bottom: 32px;">
                <!-- Barre de suivi -->
                <div style="display: flex; height: 4px; background: ${order.status === 'cancelled' ? '#ef4444' : 'var(--light-gray)'};">
                    <div style="flex: 1; background: ${order.status === 'cancelled' ? '#ef4444' : (statusStep >= 1 ? 'var(--black)' : 'var(--light-gray)')};" title="En cours de traitement"></div>
                    <div style="flex: 1; background: ${order.status === 'cancelled' ? '#ef4444' : (statusStep >= 2 ? 'var(--black)' : 'var(--light-gray)')};" title="Expédiée"></div>
                    <div style="flex: 1; background: ${order.status === 'cancelled' ? '#ef4444' : (statusStep >= 3 ? 'var(--black)' : 'var(--light-gray)')};" title="Livrée"></div>
                </div>
                
                <!-- En-tête -->
                <div style="padding: 24px; border-bottom: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                        <div>
                            <h3 style="font-size: 18px; font-weight: 400; margin-bottom: 8px;">${order.orderNumber}</h3>
                            <p style="color: var(--gray); font-size: 14px;">${new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 24px; font-weight: 300;">${order.total.toFixed(2)} €</p>
                            <p style="color: var(--gray); font-size: 12px; margin-top: 4px;">${order.items.length} article${order.items.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; overflow-x: auto;">
                        ${order.items.map(item => `
                            <img src="${item.image}" style="width: 80px; height: 80px; object-fit: cover; flex-shrink: 0;">
                        `).join('')}
                    </div>
                </div>
                
                <!-- Statut -->
                <div style="padding: 16px 24px; background: ${order.status === 'cancelled' ? '#fee2e2' : 'var(--light-gray)'}; display: flex; justify-content: space-between; align-items: center;">
                    ${order.status === 'cancelled' ? `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="padding: 8px 16px; background: #ef4444; color: white; font-weight: 600; font-size: 13px;">Commande annulée</span>
                        <span style="font-size: 13px; color: #991b1b;">Annulée le ${new Date(order.cancelledAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    ` : `
                    <div style="display: flex; gap: 16px; font-size: 13px;">
                        <span style="padding: 8px 16px; background: ${statusStep >= 1 ? 'white' : 'transparent'}; color: ${statusStep >= 1 ? 'var(--black)' : 'var(--gray)'}; font-weight: ${statusStep === 1 ? '600' : '400'}; box-shadow: ${statusStep >= 1 ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none'}; border: 1px solid ${statusStep >= 1 ? 'var(--border)' : 'transparent'}; display: inline-flex; align-items: center; gap: 6px;">
                            En traitement
                            ${statusStep > 1 ? '<span style="color: #22c55e; font-size: 16px;">✓</span>' : ''}
                        </span>
                        <span style="padding: 8px 16px; background: ${statusStep >= 2 ? 'white' : 'transparent'}; color: ${statusStep >= 2 ? 'var(--black)' : 'var(--gray)'}; font-weight: ${statusStep === 2 ? '600' : '400'}; box-shadow: ${statusStep >= 2 ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none'}; border: 1px solid ${statusStep >= 2 ? 'var(--border)' : 'transparent'}; display: inline-flex; align-items: center; gap: 6px;">
                            Expédiée
                            ${statusStep > 2 ? '<span style="color: #22c55e; font-size: 16px;">✓</span>' : ''}
                        </span>
                        <span style="padding: 8px 16px; background: ${statusStep >= 3 ? 'white' : 'transparent'}; color: ${statusStep >= 3 ? 'var(--black)' : 'var(--gray)'}; font-weight: ${statusStep === 3 ? '600' : '400'}; box-shadow: ${statusStep >= 3 ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none'}; border: 1px solid ${statusStep >= 3 ? 'var(--border)' : 'transparent'}; display: inline-flex; align-items: center; gap: 6px;">
                            Livrée
                            ${statusStep > 3 ? '<span style="color: #22c55e; font-size: 16px;">✓</span>' : ''}
                        </span>
                    </div>
                    `}
                    <button onclick="toggleOrderDetails('${order.orderNumber}')" class="order-details-btn" style="background: var(--black); border: none; color: var(--white); font-size: 13px; cursor: pointer; padding: 8px 16px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        Détails ▾
                    </button>
                </div>
                
                <!-- Détails -->
                <div id="details-${order.orderNumber}" style="display: none;">
                    <div style="padding: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
                        <div>
                            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); margin-bottom: 12px;">Livraison</h4>
                            <p style="font-size: 14px; line-height: 1.6;">
                                ${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}<br>
                                ${order.shippingAddress?.address || ''}<br>
                                ${order.shippingAddress?.phone || ''}
                            </p>
                            ${order.billingAddress ? `
                            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); margin-bottom: 12px; margin-top: 16px;">Facturation</h4>
                            <p style="font-size: 14px; line-height: 1.6;">
                                ${order.billingAddress?.firstName || ''} ${order.billingAddress?.lastName || ''}<br>
                                ${order.billingAddress?.address || ''}<br>
                                ${order.billingAddress?.postal || ''} ${order.billingAddress?.city || ''}
                            </p>
                            ` : ''}
                        </div>
                        <div>
                            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); margin-bottom: 12px;">Paiement</h4>
                            <p style="font-size: 14px; line-height: 1.6;">
                                Carte bancaire<br>
                                **** **** **** ${order.cardLast4 || 'XXXX'}
                            </p>
                        </div>
                        <div>
                            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); margin-bottom: 12px;">Résumé</h4>
                            <p style="font-size: 14px; line-height: 1.6;">
                                ${(order.discount || 0) > 0 ? `Sous-total: ${(order.total + order.discount).toFixed(2)} €<br>Réduction: -${order.discount.toFixed(2)} €<br>` : ''}
                                <strong>Total: ${order.total.toFixed(2)} €</strong>
                            </p>
                        </div>
                    </div>
                    
                    <div style="padding: 0 24px 24px;">
                        <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); margin-bottom: 16px;">Articles</h4>
                        ${order.items.map(item => `
                            <div style="display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid var(--border);">
                                <img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover;">
                                <div style="flex: 1;">
                                    <p style="font-size: 14px; font-weight: 500;">${item.name}</p>
                                    <p style="font-size: 13px; color: var(--gray); margin-top: 4px;">Taille ${item.size} · Quantité ${item.quantity}</p>
                                </div>
                                <p style="font-size: 14px; font-weight: 500;">${(item.price * item.quantity).toFixed(2)} €</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${order.status !== 'cancelled' ? `
                    <div style="padding: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px;">
                        ${order.trackingUrl ? `<a href="${order.trackingUrl}" target="_blank" class="btn-primary" style="flex: 1; text-align: center;">Suivre mon colis</a>` : ''}
                        ${order.status === 'processing' ? `<button onclick="cancelOrderConfirm('${order.orderNumber}')" class="btn-secondary" style="flex: 1; background: white; border: 1px solid var(--border); color: var(--black); transition: all 0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='white'; this.style.borderColor='#ef4444'" onmouseout="this.style.background='white'; this.style.color='var(--black)'; this.style.borderColor='var(--border)'">Annuler</button>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
        ordersList.innerHTML = '<p class="empty-state">Erreur de chargement</p>';
    }
}

window.toggleOrderDetails = function(orderNumber) {
    const details = document.getElementById(`details-${orderNumber}`);
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

window.cancelOrderConfirm = function(orderNumber) {
    document.body.classList.add('modal-open');
    const modal = document.createElement('div');
    modal.className = 'custom-modal active';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <p style="font-size: 16px; margin-bottom: 24px;">Êtes-vous sûr de vouloir annuler votre commande ?</p>
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" style="flex: 1;" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Non</button>
                <button class="btn-primary" style="flex: 1; background: #ef4444;" onclick="confirmCancelOrder('${orderNumber}')">Oui, annuler</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.confirmCancelOrder = async function(orderNumber) {
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.custom-modal').forEach(m => m.remove());
    
    try {
        const { doc, deleteDoc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion } = window.firebaseModules;
        const auth = window.firebaseAuth;
        
        const orderDoc = await getDoc(doc(window.firebaseDb, 'orders', orderNumber));
        const order = orderDoc.data();
        
        // Restaurer le stock
        const productsSnapshot = await getDocs(collection(window.firebaseDb, 'products'));
        for (const item of order.items) {
            const productDoc = productsSnapshot.docs.find(d => d.data().id === item.id);
            if (productDoc) {
                const product = productDoc.data();
                const variantKey = `${item.color}-${item.size}`;
                product.stockByVariant[variantKey] = (product.stockByVariant[variantKey] || 0) + item.quantity;
                await setDoc(doc(window.firebaseDb, 'products', `${product.id}`), product);
            }
        }
        
        // Annuler les transactions de points
        const userRef = doc(window.firebaseDb, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        const pointsEarned = Math.floor(order.total * 10);
        const pointsSpent = order.discount > 0 ? Math.floor(order.discount * 100) : 0;
        let newPoints = userData.points - pointsEarned + pointsSpent;
        
        const updates = [];
        if (pointsEarned > 0) {
            updates.push({
                points: -pointsEarned,
                description: 'Annulation de commande',
                date: new Date().toISOString()
            });
        }
        if (pointsSpent > 0) {
            updates.push({
                points: pointsSpent,
                description: 'Remboursement bon de réduction',
                date: new Date().toISOString()
            });
        }
        
        // Garder la commande dans la liste des commandes de l'utilisateur
        
        // Utiliser updateDoc pour ne pas écraser les données existantes
        await updateDoc(userRef, { 
            points: newPoints,
            pointsHistory: arrayUnion(...updates)
        });
        
        // Marquer la commande comme annulée au lieu de la supprimer
        await updateDoc(doc(window.firebaseDb, 'orders', orderNumber), {
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        });
        
        showMessage('Votre commande a bien été annulée. Vous recevrez un remboursement ou un avoir couvrant l\'intégralité du montant que vous avez payé.');
        
        // Recharger après un court délai pour s'assurer que Firestore est à jour
        setTimeout(() => {
            loadAccountData(auth.currentUser);
        }, 500);
    } catch (error) {
        console.error('Erreur annulation:', error);
        showMessage('Erreur lors de l\'annulation de la commande.');
    }
}

function loadAddresses(addresses = []) {
    const addressesList = document.getElementById('addressesList');
    
    if (addresses.length === 0) {
        addressesList.innerHTML = '<p class="empty-state">Aucune adresse enregistrée</p>';
        return;
    }
    
    addressesList.innerHTML = addresses.map((address, index) => `
        <div class="address-card">
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button onclick="editAddress(${index})" style="flex: 1; padding: 8px; background: var(--black); color: white; border: none; cursor: pointer;">Modifier</button>
                <button onclick="deleteAddress(${index})" style="flex: 1; padding: 8px; background: white; color: var(--black); border: 1px solid var(--border); cursor: pointer;">Supprimer</button>
            </div>
            <strong>${address.name || 'Adresse ' + (index + 1)}</strong>
            <p>${address.firstName || ''} ${address.lastName || ''}</p>
            ${address.email ? `<p>${address.email}</p>` : ''}
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
        showMessage('Erreur: ' + error.message);
    }
}

window.deleteAddress = deleteAddress;

async function editAddress(index) {
    const { doc, getDoc, updateDoc } = window.firebaseModules;
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const addresses = userDoc.data().addresses || [];
        const address = addresses[index];
        
        const modal = document.getElementById('addressModal');
        document.getElementById('addressForm').elements[0].value = address.name || '';
        document.getElementById('addressForm').elements[1].value = address.firstName || '';
        document.getElementById('addressForm').elements[2].value = address.lastName || '';
        document.getElementById('addressForm').elements[3].value = address.email || '';
        document.getElementById('addressForm').elements[4].value = address.phone || '';
        document.getElementById('addressForm').elements[5].value = address.address || '';
        document.getElementById('addressForm').elements[6].value = address.address2 || '';
        document.getElementById('addressForm').elements[7].value = address.postal || '';
        document.getElementById('addressForm').elements[8].value = address.city || '';
        document.getElementById('addressForm').elements[9].value = address.country || '';
        
        modal.classList.add('active');
        
        const form = document.getElementById('addressForm');
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            addresses[index] = {
                name: e.target[0].value,
                firstName: e.target[1].value,
                lastName: e.target[2].value,
                email: e.target[3].value,
                phone: e.target[4].value,
                address: e.target[5].value,
                address2: e.target[6].value,
                postal: e.target[7].value,
                city: e.target[8].value,
                country: e.target[9].value
            };
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { addresses });
            modal.classList.remove('active');
            loadAccountData(auth.currentUser);
            e.target.reset();
        });
    } catch (error) {
        showMessage('Erreur: ' + error.message);
    }
}

window.editAddress = editAddress;

function loadLoyalty(points, history) {
    document.getElementById('loyaltyPoints').textContent = points;
    
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    let historyDisplayCount = 3;
    
    const historyBtn = document.getElementById('showHistoryBtn');
    const newHistoryBtn = historyBtn.cloneNode(true);
    historyBtn.parentNode.replaceChild(newHistoryBtn, historyBtn);
    
    newHistoryBtn.addEventListener('click', function() {
        const historyDiv = document.getElementById('loyaltyHistory');
        if (historyDiv.style.display === 'none' || historyDiv.style.display === '') {
            historyDiv.style.display = 'block';
            this.textContent = 'Masquer l\'historique';
            historyDisplayCount = 3;
            renderHistory();
        } else {
            historyDiv.style.display = 'none';
            this.textContent = 'Afficher l\'historique';
        }
    });
    
    function renderHistory() {
        const historyList = document.getElementById('loyaltyHistoryList');
        if (sortedHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-state">Aucun historique pour le moment</p>';
            return;
        }
        
        const displayedHistory = sortedHistory.slice(0, historyDisplayCount);
        const hasMore = sortedHistory.length > historyDisplayCount;
        
        historyList.innerHTML = displayedHistory.map(entry => {
            const isPositive = entry.points > 0;
            return `
                <div style="border-bottom: 1px solid var(--border); padding: 16px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 14px;">${entry.description}</strong>
                        <p style="color: var(--gray); font-size: 12px; margin-top: 4px;">${new Date(entry.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span style="font-size: 16px; font-weight: 500; color: ${isPositive ? '#22c55e' : '#ef4444'};">
                        ${isPositive ? '+' : ''}${entry.points}
                    </span>
                </div>
            `;
        }).join('') + (hasMore ? `
            <button id="loadMoreHistory" class="btn-secondary" style="width: 100%; margin-top: 16px;">Voir plus</button>
        ` : '');
        
        if (hasMore) {
            document.getElementById('loadMoreHistory').addEventListener('click', function() {
                historyDisplayCount += 5;
                renderHistory();
            });
        }
    }
}
