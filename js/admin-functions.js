// Gestion des catégories
function loadCategories() {
    const categories = JSON.parse(localStorage.getItem('adminCategories')) || [
        { id: 1, name: 'T-shirts', slug: 't-shirts' },
        { id: 2, name: 'Hoodies', slug: 'hoodies' },
        { id: 3, name: 'Pantalons', slug: 'pants' },
        { id: 4, name: 'Accessoires', slug: 'accessories' }
    ];
    
    if (!localStorage.getItem('adminCategories')) {
        localStorage.setItem('adminCategories', JSON.stringify(categories));
    }
    
    // Mettre à jour le select
    const select = document.getElementById('productCategory');
    if (select) {
        select.innerHTML = '<option value="">Catégorie</option>' + 
            categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
    }
    
    // Mettre à jour le tableau
    const tbody = document.getElementById('categoriesTableBody');
    if (tbody) {
        const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        tbody.innerHTML = categories.map(cat => {
            const count = products.filter(p => p.category === cat.slug).length;
            return `
                <tr>
                    <td>${cat.name}</td>
                    <td>${cat.slug}</td>
                    <td>${count}</td>
                    <td>
                        <button class="admin-btn admin-btn-delete" onclick="deleteCategory(${cat.id})">Supprimer</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function addCategory() {
    document.getElementById('categoryModal').classList.add('active');
}

document.getElementById('addCategoryBtn')?.addEventListener('click', addCategory);

document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('categoryName').value;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const categories = JSON.parse(localStorage.getItem('adminCategories')) || [];
    categories.push({
        id: Date.now(),
        name: name,
        slug: slug
    });
    
    localStorage.setItem('adminCategories', JSON.stringify(categories));
    document.getElementById('categoryModal').classList.remove('active');
    document.getElementById('categoryForm').reset();
    loadCategories();
});

function deleteCategory(id) {
    if (confirm('Supprimer cette catégorie ?')) {
        let categories = JSON.parse(localStorage.getItem('adminCategories')) || [];
        categories = categories.filter(c => c.id !== id);
        localStorage.setItem('adminCategories', JSON.stringify(categories));
        loadCategories();
    }
}

// Mise à jour du formulaire produit
document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const id = document.getElementById('productId').value;
    
    // Galerie d'images
    const images = [
        document.getElementById('productImage1').value,
        document.getElementById('productImage2').value,
        document.getElementById('productImage3').value,
        document.getElementById('productImage4').value
    ].filter(img => img);
    
    // Images par couleur
    const colors = document.getElementById('productColors').value.split(',').map(c => c.trim());
    const imagesByColor = {};
    colors.forEach(color => {
        imagesByColor[color] = images;
    });
    
    const promoActive = document.getElementById('productPromoActive').checked;
    const existingProduct = id ? products.find(p => p.id === parseInt(id)) : null;
    const sizes = document.getElementById('productSizes').value.split(',').map(s => s.trim());
    
    const product = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        gender: document.getElementById('productGender').value,
        image: images[0],
        images: images,
        imagesByColor: imagesByColor,
        sizes: sizes,
        colors: colors,
        details: document.getElementById('productDetails').value || '100% coton bio\nCoupe régulière\nFabriqué au Portugal',
        materials: document.getElementById('productMaterials').value || 'Coton biologique certifié GOTS\nTeinture sans produits chimiques\nLavage en machine à 30°',
        shipping: document.getElementById('productShipping').value || 'Livraison gratuite dès 100€\nRetours sous 30 jours\nExpédition sous 24-48h',
        publishDate: existingProduct ? existingProduct.publishDate : (document.getElementById('productPublishDate').value || new Date().toISOString()),
        unpublishDate: document.getElementById('productUnpublishDate').value || null,
        stockByVariant: saveStockVariants(colors, sizes),
        promoActive: promoActive,
        originalPrice: promoActive ? parseFloat(document.getElementById('productOriginalPrice').value) : null,
        promoEndDate: promoActive && !document.getElementById('productPromoUnlimited').checked ? document.getElementById('productPromoEndDate').value : null,
        sizeGuideId: document.getElementById('productSizeGuide').value ? parseInt(document.getElementById('productSizeGuide').value) : null
    };
    
    if (id) {
        const index = products.findIndex(p => p.id === parseInt(id));
        products[index] = product;
    } else {
        products.push(product);
    }
    
    localStorage.setItem('adminProducts', JSON.stringify(products));
    
    // Sauvegarder dans Firestore
    saveProductToFirestore(product);
    
    // Envoyer les notifications si le stock a augmenté
    if (id) {
        checkAndNotifyStockIncrease(product);
    }
    
    loadProducts();
    document.getElementById('productModal').classList.remove('active');
});

// Sauvegarder produit dans Firestore
async function saveProductToFirestore(product) {
    if (!window.firebaseReady) return;
    try {
        const { doc, setDoc } = window.firebaseModules;
        await setDoc(doc(window.firebaseDb, 'products', `${product.id}`), product);
        console.log('Produit sauvegardé dans Firestore');
    } catch (error) {
        console.error('Erreur Firestore:', error);
    }
}

// Charger produits depuis Firestore
async function loadProductsFromFirestore() {
    if (!window.firebaseReady) return;
    try {
        const { collection, getDocs } = window.firebaseModules;
        const snapshot = await getDocs(collection(window.firebaseDb, 'products'));
        const products = snapshot.docs.map(doc => doc.data());
        localStorage.setItem('adminProducts', JSON.stringify(products));
        loadProducts();
    } catch (error) {
        console.error('Erreur chargement Firestore:', error);
    }
}

// Mise à jour de loadProducts
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const role = sessionStorage.getItem('userRole');
    
    // Filtrer les produits selon les dates
    const now = new Date();
    const visibleProducts = products.filter(p => {
        if (p.publishDate && new Date(p.publishDate) > now) return false;
        if (p.unpublishDate && new Date(p.unpublishDate) < now) return false;
        return true;
    });
    
    tbody.innerHTML = products.map(product => {
        const isVisible = visibleProducts.includes(product);
        const stockText = 'Variantes';
        
        // Calculer l'état du stock
        let stockColor = '';
        if (product.stockByVariant) {
            const stocks = Object.values(product.stockByVariant);
            const allZero = stocks.every(s => s === 0);
            const someZero = stocks.some(s => s === 0);
            
            if (allZero) {
                stockColor = 'background: #fee2e2;';
            } else if (someZero) {
                stockColor = 'background: #fed7aa;';
            }
        }
        
        return `
            <tr style="${!isVisible ? 'opacity: 0.5;' : ''}">
                <td style="${stockColor}"><img src="${product.image || product.images?.[0]}" alt="${product.name}"></td>
                <td>${product.name}${!isVisible ? ' <small>(Non publié)</small>' : ''}</td>
                <td>${product.price.toFixed(2)} €</td>
                <td>${product.category}</td>
                <td>${stockText}</td>
                <td>
                    ${role === 'customer_support' ? '<span style="color: var(--gray);">Lecture seule</span>' : `
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="editProduct(${product.id})">Modifier</button>
                        <button class="admin-btn admin-btn-delete" onclick="deleteProduct(${product.id})">Supprimer</button>
                    </div>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function editProduct(id) {
    const role = sessionStorage.getItem('userRole');
    if (role === 'customer_support') {
        alert('Vous n\'avez pas les permissions pour modifier les produits');
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const product = products.find(p => p.id === id);
    
    if (product) {
        document.getElementById('productModalTitle').textContent = 'Modifier le produit';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productGender').value = product.gender;
        
        // Images
        const images = product.images || [product.image];
        document.getElementById('productImage1').value = images[0] || '';
        document.getElementById('productImage2').value = images[1] || '';
        document.getElementById('productImage3').value = images[2] || '';
        document.getElementById('productImage4').value = images[3] || '';
        
        document.getElementById('productSizes').value = product.sizes.join(', ');
        document.getElementById('productColors').value = product.colors.join(', ');
        document.getElementById('productDetails').value = product.details || '';
        document.getElementById('productMaterials').value = product.materials || '';
        document.getElementById('productShipping').value = product.shipping || '';
        document.getElementById('productPublishDate').value = product.publishDate || '';
        document.getElementById('productUnpublishDate').value = product.unpublishDate || '';
        
        // Charger le stock par variante
        setTimeout(() => loadStockVariants(product), 100);
        
        // Promo
        const promoActive = product.promoActive || false;
        document.getElementById('productPromoActive').checked = promoActive;
        document.getElementById('promoFields').style.display = promoActive ? 'block' : 'none';
        document.getElementById('productOriginalPrice').value = product.originalPrice || '';
        document.getElementById('productPromoUnlimited').checked = !product.promoEndDate && promoActive;
        document.getElementById('productPromoEndDate').value = product.promoEndDate || '';
        document.getElementById('productPromoEndDate').disabled = !product.promoEndDate && promoActive;
        document.getElementById('productSizeGuide').value = product.sizeGuideId || '';
        
        document.getElementById('productModal').classList.add('active');
    }
}

async function deleteProduct(id) {
    const role = sessionStorage.getItem('userRole');
    if (role === 'customer_support') {
        alert('Vous n\'avez pas les permissions pour supprimer les produits');
        return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        let products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem('adminProducts', JSON.stringify(products));
        
        // Supprimer de Firestore
        if (window.firebaseReady) {
            try {
                const { doc, deleteDoc } = window.firebaseModules;
                await deleteDoc(doc(window.firebaseDb, 'products', `${id}`));
            } catch (error) {
                console.error('Erreur suppression Firestore:', error);
            }
        }
        
        loadProducts();
    }
}

// Size Guides Management
function loadSizeGuides() {
    const guides = JSON.parse(localStorage.getItem('sizeGuides')) || [];
    
    // Update select in product form
    const select = document.getElementById('productSizeGuide');
    if (select) {
        select.innerHTML = '<option value="">Guide des tailles (optionnel)</option>' + 
            guides.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }
    
    // Update table
    const tbody = document.getElementById('sizeguidesTableBody');
    if (tbody) {
        const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        tbody.innerHTML = guides.map(guide => {
            const count = products.filter(p => p.sizeGuideId === guide.id).length;
            return `
                <tr>
                    <td>${guide.name}</td>
                    <td>${count}</td>
                    <td>
                        <div class="admin-actions">
                            <button class="admin-btn" onclick="editSizeGuide(${guide.id})">Modifier</button>
                            <button class="admin-btn admin-btn-delete" onclick="deleteSizeGuide(${guide.id})">Supprimer</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

let sizeGuideRowsData = [];

function renderSizeGuideRows() {
    const container = document.getElementById('sizeGuideRows');
    if (!container) return;
    
    const columnsInput = document.getElementById('sizeGuideColumns');
    if (!columnsInput) return;
    
    const columns = columnsInput.value.split(',').map(c => c.trim()).filter(c => c);
    
    container.innerHTML = sizeGuideRowsData.map((row, index) => `
        <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
            ${columns.map((col, colIndex) => `
                <input type="text" placeholder="${col}" value="${row[colIndex] || ''}" 
                    data-row="${index}" data-col="${colIndex}" class="size-guide-cell"
                    style="flex: 1;">
            `).join('')}
            <button type="button" class="remove-row-btn" data-index="${index}" style="background: none; color: var(--gray); padding: 8px; cursor: pointer;">✕</button>
        </div>
    `).join('');
    
    // Add event listeners
    container.querySelectorAll('.size-guide-cell').forEach(input => {
        input.addEventListener('input', function() {
            const row = parseInt(this.dataset.row);
            const col = parseInt(this.dataset.col);
            sizeGuideRowsData[row][col] = this.value;
        });
    });
    
    container.querySelectorAll('.remove-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            sizeGuideRowsData.splice(index, 1);
            renderSizeGuideRows();
        });
    });
}

function addSizeGuideRow() {
    const columnsInput = document.getElementById('sizeGuideColumns');
    if (!columnsInput || !columnsInput.value.trim()) {
        alert('Veuillez d\'abord définir les colonnes');
        return;
    }
    const columns = columnsInput.value.split(',').map(c => c.trim()).filter(c => c);
    sizeGuideRowsData.push(new Array(columns.length).fill(''));
    renderSizeGuideRows();
}

setTimeout(() => {
    document.getElementById('sizeGuideColumns')?.addEventListener('input', () => {
        renderSizeGuideRows();
    });
    
    const addRowBtn = document.getElementById('addRowBtn');
    if (addRowBtn) {
        addRowBtn.addEventListener('click', addSizeGuideRow);
    }
}, 500);

document.getElementById('addSizeGuideBtn')?.addEventListener('click', () => {
    document.getElementById('sizeGuideModalTitle').textContent = 'Ajouter un guide des tailles';
    document.getElementById('sizeGuideForm').reset();
    document.getElementById('sizeGuideId').value = '';
    sizeGuideRowsData = [];
    document.getElementById('sizeGuideRows').innerHTML = '';
    document.getElementById('sizeGuideModal').classList.add('active');
});

document.getElementById('sizeGuideForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const guides = JSON.parse(localStorage.getItem('sizeGuides')) || [];
    const id = document.getElementById('sizeGuideId').value;
    
    const columns = document.getElementById('sizeGuideColumns').value.split(',').map(c => c.trim()).filter(c => c);
    
    const guide = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('sizeGuideName').value,
        columns: columns,
        rows: sizeGuideRowsData
    };
    
    if (id) {
        const index = guides.findIndex(g => g.id === parseInt(id));
        guides[index] = guide;
    } else {
        guides.push(guide);
    }
    
    localStorage.setItem('sizeGuides', JSON.stringify(guides));
    document.getElementById('sizeGuideModal').classList.remove('active');
    loadSizeGuides();
});

