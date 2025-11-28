// Configuration Stripe - Remplacez par votre clé publique
const STRIPE_PUBLIC_KEY = 'pk_test_YOUR_STRIPE_PUBLIC_KEY';
let stripe, elements, paymentElement;

document.addEventListener('DOMContentLoaded', async () => {
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    displayCheckoutSummary();
    
    // Pré-remplir les informations si l'utilisateur est connecté
    if (currentUser) {
        document.getElementById('shippingFirstName').value = currentUser.firstName || '';
        document.getElementById('shippingLastName').value = currentUser.lastName || '';
        document.getElementById('shippingEmail').value = currentUser.email || '';
        document.getElementById('shippingPhone').value = currentUser.phone || '';
    }
    
    // Initialiser Stripe
    try {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        await initializePayment();
    } catch (error) {
        console.error('Erreur Stripe:', error);
        document.getElementById('payment-message').textContent = 
            'Configuration Stripe requise. Ajoutez votre clé publique dans checkout.js';
    }
    
    document.getElementById('submitPayment').addEventListener('click', handlePayment);
});

function displayCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const total = getCartTotal();
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <div class="checkout-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="checkout-item-info">
                <h4>${item.name}</h4>
                <p>Taille: ${item.size} | Qté: ${item.quantity}</p>
                <p>${(item.price * item.quantity).toFixed(2)} €</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('checkoutSubtotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('checkoutTotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('paymentAmount').textContent = `${total.toFixed(2)} €`;
}

async function initializePayment() {
    const total = getCartTotal();
    
    // En production, créez un PaymentIntent côté serveur
    // Pour la démo, on simule l'interface Stripe
    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#000000',
            colorBackground: '#ffffff',
            colorText: '#000000',
            colorDanger: '#df1b41',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            spacingUnit: '4px',
            borderRadius: '0px'
        }
    };
    
    // Simuler l'élément de paiement pour la démo
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
}

async function handlePayment(e) {
    e.preventDefault();
    
    // Validation du formulaire
    const form = document.getElementById('shippingForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const shippingData = {
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
    
    // Simuler le paiement pour la démo
    document.getElementById('submitPayment').disabled = true;
    document.getElementById('submitPayment').textContent = 'Traitement...';
    
    setTimeout(() => {
        processOrder(shippingData);
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
        document.getElementById('submitPayment').textContent = 'Payer';
    }
    */
}

function processOrder(shippingData) {
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: [...cart],
        total: getCartTotal(),
        shipping: shippingData,
        status: 'confirmed'
    };
    
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
