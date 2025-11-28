let captchaAnswer = 0;
let formSubmitTime = 0;
const formLoadTime = Date.now();

// Generate random math CAPTCHA
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = num1 + num2;
    document.getElementById('captchaQuestion').textContent = `Combien font ${num1} + ${num2} ?`;
}

// Validate email format
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Anti-spam checks
function passesSecurityChecks(formData) {
    // Check honeypot field (should be empty)
    if (formData.get('website')) {
        return false;
    }
    
    // Check form submission time (should take at least 3 seconds)
    const timeTaken = (Date.now() - formLoadTime) / 1000;
    if (timeTaken < 3) {
        return false;
    }
    
    // Check CAPTCHA
    const userAnswer = parseInt(document.getElementById('captchaAnswer').value);
    if (userAnswer !== captchaAnswer) {
        return false;
    }
    
    // Check email validity
    if (!isValidEmail(formData.get('email'))) {
        return false;
    }
    
    // Check message length (spam usually very short or very long)
    const message = formData.get('message');
    if (message.length < 10 || message.length > 2000) {
        return false;
    }
    
    // Check for spam keywords
    const spamKeywords = ['viagra', 'casino', 'lottery', 'prize', 'click here', 'buy now'];
    const content = (message + formData.get('subject')).toLowerCase();
    if (spamKeywords.some(keyword => content.includes(keyword))) {
        return false;
    }
    
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();
    
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = document.getElementById('submitBtn');
        const formMessage = document.getElementById('formMessage');
        
        // Security checks
        if (!passesSecurityChecks(formData)) {
            formMessage.textContent = 'Erreur de validation. Veuillez vérifier vos réponses.';
            formMessage.style.color = '#df1b41';
            generateCaptcha();
            document.getElementById('captchaAnswer').value = '';
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi...';
        
        // Simulate sending (in production, send to backend)
        setTimeout(() => {
            formMessage.textContent = 'Message envoyé avec succès ! Nous vous répondrons sous 24h.';
            formMessage.style.color = '#000';
            e.target.reset();
            generateCaptcha();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer';
            
            // Store message locally for demo
            const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
            messages.push({
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                date: new Date().toISOString()
            });
            localStorage.setItem('contactMessages', JSON.stringify(messages));
        }, 1500);
    });
    
    // Regenerate CAPTCHA on wrong answer
    document.getElementById('captchaAnswer').addEventListener('input', () => {
        document.getElementById('formMessage').textContent = '';
    });
});
