// Minimal admin UI for local editing of products and variant stocks
document.addEventListener('DOMContentLoaded', () => {
    const productsTable = document.getElementById('productsTable');
    const productForm = document.getElementById('productForm');
    const btnList = document.getElementById('btnList');
    const btnCreate = document.getElementById('btnCreate');
    const sectionList = document.getElementById('sectionList');
    const sectionCreate = document.getElementById('sectionCreate');

    function readProducts() {
        return JSON.parse(localStorage.getItem('adminProducts')) || [];
    }

    function saveProducts(products) {
        localStorage.setItem('adminProducts', JSON.stringify(products));
    }

    function renderTable() {
        const products = readProducts();
        if (products.length === 0) {
            productsTable.innerHTML = '<p style="padding:16px;">Aucun produit</p>';
            return;
        }
        const rows = products.map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; border-bottom:1px solid #eee;">
                <div style="display:flex; gap:12px; align-items:center;">
                    <img src="${p.image||''}" style="width:50px;height:65px;object-fit:cover;background:#f5f5f5">
                    <div>
                        <div><strong>${p.name}</strong></div>
                        <div style="font-size:13px;color:#666">${p.price ? p.price + ' €' : ''}</div>
                    </div>
                </div>
                <div class="admin-actions">
                    <button class="admin-btn" data-id="${p.id}" data-action="edit">Éditer</button>
                    <button class="admin-btn admin-btn-delete" data-id="${p.id}" data-action="delete">Supprimer</button>
                </div>
            </div>
        `).join('');
        productsTable.innerHTML = rows;
        productsTable.querySelectorAll('.admin-btn').forEach(b => b.addEventListener('click', (e) => {
            const id = parseInt(b.dataset.id);
            const action = b.dataset.action;
            if (action === 'edit') loadProduct(id);
            if (action === 'delete') {
                if (!confirm('Supprimer ce produit ?')) return;
                // If Firestore is available, delete remote doc, else delete local
                if (window.firebaseReady && window.firebaseDb && window.firebaseModules && window.firebaseModules.deleteDoc && window.firebaseModules.doc) {
                    const { deleteDoc, doc } = window.firebaseModules;
                    try {
                        deleteDoc(doc(window.firebaseDb, 'products', String(id))).catch(err => {
                            console.error('Erreur suppression Firestore', err);
                            // fallback to local delete
                            const ps = readProducts().filter(x => x.id !== id);
                            saveProducts(ps);
                            renderTable();
                        });
                    } catch (err) {
                        console.error(err);
                        const ps = readProducts().filter(x => x.id !== id);
                        saveProducts(ps);
                        renderTable();
                    }
                } else {
                    const ps = readProducts().filter(x => x.id !== id);
                    saveProducts(ps);
                    renderTable();
                }
            }
        }));
    }

    function switchToCreate() {
        btnList.classList.remove('active');
        btnCreate.classList.add('active');
        sectionList.classList.remove('active');
        sectionCreate.classList.add('active');
    }

    btnList.addEventListener('click', () => {
        btnCreate.classList.remove('active');
        btnList.classList.add('active');
        sectionCreate.classList.remove('active');
        sectionList.classList.add('active');
    });
    btnCreate.addEventListener('click', switchToCreate);

    function resetForm() {
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('variantsEditor').innerHTML = '';
    }

    document.getElementById('resetForm').addEventListener('click', resetForm);

    function loadProduct(id) {
        const products = readProducts();
        const p = products.find(x => x.id === id);
        if (!p) return;
        document.getElementById('productId').value = p.id;
        document.getElementById('pName').value = p.name || '';
        document.getElementById('pPrice').value = p.price || '';
        document.getElementById('pImage').value = p.image || '';
        document.getElementById('pDescription').value = p.description || '';
        document.getElementById('pSizes').value = (p.sizes||[]).join(',');
        document.getElementById('pColors').value = (p.colors||[]).join(',');
        renderVariantsEditor(p);
        switchToCreate();
    }

    function renderVariantsEditor(product) {
        const container = document.getElementById('variantsEditor');
        const sizes = product.sizes || [];
        const colors = product.colors || [];
        // Build table
        let html = '<table style="width:100%;border-collapse:collapse">';
        html += '<tr><th>Taille</th><th>Couleur</th><th>Stock</th></tr>';
        const variants = product.variants || [];
        sizes.forEach(size => {
            colors.forEach(color => {
                const v = variants.find(x => x.size === size && x.color === color) || { size, color, stock: 0 };
                html += `<tr data-size="${size}" data-color="${color}"><td>${size}</td><td>${color}</td><td><input type="number" value="${v.stock||0}" data-size="${size}" data-color="${color}" style="width:100px"></td></tr>`;
            });
        });
        html += '</table>';
        container.innerHTML = html;
    }

    document.getElementById('pSizes').addEventListener('change', () => {
        const sizes = document.getElementById('pSizes').value.split(',').map(s => s.trim()).filter(Boolean);
        const colors = document.getElementById('pColors').value.split(',').map(s => s.trim()).filter(Boolean);
        renderVariantsEditor({ sizes, colors, variants: [] });
    });
    document.getElementById('pColors').addEventListener('change', () => {
        const sizes = document.getElementById('pSizes').value.split(',').map(s => s.trim()).filter(Boolean);
        const colors = document.getElementById('pColors').value.split(',').map(s => s.trim()).filter(Boolean);
        renderVariantsEditor({ sizes, colors, variants: [] });
    });

    document.getElementById('saveProduct').addEventListener('click', () => {
        const idVal = document.getElementById('productId').value;
        const id = idVal ? parseInt(idVal,10) : Date.now();
        const name = document.getElementById('pName').value;
        const price = parseFloat(document.getElementById('pPrice').value) || 0;
        const image = document.getElementById('pImage').value;
        const description = document.getElementById('pDescription').value;
        const sizes = document.getElementById('pSizes').value.split(',').map(s => s.trim()).filter(Boolean);
        const colors = document.getElementById('pColors').value.split(',').map(s => s.trim()).filter(Boolean);

        const variants = [];
        document.querySelectorAll('#variantsEditor input[type="number"]').forEach(input => {
            const s = input.dataset.size;
            const c = input.dataset.color;
            const stock = parseInt(input.value||0,10) || 0;
            variants.push({ size: s, color: c, stock });
        });

        const product = { id, name, price, image, description, sizes, colors, variants };
        // If Firestore available, write to collection 'products'
        if (window.firebaseReady && window.firebaseDb && window.firebaseModules && window.firebaseModules.setDoc && window.firebaseModules.doc) {
            const { setDoc, doc } = window.firebaseModules;
            setDoc(doc(window.firebaseDb, 'products', String(id)), product).then(() => {
                resetForm();
                btnList.click();
            }).catch(err => {
                console.error('Erreur écriture Firestore, fallback local', err);
                const products = readProducts();
                const existingIndex = products.findIndex(p => p.id === id);
                if (existingIndex === -1) products.push(product); else products[existingIndex] = product;
                saveProducts(products);
                resetForm();
                renderTable();
                btnList.click();
            });
        } else {
            const products = readProducts();
            const existingIndex = products.findIndex(p => p.id === id);
            if (existingIndex === -1) products.push(product); else products[existingIndex] = product;
            saveProducts(products);
            resetForm();
            renderTable();
            btnList.click();
        }
    });

    // Init: subscribe to Firestore 'products' collection if available, otherwise render from localStorage
    if (window.firebaseReady && window.firebaseDb && window.firebaseModules && window.firebaseModules.onSnapshot && window.firebaseModules.collection) {
        const { onSnapshot, collection } = window.firebaseModules;
        try {
            onSnapshot(collection(window.firebaseDb, 'products'), (snapshot) => {
                const prods = [];
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const pid = data.id ?? (docSnap.id ? parseInt(docSnap.id, 10) : undefined);
                    prods.push({ ...data, id: pid });
                });
                // cache locally for offline
                localStorage.setItem('adminProducts', JSON.stringify(prods));
                renderTable();
            }, (err) => {
                console.error('Firestore onSnapshot error', err);
                renderTable();
            });
        } catch (err) {
            console.error('Erreur initialisation snapshot', err);
            renderTable();
        }
    } else {
        renderTable();
    }
});
