// Configuration Stripe
const STRIPE_PUBLIC_KEY = 'pk_live_51Q9ORzRwel3656rYkt2acyiz7KoCl1mJA6ru04LPlGQmt5Iw9BcTQa16qv5O0Ozte9bMCtutah1qh4r6yds3l2p000MPG83KmB';
const SERVER_URL = 'https://burban-v8.onrender.com';
let stripe, elements;
let currentStep = 1;
let shippingData = null;
let billingData = null;

// Fonction pour nettoyer les commandes temporaires
async function cleanupTempOrders() {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        try {
            const { query, collection, where, getDocs, deleteDoc, doc } = window.firebaseModules;
            const db = window.firebaseDb;
            
            const tempOrdersQuery = query(
                collection(db, 'temp_orders'),
                where('userId', '==', window.firebaseAuth.currentUser.uid),
                where('status', '==', 'pending_payment')
            );
            const tempOrdersDocs = await getDocs(tempOrdersQuery);
            
            for (const tempDoc of tempOrdersDocs.docs) {
                await deleteDoc(doc(db, 'temp_orders', tempDoc.id));
                console.log('Commande temporaire supprimée:', tempDoc.id);
            }
        } catch (error) {
            console.error('Erreur suppression commandes temporaires:', error);
        }
    }
}

