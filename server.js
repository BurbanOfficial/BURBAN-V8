const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const https = require('https');
const FormData = require('form-data');
const Mailgun = require('mailgun.js');

const MAILGUN_DOMAIN = 'mg.burbanofficial.com';
const MAILGUN_FROM = `BURBAN <noreply@${MAILGUN_DOMAIN}>`;
const mg = new Mailgun(FormData).client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY || '60cb5ddcede1d9c2ed35283c7432c647-8a3819a9-08d21130',
    url: 'https://api.eu.mailgun.net'
});

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
        console.log('Requête reçue:', JSON.stringify(req.body, null, 2));
        
        const { amount, shippingAddress, userId } = req.body;

        if (!amount || !shippingAddress) {
            console.error('Données manquantes - amount:', amount, 'shippingAddress:', shippingAddress);
            return res.status(400).json({ error: 'Montant et adresse requis' });
        }

        const countryMap = { 'France': 'FR', 'Belgique': 'BE', 'Suisse': 'CH', 'Luxembourg': 'LU' };
        const countryCode = countryMap[shippingAddress.country] || 'FR';

        console.log('Création PaymentIntent - amount:', amount, 'country:', countryCode);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            metadata: {
                orderNumber: 'PENDING',
                userId: userId || 'guest'
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

        console.log('PaymentIntent créé avec succès:', paymentIntent.id);

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Erreur complète:', error);
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

app.post('/refund-order', async (req, res) => {
    try {
        const { orderNumber } = req.body;
        const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });
        const paymentIntent = paymentIntents.data.find(pi => pi.metadata.orderNumber === orderNumber);
        
        if (!paymentIntent) {
            return res.json({ success: false, error: 'Paiement introuvable' });
        }
        
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntent.id
        });
        
        res.json({ success: true, amount: refund.amount / 100 });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/update-payment-intent/:paymentIntentId', async (req, res) => {
    try {
        const { orderNumber } = req.body;
        await stripe.paymentIntents.update(req.params.paymentIntentId, {
            metadata: { orderNumber }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint emails transactionnels via Mailgun
app.post('/send-order-email', async (req, res) => {
    const { type, email, customerName, orderNumber, orderDate, items, total, shippingAddress, trackingLink } = req.body;
    if (!email || !type) return res.status(400).json({ success: false, error: 'email et type requis' });

    const itemsText = (items || []).map(item =>
        `${item.name}${item.color ? ' - ' + item.color : ''} | Taille ${item.size} x${item.quantity} — ${(item.price * item.quantity).toFixed(2)} €`
    ).join('\n');

    const addr = shippingAddress || {};
    const now = new Date().toLocaleDateString('fr-FR');

    const templates = {
        confirmation: {
            subject: `Commande confirmée — ${orderNumber}`,
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <tr><td align="center" style="padding-bottom:40px;"><img src="https://i.imgur.com/iZFkTAN.png" alt="BURBAN" style="height:60px;"></td></tr>
  <tr><td style="padding:0 20px;">
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#000;">Commande confirmée</h1>
    <p style="margin:0 0 24px;color:#666;line-height:1.6;">Bonjour ${customerName},</p>
    <p style="margin:0 0 32px;color:#666;line-height:1.6;">Merci pour votre commande. Nous avons bien reçu votre paiement.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #e5e5e5;">
      <tr><td style="padding:16px;border-bottom:1px solid #e5e5e5;"><strong style="color:#000;">Numéro de commande</strong><br><span style="color:#666;">${orderNumber}</span></td></tr>
      <tr><td style="padding:16px;"><strong style="color:#000;">Date de commande</strong><br><span style="color:#666;">${orderDate || now}</span></td></tr>
    </table>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#000;">Articles</h2>
    <div style="white-space:pre-line;padding:16px;background:#f5f5f5;margin-bottom:24px;color:#000;line-height:1.8;">${itemsText}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr><td style="padding:16px 0;text-align:right;border-top:2px solid #000;"><strong style="font-size:18px;color:#000;">Total : ${parseFloat(total).toFixed(2)} €</strong></td></tr>
    </table>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#000;">Adresse de livraison</h2>
    <div style="padding:16px;background:#f5f5f5;margin-bottom:32px;"><p style="margin:0;color:#000;line-height:1.6;">${addr.firstName || ''} ${addr.lastName || ''}<br>${addr.address || ''}<br>${addr.postal || ''} ${addr.city || ''}<br>${addr.country || ''}</p></div>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#000;">Adresse de facturation</h2>
    <div style="padding:16px;background:#f5f5f5;margin-bottom:32px;"><p style="margin:0;color:#000;line-height:1.6;">${addr.firstName || ''} ${addr.lastName || ''}<br>${addr.address || ''}<br>${addr.postal || ''} ${addr.city || ''}<br>${addr.country || ''}</p></div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr><td align="center"><a href="https://burbanofficial.github.io/BURBAN-V8/account.html" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;text-decoration:none;font-weight:500;">Suivre ma commande</a></td></tr></table>
    <p style="margin:32px 0 0;color:#999;font-size:14px;text-align:center;line-height:1.6;">Des questions ? Contactez-nous à support@burbanofficial.com</p><br>
  </td></tr>
  <tr><td style="padding:40px 20px 0;text-align:center;border-top:1px solid #e5e5e5;"><p style="margin:0 0 8px;color:#666;font-size:14px;">BURBAN</p><p style="margin:0;color:#999;font-size:12px;">&copy; ${new Date().getFullYear()} BURBAN. Tous droits réservés.</p></td></tr>
</table></body></html>`
        },
        shipped: {
            subject: `Votre commande ${orderNumber} est en route !`,
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <tr><td align="center" style="padding-bottom:40px;"><img src="https://i.imgur.com/iZFkTAN.png" alt="BURBAN" style="height:60px;"></td></tr>
  <tr><td style="padding:0 20px;">
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#000;">Commande envoyée</h1>
    <p style="margin:0 0 24px;color:#666;line-height:1.6;">Bonjour ${customerName},</p>
    <p style="margin:0 0 32px;color:#666;line-height:1.6;">Excellente nouvelle ! Votre commande a été confiée à notre transporteur et est actuellement en route vers votre adresse de livraison.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #e5e5e5;">
      <tr><td style="padding:16px;border-bottom:1px solid #e5e5e5;"><strong style="color:#000;">Numéro de commande</strong><br><span style="color:#666;">${orderNumber}</span></td></tr>
      <tr><td style="padding:16px;"><strong style="color:#000;">Date d'expédition</strong><br><span style="color:#666;">${now}</span></td></tr>
    </table>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#000;">Articles expédiés</h2>
    <div style="white-space:pre-line;padding:16px;background:#f5f5f5;margin-bottom:24px;color:#000;line-height:1.8;">${itemsText}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td style="padding:16px 0;text-align:right;border-top:2px solid #000;"><strong style="font-size:18px;color:#000;">Total : ${parseFloat(total).toFixed(2)} €</strong></td></tr></table>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#000;">Adresse de livraison</h2>
    <div style="padding:16px;background:#f5f5f5;margin-bottom:32px;"><p style="margin:0;color:#000;line-height:1.6;">${addr.firstName || ''} ${addr.lastName || ''}<br>${addr.address || ''}<br>${addr.postal || ''} ${addr.city || ''}<br>${addr.country || ''}</p></div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr><td align="center"><a href="${trackingLink || '#'}" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;text-decoration:none;font-weight:500;">Suivre mon colis</a></td></tr></table>
    <p style="margin:32px 0 0;color:#999;font-size:14px;text-align:center;line-height:1.6;">Des questions ? Contactez-nous à support@burbanofficial.com</p><br>
  </td></tr>
  <tr><td style="padding:40px 20px 0;text-align:center;border-top:1px solid #e5e5e5;"><p style="margin:0 0 8px;color:#666;font-size:14px;">BURBAN</p><p style="margin:0;color:#999;font-size:12px;">&copy; ${new Date().getFullYear()} BURBAN. Tous droits réservés.</p></td></tr>
</table></body></html>`
        },
        delivered: {
            subject: `Votre commande ${orderNumber} a été livrée`,
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <tr><td align="center" style="padding-bottom:40px;"><img src="https://i.imgur.com/iZFkTAN.png" alt="BURBAN" style="height:60px;"></td></tr>
  <tr><td style="padding:0 20px;">
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#000;">Commande livrée</h1>
    <p style="margin:0 0 24px;color:#666;line-height:1.6;">Bonjour ${customerName},</p>
    <p style="margin:0 0 32px;color:#666;line-height:1.6;">Votre commande a été livrée avec succès ! Nous espérons que vos nouveaux articles vous donneront entière satisfaction.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #e5e5e5;">
      <tr><td style="padding:16px;border-bottom:1px solid #e5e5e5;"><strong style="color:#000;">Numéro de commande</strong><br><span style="color:#666;">${orderNumber}</span></td></tr>
      <tr><td style="padding:16px;"><strong style="color:#000;">Date de livraison</strong><br><span style="color:#666;">${now}</span></td></tr>
    </table>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#000;">Récapitulatif de vos articles</h2>
    <div style="white-space:pre-line;padding:16px;background:#f5f5f5;margin-bottom:32px;color:#000;line-height:1.8;">${itemsText}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr><td align="center"><a href="https://burbanofficial.github.io/BURBAN-V8/account.html" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;text-decoration:none;font-weight:500;">Voir les détails de ma commande</a></td></tr></table>
    <p style="margin:32px 0 0;color:#999;font-size:14px;text-align:center;line-height:1.6;">Un problème avec votre livraison ou besoin d'effectuer un retour ?<br>Contactez-nous à support@burbanofficial.com</p><br>
  </td></tr>
  <tr><td style="padding:40px 20px 0;text-align:center;border-top:1px solid #e5e5e5;"><p style="margin:0 0 8px;color:#666;font-size:14px;">BURBAN</p><p style="margin:0;color:#999;font-size:12px;">&copy; ${new Date().getFullYear()} BURBAN. Tous droits réservés.</p></td></tr>
</table></body></html>`
        },
        cancelled: {
            subject: `Votre commande ${orderNumber} a été annulée`,
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <tr><td align="center" style="padding-bottom:40px;"><img src="https://i.imgur.com/iZFkTAN.png" alt="BURBAN" style="height:60px;"></td></tr>
  <tr><td style="padding:0 20px;">
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#000;">Commande annulée</h1>
    <p style="margin:0 0 24px;color:#666;line-height:1.6;">Bonjour ${customerName},</p>
    <p style="margin:0 0 32px;color:#666;line-height:1.6;">Votre commande a bien été annulée. Si vous aviez déjà été débité(e), le remboursement intégral a été initié et apparaîtra sur votre moyen de paiement sous quelques jours ouvrés.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #e5e5e5;">
      <tr><td style="padding:16px;border-bottom:1px solid #e5e5e5;"><strong style="color:#000;">Numéro de commande</strong><br><span style="color:#666;">${orderNumber}</span></td></tr>
      <tr><td style="padding:16px;"><strong style="color:#000;">Date d'annulation</strong><br><span style="color:#666;">${now}</span></td></tr>
    </table>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#000;">Articles annulés</h2>
    <div style="white-space:pre-line;padding:16px;background:#f5f5f5;margin-bottom:24px;color:#000;line-height:1.8;">${itemsText}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td style="padding:16px 0;text-align:right;border-top:2px solid #000;"><strong style="font-size:18px;color:#000;">Montant remboursé : ${parseFloat(total).toFixed(2)} €</strong></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr><td align="center"><a href="https://burbanofficial.github.io/BURBAN-V8/" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;text-decoration:none;font-weight:500;">Retourner sur la boutique</a></td></tr></table>
    <p style="margin:32px 0 0;color:#999;font-size:14px;text-align:center;line-height:1.6;">Si vous n'êtes pas à l'origine de cette annulation, contactez-nous à support@burbanofficial.com</p><br>
  </td></tr>
  <tr><td style="padding:40px 20px 0;text-align:center;border-top:1px solid #e5e5e5;"><p style="margin:0 0 8px;color:#666;font-size:14px;">BURBAN</p><p style="margin:0;color:#999;font-size:12px;">&copy; ${new Date().getFullYear()} BURBAN. Tous droits réservés.</p></td></tr>
</table></body></html>`
        }
    };

    const tpl = templates[type];
    if (!tpl) return res.status(400).json({ success: false, error: 'type invalide' });

    try {
        await mg.messages.create(MAILGUN_DOMAIN, {
            from: MAILGUN_FROM,
            to: [email],
            subject: tpl.subject,
            html: tpl.html
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur Mailgun order email:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Notification retour en stock via Mailgun
app.post('/send-stock-notification', async (req, res) => {
    const { email, productName, productImage, productPrice, productId, color, size } = req.body;
    if (!email || !productName) return res.status(400).json({ success: false, error: 'email et productName requis' });

    const productUrl = `https://burban-v8.onrender.com/product-detail.html?id=${productId}`;
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;width:100%;">
  <tr><td style="background:#fff;padding:40px;text-align:center;">
    <img src="https://i.imgur.com/iZFkTAN.png" alt="BURBAN" style="height:60px;">
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="font-size:22px;font-weight:400;margin:0 0 8px;color:#000;">De retour en stock !</h1>
    <p style="font-size:15px;color:#666;margin:0 0 32px;">L'article que vous attendiez est &agrave; nouveau disponible.</p>
    ${productImage ? `<div style="text-align:center;margin-bottom:32px;"><a href="${productUrl}"><img src="${productImage}" alt="${productName}" style="max-width:100%;max-height:380px;object-fit:cover;"></a></div>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;padding:24px 0;margin-bottom:32px;">
      <tr><td>
        <p style="font-size:18px;font-weight:500;margin:0 0 8px;color:#000;">${productName}</p>
        ${color ? `<p style="font-size:14px;color:#666;margin:0 0 4px;">Couleur&nbsp;: ${color}</p>` : ''}
        ${size ? `<p style="font-size:14px;color:#666;margin:0 0 4px;">Taille&nbsp;: ${size}</p>` : ''}
        ${productPrice ? `<p style="font-size:20px;font-weight:500;margin:12px 0 0;color:#000;">${parseFloat(productPrice).toFixed(2)} &euro;</p>` : ''}
      </td></tr>
    </table>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${productUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:16px 40px;font-size:13px;letter-spacing:1px;">COMMANDER MAINTENANT</a>
    </div>
    <p style="font-size:13px;color:#999;margin:0;">Les stocks sont limit&eacute;s, ne tardez pas !</p>
  </td></tr>
  <tr><td style="background:#f5f5f5;padding:20px;text-align:center;border-top:1px solid #e0e0e0;">
    <p style="font-size:12px;color:#999;margin:0;">&copy; ${new Date().getFullYear()} BURBAN. Tous droits r&eacute;serv&eacute;s.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

    try {
        await mg.messages.create(MAILGUN_DOMAIN, {
            from: MAILGUN_FROM,
            to: [email],
            subject: `${productName} est de retour en stock !`,
            html
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur Mailgun:', error.message);
        res.status(500).json({ success: false, error: error.message });
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
