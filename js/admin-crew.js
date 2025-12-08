async function loadCrewUsers() {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin_manager') {
        return;
    }
    
    try {
        const { collection, getDocs } = window.firebaseModules;
        const crewSnapshot = await getDocs(collection(window.firebaseDb, 'crew'));
        
        const crewUsers = crewSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayCrewUsers(crewUsers);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function displayCrewUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    const roleLabels = {
        'admin_manager': 'Admin Manager',
        'customer_support': 'Customer Support Agent',
        'limited_operator': 'Limited Operator'
    };
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.firstname} ${user.lastname}</td>
            <td>${user.email}</td>
            <td>${roleLabels[user.role] || user.role}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
            <td>
                <button class="admin-btn" onclick="editCrewUser('${user.id}')">Modifier</button>
                <button class="admin-btn admin-btn-delete" onclick="deleteCrewUser('${user.id}')">Supprimer</button>
            </td>
        </tr>
    `).join('');
}

async function editCrewUser(userId) {
    // À implémenter si besoin
    alert('Fonctionnalité à venir');
}

async function deleteCrewUser(userId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
        const { doc, deleteDoc } = window.firebaseModules;
        await deleteDoc(doc(window.firebaseDb, 'crew', userId));
        alert('Utilisateur supprimé');
        loadCrewUsers();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
    }
}

window.loadCrewUsers = loadCrewUsers;
window.editCrewUser = editCrewUser;
window.deleteCrewUser = deleteCrewUser;
