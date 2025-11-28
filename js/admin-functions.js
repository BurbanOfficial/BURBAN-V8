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
        sizes: document.getElementById('productSizes').value.split(',').map(s => s.trim()),
        colors: colors,
        publishDate: document.getElementById('productPublishDate').value || null,
        unpublishDate: document.getElementById('productUnpublishDate').value || null,
        stock: document.getElementById('productStock').value ? parseInt(document.getElementById('productStock').value) : null
    };
    
    if (id) {
        const index = products.findIndex(p => p.id === parseInt(id));
        products[index] = product;
    } else {
        products.push(product);
    }
    
    localStorage.setItem('adminProducts', JSON.stringify(products));
    window.products = products;
    loadProducts();
    document.getElementById('productModal').classList.remove('active');
});

// Mise à jour de loadProducts
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    
    // Filtrer les produits selon les dates
    const now = new Date();
    const visibleProducts = products.filter(p => {
        if (p.publishDate && new Date(p.publishDate) > now) return false;
        if (p.unpublishDate && new Date(p.unpublishDate) < now) return false;
        return true;
    });
    
    tbody.innerHTML = products.map(product => {
        const isVisible = visibleProducts.includes(product);
        const stockText = product.stock === null ? 'Illimité' : product.stock;
        
        return `
            <tr style="${!isVisible ? 'opacity: 0.5;' : ''}">
                <td><img src="${product.image || product.images?.[0]}" alt="${product.name}"></td>
                <td>${product.name}${!isVisible ? ' <small>(Non publié)</small>' : ''}</td>
                <td>${product.price.toFixed(2)} €</td>
                <td>${product.category}</td>
                <td>${stockText}</td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="editProduct(${product.id})">Modifier</button>
                        <button class="admin-btn admin-btn-delete" onclick="deleteProduct(${product.id})">Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function editProduct(id) {
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
        document.getElementById('productPublishDate').value = product.publishDate || '';
        document.getElementById('productUnpublishDate').value = product.unpublishDate || '';
        document.getElementById('productStock').value = product.stock || '';
        
        document.getElementById('productModal').classList.add('active');
    }
}

function deleteProduct(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        let products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem('adminProducts', JSON.stringify(products));
        window.products = products;
        loadProducts();
    }
}

// Charger les catégories au démarrage
if (document.getElementById('productCategory')) {
    loadCategories();
}
