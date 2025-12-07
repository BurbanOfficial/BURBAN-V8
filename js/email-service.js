// Service d'envoi d'emails direct via Brevo API
class EmailService {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://api.brevo.com/v3/smtp/email';
    }

    async sendStockNotification(email, productName, color, size) {
        const colorNames = {
            '#000000': 'Noir', '#FFFFFF': 'Blanc', '#808080': 'Gris',
            '#FF0000': 'Rouge', '#0000FF': 'Bleu', '#008000': 'Vert'
        };

        const emailData = {
            sender: { name: 'BURBAN', email: 'noreply@burbanofficial.com' },
            to: [{ email: email }],
            subject: `${productName} est de retour en stock !`,
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #000; }
                        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                        h2 { font-size: 24px; font-weight: 300; margin-bottom: 16px; }
                        p { font-size: 16px; line-height: 1.6; color: #666; }
                        .product { background: #f5f5f5; padding: 20px; margin: 24px 0; }
                        .btn { display: inline-block; background: #000; color: #fff; padding: 14px 32px; text-decoration: none; margin-top: 24px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Bonne nouvelle !</h2>
                        <p>Le produit que vous attendiez est de retour en stock :</p>
                        <div class="product">
                            <strong>${productName}</strong><br>
                            Couleur : ${colorNames[color] || color}<br>
                            Taille : ${size}
                        </div>
                        <p>Dépêchez-vous, les stocks sont limités !</p>
                        <a href="https://burbanofficial.com/products" class="btn">Voir le produit</a>
                    </div>
                </body>
                </html>
            `
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                console.log(`Email envoyé à ${email}`);
                return true;
            } else {
                console.error('Erreur envoi email:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            return false;
        }
    }
}

window.emailService = new EmailService();