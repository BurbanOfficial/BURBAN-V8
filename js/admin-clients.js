let allClients = [];

async function loadClients() {
    try {
        const { collection, getDocs } = window.firebaseModules;
        const usersSnapshot = await getDocs(collection(window.firebaseDb, 'users'));
        
        allClients = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayClients(allClients);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des clients');
    }
}

function displayClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    const role = sessionStorage.getItem('userRole');
    
    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${client.firstname || ''} ${client.lastname || ''}</td>
            <td>${client.email || ''}</td>
            <td>${client.phone || '-'}</td>
            <td>${client.points || 0}</td>
            <td>${client.orders?.length || 0}</td>
            <td>${client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
            <td>
                ${role !== 'customer_support' ? `<button class="admin-btn" onclick="editClient('${client.id}')">Modifier</button>` : '<span style="color: var(--gray);">Lecture seule</span>'}
            </td>
        </tr>
    `).join('');
}

document.getElementById('clientSearch')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = allClients.filter(client => 
        (client.firstname?.toLowerCase().includes(search)) ||
        (client.lastname?.toLowerCase().includes(search)) ||
        (client.email?.toLowerCase().includes(search)) ||
        (client.phone?.includes(search))
    );
    displayClients(filtered);
});

async function editClient(clientId) {
    const role = sessionStorage.getItem('userRole');
    if (role === 'customer_support') {
        alert('Vous n\'avez pas les permissions pour modifier les clients');
        return;
    }
    
    try {
        const { doc, getDoc } = window.firebaseModules;
        const clientDoc = await getDoc(doc(window.firebaseDb, 'users', clientId));
        
        if (!clientDoc.exists()) {
            alert('Client introuvable');
            return;
        }
        
        const client = clientDoc.data();
        
        document.getElementById('clientId').value = clientId;
        document.getElementById('clientFirstname').value = client.firstname || '';
        document.getElementById('clientLastname').value = client.lastname || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientCountry').value = client.country || '';
        document.getElementById('clientBirthday').value = client.birthday || '';
        document.getElementById('clientPoints').value = client.points || 0;
        document.getElementById('clientNewsletter').checked = client.newsletter || false;
        
        const addressesDiv = document.getElementById('clientAddresses');
        if (client.addresses && client.addresses.length > 0) {
            addressesDiv.innerHTML = client.addresses.map((addr, i) => `
                <div style="padding: 12px; border: 1px solid var(--border); margin-bottom: 8px; border-radius: 4px;">
                    <strong>${addr.name || 'Adresse ' + (i + 1)}</strong><br>
                    ${addr.firstName} ${addr.lastName}<br>
                    ${addr.address}<br>
                    ${addr.postal} ${addr.city}<br>
                    ${addr.country || ''}
                </div>
            `).join('');
        } else {
            addressesDiv.innerHTML = '<p style="color: var(--gray);">Aucune adresse</p>';
        }
        
        const ordersDiv = document.getElementById('clientOrders');
        if (client.orders && client.orders.length > 0) {
            const ordersPromises = client.orders.map(orderNum => 
                getDoc(doc(window.firebaseDb, 'orders', orderNum))
            );
            const ordersDocs = await Promise.all(ordersPromises);
            
            ordersDiv.innerHTML = ordersDocs.map(orderDoc => {
                if (!orderDoc.exists()) return '';
                const order = orderDoc.data();
                return `
                    <div style="padding: 12px; border: 1px solid var(--border); margin-bottom: 8px; border-radius: 4px;">
                        <strong>${order.orderNumber}</strong> - ${new Date(order.date).toLocaleDateString('fr-FR')}<br>
                        Montant: ${order.total?.toFixed(2)}€<br>
                        Statut: ${order.status}
                    </div>
                `;
            }).join('');
        } else {
            ordersDiv.innerHTML = '<p style="color: var(--gray);">Aucune commande</p>';
        }
        
        document.getElementById('clientModal').classList.add('active');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement du client');
    }
}

document.getElementById('clientForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const clientId = document.getElementById('clientId').value;
    const clientData = {
        firstname: document.getElementById('clientFirstname').value,
        lastname: document.getElementById('clientLastname').value,
        phone: document.getElementById('clientPhone').value,
        country: document.getElementById('clientCountry').value,
        birthday: document.getElementById('clientBirthday').value,
        points: parseInt(document.getElementById('clientPoints').value) || 0,
        newsletter: document.getElementById('clientNewsletter').checked
    };
    
    try {
        const { doc, updateDoc } = window.firebaseModules;
        await updateDoc(doc(window.firebaseDb, 'users', clientId), clientData);
        
        alert('Client mis à jour avec succès');
        document.getElementById('clientModal').classList.remove('active');
        loadClients();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour');
    }
});

document.getElementById('resetPasswordBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('clientEmail').value;
    
    if (!confirm(`Envoyer un email de réinitialisation à ${email} ?`)) return;
    
    try {
        const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=AIzaSyDb4AOtRT7jGENnLZ2KNwpczaG2Z77G2rc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestType: 'PASSWORD_RESET',
                email: email
            })
        });
        
        if (response.ok) {
            alert('Email de réinitialisation envoyé');
        } else {
            throw new Error('Erreur');
        }
    } catch (error) {
        alert('Erreur lors de l\'envoi');
    }
});

document.querySelector('#clientModal .modal-close')?.addEventListener('click', () => {
    document.getElementById('clientModal').classList.remove('active');
});

window.editClient = editClient;
window.loadClients = loadClients;
