// Charger les commandes
async function loadOrders() {
    if (!window.firebaseReady) return;
    
    try {
        const { collection, getDocs, doc, updateDoc, deleteDoc } = window.firebaseModules;
        const snapshot = await getDocs(collection(window.firebaseDb, 'orders'));
        const orders = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.orderNumber}</td>
                <td>${order.userEmail}</td>
                <td>${new Date(order.date).toLocaleDateString('fr-FR')}</td>
                <td>${order.total.toFixed(2)} €</td>
                <td><span style="padding: 4px 12px; background: ${order.status === 'shipped' ? '#22c55e' : '#f59e0b'}; color: white; border-radius: 4px; font-size: 12px;">${order.status === 'shipped' ? 'Envoyé' : 'En traitement'}</span></td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="editOrder('${order.orderNumber}')">Gérer</button>
                        ${order.status !== 'shipped' ? `<button class="admin-btn admin-btn-delete" onclick="cancelOrder('${order.orderNumber}')">Annuler</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

// Éditer une commande
async function editOrder(orderNumber) {
    const { doc, getDoc } = window.firebaseModules;
    const orderDoc = await getDoc(doc(window.firebaseDb, 'orders', orderNumber));
    const order = orderDoc.data();
    
    document.getElementById('orderNumber').value = orderNumber;
    document.getElementById('orderTrackingUrl').value = order.trackingUrl || '';
    document.getElementById('orderStatus').value = order.status;
    document.getElementById('orderModal').classList.add('active');
}

// Sauvegarder les modifications
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const orderNumber = document.getElementById('orderNumber').value;
    const trackingUrl = document.getElementById('orderTrackingUrl').value;
    const status = document.getElementById('orderStatus').value;
    
    try {
        const { doc, updateDoc } = window.firebaseModules;
        await updateDoc(doc(window.firebaseDb, 'orders', orderNumber), {
            trackingUrl,
            status
        });
        
        document.getElementById('orderModal').classList.remove('active');
        loadOrders();
        alert('Commande mise à jour');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour');
    }
});

// Annuler une commande
async function cancelOrder(orderNumber) {
    if (!confirm('Annuler cette commande ?')) return;
    
    try {
        const { doc, deleteDoc, getDoc, collection, getDocs, setDoc } = window.firebaseModules;
        
        // Récupérer la commande
        const orderDoc = await getDoc(doc(window.firebaseDb, 'orders', orderNumber));
        const order = orderDoc.data();
        
        // Remettre le stock
        const productsSnapshot = await getDocs(collection(window.firebaseDb, 'products'));
        for (const item of order.items) {
            const productDoc = productsSnapshot.docs.find(d => d.data().id === item.id);
            if (productDoc) {
                const product = productDoc.data();
                const variantKey = `${item.color}-${item.size}`;
                product.stockByVariant[variantKey] = (product.stockByVariant[variantKey] || 0) + item.quantity;
                await setDoc(doc(window.firebaseDb, 'products', `${product.id}`), product);
            }
        }
        
        // Supprimer la commande
        await deleteDoc(doc(window.firebaseDb, 'orders', orderNumber));
        
        loadOrders();
        alert('Commande annulée et stock restauré');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'annulation');
    }
}

window.editOrder = editOrder;
window.cancelOrder = cancelOrder;

// Charger au démarrage
setTimeout(() => {
    if (document.getElementById('ordersTableBody')) {
        const waitForFirebase = setInterval(() => {
            if (window.firebaseReady) {
                clearInterval(waitForFirebase);
                loadOrders();
            }
        }, 100);
    }
}, 500);
