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
    
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = `${product.price} €`;
    document.getElementById('productDescription').textContent = product.description;
    
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
    document.getElementById('sizeGuide').addEventListener('click', () => {
        showSizeGuide();
    });
    
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
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.includes(productId)) {
        favBtn.classList.add('active');
    }
    
    favBtn.addEventListener('click', () => {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const index = favorites.indexOf(productId);
        
        if (index > -1) {
            favorites.splice(index, 1);
            favBtn.classList.remove('active');
            showMessage('Retiré des favoris');
        } else {
            favorites.push(productId);
            favBtn.classList.add('active');
            showMessage('Ajouté aux favoris');
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
    });
});