// Nettoyer les commandes temporaires quand l'utilisateur quitte la page
window.addEventListener('beforeunload', cleanupTempOrders);
window.addEventListener('pagehide', cleanupTempOrders);

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Panier au checkout:', cart);
    console.log('Total:', getCartTotal());
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    // Code promo
    document.getElementById('applyPromoBtn')?.addEventListener('click', async () => {
        const code = document.getElementById('promoCode').value.trim().toUpperCase();
        const msg = document.getElementById('promoMessage');
        
        if (!code) {
            msg.style.display = 'block';
            msg.style.color = '#ef4444';
            msg.textContent = 'Veuillez entrer un code';
            return;
        }
        
        if (window.selectedVoucher) {
            msg.style.display = 'block';
            msg.style.color = '#ef4444';
            msg.textContent = 'Impossible de cumuler un code promo avec un bon de réduction';
            return;
        }
        
        try {
            const response = await fetch(`${SERVER_URL}/verify-promo-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const result = await response.json();
            
            if (result.valid) {
                msg.style.display = 'block';
                msg.style.color = '#22c55e';
                msg.textContent = `Code appliqué: -${result.discount}${result.type === 'percentage' ? '%' : '€'}`;
            } else {
                msg.style.display = 'block';
                msg.style.color = '#ef4444';
                msg.textContent = 'Code promotionnel invalide';
            }
        } catch (error) {
            msg.style.display = 'block';
            msg.style.color = '#ef4444';
            msg.textContent = 'Erreur de vérification du code';
        }
    });
    
    updateStepIndicator();
    
    // Attendre que le panier soit chargé
    setTimeout(() => {
        displayCheckoutSummary();
    }, 100);
    
    // Attendre Firebase et charger les adresses
    setTimeout(() => {
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            console.log('Utilisateur connecté:', window.firebaseAuth.currentUser.uid);
            loadSavedAddresses(window.firebaseAuth.currentUser.uid);
        } else {
            console.log('Aucun utilisateur connecté');
        }
    }, 1000);
    
    // Toggle adresse de facturation
    document.getElementById('sameBillingAddress').addEventListener('change', (e) => {
        const billingSection = document.getElementById('billingAddressSection');
        const billingInputs = billingSection.querySelectorAll('input');
        
        if (e.target.checked) {
            billingSection.style.display = 'none';
            billingInputs.forEach(input => input.removeAttribute('required'));
        } else {
            billingSection.style.display = 'block';
            billingInputs.forEach(input => {
                if (input.id !== 'billingAddress2') {
                    input.setAttribute('required', 'required');
                }
            });
        }
    });
    

    
    // Navigation
    document.getElementById('continueToPayment').addEventListener('click', goToPaymentStep);
    document.getElementById('backToAddress').addEventListener('click', goToAddressStep);
    document.getElementById('submitPayment').addEventListener('click', handlePayment);
    
    // Nettoyer les commandes temporaires existantes au chargement de la page
    setTimeout(() => {
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            cleanupTempOrders();
        }
    }, 2000);
});

function selectAddress(address) {
    document.getElementById('shippingFirstName').value = address.firstName || '';
    document.getElementById('shippingLastName').value = address.lastName || '';
    document.getElementById('shippingEmail').value = address.email || '';
    document.getElementById('shippingPhone').value = address.phone || '';
    document.getElementById('shippingAddress').value = address.address || '';
    document.getElementById('shippingAddress2').value = address.address2 || '';
    document.getElementById('shippingPostal').value = address.postal || '';
    document.getElementById('shippingCity').value = address.city || '';
    document.getElementById('shippingCountry').value = address.country || 'France';
    
    document.querySelectorAll('.address-card-checkout').forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

window.selectAddress = selectAddress;

async function loadSavedAddresses(uid) {
    console.log('Chargement adresses pour:', uid);
    try {
        const { doc, getDoc } = window.firebaseModules;
        const db = window.firebaseDb;
        
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
            console.log('Document utilisateur introuvable');
            return;
        }
        
        const userData = userDoc.data();
        const addresses = userData?.addresses || [];
        
        console.log('Adresses trouvées:', addresses.length, addresses);
        
        const container = document.getElementById('savedAddressesContainer');
        const list = document.getElementById('savedAddressesList');
        
        if (addresses.length > 0) {
            container.style.display = 'block';
            list.innerHTML = addresses.map((addr, index) => `
                <div class="address-card-checkout" onclick='selectAddress(${JSON.stringify(addr).replace(/'/g, "&apos;")})' style="border: 1px solid var(--border); padding: 16px; cursor: pointer; transition: all 0.3s;">
                    <strong style="display: block; margin-bottom: 8px;">${addr.name || 'Adresse ' + (index + 1)}</strong>
                    <p style="font-size: 14px; color: var(--gray); margin: 0;">${addr.firstName || ''} ${addr.lastName || ''}</p>
                    <p style="font-size: 14px; color: var(--gray); margin: 0;">${addr.address}</p>
                    <p style="font-size: 14px; color: var(--gray); margin: 0;">${addr.postal} ${addr.city}</p>
                </div>
            `).join('');
        } else {
            console.log('Aucune adresse enregistrée');
        }
    } catch (error) {
        console.error('Erreur chargement adresses:', error);
    }
}

function getColorName(hex) {
    const colors = {
        '#000000': 'Noir',
        '#FFFFFF': 'Blanc',
        '#808080': 'Gris',
        '#FF0000': 'Rouge',
        '#0000FF': 'Bleu',
        '#008000': 'Vert',
        '#FFFF00': 'Jaune',
        '#FFA500': 'Orange',
        '#800080': 'Violet',
        '#FFC0CB': 'Rose',
        '#A52A2A': 'Marron',
        '#00FFFF': 'Cyan'
    };
    return colors[hex?.toUpperCase()] || hex;
}

function displayCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const subtotal = getCartTotal();
    const shipping = subtotal < 49 ? 5 : 0;
    const total = subtotal + shipping;
    
    checkoutItems.innerHTML = cart.map(item => {
        const itemName = item.color ? `${item.name} - ${getColorName(item.color)}` : item.name;
        return `
        <div class="checkout-item">
            <div class="checkout-item-image">
                <img src="${item.image}" alt="${itemName}">
            </div>
            <div class="checkout-item-info">
                <h4>${itemName}</h4>
                <p>Taille: ${item.size} | Qté: ${item.quantity}</p>
                <p>${(item.price * item.quantity).toFixed(2)} €</p>
            </div>
        </div>
    `}).join('');
    
    document.getElementById('checkoutSubtotal').textContent = `${subtotal.toFixed(2)} €`;
    document.getElementById('checkoutShipping').textContent = shipping > 0 ? `${shipping.toFixed(2)} €` : 'Gratuite';
    document.getElementById('checkoutTotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('paymentAmount').textContent = `${total.toFixed(2)} €`;
}

function updateCheckoutSummary() {
    const subtotal = getCartTotal();
    const discount = window.selectedVoucher ? window.selectedVoucher.discount : 0;
    const shipping = subtotal < 49 ? 5 : 0;
    const total = Math.max(0, subtotal - discount + shipping);

    document.getElementById('checkoutSubtotal').textContent = `${subtotal.toFixed(2)} €`;
    document.getElementById('checkoutShipping').textContent = shipping > 0 ? `${shipping.toFixed(2)} €` : 'Gratuite';
    if (window.selectedVoucher) {
        document.getElementById('discount').textContent = `-${discount.toFixed(2)} €`;
        document.getElementById('discountLine').style.display = 'flex';
    } else {
        document.getElementById('discountLine').style.display = 'none';
    }
    document.getElementById('checkoutTotal').textContent = `${total.toFixed(2)} €`;
    const paymentAmountEl = document.getElementById('paymentAmount');
    if (paymentAmountEl) {
        paymentAmountEl.textContent = `${total.toFixed(2)} €`;
    }
    document.getElementById('paymentAmount').textContent = `${total.toFixed(2)} €`;
}

window.updateCheckoutSummary = updateCheckoutSummary;

function updateStepIndicator() {
    document.getElementById('stepIndicator1').classList.toggle('active', currentStep === 1);
    document.getElementById('stepIndicator2').classList.toggle('active', currentStep === 2);
}

function goToPaymentStep() {
    const shippingForm = document.getElementById('shippingForm');
    if (!shippingForm.checkValidity()) {
        shippingForm.reportValidity();
        return;
    }
    
    // Vérifier le formulaire de facturation si différent
    const sameBilling = document.getElementById('sameBillingAddress').checked;
    if (!sameBilling) {
        const billingInputs = document.querySelectorAll('#billingAddressSection input[required]');
        let isValid = true;
        billingInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.reportValidity();
            }
        });
        if (!isValid) return;
    }
    
    // Sauvegarder les données de livraison
    shippingData = {
        firstName: document.getElementById('shippingFirstName').value,
        lastName: document.getElementById('shippingLastName').value,
        email: document.getElementById('shippingEmail').value,
        phone: document.getElementById('shippingPhone').value,
        address: document.getElementById('shippingAddress').value,
        address2: document.getElementById('shippingAddress2').value,
        postal: document.getElementById('shippingPostal').value,
        city: document.getElementById('shippingCity').value,
        country: document.getElementById('shippingCountry').value
    };
    
    // Sauvegarder les données de facturation si différentes
    if (!sameBilling) {
        billingData = {
            firstName: document.getElementById('billingFirstName').value,
            lastName: document.getElementById('billingLastName').value,
            address: document.getElementById('billingAddress').value,
            address2: document.getElementById('billingAddress2').value,
            postal: document.getElementById('billingPostal').value,
            city: document.getElementById('billingCity').value,
            country: document.getElementById('billingCountry').value
        };
    } else {
        billingData = { ...shippingData };
    }
    
    // Passer à l'étape 2
    currentStep = 2;
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    updateStepIndicator();
    
    // Afficher les bons de fidélité si connecté
    if (window.displayVouchers) {
        displayVouchers();
    }
    
    // Initialiser Stripe Payment Element
    initializePayment();
}

function goToAddressStep() {
    currentStep = 1;
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    updateStepIndicator();
}

async function initializePayment() {
    const subtotal = getCartTotal();
    const discount = window.selectedVoucher ? window.selectedVoucher.discount : 0;
    const shipping = subtotal < 49 ? 5 : 0;
    const total = Math.max(0, subtotal - discount + shipping);
    
    try {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        
        // Créer un PaymentIntent côté serveur
        const response = await fetch(`${SERVER_URL}/create-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: total,
                shippingAddress: shippingData,
                billingAddress: JSON.stringify(billingData) !== JSON.stringify(shippingData) ? billingData : null,
                promoCode: document.getElementById('promoCode').value.trim().toUpperCase() || null,
                voucherDiscount: discount,
                shippingFee: shipping,
                items: cart,
                userId: window.firebaseAuth?.currentUser?.uid || null
            })
        });
        
        const { clientSecret } = await response.json();
        
        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#000000',
                colorBackground: '#ffffff',
                colorText: '#000000',
                colorDanger: '#df1b41',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                borderRadius: '0px'
            }
        };
        
        elements = stripe.elements({ clientSecret, appearance });
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
        
    } catch (error) {
        console.error('Erreur Stripe:', error);
        document.getElementById('payment-message').textContent = 
            'Erreur de connexion au serveur de paiement. Vérifiez que le serveur est démarré.';
    }
}

