async function getGeoIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
            ip: data.ip,
            city: data.city,
            country: data.country_name,
            isVPN: data.threat?.is_proxy || false
        };
    } catch (error) {
        console.error('Erreur GeoIP:', error);
        return { ip: 'Unknown', city: 'Unknown', country: 'Unknown', isVPN: false };
    }
}

function calculateSecurityScore(geoData, userData, twoFASuccess) {
    let score = 50;
    
    const lastLogin = userData.lastLogin;
    if (lastLogin) {
        if (lastLogin.country === geoData.country) score += 20;
        if (lastLogin.city === geoData.city) score += 10;
    }
    
    if (geoData.isVPN) score -= 30;
    
    if (twoFASuccess) {
        score += 30;
    } else {
        score -= 40;
    }
    
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) score -= 10;
    
    return Math.max(0, Math.min(100, score));
}

async function logLogin(userId, email, role, firstname, lastname, twoFASuccess) {
    try {
        const geoData = await getGeoIP();
        const { doc, setDoc, getDoc, collection } = window.firebaseModules;
        const db = window.firebaseDb;
        
        const userDoc = await getDoc(doc(db, 'crew', userId));
        const userData = userDoc.data();
        
        const securityScore = calculateSecurityScore(geoData, userData, twoFASuccess);
        
        const logEntry = {
            userId,
            email,
            role,
            firstname: firstname || '',
            lastname: lastname || '',
            timestamp: new Date().toISOString(),
            ip: geoData.ip,
            city: geoData.city,
            country: geoData.country,
            twoFAValidated: twoFASuccess,
            sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
            event: 'login',
            securityScore
        };
        
        await setDoc(doc(collection(db, 'login_history')), logEntry);
        
        await setDoc(doc(db, 'crew', userId), {
            lastLogin: {
                timestamp: new Date().toISOString(),
                ip: geoData.ip,
                city: geoData.city,
                country: geoData.country
            }
        }, { merge: true });
        
        return securityScore;
    } catch (error) {
        console.error('Erreur logging:', error);
        return 50;
    }
}

async function logLogout(userId, email, role) {
    try {
        const { doc, setDoc, collection } = window.firebaseModules;
        
        await setDoc(doc(collection(window.firebaseDb, 'login_history')), {
            userId,
            email,
            role,
            timestamp: new Date().toISOString(),
            event: 'logout',
            securityScore: 100
        });
    } catch (error) {
        console.error('Erreur logout logging:', error);
    }
}

async function checkBlockedUser(userId) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const blockedDoc = await getDoc(doc(window.firebaseDb, 'blocked_users', userId));
        return blockedDoc.exists();
    } catch (error) {
        console.error('Erreur vérification blocage:', error);
        return false;
    }
}

function showBlockedScreen() {
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; padding: 24px;">
            <div style="text-align: center; max-width: 500px; background: white; padding: 48px; border: 1px solid #e0e0e0;">
                <div style="width: 80px; height: 80px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 40px; color: white;">🔒</div>
                <h1 style="font-size: 24px; margin-bottom: 16px; font-weight: 600;">Accès bloqué</h1>
                <p style="color: #666; margin-bottom: 24px; line-height: 1.6;">Votre compte a été temporairement bloqué pour des raisons de sécurité.</p>
                <p style="color: #666; font-size: 14px;">Veuillez contacter :<br><strong>direction@burbanofficial.com</strong></p>
            </div>
        </div>
    `;
}

async function showSuspiciousWarning(email) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3 style="margin-bottom: 16px;">⚠️ Vérification requise</h3>
                <p style="color: #666; margin-bottom: 24px;">Activité suspecte détectée. Un email de vérification a été envoyé à ${email}.</p>
                <p style="font-size: 14px; color: #666;">Veuillez vérifier votre email et cliquer sur le lien de confirmation.</p>
            </div>
        `;
        document.body.appendChild(modal);
        
        const checkInterval = setInterval(async () => {
            const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const auth = getAuth();
            await auth.currentUser.reload();
            
            if (auth.currentUser.emailVerified) {
                clearInterval(checkInterval);
                modal.remove();
                resolve(true);
            }
        }, 3000);
    });
}

window.securityLogger = {
    logLogin,
    logLogout,
    checkBlockedUser,
    showBlockedScreen,
    showSuspiciousWarning
};
