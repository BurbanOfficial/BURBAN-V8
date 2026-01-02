let selectedSize = null;
let selectedColor = null;
let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Attendre Firebase et charger les produits
    await new Promise(resolve => {
        const check = setInterval(() => {
            if (window.firebaseReady) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
    
    await loadProductsFromFirestore();
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const product = products.find(p => p.id === productId);
    currentProduct = product;
    
    if (!product) {
        window.location.href = 'products.html';
        return;
    }
    
    // Initialiser le stock par variante si inexistant
    if (!product.stockByVariant) {
        product.stockByVariant = {};
        const colors = product.colors || ['#000000'];
        const sizes = product.sizes || ['S', 'M', 'L', 'XL'];
        colors.forEach(color => {
            sizes.forEach(size => {
                product.stockByVariant[`${color}-${size}`] = 10;
            });
        });
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
            
            // Update size availability
            updateSizeAvailability();
            updateStockIndicator();
        });
    });
    
    function updateSizeAvailability() {
        document.querySelectorAll('.size-btn').forEach(btn => {
            const size = btn.dataset.size;
            const stock = getStock(selectedColor, size);
            if (stock === 0) {
                btn.style.opacity = '0.5';
            } else {
                btn.style.opacity = '1';
            }
        });
    }
    
    function getStock(color, size) {
        if (!currentProduct || !currentProduct.stockByVariant) return 10;
        return currentProduct.stockByVariant[`${color}-${size}`] || 0;
    }
    
    function updateStockIndicator() {
        if (!selectedSize || !selectedColor) return;
        
        const stock = getStock(selectedColor, selectedSize);
        const indicator = document.getElementById('stockIndicator');
        const dot = indicator.querySelector('.stock-dot');
        const text = indicator.querySelector('.stock-text');
        
        indicator.style.display = 'flex';
        dot.className = 'stock-dot';
        
        if (stock === 0) {
            dot.classList.add('out-of-stock');
            text.textContent = 'En rupture de stock';
        } else if (stock >= 1 && stock <= 4) {
            dot.classList.add('low-stock');
            text.textContent = `Stock faible (${stock} restant${stock > 1 ? 's' : ''})`;
        } else {
            dot.classList.add('in-stock');
            text.textContent = 'En stock';
        }
        
        // Update button
        const addBtn = document.getElementById('addToCart');
        if (stock === 0) {
            addBtn.textContent = 'Alertez moi dès son retour';
            addBtn.onclick = handleNotifyMe;
        } else {
            addBtn.textContent = 'Ajouter au panier';
            addBtn.onclick = handleAddToCart;
        }
    }
    
    // Initial button setup
    document.getElementById('addToCart').onclick = handleAddToCart;
    
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
            updateStockIndicator();
        });
    });
    
    updateSizeAvailability();
    
    // Size Guide
    const sizeGuideBtn = document.getElementById('sizeGuide');
    if (product.sizeGuideId) {
        sizeGuideBtn.style.display = 'block';
        sizeGuideBtn.addEventListener('click', () => {
            showSizeGuide(product.sizeGuideId);
        });
    }
    
    // Add to Cart
    function handleAddToCart() {
        if (!selectedSize) {
            showMessage('Veuillez sélectionner une taille');
            return;
        }
        const stock = getStock(selectedColor, selectedSize);
        if (stock === 0) {
            showMessage('Ce produit est en rupture de stock');
            return;
        }
        
        // Vérifier quantité déjà dans le panier
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => 
            item.id === product.id && 
            item.size === selectedSize && 
            item.color === selectedColor
        );
        const currentQty = existingItem ? existingItem.quantity : 0;
        
        if (currentQty >= stock) {
            showStockError(stock);
            return;
        }
        
        addToCart(product.id, selectedSize, selectedColor);
        showCartConfirm();
    }
    
    async function handleNotifyMe() {
        if (!selectedSize || !selectedColor) {
            showMessage('Veuillez sélectionner une couleur et une taille');
            return;
        }
        
        const variantKey = `${selectedColor}-${selectedSize}`;
        
        // Vérifier si connecté
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            try {
                const { doc, setDoc, arrayUnion } = window.firebaseModules;
                const notifRef = doc(window.firebaseDb, 'stockNotifications', `${productId}`);
                
                await setDoc(notifRef, {
                    productId: productId,
                    productName: product.name,
                    variants: {
                        [variantKey]: arrayUnion({
                            email: window.firebaseAuth.currentUser.email,
                            color: selectedColor,
                            size: selectedSize,
                            timestamp: new Date().toISOString()
                        })
                    }
                }, { merge: true });
                
                showMessage('Vous êtes sur la liste ! Nous vous informerons dès son retour.');
            } catch (error) {
                console.error('Erreur notification:', error);
                showMessage('Erreur lors de l\'enregistrement de votre demande');
            }
        } else {
            // Demander l'email
            document.body.classList.add('modal-open');
            const modal = document.createElement('div');
            modal.className = 'custom-modal active';
            modal.innerHTML = `
                <div class="custom-modal-content">
                    <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 16px;">Alertez moi dès son retour</h3>
                    <p style="margin-bottom: 24px; color: var(--gray); font-size: 14px;">Entrez votre email pour être notifié dès que cet article sera disponible.</p>
                    <input type="email" id="notifyEmail" placeholder="Votre email" style="width: 100%; margin-bottom: 16px;">
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-secondary" onclick="document.body.classList.remove('modal-open'); this.closest('.custom-modal').remove();">Annuler</button>
                        <button class="btn-primary" id="submitNotify">Valider</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('submitNotify').addEventListener('click', async () => {
                const email = document.getElementById('notifyEmail').value;
                if (!email || !email.includes('@')) {
                    showMessage('Veuillez entrer une adresse email valide');
                    return;
                }
                
                try {
                    const { doc, setDoc, arrayUnion } = window.firebaseModules;
                    const notifRef = doc(window.firebaseDb, 'stockNotifications', `${productId}`);
                    
                    await setDoc(notifRef, {
                        productId: productId,
                        productName: product.name,
                        variants: {
                            [variantKey]: arrayUnion({
                                email: email,
                                color: selectedColor,
                                size: selectedSize,
                                timestamp: new Date().toISOString()
                            })
                        }
                    }, { merge: true });
                    
                    modal.remove();
                    document.body.classList.remove('modal-open');
                    showMessage('Vous êtes sur la liste ! Nous vous informerons dès son retour.');
                } catch (error) {
                    console.error('Erreur notification:', error);
                    showMessage('Erreur lors de l\'enregistrement de votre demande');
                }
            });
        }
    }
    
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