async function handlePayment(e) {
    e.preventDefault();
    
    if (!elements) {
        document.getElementById('payment-message').textContent = 'Erreur: Paiement non initialisé';
        return;
    }
    
    document.getElementById('submitPayment').disabled = true;
    document.getElementById('submitPayment').textContent = 'Traitement...';
    
    // Créer une commande temporaire avant le paiement
    const cartTotal = getCartTotal();
    const discount = window.selectedVoucher ? window.selectedVoucher.discount : 0;
    const shipping = cartTotal < 49 ? 5 : 0;
    const finalTotal = Math.max(0, cartTotal - discount + shipping);
    
    let tempOrderId = null;
    
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        try {
            const { doc, setDoc } = window.firebaseModules;
            const db = window.firebaseDb;
            
            // Générer ID temporaire unique
            tempOrderId = 'TEMP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Créer commande temporaire
            const tempOrderData = {
                tempOrderId,
                userId: window.firebaseAuth.currentUser.uid,
                items: cart,
                total: finalTotal,
                discount: discount,
                shippingAddress: shippingData,
                billingAddress: JSON.stringify(billingData) !== JSON.stringify(shippingData) ? billingData : null,
                voucher: window.selectedVoucher,
                status: 'pending_payment',
                createdAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'temp_orders', tempOrderId), tempOrderData);
            console.log('Commande temporaire créée:', tempOrderId);
        } catch (error) {
            console.error('Erreur création commande temporaire:', error);
        }
    }
    
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `https://burbanofficial.github.io/BURBAN-V8/success.html?temp_order=${tempOrderId}`,
            receipt_email: shippingData.email,
        },
    });
    
    if (error) {
        document.getElementById('payment-message').textContent = error.message;
        document.getElementById('submitPayment').disabled = false;
        document.getElementById('submitPayment').textContent = 'Payer ' + document.getElementById('paymentAmount').textContent;
    }
}

