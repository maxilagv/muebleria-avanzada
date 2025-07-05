import { db } from "./firebaseconfig.js";
import { collection, getDocs, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.c7');
    const navMenu = document.getElementById('nav-menu');
    const catalogLink = document.getElementById('catalog-link');
    const catalogSection = document.getElementById('nuestro-catalogo');
    const catalogContainer = document.getElementById('catalog-container');
    const dynamicProductSections = document.getElementById('dynamic-product-sections');
    const dynamicCategoryNav = document.getElementById('dynamic-category-nav');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const productDetailModal = document.getElementById('product-detail-modal');
    const closeProductDetailModal = document.getElementById('close-product-detail-modal');
    const modalProductImage = document.getElementById('modal-product-image');
    const modalProductName = document.getElementById('modal-product-name');
    const modalProductDescription = document.getElementById('modal-product-description');
    const modalProductPrice = document.getElementById('modal-product-price');

    let allProducts = [];

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                navMenu.classList.remove('active');
            }
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    function showSection(sectionId, pushState = true) {
        const allSections = document.querySelectorAll('.product-category-section, #nuestro-catalogo, #inicio, #contacto');
        allSections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                section.style.display = 'none';
            }
        });

        if (pushState) {
            history.pushState({ section: sectionId }, '', `#${sectionId}`);
        }
    }

    function showAllProducts(pushState = true) {
        const allCategorySections = document.querySelectorAll('.product-category-section');
        allCategorySections.forEach(section => {
            section.style.display = 'none';
        });

        catalogContainer.innerHTML = '';
        dynamicProductSections.innerHTML = '';

        const productsByCategory = {};
        allProducts.forEach(productData => {
            const categoryName = productData.categoria.toLowerCase();
            if (!productsByCategory[categoryName]) {
                productsByCategory[categoryName] = [];
            }
            productsByCategory[categoryName].push(productData);
        });

        for (const categoryName in productsByCategory) {
            const categorySection = document.createElement('section');
            categorySection.id = `category-${categoryName}`;
            categorySection.className = 'c25 c4 product-category-section';
            categorySection.innerHTML = `
                <h3 class="c26 c3">Nuestros ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</h3>
                <div class="c27 product-grid"></div>
            `;
            const productGrid = categorySection.querySelector('.product-grid');

            productsByCategory[categoryName].forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'c28 product-card';
                productCard.dataset.productId = product.id;
                productCard.innerHTML = `
                    <img src="${product.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Producto'}" alt="${product.nombre}" class="c29">
                    <h4 class="c30 c3">${product.nombre}</h4>
                    <p class="c31">${product.descripcion}</p>
                    <p class="c32 c3">$${product.precio.toFixed(2)}</p>
                    <a href="#" class="c32 c3 c5 view-details-link" data-product-id="${product.id}">Ver detalles &rarr;</a>
                `;
                productGrid.appendChild(productCard);
            });
            dynamicProductSections.appendChild(categorySection);
            categorySection.style.display = 'block';
        }

        showSection('nuestro-catalogo', pushState);
    }

    async function cargarContenido() {
        catalogContainer.innerHTML = '';
        dynamicProductSections.innerHTML = '';
        dynamicCategoryNav.innerHTML = '';
        allProducts = [];

        onSnapshot(collection(db, "categorias"), async (categorySnapshot) => {
            catalogContainer.innerHTML = '';
            dynamicCategoryNav.innerHTML = '';

            const categories = [];
            categorySnapshot.forEach(doc => {
                categories.push({ id: doc.id, ...doc.data() });
            });

            categories.sort((a, b) => a.nombre.localeCompare(b.nombre));

            const viewAllLink = document.createElement('a');
            viewAllLink.href = `#`;
            viewAllLink.className = 'c18 c5 py-2 nav-category-link';
            viewAllLink.dataset.category = 'all';
            viewAllLink.textContent = 'Ver Todos los Productos';
            dynamicCategoryNav.appendChild(viewAllLink);

            categories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'c28 category-card';
                categoryCard.dataset.category = category.nombre.toLowerCase();
                categoryCard.innerHTML = `
                    <img src="${category.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Categor%C3%ADa'}" alt="${category.nombre}" class="c29">
                    <h4 class="c30 c3">${category.nombre}</h4>
                    <p class="c31">Explora nuestra colección de ${category.nombre.toLowerCase()}.</p>
                    <a href="#" class="c32 c3 c5 view-category" data-category="${category.nombre.toLowerCase()}">Ver ${category.nombre} &rarr;</a>
                `;
                catalogContainer.appendChild(categoryCard);

                const navLink = document.createElement('a');
                navLink.href = `#category-${category.nombre.toLowerCase()}`;
                navLink.className = 'c18 c5 py-2 nav-category-link';
                navLink.dataset.category = category.nombre.toLowerCase();
                navLink.textContent = category.nombre;
                dynamicCategoryNav.appendChild(navLink);
            });

            onSnapshot(collection(db, "muebles"), (productSnapshot) => {
                dynamicProductSections.innerHTML = '';

                const productsByCategory = {};
                productSnapshot.forEach(doc => {
                    const productData = { id: doc.id, ...doc.data() };
                    allProducts.push(productData);
                    const categoryName = productData.categoria.toLowerCase();
                    if (!productsByCategory[categoryName]) {
                        productsByCategory[categoryName] = [];
                    }
                    productsByCategory[categoryName].push(productData);
                });

                for (const categoryName in productsByCategory) {
                    const categorySection = document.createElement('section');
                    categorySection.id = `category-${categoryName}`;
                    categorySection.className = 'c25 c4 product-category-section';
                    categorySection.innerHTML = `
                        <h3 class="c26 c3">Nuestros ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</h3>
                        <div class="c27 product-grid"></div>
                    `;
                    const productGrid = categorySection.querySelector('.product-grid');

                    productsByCategory[categoryName].forEach(product => {
                        const productCard = document.createElement('div');
                        productCard.className = 'c28 product-card';
                        productCard.dataset.productId = product.id;
                        productCard.innerHTML = `
                            <img src="${product.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Producto'}" alt="${product.nombre}" class="c29">
                            <h4 class="c30 c3">${product.nombre}</h4>
                            <p class="c31">${product.descripcion}</p>
                            <p class="c32 c3">$${product.precio.toFixed(2)}</p>
                            <a href="#" class="c32 c3 c5 view-details-link" data-product-id="${product.id}">Ver detalles &rarr;</a>
                        `;
                        productGrid.appendChild(productCard);
                    });
                    dynamicProductSections.appendChild(categorySection);
                }

                showSection('nuestro-catalogo', false);

                if (searchButton && searchInput) {
                    searchButton.addEventListener('click', () => performSearch());
                    searchInput.addEventListener('keypress', (event) => {
                        if (event.key === 'Enter') performSearch();
                    });
                }
            });
        });
    }

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-category') || event.target.classList.contains('nav-category-link')) {
            event.preventDefault();
            const category = event.target.dataset.category;
            if (category === 'all') {
                showAllProducts();
            } else {
                showSection(`category-${category}`);
            }
        }
    });

    if (catalogLink) {
        catalogLink.addEventListener('click', (event) => {
            event.preventDefault();
            showSection('nuestro-catalogo');
        });
    }

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const productCards = document.querySelectorAll('.product-card');
        let foundCard = null;

        productCards.forEach(card => {
            const productName = card.querySelector('h4').textContent.toLowerCase();
            const productDescription = card.querySelector('p').textContent.toLowerCase();
            const productCategory = card.closest('.product-category-section')?.id.replace('category-', '') || '';

            const match = productName.includes(searchTerm) || productDescription.includes(searchTerm) || productCategory.includes(searchTerm);

            if (match) {
                if (!foundCard) foundCard = card;
                card.style.display = 'block';
                card.classList.add('highlight-result');
            } else {
                card.style.display = 'none';
                card.classList.remove('highlight-result');
            }
        });

        if (searchTerm === '') {
            productCards.forEach(card => {
                card.style.display = 'block';
                card.classList.remove('highlight-result');
            });
        }

        if (foundCard) {
            const parentSection = foundCard.closest('.product-category-section');
            if (parentSection) {
                showSection(parentSection.id);
                foundCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            alert("No se encontraron productos.");
        }
    }

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.section) {
            showSection(event.state.section, false);
        } else {
            showSection('nuestro-catalogo', false);
        }
    });

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-details-link')) {
            event.preventDefault();
            const productId = event.target.dataset.productId;
            const product = allProducts.find(p => p.id === productId);

            if (product) {
                modalProductImage.src = product.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Producto';
                modalProductImage.alt = product.nombre;
                modalProductName.textContent = product.nombre;
                modalProductDescription.textContent = product.descripcion;
                modalProductPrice.textContent = `$${product.precio.toFixed(2)}`;
                productDetailModal.classList.add('show');
            }
        }
    });

    if (closeProductDetailModal) {
        closeProductDetailModal.addEventListener('click', () => {
            productDetailModal.classList.remove('show');
        });
    }

    if (productDetailModal) {
        productDetailModal.addEventListener('click', (event) => {
            if (event.target === productDetailModal) {
                productDetailModal.classList.remove('show');
            }
        });
    }

    cargarContenido();
});

