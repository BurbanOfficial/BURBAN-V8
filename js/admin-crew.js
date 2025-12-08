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
    try {
        const { doc, getDoc } = window.firebaseModules;
        const userDoc = await getDoc(doc(window.firebaseDb, 'crew', userId));
        
        if (!userDoc.exists()) {
            alert('Utilisateur introuvable');
            return;
        }
        
        const user = userDoc.data();
        
        document.getElementById('crewUserId').value = userId;
        document.getElementById('crewUserFirstname').value = user.firstname || '';
        document.getElementById('crewUserLastname').value = user.lastname || '';
        document.getElementById('crewUserEmail').value = user.email || '';
        document.getElementById('crewUserRole').value = user.role || '';
        document.getElementById('crewUserActive').checked = user.active !== false;
        
        document.getElementById('crewUserModal').classList.add('active');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement');
    }
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

document.getElementById('crewUserForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('crewUserId').value;
    const userData = {
        firstname: document.getElementById('crewUserFirstname').value,
        lastname: document.getElementById('crewUserLastname').value,
        role: document.getElementById('crewUserRole').value,
        active: document.getElementById('crewUserActive').checked
    };
    
    try {
        const { doc, updateDoc } = window.firebaseModules;
        await updateDoc(doc(window.firebaseDb, 'crew', userId), userData);
        
        alert('Utilisateur mis à jour');
        document.getElementById('crewUserModal').classList.remove('active');
        loadCrewUsers();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour');
    }
});

document.querySelector('#crewUserModal .modal-close')?.addEventListener('click', () => {
    document.getElementById('crewUserModal').classList.remove('active');
});

window.loadCrewUsers = loadCrewUsers;
window.editCrewUser = editCrewUser;
window.deleteCrewUser = deleteCrewUser;
