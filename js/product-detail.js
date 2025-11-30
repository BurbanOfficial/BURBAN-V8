let selectedSize = null;
let selectedColor = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        window.location.href = 'products.html';
        return;
    }
    
    // Tracker les vues de produits dans Firestore
    setTimeout(async () => {
        if (window.firebaseReady && window.firebaseModules) {
            try {
                const { doc, getDoc, setDoc, increment } = window.firebaseModules;
                const statsRef = doc(window.firebaseDb, 'stats', 'products');
                const statsDoc = await getDoc(statsRef);
                
                if (statsDoc.exists()) {
                    const views = statsDoc.data().views || {};
                    views[productId] = (views[productId] || 0) + 1;
                    await setDoc(statsRef, { views }, { merge: true });
                } else {
                    await setDoc(statsRef, { views: { [productId]: 1 }, sales: {} });
                }
            } catch (error) {
                console.error('Erreur tracking vue:', error);
            }
        }
    }, 500);
    
    // Gallery
    const imagesByColor = product.imagesByColor || {
        '#000000': product.images || [product.image, product.image, product.image, product.image]
    };
    let currentImages = Object.values(imagesByColor)[0];
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.getElementById('thumbnails');
    
    function updateGallery(images) {
        currentImages = images;
        mainImage.src = images[0];
        mainImage.alt = product.name;
        
        thumbnails.innerHTML = images.map((img, index) => `
            <img src="${img}" alt="${product.name} ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
        `).join('');
        
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                mainImage.src = currentImages[thumb.dataset.index];
            });
        });
    }
    
    updateGallery(currentImages);
    
    // Zoom on click
    mainImage.style.cursor = 'zoom-in';
    mainImage.addEventListener('click', () => {
        showImageZoom(mainImage.src, currentImages);
    });
    
    // Check promo expiration
    const now = new Date();
    if (product.promoActive && product.promoEndDate && new Date(product.promoEndDate) < now) {
        product.promoActive = false;
        product.price = product.originalPrice;
        product.originalPrice = null;
        product.promoEndDate = null;
        const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        const index = products.findIndex(p => p.id === product.id);
        if (index !== -1) {
            products[index] = product;
            localStorage.setItem('adminProducts', JSON.stringify(products));
        }
    }
    
    // Check if new (less than 1 month old)
    const publishDate = new Date(product.publishDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (publishDate > oneMonthAgo) {
        document.getElementById('newBadge').style.display = 'inline-block';
    }
    
    document.getElementById('productName').textContent = product.name;
    
    // Price with promo
    const priceEl = document.getElementById('productPrice');
    if (product.promoActive && product.originalPrice) {
        priceEl.innerHTML = `<span style="text-decoration: line-through; color: var(--gray); margin-right: 8px;">${product.originalPrice.toFixed(2)} €</span>${product.price.toFixed(2)} €`;
    } else {
        priceEl.textContent = `${product.price.toFixed(2)} €`;
    }
    
    document.getElementById('productDescription').textContent = product.description;
    
    // Informations produit
    document.getElementById('productDetails').innerHTML = (product.details || '100% coton bio<br>Coupe régulière<br>Fabriqué au Portugal').replace(/\n/g, '<br>');
    document.getElementById('productMaterials').innerHTML = (product.materials || 'Coton biologique certifié GOTS<br>Teinture sans produits chimiques<br>Lavage en machine à 30°').replace(/\n/g, '<br>');
    document.getElementById('productShipping').innerHTML = (product.shipping || 'Livraison gratuite dès 100€<br>Retours sous 30 jours<br>Expédition sous 24-48h').replace(/\n/g, '<br>');
    
    // Colors
    const colors = product.colors || ['#000000', '#FFFFFF', '#808080'];
    const colorOptions = document.getElementById('colorOptions');
    colorOptions.innerHTML = colors.map((color, index) => `
        <button class="color-btn" data-color="${color}" style="background: ${color}; ${color === '#FFFFFF' ? 'border-color: #e0e0e0;' : ''}"></button>
    `).join('');
    
    document.querySelectorAll('.color-btn').forEach((btn, index) => {
        if (index === 0) {
            btn.classList.add('selected');
            selectedColor = btn.dataset.color;
        }
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedColor = btn.dataset.color;
            
            // Update gallery with color images
            const colorImages = imagesByColor[selectedColor] || currentImages;
            updateGallery(colorImages);
            // Re-render stock when color changes
            renderStockIndicator?.();
        });
    });
    
    // Sizes
    const sizeOptions = document.getElementById('sizeOptions');
    sizeOptions.innerHTML = product.sizes.map(size => `
        <button class="size-btn" data-size="${size}">${size}</button>
    `).join('');
    
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedSize = btn.dataset.size;
            // Re-render stock when size changes
            renderStockIndicator?.();
        });
    });
    
    // Size Guide
    const sizeGuideBtn = document.getElementById('sizeGuide');
    if (product.sizeGuideId) {
        sizeGuideBtn.style.display = 'block';
        sizeGuideBtn.addEventListener('click', () => {
            showSizeGuide(product.sizeGuideId);
        });
    }
    
    // Add to Cart
    const addToCartBtn = document.getElementById('addToCart');
    const productInfo = document.querySelector('.product-info');

    function renderStockIndicator() {
        const stockIndicator = document.getElementById('stockIndicator');
        const stockVisual = document.getElementById('stockVisual');
        const stockText = document.getElementById('stockText');

        // Determine stock value. Support multiple field names: stock, inventory, quantity
        // First try variant-level stock when size+color selected
        let stock = null;
        try {
            if (selectedSize && selectedColor && Array.isArray(product.variants)) {
                const v = product.variants.find(x => x.size === selectedSize && x.color === selectedColor);
                if (v && (typeof v.stock === 'number' || v.stock != null)) {
                    stock = typeof v.stock === 'number' ? v.stock : parseInt(v.stock, 10);
                }
            }
        } catch (err) {
            // ignore
        }

        if (stock === null) {
            const rawStock = product.stock ?? product.inventory ?? product.quantity ?? null;
            stock = typeof rawStock === 'number' ? rawStock : (rawStock ? parseInt(rawStock, 10) : null);
        }

        // Default: unknown
        if (stock === null || Number.isNaN(stock)) {
            stockText.textContent = 'Stock inconnu';
            stockIndicator.classList.remove('stock-status-in-stock', 'stock-status-low', 'stock-status-out');
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = 'Ajouter au panier';
            return;
        }

        const lowThreshold = 5; // seuil pour stock faible

        if (stock <= 0) {
            // Out of stock
            stockIndicator.classList.remove('stock-status-in-stock', 'stock-status-low');
            stockIndicator.classList.add('stock-status-out');
            stockText.textContent = 'En rupture de stock';

            // Replace add to cart with notify button
            const notifyBtn = document.createElement('button');
            notifyBtn.className = 'btn-secondary';
            notifyBtn.id = 'notifyBtn';
            notifyBtn.textContent = 'Informez-moi du retour de ce produit';
            notifyBtn.addEventListener('click', () => {
                // basic modal asking for email
                document.body.classList.add('modal-open');
                const modal = document.createElement('div');
                modal.className = 'custom-modal active';
                modal.innerHTML = `
                    <div class="custom-modal-content">
                        <h3 style="font-size: 18px; margin-bottom: 12px;">Recevoir une alerte</h3>
                        <p style="margin-bottom: 12px;">Entrez votre email pour être informé du retour en stock :</p>
                        <input type="email" id="notifyEmail" placeholder="Votre email" style="width: 100%; padding: 12px; margin-bottom: 12px;">
                        <div style="display:flex; gap:12px;">
                            <button class="btn-secondary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove();">Annuler</button>
                            <button class="btn-primary" id="sendNotify">M'avertir</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelector('#sendNotify').addEventListener('click', () => {
                    const email = modal.querySelector('#notifyEmail').value;
                    if (!email) {
                        showMessage('Veuillez entrer une adresse email');
                        return;
                    }
                    // Persist the notify request in Firestore (best-effort) and confirm
                    (async () => {
                        try {
                            if (window.firebaseReady && window.firebaseDb && window.firebaseModules && window.firebaseModules.setDoc && window.firebaseModules.doc) {
                                const { setDoc, doc } = window.firebaseModules;
                                const db = window.firebaseDb;
                                const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
                                await setDoc(doc(db, 'stockAlerts', id), {
                                    productId: product.id,
                                    size: selectedSize || null,
                                    color: selectedColor || null,
                                    email: email,
                                    createdAt: new Date().toISOString()
                                });
                            }
                        } catch (err) {
                            console.error('Erreur en sauvegardant la demande d\'alerte:', err);
                        } finally {
                            document.body.classList.remove('modal-open');
                            modal.remove();
                            showMessage('Merci — vous serez informé par email si le produit revient en stock.');
                        }
                    })();
                });
            });

            addToCartBtn.replaceWith(notifyBtn);
            return;
        }

        if (stock <= lowThreshold) {
            stockIndicator.classList.remove('stock-status-in-stock', 'stock-status-out');
            stockIndicator.classList.add('stock-status-low');
            stockText.textContent = 'Stock Faible';
        } else {
            stockIndicator.classList.remove('stock-status-low', 'stock-status-out');
            stockIndicator.classList.add('stock-status-in-stock');
            stockText.textContent = 'En Stock';
        }

        // Ensure addToCart button exists (in case it was replaced previously)
        if (!document.getElementById('addToCart')) {
            const existingNotify = document.getElementById('notifyBtn');
            if (existingNotify) existingNotify.replaceWith(addToCartBtn);
        }

        addToCartBtn.disabled = false;
        addToCartBtn.textContent = 'Ajouter au panier';
    }

    // initial render
    renderStockIndicator();

    // Add to Cart handler remains the same
    addToCartBtn.addEventListener('click', async () => {
        if (!selectedSize) {
            showMessage('Veuillez sélectionner une taille');
            return;
        }

        // If variants exist, find the matching variant and ensure stock > 0, then decrement
        try {
            let variantUpdated = false;
            if (Array.isArray(product.variants) && selectedColor) {
                const vIndex = product.variants.findIndex(v => v.size === selectedSize && v.color === selectedColor);
                if (vIndex !== -1) {
                    const currentStock = parseInt(product.variants[vIndex].stock || 0, 10);
                    if (currentStock <= 0) {
                        showMessage('Produit en rupture de stock pour la variante sélectionnée');
                        return;
                    }
                    // decrement
                    product.variants[vIndex].stock = currentStock - 1;
                    variantUpdated = true;
                }
            }

            // If variant wasn't present but a global stock exists, decrement that
            if (!variantUpdated) {
                const rawStock = product.stock ?? product.inventory ?? product.quantity ?? null;
                const stockVal = typeof rawStock === 'number' ? rawStock : (rawStock ? parseInt(rawStock, 10) : null);
                if (stockVal !== null) {
                    if (stockVal <= 0) {
                        showMessage('Produit en rupture de stock');
                        return;
                    }
                    // update product global stock
                    const newStock = stockVal - 1;
                    product.stock = newStock;
                    variantUpdated = true;
                }
            }

            // Persist updates to localStorage (adminProducts)
            if (variantUpdated) {
                try {
                    const prods = JSON.parse(localStorage.getItem('adminProducts')) || [];
                    const idx = prods.findIndex(p => p.id === product.id);
                    if (idx !== -1) {
                        prods[idx] = product;
                    } else {
                        prods.push(product);
                    }
                    localStorage.setItem('adminProducts', JSON.stringify(prods));
                } catch (err) {
                    console.error('Erreur mise à jour localStorage stock:', err);
                }

                // Best-effort: update Firestore product document (merge)
                try {
                    if (window.firebaseReady && window.firebaseDb && window.firebaseModules && window.firebaseModules.setDoc && window.firebaseModules.doc) {
                        const { setDoc, doc } = window.firebaseModules;
                        const db = window.firebaseDb;
                        await setDoc(doc(db, 'products', String(product.id)), { variants: product.variants, stock: product.stock }, { merge: true });
                    }
                } catch (err) {
                    console.error('Erreur mise à jour Firestore stock:', err);
                }
            }

            // proceed to add to cart
            addToCart(product.id, selectedSize);
            showCartConfirm();
            // re-render indicator after change
            renderStockIndicator();
        } catch (err) {
            console.error('Erreur lors de l\'ajout au panier / mise à jour du stock:', err);
            showMessage('Erreur lors de la mise à jour du stock');
        }
    });
    
    // Add to Favorites
    const favBtn = document.getElementById('addToFavorites');
    
    // Vérifier les favoris
    const checkFavorites = async () => {
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            const { doc, getDoc } = window.firebaseModules || {};
            if (doc && getDoc) {
                const userDoc = await getDoc(doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid));
                const favorites = userDoc.data()?.favorites || [];
                if (favorites.includes(productId)) {
                    favBtn.classList.add('active');
                }
            }
        }
    };
    
    setTimeout(checkFavorites, 500);
    
    favBtn.addEventListener('click', async () => {
        // Vérifier si connecté
        if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
            document.body.classList.add('modal-open');
            const modal = document.createElement('div');
            modal.className = 'custom-modal active';
            modal.innerHTML = `
                <div class="custom-modal-content">
                    <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 16px;">Connectez-vous pour sauvegarder vos favoris</h3>
                    <p style="margin-bottom: 24px;">Créez un compte ou connectez-vous pour retrouver vos produits favoris plus tard.</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-secondary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove();">Annuler</button>
                        <button class="btn-primary" onclick="window.location.href='account.html';">Se connecter</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            return;
        }
        
        // Ajouter/retirer des favoris
        try {
            const { doc, getDoc, updateDoc, arrayUnion, arrayRemove } = window.firebaseModules;
            const userRef = doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            const favorites = userDoc.data()?.favorites || [];
            
            if (favorites.includes(productId)) {
                await updateDoc(userRef, {
                    favorites: arrayRemove(productId)
                });
                favBtn.classList.remove('active');
                showMessage('Retiré des favoris');
            } else {
                await updateDoc(userRef, {
                    favorites: arrayUnion(productId)
                });
                favBtn.classList.add('active');
                showMessage('Ajouté aux favoris');
            }
        } catch (error) {
            console.error('Erreur favoris:', error);
            showMessage('Erreur lors de la mise à jour des favoris');
        }
    });
});
