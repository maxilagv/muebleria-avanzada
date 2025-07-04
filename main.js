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

    
    function showSection(sectionId) {
        const allSections = document.querySelectorAll('.product-category-section, #nuestro-catalogo');
        allSections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                section.style.display = 'none';
            }
        });
    }

    
    async function cargarContenido() {
        
        catalogContainer.innerHTML = '';
        dynamicProductSections.innerHTML = '';
        dynamicCategoryNav.innerHTML = '';
        allProducts = []; 

        // Cargar categorías
        onSnapshot(collection(db, "categorias"), async (categorySnapshot) => {
            catalogContainer.innerHTML = ''; 
            dynamicCategoryNav.innerHTML = ''; 

            const categories = [];
            categorySnapshot.forEach(doc => {
                categories.push({ id: doc.id, ...doc.data() });
            });

            
            categories.sort((a, b) => a.nombre.localeCompare(b.nombre));

            
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
                        productCard.dataset.productId = product.id; // Añadir ID para referencia
                        productCard.innerHTML = `
                            <img src="${product.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Producto'}" alt="${product.nombre}" class="c29">
                            <h4 class="c30 c3">${product.nombre}</h4>
                            <p class="c31">${product.descripcion}</p>
                            <p class="c32 c3">$${product.precio.toFixed(2)}</p>
                            <a href="#" class="c32 c3 c5">Ver detalles &rarr;</a>
                        `;
                        productGrid.appendChild(productCard);
                    });
                    dynamicProductSections.appendChild(categorySection);
                }

                
                showSection('nuestro-catalogo');
            });
        });
    }

    
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-category') || event.target.classList.contains('nav-category-link')) {
            event.preventDefault();
            const category = event.target.dataset.category;
            showSection(`category-${category}`);
        }
    });

    // Event listener para el enlace "Nuestro Catálogo"
    if (catalogLink) {
        catalogLink.addEventListener('click', (event) => {
            event.preventDefault();
            showSection('nuestro-catalogo');
        });
    }

    
    searchButton.addEventListener('click', () => {
        performSearch();
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const productCards = document.querySelectorAll('.product-card');

        
        showSection('nuestro-catalogo');

        productCards.forEach(card => {
            const productName = card.querySelector('h4').textContent.toLowerCase();
            const productDescription = card.querySelector('p').textContent.toLowerCase();
            const productCategory = card.closest('.product-category-section')?.id.replace('category-', '') || '';

            if (productName.includes(searchTerm) || productDescription.includes(searchTerm) || productCategory.includes(searchTerm)) {
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
    }

    
    cargarContenido();
});
