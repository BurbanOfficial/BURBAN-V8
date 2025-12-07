// Gestion des bons de fidélité
window.selectedVoucher = null;

async function displayVouchers() {
    const vouchersContainer = document.getElementById('vouchersContainer');
    if (!vouchersContainer) return;

    // Vérifier si l'utilisateur est connecté
    if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        vouchersContainer.style.display = 'none';
        return;
    }

    vouchersContainer.style.display = 'block';

    const { doc, getDoc } = window.firebaseModules;
    const userDoc = await getDoc(doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid));
    const userData = userDoc.data();
    const points = userData?.points || 0;
    const cartTotal = getCartTotal();

    const vouchers = [
        { points: 500, discount: 5, minPurchase: 30 },
        { points: 1000, discount: 10, minPurchase: 40 },
        { points: 2000, discount: 20, minPurchase: 60 },
        { points: 2500, discount: 30, minPurchase: 100 }
    ];

    vouchersContainer.innerHTML = `
        <h3 style="margin-bottom: 16px;">Utiliser mes points de fidélité (${points} points disponibles)</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
            ${vouchers.map(v => {
                const hasEnoughPoints = points >= v.points;
                const hasMinPurchase = cartTotal >= v.minPurchase;
                const canUse = hasEnoughPoints && hasMinPurchase;
                const isSelected = window.selectedVoucher?.points === v.points;
                return `
                    <div ${canUse ? `onclick="selectVoucher(${v.points}, ${v.discount}, ${v.minPurchase})"` : ''}
                         style="border: 2px solid ${isSelected ? '#000' : 'var(--border)'}; padding: 16px; text-align: center; cursor: ${canUse ? 'pointer' : 'not-allowed'}; opacity: ${canUse ? '1' : '0.4'}; background: ${isSelected ? 'var(--light-gray)' : canUse ? '#fff' : '#f5f5f5'};">
                        <p style="font-size: 20px; font-weight: 500; margin-bottom: 4px;">-${v.discount}€</p>
                        <p style="font-size: 12px; color: var(--gray); margin-bottom: 8px;">${v.points} points</p>
                        <p style="font-size: 11px; color: var(--gray);">Dès ${v.minPurchase}€</p>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

async function selectVoucher(points, discount, minPurchase) {
    const { doc, getDoc } = window.firebaseModules;
    const userDoc = await getDoc(doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid));
    const userData = userDoc.data();
    const userPoints = userData?.points || 0;
    const cartTotal = getCartTotal();

    if (userPoints < points || cartTotal < minPurchase) {
        return;
    }

    // Confirmation
    document.body.classList.add('modal-open');
    const modal = document.createElement('div');
    modal.className = 'custom-modal active';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <p>Voulez-vous échanger ${points} points contre un bon de ${discount}€ ?</p>
            <div style="display: flex; gap: 12px; margin-top: 24px; justify-content: center;">
                <button class="btn-secondary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove()">Annuler</button>
                <button class="btn-primary" id="confirmVoucher">Confirmer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirmVoucher').onclick = async () => {
        window.selectedVoucher = { points, discount, minPurchase };
        document.body.classList.remove('modal-open');
        modal.remove();
        displayVouchers();
        if (window.updateCheckoutSummary) {
            window.updateCheckoutSummary();
        }
    };
}

window.selectVoucher = selectVoucher;
window.displayVouchers = displayVouchers;