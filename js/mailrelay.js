const MAILRELAY_CONFIG = {
    apiKey: 'fxZ5kwQ_gVfaAqpYTS2qNfox7vsiGrkzyzdyy_Wd',
    apiUrl: 'https://burbanofficial.ipzmarketing.com/ccm/admin/api/version/2',
    templates: {
        orderConfirmation: 1,
        orderShipped: 2,
        orderDelivered: 3
    }
};

async function sendEmail(templateId, to, subject, variables) {
    try {
        const response = await fetch(`${MAILRELAY_CONFIG.apiUrl}/campaigns/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': MAILRELAY_CONFIG.apiKey
            },
            body: JSON.stringify({
                template_id: templateId,
                subject: subject,
                recipients: [{ email: to }],
                merge_tags: variables
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            console.log('Email envoyé avec succès', result);
            return true;
        } else {
            console.error('Erreur envoi email:', result);
            return false;
        }
    } catch (error) {
        console.error('Erreur:', error);
        return false;
    }
}

async function sendOrderConfirmation(orderData) {
    const itemsHtml = orderData.items.map(item => 
        `${item.name} - Taille ${item.size} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} €`
    ).join('\n');
    
    return await sendEmail(
        MAILRELAY_CONFIG.templates.orderConfirmation,
        orderData.email,
        `Confirmation de commande ${orderData.orderNumber}`,
        {
            customerName: orderData.customerName,
            orderNumber: orderData.orderNumber,
            orderDate: orderData.orderDate,
            items: itemsHtml,
            total: orderData.total.toFixed(2),
            shippingFirstName: orderData.shippingAddress.firstName,
            shippingLastName: orderData.shippingAddress.lastName,
            shippingAddress: orderData.shippingAddress.address,
            shippingPostal: orderData.shippingAddress.postal,
            shippingCity: orderData.shippingAddress.city,
            shippingCountry: orderData.shippingAddress.country
        }
    );
}

async function sendOrderShipped(orderData) {
    return await sendEmail(
        MAILRELAY_CONFIG.templates.orderShipped,
        orderData.email,
        `Votre commande ${orderData.orderNumber} est en route`,
        {
            customerName: orderData.customerName,
            orderNumber: orderData.orderNumber,
            trackingUrl: orderData.trackingUrl || 'https://burbanofficial.github.io/BURBAN-V8/account.html'
        }
    );
}

async function sendOrderDelivered(orderData) {
    return await sendEmail(
        MAILRELAY_CONFIG.templates.orderDelivered,
        orderData.email,
        `Votre commande ${orderData.orderNumber} a été livrée`,
        {
            customerName: orderData.customerName,
            orderNumber: orderData.orderNumber
        }
    );
}

window.mailrelay = {
    sendOrderConfirmation,
    sendOrderShipped,
    sendOrderDelivered
};