function editSizeGuide(id) {
    const guides = JSON.parse(localStorage.getItem('sizeGuides')) || [];
    const guide = guides.find(g => g.id === id);
    
    if (guide) {
        document.getElementById('sizeGuideModalTitle').textContent = 'Modifier le guide';
        document.getElementById('sizeGuideId').value = guide.id;
        document.getElementById('sizeGuideName').value = guide.name;
        document.getElementById('sizeGuideColumns').value = guide.columns ? guide.columns.join(', ') : 'Taille, Poitrine (cm), Longueur (cm)';
        sizeGuideRowsData = guide.rows || [];
        renderSizeGuideRows();
        document.getElementById('sizeGuideModal').classList.add('active');
    }
}

function deleteSizeGuide(id) {
    if (confirm('Supprimer ce guide des tailles ?')) {
        let guides = JSON.parse(localStorage.getItem('sizeGuides')) || [];
        guides = guides.filter(g => g.id !== id);
        localStorage.setItem('sizeGuides', JSON.stringify(guides));
        loadSizeGuides();
    }
}

// Modal close handlers
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// Gestion du stock par variante
function loadStockVariants(product) {
    const container = document.getElementById('stockVariantsContainer');
    if (!container) return;
    
    const colors = product.colors || [];
    const sizes = product.sizes || [];
    const stockByVariant = product.stockByVariant || {};
    
    if (colors.length === 0 || sizes.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<h4 style="margin: 16px 0 12px; font-size: 14px;">Stock par variante</h4>';
    
    colors.forEach(color => {
        const colorName = getColorName(color);
        html += `<div style="margin-bottom: 16px;"><strong>${colorName}</strong></div>`;
        
        sizes.forEach(size => {
            const key = `${color}-${size}`;
            const stock = stockByVariant[key] !== undefined ? stockByVariant[key] : 10;
            html += `
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                    <label style="width: 60px; font-size: 14px;">${size}:</label>
                    <input type="number" min="0" value="${stock}" data-variant="${key}" class="variant-stock" style="width: 100px; padding: 8px; border: 1px solid var(--border);">
                </div>
            `;
        });
    });
    
    container.innerHTML = html;
}

function saveStockVariants(colors, sizes) {
    const stockByVariant = {};
    document.querySelectorAll('.variant-stock').forEach(input => {
        const key = input.dataset.variant;
        stockByVariant[key] = parseInt(input.value) || 0;
    });
    return stockByVariant;
}

function getColorName(hex) {
    const colors = {
        '#000000': 'Noir',
        '#FFFFFF': 'Blanc',
        '#808080': 'Gris',
        '#FF0000': 'Rouge',
        '#0000FF': 'Bleu',
        '#008000': 'Vert',
        '#FFFF00': 'Jaune',
        '#FFA500': 'Orange',
        '#800080': 'Violet',
        '#FFC0CB': 'Rose',
        '#A52A2A': 'Marron',
        '#00FFFF': 'Cyan'
    };
    return colors[hex?.toUpperCase()] || hex;
}

async function checkAndNotifyStockIncrease(product) {
    if (!window.firebaseReady || !window.firebaseModules) return;
    
    try {
        const { doc, getDoc, updateDoc, deleteField } = window.firebaseModules;
        const notifRef = doc(window.firebaseDb, 'stockNotifications', `${product.id}`);
        const notifDoc = await getDoc(notifRef);
        
        if (!notifDoc.exists()) return;
        
        const notifications = notifDoc.data();
        const variants = notifications.variants || {};
        const variantsToDelete = [];
        
        // Vérifier chaque variante
        for (const [variantKey, subscribers] of Object.entries(variants)) {
            const stock = product.stockByVariant?.[variantKey] || 0;
            
            if (stock > 0 && subscribers && subscribers.length > 0) {
                const [color, size] = variantKey.split('-');
                let successCount = 0;
                
                // Envoyer les emails via Cloud Function
                for (const sub of subscribers) {
                    try {
                        const response = await fetch('https://us-central1-burban-fidelity.cloudfunctions.net/sendStockNotification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                data: {
                                    email: sub.email,
                                    productName: product.name,
                                    color: getColorName(color),
                                    size: size
                                }
                            })
                        });
                        
                        if (response.ok) {
                            successCount++;
                            console.log(`Email envoyé à: ${sub.email}`);
                        }
                    } catch (error) {
                        console.error(`Erreur envoi email à ${sub.email}:`, error);
                    }
                }
                
                if (successCount > 0) {
                    alert(`${successCount} email(s) envoyé(s) pour ${product.name} (${getColorName(color)}, ${size})`);
                    variantsToDelete.push(variantKey);
                }
            }
        }
        
        // Supprimer uniquement les variantes dont les emails ont été envoyés
        if (variantsToDelete.length > 0) {
            const updates = {};
            variantsToDelete.forEach(key => {
                updates[`variants.${key}`] = deleteField();
            });
            await updateDoc(notifRef, updates);
        }
        
    } catch (error) {
        console.error('Erreur notifications:', error);
    }
}

// Mettre à jour les couleurs/tailles pour générer les variantes
setTimeout(() => {
    document.getElementById('productColors')?.addEventListener('blur', () => {
        const colors = document.getElementById('productColors').value.split(',').map(c => c.trim()).filter(c => c);
        const sizes = document.getElementById('productSizes').value.split(',').map(s => s.trim()).filter(s => s);
        if (colors.length && sizes.length) {
            loadStockVariants({ colors, sizes, stockByVariant: {} });
        }
    });

    document.getElementById('productSizes')?.addEventListener('blur', () => {
        const colors = document.getElementById('productColors').value.split(',').map(c => c.trim()).filter(c => c);
        const sizes = document.getElementById('productSizes').value.split(',').map(s => s.trim()).filter(s => s);
        if (colors.length && sizes.length) {
            loadStockVariants({ colors, sizes, stockByVariant: {} });
        }
    });
}, 500);

// Charger les catégories au démarrage
if (document.getElementById('productCategory')) {
    loadCategories();
    loadSizeGuides();
    
    // Charger les produits depuis Firestore au démarrage
    const waitForFirebase = setInterval(() => {
        if (window.firebaseReady) {
            clearInterval(waitForFirebase);
            loadProductsFromFirestore();
        }
    }, 100);
}
