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
    document.getElementById('addToCart').addEventListener('click', () => {
        if (!selectedSize) {
            showMessage('Veuillez sélectionner une taille');
            return;
        }
        addToCart(product.id, selectedSize);
        showCartConfirm();
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
