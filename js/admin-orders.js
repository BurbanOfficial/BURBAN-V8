let allOrders = [];
let currentFilter = 'all';

// Charger les commandes
async function loadOrders() {
    if (!window.firebaseReady) return;
    
    try {
        const { collection, getDocs } = window.firebaseModules;
        const snapshot = await getDocs(collection(window.firebaseDb, 'orders'));
        allOrders = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.date) - new Date(a.date));
        displayOrders(allOrders);
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = orders.map(order => {
        const statusColors = {
            processing: '#f59e0b',
            shipped: '#3b82f6',
            delivered: '#22c55e',
            cancelled: '#ef4444'
        };
        const statusLabels = {
            processing: 'En traitement',
            shipped: 'Envoyé',
            delivered: 'Livré',
            cancelled: 'Annulé'
        };
        return `
            <tr style="${order.status === 'cancelled' ? 'opacity: 0.6;' : ''}">
                <td>${order.orderNumber} ${order.status === 'cancelled' ? '<span style="color: #ef4444;">✕</span>' : ''}</td>
                <td>${order.userEmail}</td>
                <td>${new Date(order.date).toLocaleDateString('fr-FR')}</td>
                <td>${order.total.toFixed(2)} €</td>
                <td><span style="padding: 4px 12px; background: ${statusColors[order.status] || '#f59e0b'}; color: white; border-radius: 4px; font-size: 12px;">${statusLabels[order.status] || 'En traitement'}</span></td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="viewOrderDetails('${order.orderNumber}')">Voir</button>
                        ${order.status !== 'cancelled' && order.status !== 'delivered' ? `<button class="admin-btn" onclick="editOrder('${order.orderNumber}')">Gérer</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterOrders(status) {
    currentFilter = status;
    document.querySelectorAll('[id^="filter-"]').forEach(btn => {
        btn.style.background = 'var(--light-gray)';
        btn.style.color = 'var(--black)';
    });
    const activeBtn = document.getElementById(`filter-${status}`);
    if (activeBtn) {
        activeBtn.style.background = 'var(--black)';
        activeBtn.style.color = 'var(--white)';
    }
    
    const searchTerm = document.getElementById('orderSearch')?.value.toLowerCase() || '';
    let filtered = allOrders;
    
    if (status !== 'all') {
        filtered = filtered.filter(o => o.status === status);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(o => 
            o.orderNumber.toLowerCase().includes(searchTerm) ||
            o.userEmail.toLowerCase().includes(searchTerm) ||
            o.total.toString().includes(searchTerm) ||
            (o.shippingAddress?.firstName || '').toLowerCase().includes(searchTerm) ||
            (o.shippingAddress?.lastName || '').toLowerCase().includes(searchTerm) ||
            (o.shippingAddress?.phone || '').includes(searchTerm) ||
            (o.shippingAddress?.address || '').toLowerCase().includes(searchTerm)
        );
    }
    
    displayOrders(filtered);
}

window.filterOrders = filterOrders;

// Voir les détails d'une commande
async function viewOrderDetails(orderNumber) {
    const { doc, getDoc } = window.firebaseModules;
    const orderDoc = await getDoc(doc(window.firebaseDb, 'orders', orderNumber));
    const order = orderDoc.data();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            <h3>Commande ${order.orderNumber}</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 24px;">
                <div>
                    <h4 style="margin-bottom: 12px;">Livraison</h4>
                    <p>${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}</p>
                    <p>${order.shippingAddress?.address || ''}</p>
                    <p>${order.shippingAddress?.phone || ''}</p>
                    <p>${order.shippingAddress?.email || ''}</p>
                </div>
                <div>
                    <h4 style="margin-bottom: 12px;">Paiement</h4>
                    <p>Carte bancaire</p>
                    <p>**** **** **** ${order.cardLast4 || 'XXXX'}</p>
                    <p style="margin-top: 12px;"><strong>Total: ${order.total.toFixed(2)} €</strong></p>
                </div>
            </div>
            <h4 style="margin: 24px 0 12px;">Articles</h4>
            ${order.items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 12px; border: 1px solid var(--border); margin-bottom: 8px;">
                    <span>${item.name} - Taille ${item.size} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} €</span>
                </div>
            `).join('')}
        </div>
    `;
    document.body.appendChild(modal);
}

window.viewOrderDetails = viewOrderDetails;

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

window.editOrder = editOrder;

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
        setTimeout(() => loadOrders(), 500);
        alert('Commande mise à jour');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour');
    }
});

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
    
    // Initialiser la recherche
    document.getElementById('orderSearch')?.addEventListener('input', () => {
        filterOrders(currentFilter);
    });
    
    // Activer le filtre "Toutes" par défaut et initialiser les boutons
    setTimeout(() => {
        const filterAll = document.getElementById('filter-all');
        if (filterAll) {
            filterAll.style.background = 'var(--black)';
            filterAll.style.color = 'var(--white)';
            
            // Attacher les événements aux boutons de filtre
            document.getElementById('filter-all')?.addEventListener('click', () => filterOrders('all'));
            document.getElementById('filter-processing')?.addEventListener('click', () => filterOrders('processing'));
            document.getElementById('filter-shipped')?.addEventListener('click', () => filterOrders('shipped'));
            document.getElementById('filter-delivered')?.addEventListener('click', () => filterOrders('delivered'));
            document.getElementById('filter-cancelled')?.addEventListener('click', () => filterOrders('cancelled'));
        }
    }, 1000);
}, 500);
