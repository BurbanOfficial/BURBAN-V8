async function sendOrderConfirmationEmail(email, orderData) {
    try {
        const response = await fetch('https://burban-v8.onrender.com/send-mailrelay-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, orderData })
        });
        
        const result = await response.json();
        console.log('Email envoyé:', result);
        return result;
    } catch (error) {
        console.error('Erreur envoi email:', error);
    }
}

window.mailrelayService = {
    sendOrderConfirmationEmail
};
