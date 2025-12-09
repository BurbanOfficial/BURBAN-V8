let allHistory = [];

async function loadHistory() {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin_manager') {
        document.getElementById('historyTableBody').innerHTML = '<tr><td colspan="6" style="text-align: center;">Accès non autorisé</td></tr>';
        return;
    }
    
    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const historySnapshot = await getDocs(query(collection(window.firebaseDb, 'login_history'), orderBy('timestamp', 'desc')));
        
        allHistory = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayHistory(allHistory);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function applyFilters() {
    const search = document.getElementById('historySearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('historyRoleFilter')?.value || '';
    const dateFrom = document.getElementById('historyDateFrom')?.value || '';
    const dateTo = document.getElementById('historyDateTo')?.value || '';
    
    let filtered = allHistory;
    
    if (search) {
        filtered = filtered.filter(entry => 
            (entry.firstname?.toLowerCase().includes(search)) ||
            (entry.lastname?.toLowerCase().includes(search)) ||
            (entry.email?.toLowerCase().includes(search))
        );
    }
    
    if (roleFilter) {
        filtered = filtered.filter(entry => entry.role === roleFilter);
    }
    
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter(entry => new Date(entry.timestamp) >= fromDate);
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        filtered = filtered.filter(entry => new Date(entry.timestamp) <= toDate);
    }
    
    displayHistory(filtered);
}

function displayHistory(history) {
    const tbody = document.getElementById('historyTableBody');
    
    tbody.innerHTML = history.map(entry => {
        const securityLevel = getSecurityLevel(entry.securityScore);
        const date = new Date(entry.timestamp);
        
        return `
            <tr>
                <td>${entry.firstname || ''} ${entry.lastname || ''}</td>
                <td>${entry.email}</td>
                <td>${getRoleLabel(entry.role)}</td>
                <td>${date.toLocaleString('fr-FR')}</td>
                <td>
                    ${entry.event === 'login' ? `<span style="padding: 4px 12px; background: ${securityLevel.color}; color: white; border-radius: 4px; font-size: 12px;">${securityLevel.label}</span>` : '<span style="color: var(--gray);">Déconnexion</span>'}
                </td>
                <td>
                    <button class="admin-btn" onclick="viewHistoryDetails('${entry.id}')">Détails</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getSecurityLevel(score) {
    if (score > 70) return { label: 'Sécurisé', color: '#22c55e' };
    if (score >= 40) return { label: 'Suspect', color: '#f59e0b' };
    return { label: 'Dangereux', color: '#ef4444' };
}

function getRoleLabel(role) {
    const labels = {
        'admin_manager': 'Admin Manager',
        'customer_support': 'Support Client',
        'limited_operator': 'Opérateur'
    };
    return labels[role] || role;
}

async function viewHistoryDetails(entryId) {
    const entry = allHistory.find(e => e.id === entryId);
    if (!entry) return;
    
    const securityLevel = getSecurityLevel(entry.securityScore);
    const date = new Date(entry.timestamp);
    
    document.getElementById('detailUserId').textContent = entry.userId;
    document.getElementById('detailEmail').textContent = entry.email;
    document.getElementById('detailRole').textContent = getRoleLabel(entry.role);
    document.getElementById('detailTimestamp').textContent = date.toLocaleString('fr-FR', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    document.getElementById('detailIP').textContent = entry.ip || 'N/A';
    document.getElementById('detailLocation').textContent = `${entry.city || 'N/A'}, ${entry.country || 'N/A'}`;
    document.getElementById('detail2FA').textContent = entry.twoFAValidated ? 'Validé ✓' : 'Non validé ✗';
    document.getElementById('detailSessionId').textContent = entry.sessionId || 'N/A';
    document.getElementById('detailEvent').textContent = entry.event === 'login' ? 'Connexion' : 'Déconnexion';
    document.getElementById('detailSecurityScore').textContent = `${entry.securityScore} - ${securityLevel.label}`;
    document.getElementById('detailSecurityScore').style.color = securityLevel.color;
    
    const { doc, getDoc } = window.firebaseModules;
    const blockedDoc = await getDoc(doc(window.firebaseDb, 'blocked_users', entry.userId));
    const isBlocked = blockedDoc.exists();
    
    document.getElementById('blockUserBtn').setAttribute('data-user-id', entry.userId);
    document.getElementById('blockUserBtn').setAttribute('data-email', entry.email);
    document.getElementById('blockUserBtn').style.display = isBlocked ? 'none' : 'block';
    
    document.getElementById('unblockUserBtn').setAttribute('data-user-id', entry.userId);
    document.getElementById('unblockUserBtn').setAttribute('data-email', entry.email);
    document.getElementById('unblockUserBtn').style.display = isBlocked ? 'block' : 'none';
    
    document.getElementById('historyDetailModal').classList.add('active');
}

document.getElementById('blockUserBtn')?.addEventListener('click', async function() {
    const userId = this.getAttribute('data-user-id');
    const email = this.getAttribute('data-email');
    
    if (!confirm(`Bloquer l'accès de ${email} ?`)) return;
    
    try {
        const { doc, setDoc } = window.firebaseModules;
        await setDoc(doc(window.firebaseDb, 'blocked_users', userId), {
            email,
            blockedAt: new Date().toISOString(),
            reason: 'Bloqué manuellement par admin'
        });
        
        alert('Utilisateur bloqué avec succès');
        document.getElementById('historyDetailModal').classList.remove('active');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du blocage');
    }
});

document.getElementById('unblockUserBtn')?.addEventListener('click', async function() {
    const userId = this.getAttribute('data-user-id');
    const email = this.getAttribute('data-email');
    
    if (!confirm(`Débloquer l'accès de ${email} ?`)) return;
    
    try {
        const { doc, deleteDoc } = window.firebaseModules;
        await deleteDoc(doc(window.firebaseDb, 'blocked_users', userId));
        
        alert('Utilisateur débloqué avec succès');
        document.getElementById('historyDetailModal').classList.remove('active');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du déblocage');
    }
});

document.querySelector('#historyDetailModal .modal-close')?.addEventListener('click', () => {
    document.getElementById('historyDetailModal').classList.remove('active');
});

document.getElementById('historySearch')?.addEventListener('input', applyFilters);
document.getElementById('historyRoleFilter')?.addEventListener('change', applyFilters);
document.getElementById('historyDateFrom')?.addEventListener('change', applyFilters);
document.getElementById('historyDateTo')?.addEventListener('change', applyFilters);

window.viewHistoryDetails = viewHistoryDetails;
window.loadHistory = loadHistory;
