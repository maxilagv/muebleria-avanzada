import { db } from "./firebaseconfig.js";
import { collection, getDocs, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Initializing main.js...");

    const menuToggle = document.querySelector('.menu-toggle'); // Usar la clase más descriptiva
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

    const messageBox = document.getElementById('message-box');

    let allProducts = [];

    // --- Funcionalidad del menú de hamburguesa ---
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Cierra el menú si se hace clic fuera de él
        document.addEventListener('click', (event) => {
            if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                navMenu.classList.remove('active');
            }
        });

        // Cierra el menú al hacer clic en un enlace (para navegación móvil)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    /**
     * Muestra una sección específica de la página y actualiza el historial del navegador.
     * Ahora utiliza clases 'active' para controlar la visibilidad y las transiciones CSS.
     * @param {string} sectionId - El ID de la sección a mostrar.
     * @param {boolean} pushState - Si se debe agregar al historial del navegador (por defecto true).
     */
    function showSection(sectionId, pushState = true) {
        const allSections = document.querySelectorAll('.product-category-section, #nuestro-catalogo, #inicio, #contacto');
        allSections.forEach(section => {
            section.classList.remove('active'); // Elimina la clase 'active' de todas las secciones
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active'); // Añade la clase 'active' a la sección objetivo
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }

        if (pushState) {
            history.pushState({ section: sectionId }, '', `#${sectionId}`);
        }
    }

    /**
     * Muestra la sección principal del catálogo y todas las secciones de productos por categoría.
     * Ahora utiliza clases 'active' para controlar la visibilidad y las transiciones CSS.
     */
    function showAllProducts() {
        const allSections = document.querySelectorAll('.product-category-section, #nuestro-catalogo, #inicio, #contacto');
        allSections.forEach(section => {
            section.classList.remove('active'); // Elimina la clase 'active' de todas las secciones
        });

        // Muestra la sección principal del catálogo
        const catalogSection = document.getElementById('nuestro-catalogo');
        if (catalogSection) {
            catalogSection.classList.add('active');
        }

        // Muestra todas las secciones de productos por categoría
        document.querySelectorAll('.product-category-section').forEach(section => {
            section.classList.add('active'); // Añade la clase 'active' a todas las secciones de categoría
        });

        // Actualiza el historial del navegador
        history.pushState({ section: 'nuestro-catalogo' }, '', `#nuestro-catalogo`);
    }

    /**
     * Muestra un mensaje flotante en la parte inferior de la pantalla.
     * @param {string} message - El texto del mensaje.
     * @param {string} type - El tipo de mensaje ('info' o 'error').
     */
    function showMessage(message, type = 'info') {
        if (messageBox) {
            messageBox.textContent = message;
            // Reinicia las clases de color para aplicar la correcta
            messageBox.classList.remove('bg-red-500', 'bg-blue-500');
            if (type === 'error') {
                messageBox.classList.add('bg-red-500');
            } else {
                messageBox.classList.add('bg-blue-500'); // Color por defecto para info
            }
            messageBox.classList.remove('opacity-0', 'invisible');
            messageBox.classList.add('opacity-100', 'visible');

            setTimeout(() => {
                messageBox.classList.remove('opacity-100', 'visible');
                messageBox.classList.add('opacity-0', 'invisible');
            }, 3000);
        }
    }

    /**
     * Carga el contenido de las categorías y productos desde Firestore y los renderiza en la página.
     */
    async function cargarContenido() {
        console.log("Attempting to load content from Firestore...");
        console.log("db instance:", db);
        console.log("catalogContainer element:", catalogContainer);
        console.log("dynamicProductSections element:", dynamicProductSections);
        console.log("dynamicCategoryNav element:", dynamicCategoryNav);


        // Check if Firestore DB is initialized
        if (!db) {
            console.error("Error: Firestore database (db) is not initialized. Check firebaseconfig.js and its import.");
            showMessage("Error: La conexión a la base de datos no está disponible. Por favor, revisa la consola para más detalles.", 'error');
            return;
        }

        // Check if critical DOM elements exist
        if (!catalogContainer) {
            console.error("Error: Element with ID 'catalog-container' not found in HTML. Cannot render categories.");
            showMessage("Error: No se pudo cargar el catálogo. Elemento principal no encontrado en la página.", 'error');
            return;
        }
        if (!dynamicProductSections) {
            console.error("Error: Element with ID 'dynamic-product-sections' not found in HTML. Cannot render product sections.");
            showMessage("Error: No se pudieron cargar las secciones de productos. Elemento principal no encontrado en la página.", 'error');
            return;
        }
        if (!dynamicCategoryNav) {
            console.error("Error: Element with ID 'dynamic-category-nav' not found in HTML. Cannot render category navigation.");
            showMessage("Error: No se pudo cargar la navegación de categorías. Elemento principal no encontrado en la página.", 'error');
            return;
        }

        catalogContainer.innerHTML = '';
        dynamicProductSections.innerHTML = '';
        dynamicCategoryNav.innerHTML = '';
        allProducts = [];

        try {
            onSnapshot(collection(db, "categorias"), async (categorySnapshot) => {
                console.log("Categories snapshot received.");
                catalogContainer.innerHTML = ''; // Clear existing content
                dynamicCategoryNav.innerHTML = ''; // Clear existing content

                const categories = [];
                categorySnapshot.forEach(doc => {
                    categories.push({ id: doc.id, ...doc.data() });
                });

                categories.sort((a, b) => a.nombre.localeCompare(b.nombre));

                // Crea el enlace "Ver Todos los Productos" en el menú de navegación
                const viewAllLink = document.createElement('a');
                viewAllLink.href = `#`;
                viewAllLink.className = 'nav-link-style hover-text-accent py-2 px-4 nav-category-link';
                viewAllLink.dataset.category = 'all';
                viewAllLink.textContent = 'Ver Todos los Productos';
                dynamicCategoryNav.appendChild(viewAllLink);

                // Renderiza las tarjetas de categoría y los enlaces de navegación por categoría
                categories.forEach(category => {
                    const categoryCard = document.createElement('div');
                    categoryCard.className = 'card-base category-card'; // Usar clase general de tarjeta
                    categoryCard.dataset.category = category.nombre.toLowerCase();
                    categoryCard.innerHTML = `
                        <img src="${category.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Categor%C3%ADa'}" alt="${category.nombre}" class="card-image">
                        <h4 class="product-title text-primary-dark">${category.nombre}</h4>
                        <p class="product-description">Explora nuestra colección de ${category.nombre.toLowerCase()}.</p>
                        <a href="#" class="view-details-link view-category" data-category="${category.nombre.toLowerCase()}">Ver ${category.nombre} &rarr;</a>
                    `;
                    catalogContainer.appendChild(categoryCard);

                    const navLink = document.createElement('a');
                    navLink.href = `#category-${category.nombre.toLowerCase()}`;
                    navLink.className = 'nav-link-style hover-text-accent py-2 px-4 nav-category-link';
                    navLink.dataset.category = category.nombre.toLowerCase();
                    navLink.textContent = category.nombre;
                    dynamicCategoryNav.appendChild(navLink);
                });

                // Escucha cambios en la colección de muebles (productos)
                try {
                    onSnapshot(collection(db, "muebles"), (productSnapshot) => {
                        console.log("Products snapshot received.");
                        dynamicProductSections.innerHTML = ''; // Limpia las secciones de productos existentes

                        const productsByCategory = {};
                        allProducts = []; // Reinicia allProducts para la búsqueda
                        productSnapshot.forEach(doc => {
                            const productData = { id: doc.id, ...doc.data() };
                            allProducts.push(productData); // Almacena todos los productos para la búsqueda
                            const categoryName = productData.categoria.toLowerCase();
                            if (!productsByCategory[categoryName]) {
                                productsByCategory[categoryName] = [];
                            }
                            productsByCategory[categoryName].push(productData);
                        });

                        // Renderiza las secciones de productos por categoría
                        for (const categoryName in productsByCategory) {
                            const categorySection = document.createElement('section');
                            categorySection.id = `category-${categoryName}`;
                            // Ahora se añade la clase 'product-category-section' para las transiciones
                            categorySection.className = 'section-padding border-primary-subtle product-category-section fade-in-section';
                            categorySection.innerHTML = `
                                <h3 class="section-heading text-primary-dark">Nuestros ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</h3>
                                <div class="product-grid"></div>
                            `;
                            const productGrid = categorySection.querySelector('.product-grid');

                            productsByCategory[categoryName].forEach(product => {
                                const productCard = document.createElement('div');
                                productCard.className = 'card-base product-card'; // Usar clase general de tarjeta
                                productCard.dataset.productId = product.id;
                                productCard.innerHTML = `
                                    <img src="${product.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Producto'}" alt="${product.nombre}" class="card-image">
                                    <h4 class="product-title text-primary-dark">${product.nombre}</h4>
                                    <p class="product-description">${product.descripcion}</p>
                                    <p class="product-price">$${product.precio.toFixed(2)}</p>
                                    <a href="#" class="view-details-link" data-product-id="${product.id}">Ver detalles &rarr;</a>
                                `;
                                productGrid.appendChild(productCard);
                            });
                            dynamicProductSections.appendChild(categorySection);
                        }

                        // Muestra la sección del catálogo principal por defecto al cargar el contenido
                        showSection('nuestro-catalogo', false);

                        // Configura los eventos de búsqueda después de cargar los productos
                        if (searchButton && searchInput) {
                            searchButton.addEventListener('click', () => performSearch());
                            searchInput.addEventListener('keypress', (event) => {
                                if (event.key === 'Enter') performSearch();
                            });
                        }

                        // Inicializa el Intersection Observer después de que las secciones se hayan cargado
                        setupIntersectionObserver();
                    }, (error) => {
                        console.error("Error al obtener productos de Firestore:", error);
                        showMessage("Error al cargar los productos. Por favor, revisa la consola para más detalles.", 'error');
                    });
                } catch (error) {
                    console.error("Error al configurar el listener de productos (Firestore):", error);
                    showMessage("Error al cargar los productos. Por favor, revisa la consola para más detalles.", 'error');
                }
            }, (error) => {
                console.error("Error al obtener categorías de Firestore:", error);
                showMessage("Error al cargar las categorías. Por favor, revisa la consola para más detalles.", 'error');
            });
        } catch (error) {
            console.error("Error al configurar el listener de categorías (Firestore):", error);
            showMessage("Error al cargar las categorías. Por favor, revisa la consola para más detalles.", 'error');
        }
    }

    // Maneja los clics en los enlaces de navegación y categorías
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');

        if (href && href.startsWith('#')) {
            event.preventDefault();
            const sectionId = href.replace('#', '');

            if (sectionId === 'inicio') {
                // Para la sección de inicio, asegúrate de que solo el contenido de inicio sea visible
                const allSections = document.querySelectorAll('.product-category-section, #nuestro-catalogo, #contacto');
                allSections.forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById('inicio').classList.add('active'); // Usa active para inicio
                history.pushState({ section: 'inicio' }, '', `#inicio`);
            } else if (sectionId === 'nuestro-catalogo' || sectionId === 'contacto') {
                showSection(sectionId);
            } else if (link.classList.contains('nav-category-link')) {
                const category = link.dataset.category;
                if (category === 'all') {
                    showAllProducts(); // Llama a la nueva función para mostrar todos los productos
                } else {
                    showSection(`category-${category}`);
                }
            } else if (link.classList.contains('view-category')) { // Maneja el clic en "Ver [Categoría]" en las tarjetas de categoría
                const category = link.dataset.category;
                showSection(`category-${category}`);
            }
        }
    });

    // Evento para el enlace "Nuestro Catálogo" en el menú principal
    if (catalogLink) {
        catalogLink.addEventListener('click', (event) => {
            event.preventDefault();
            showSection('nuestro-catalogo');
        });
    }

    /**
     * Realiza una búsqueda de productos basada en el término de búsqueda.
     */
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const productCards = document.querySelectorAll('.product-card');
        let foundCard = null;

        // Ocultar todas las secciones de productos y mostrar solo el catálogo general para la búsqueda
        document.querySelectorAll('.product-category-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('nuestro-catalogo').classList.add('active');


        productCards.forEach(card => {
            const productName = card.querySelector('h4').textContent.toLowerCase();
            const productDescription = card.querySelector('p').textContent.toLowerCase();
            const productCategory = card.closest('.product-category-section')?.id.replace('category-', '') || '';

            const match = productName.includes(searchTerm) || productDescription.includes(searchTerm) || productCategory.includes(searchTerm);

            if (match) {
                if (!foundCard) foundCard = card; // Guarda la primera tarjeta encontrada para hacer scroll
                card.style.display = 'block'; // Muestra la tarjeta si coincide
                card.classList.add('highlight-result');
            } else {
                card.style.display = 'none'; // Oculta la tarjeta si no coincide
                card.classList.remove('highlight-result');
            }
        });

        // Si el término de búsqueda está vacío, muestra todas las tarjetas
        if (searchTerm === '') {
            productCards.forEach(card => {
                card.style.display = 'block';
                card.classList.remove('highlight-result');
            });
            // Asegúrate de que todas las secciones de categoría estén activas si no hay búsqueda
            document.querySelectorAll('.product-category-section').forEach(section => {
                section.classList.add('active');
            });
        }

        // Si se encontró al menos una tarjeta, desplázate a ella
        if (foundCard) {
            const parentSection = foundCard.closest('.product-category-section');
            if (parentSection) {
                // Asegura que la sección de la tarjeta esté visible y actívala
                showSection(parentSection.id);
                foundCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Muestra un mensaje si no se encontraron productos
            showMessage("No se encontraron productos.", 'error');
        }
    }

    // Maneja el botón de retroceso del navegador
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.section) {
            showSection(event.state.section, false);
        } else {
            showSection('nuestro-catalogo', false);
        }
    });

    // Maneja la apertura del modal de detalles del producto
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

    // Cierra el modal de detalles del producto al hacer clic en la "X"
    if (closeProductDetailModal) {
        closeProductDetailModal.addEventListener('click', () => {
            productDetailModal.classList.remove('show');
        });
    }

    // Cierra el modal de detalles del producto al hacer clic fuera de él
    if (productDetailModal) {
        productDetailModal.addEventListener('click', (event) => {
            if (event.target === productDetailModal) {
                productDetailModal.classList.remove('show');
            }
        });
    }

    /**
     * Configura el Intersection Observer para animar secciones al hacer scroll.
     */
    function setupIntersectionObserver() {
        const fadeSections = document.querySelectorAll('.fade-in-section');

        const observerOptions = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.1 // 10% de la sección visible para activar
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Dejar de observar una vez que es visible
                }
            });
        }, observerOptions);

        fadeSections.forEach(section => {
            observer.observe(section);
        });
    }


    // Carga el contenido inicial al cargar la página
    cargarContenido();
});
