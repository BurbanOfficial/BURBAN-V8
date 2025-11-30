// Configuration Stripe - Remplacez par votre clé publique
const STRIPE_PUBLIC_KEY = 'pk_test_YOUR_STRIPE_PUBLIC_KEY';
let stripe, elements;
let currentStep = 1;
let shippingData = null;
let billingData = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Panier au checkout:', cart);
    console.log('Total:', getCartTotal());
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    displayCheckoutSummary();
    updateStepIndicator();
    
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
        document.getElementById('billingAddressSection').style.display = e.target.checked ? 'none' : 'block';
    });
    

    
    // Navigation
    document.getElementById('continueToPayment').addEventListener('click', goToPaymentStep);
    document.getElementById('backToAddress').addEventListener('click', goToAddressStep);
    document.getElementById('submitPayment').addEventListener('click', handlePayment);
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
    const total = getCartTotal();
    
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
    
    document.getElementById('checkoutSubtotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('checkoutTotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('paymentAmount').textContent = `${total.toFixed(2)} €`;
}

function updateStepIndicator() {
    document.getElementById('stepIndicator1').classList.toggle('active', currentStep === 1);
    document.getElementById('stepIndicator2').classList.toggle('active', currentStep === 2);
}

function goToPaymentStep() {
    const form = document.getElementById('shippingForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
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
    const sameBilling = document.getElementById('sameBillingAddress').checked;
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
    const total = getCartTotal();
    
    try {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        
        // En production: créer un PaymentIntent côté serveur
        // const response = await fetch('/create-payment-intent', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ 
        //         amount: total * 100, 
        //         currency: 'eur',
        //         shipping: shippingData,
        //         billing: billingData
        //     })
        // });
        // const { clientSecret } = await response.json();
        
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
        
        // Mode démo: simuler l'interface
        document.getElementById('payment-element').innerHTML = `
            <div style="border: 1px solid #e0e0e0; padding: 16px; margin-bottom: 16px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 12px;">Informations de carte</p>
                <input type="text" placeholder="1234 5678 9012 3456" style="width: 100%; margin-bottom: 12px; padding: 12px; border: 1px solid #e0e0e0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <input type="text" placeholder="MM / AA" style="padding: 12px; border: 1px solid #e0e0e0;">
                    <input type="text" placeholder="CVC" style="padding: 12px; border: 1px solid #e0e0e0;">
                </div>
            </div>
            <p style="font-size: 12px; color: #666;">
                <strong>Mode démo:</strong> Configurez Stripe avec votre clé API pour activer les paiements réels.
            </p>
        `;
        
        // elements = stripe.elements({ clientSecret, appearance });
        // const paymentElement = elements.create('payment');
        // paymentElement.mount('#payment-element');
        
    } catch (error) {
        console.error('Erreur Stripe:', error);
        document.getElementById('payment-message').textContent = 
            'Configuration Stripe requise. Ajoutez votre clé publique dans checkout.js';
    }
}

async function handlePayment(e) {
    e.preventDefault();
    
    document.getElementById('submitPayment').disabled = true;
    document.getElementById('submitPayment').textContent = 'Traitement...';
    
    // Mode démo: simuler le paiement
    setTimeout(async () => {
        await processOrder();
    }, 1500);
    
    /* 
    // Code pour paiement Stripe réel (décommenter quand configuré)
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.origin + '/success.html',
            receipt_email: shippingData.email,
        },
    });
    
    if (error) {
        document.getElementById('payment-message').textContent = error.message;
        document.getElementById('submitPayment').disabled = false;
        document.getElementById('submitPayment').textContent = 'Payer ' + document.getElementById('paymentAmount').textContent;
    }
    */
}

async function processOrder() {
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: cart.map(item => ({
            ...item,
            name: item.color ? `${item.name} - ${getColorName(item.color)}` : item.name
        })),
        total: getCartTotal(),
        shipping: shippingData,
        billing: billingData,
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
    
    // Sauvegarder la commande si l'utilisateur est connecté
    if (currentUser) {
        const orders = currentUser.orders || [];
        orders.push(order);
        updateUser({ orders });
    }
    
    // Vider le panier
    clearCart();
    
    // Rediriger vers la page de succès
    window.location.href = 'success.html';
}