async function processOrder() {
    const cartTotal = getCartTotal();
    const discount = window.selectedVoucher ? window.selectedVoucher.discount : 0;
    const shipping = cartTotal < 49 ? 5 : 0;
    const finalTotal = Math.max(0, cartTotal - discount + shipping);
    
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: cart.map(item => ({
            ...item,
            name: item.color ? `${item.name} - ${getColorName(item.color)}` : item.name
        })),
        subtotal: cartTotal,
        discount: discount,
        total: finalTotal,
        shippingAddress: shippingData,
        billingAddress: JSON.stringify(billingData) !== JSON.stringify(shippingData) ? billingData : null,
        cardLast4: document.getElementById('cardNumber')?.value.slice(-4) || 'XXXX',
        status: 'confirmed'
    };
    
    // Tracker les ventes pour best sellers dans Firestore
    if (window.firebaseReady && window.firebaseModules) {
        try {
            const { doc, getDoc, setDoc } = window.firebaseModules;
            const statsRef = doc(window.firebaseDb, 'stats', 'products');
            const statsDoc = await getDoc(statsRef);
            
            const sales = statsDoc.exists() ? (statsDoc.data().sales || {}) : {};
            cart.forEach(item => {
                sales[item.id] = (sales[item.id] || 0) + item.quantity;
            });
            await setDoc(statsRef, { sales }, { merge: true });
        } catch (error) {
            console.error('Erreur tracking ventes:', error);
        }
    }
    
    // Sauvegarder les infos de commande dans sessionStorage pour success.html
    const orderData = {
        order,
        voucher: window.selectedVoucher,
        userId: window.firebaseAuth?.currentUser?.uid
    };
    console.log('Sauvegarde dans sessionStorage:', orderData);
    sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
    console.log('Vérification sessionStorage:', sessionStorage.getItem('lastOrder'));
    
    // Sauvegarder la commande si l'utilisateur est connecté
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        try {
            const { doc, getDoc, updateDoc } = window.firebaseModules;
            const userRef = doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();
            
            const orders = userData.orders || [];
            orders.push(order);
            
            await updateDoc(userRef, { orders });
        } catch (error) {
            console.error('Erreur sauvegarde commande:', error);
        }
    }
    
    // Vider le panier
    clearCart();
    
    // Rediriger vers la page de succès
    window.location.href = 'success.html';
}
