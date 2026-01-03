const express = require('express');
const stripe = require('stripe')('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');
const cors = require('cors');
const https = require('https');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
app.use(express.json());
app.use(express.static('.'));

// Codes promotionnels (à configurer selon vos besoins)
const promoCodes = {
    'WELCOME10': { discount: 10, type: 'percentage' },
    'SAVE20': { discount: 20, type: 'fixed' },
    'SUMMER15': { discount: 15, type: 'percentage' }
};

// Endpoint pour créer un Payment Intent
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, shippingAddress } = req.body;

        const countryMap = { 'France': 'FR', 'Belgique': 'BE', 'Suisse': 'CH', 'Luxembourg': 'LU' };
        const countryCode = countryMap[shippingAddress?.country] || 'FR';

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            metadata: {
                orderNumber: 'PENDING',
                userId: req.body.userId || 'guest'
            },
            shipping: {
                name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                address: {
                    line1: shippingAddress.address,
                    postal_code: shippingAddress.postal,
                    city: shippingAddress.city,
                    country: countryCode
                }
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Erreur:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint pour vérifier un code promo
app.post('/verify-promo-code', (req, res) => {
    const { code } = req.body;
    
    if (promoCodes[code]) {
        res.json({ 
            valid: true, 
            discount: promoCodes[code].discount,
            type: promoCodes[code].type
        });
    } else {
        res.json({ valid: false });
    }
});

// Endpoint pour récupérer les détails du paiement
app.get('/payment-details/:paymentIntentId', async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        
        res.json({
            status: paymentIntent.status,
            metadata: paymentIntent.metadata,
            amount: paymentIntent.amount / 100,
            cardLast4: paymentMethod.card?.last4 || 'XXXX'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur Stripe démarré sur le port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    
    // Self-ping toutes les minutes pour éviter l'inactivité
    setInterval(() => {
        https.get('https://burban-v8.onrender.com/health', (res) => {
            console.log(`Self-ping: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error('Erreur self-ping:', err.message);
        });
    }, 60 * 1000);
});

// Endpoint health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test Mailrelay API
app.get('/test-mailrelay', (req, res) => {
    const options = {
        hostname: 'burbanofficial.ipzmarketing.com',
        path: '/api/v1/groups',
        method: 'GET',
        headers: {
            'X-AUTH-TOKEN': 'fxZ5kwQ_gVfaAqpYTS2qNfox7vsiGrkzyzdyy_Wd'
        }
    };
    
    const mailreq = https.request(options, (mailres) => {
        let data = '';
        mailres.on('data', chunk => data += chunk);
        mailres.on('end', () => {
            res.json({ status: mailres.statusCode, data: data });
        });
    });
    
    mailreq.on('error', (error) => {
        res.status(500).json({ error: error.message });
    });
    
    mailreq.end();
});

// Proxy Mailrelay
app.post('/send-mailrelay-email', (req, res) => {
    const { email, orderData } = req.body;
    
    const postData = JSON.stringify({
        from: {
            email: 'noreply@burbanofficial.com',
            name: 'Burban Official'
        },
        to: [{
            email: email,
            name: orderData.customerName
        }],
        subject: `Confirmation de commande ${orderData.orderNumber}`,
        html_part: `
            <h1>Commande ${orderData.orderNumber}</h1>
            <p>Bonjour ${orderData.customerName},</p>
            <p>Votre commande a été confirmée.</p>
            <h2>Détails:</h2>
            <ul>
                ${orderData.items.map(item => 
                    `<li>${item.name} - Taille ${item.size} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} €</li>`
                ).join('')}
            </ul>
            <p><strong>Total: ${orderData.total.toFixed(2)} €</strong></p>
            <p>Adresse de livraison:<br>
            ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
            ${orderData.shippingAddress.address}<br>
            ${orderData.shippingAddress.postal} ${orderData.shippingAddress.city}<br>
            ${orderData.shippingAddress.country}</p>
        `
    });
    
    const options = {
        hostname: 'burbanofficial.ipzmarketing.com',
        path: '/api/v1/send_emails',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-AUTH-TOKEN': 'fxZ5kwQ_gVfaAqpYTS2qNfox7vsiGrkzyzdyy_Wd',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const mailreq = https.request(options, (mailres) => {
        let data = '';
        mailres.on('data', chunk => data += chunk);
        mailres.on('end', () => {
            try {
                res.json({ success: true, data: JSON.parse(data) });
            } catch (e) {
                res.json({ success: true, data: data });
            }
        });
    });
    
    mailreq.on('error', (error) => {
        res.status(500).json({ success: false, error: error.message });
    });
    
    mailreq.write(postData);
    mailreq.end();
});
