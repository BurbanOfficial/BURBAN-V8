const MAILRELAY_CONFIG = {
    apiKey: 'fxZ5kwQ_gVfaAqpYTS2qNfox7vsiGrkzyzdyy_Wd',
    apiUrl: 'https://burbanofficial.ipzmarketing.com/ccm/admin/api/version/2',
    groupId: 1
};

async function addSubscriberToList(email, name) {
    try {
        const response = await fetch(`${MAILRELAY_CONFIG.apiUrl}/subscribers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': MAILRELAY_CONFIG.apiKey
            },
            body: JSON.stringify({
                email: email,
                name: name,
                groups: [MAILRELAY_CONFIG.groupId]
            })
        });
        
        const result = await response.json();
        console.log('Subscriber added:', result);
        return result;
    } catch (error) {
        console.error('Erreur ajout subscriber:', error);
    }
}

async function sendOrderConfirmationEmail(email, orderData) {
    try {
        const response = await fetch(`${MAILRELAY_CONFIG.apiUrl}/send_emails`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': MAILRELAY_CONFIG.apiKey
            },
            body: JSON.stringify({
                template_id: 1,
                recipients: [email],
                subject: `Confirmation de commande ${orderData.orderNumber}`,
                variables: {
                    customerName: orderData.customerName,
                    orderNumber: orderData.orderNumber,
                    orderDate: orderData.orderDate,
                    items: orderData.items.map(item => 
                        `${item.name} - Taille ${item.size} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} €`
                    ).join('\n'),
                    total: orderData.total.toFixed(2),
                    shippingFirstName: orderData.shippingAddress.firstName,
                    shippingLastName: orderData.shippingAddress.lastName,
                    shippingAddress: orderData.shippingAddress.address,
                    shippingPostal: orderData.shippingAddress.postal,
                    shippingCity: orderData.shippingAddress.city,
                    shippingCountry: orderData.shippingAddress.country
                }
            })
        });
        
        const result = await response.json();
        console.log('Email envoyé:', result);
        return result;
    } catch (error) {
        console.error('Erreur envoi email:', error);
    }
}

window.mailrelayService = {
    addSubscriberToList,
    sendOrderConfirmationEmail
};
