import { db } from "./firebaseconfig.js"; // Ruta corregida
import { collection, getDocs, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let allProducts = []; // allProducts sí se mantiene como variable global

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Initializing main.js...");

    // Declarar las variables de los elementos del DOM.
    // Se asignarán valores aquí para el ámbito del DOMContentLoaded y para funciones que los usen directamente.
    const menuToggle = document.querySelector('.menu-toggle');
    console.log("menuToggle (DOMContentLoaded):", menuToggle);
    const navMenu = document.getElementById('nav-menu');
    console.log("navMenu (DOMContentLoaded):", navMenu);
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay'); // Nuevo: Overlay del menú móvil
    console.log("mobileMenuOverlay (DOMContentLoaded):", mobileMenuOverlay);
    const mainContent = document.getElementById('main-content'); // Referencia al contenido principal

    const catalogLink = document.getElementById('catalog-link');
    console.log("catalogLink (DOMContentLoaded):", catalogLink);
    const contactLink = document.getElementById('contact-link');
    console.log("contactLink (DOMContentLoaded):", contactLink);
    const catalogSection = document.getElementById('nuestro-catalogo');
    console.log("catalogSection (DOMContentLoaded):", catalogSection);
    const contactSection = document.getElementById('contacto');
    console.log("contactSection (DOMContentLoaded):", contactSection);
    const dynamicProductSections = document.getElementById('dynamic-product-sections');
    console.log("dynamicProductSections (DOMContentLoaded):", dynamicProductSections);
    const dynamicCategoryNav = document.getElementById('dynamic-category-nav');
    console.log("dynamicCategoryNav (DOMContentLoaded):", dynamicCategoryNav);
    const categoryDropdownToggle = document.getElementById('category-dropdown-toggle'); // Nuevo: Botón de toggle de categorías
    console.log("categoryDropdownToggle (DOMContentLoaded):", categoryDropdownToggle);
    const searchInput = document.getElementById('search-input');
    console.log("searchInput (DOMContentLoaded):", searchInput);
    const searchButton = document.getElementById('search-button');
    console.log("searchButton (DOMContentLoaded):", searchButton);

    const productDetailModal = document.getElementById('product-detail-modal');
    console.log("productDetailModal (DOMContentLoaded):", productDetailModal);
    const closeProductDetailModal = document.getElementById('close-product-detail-modal');
    console.log("closeProductDetailModal (DOMContentLoaded):", closeProductDetailModal);
    const modalProductImage = document.getElementById('modal-product-image');
    console.log("modalProductImage (DOMContentLoaded):", modalProductImage);
    const modalProductName = document.getElementById('modal-product-name');
    console.log("modalProductName (DOMContentLoaded):", modalProductName);
    const modalProductDescription = document.getElementById('modal-product-description');
    console.log("modalProductDescription (DOMContentLoaded):", modalProductDescription);
    const modalProductPrice = document.getElementById('modal-product-price');
    console.log("modalProductPrice (DOMContentLoaded):", modalProductPrice);

    const messageBox = document.getElementById('message-box');
    console.log("messageBox (DOMContentLoaded):", messageBox);


    // --- Funcionalidad del menú de hamburguesa ---
    if (menuToggle && navMenu && mobileMenuOverlay && mainContent) {
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita que el clic se propague al documento
            navMenu.classList.toggle('active');
            mobileMenuOverlay.classList.toggle('active');
            document.body.classList.toggle('menu-open'); // Controla el scroll del body
            mainContent.classList.toggle('menu-open'); // Controla pointer-events del mainContent

            // Solución: eliminamos estilo en línea para que el CSS controle la visibilidad
            navMenu.style.removeProperty('display');

            // Control explícito de pointer-events para el overlay
            if (mobileMenuOverlay.classList.contains('active')) {
                mobileMenuOverlay.style.pointerEvents = 'auto';
            } else {
                mobileMenuOverlay.style.pointerEvents = 'none';
            }

            // Asegúrate de que el menú de categorías se cierre si el menú principal se cierra
            if (!navMenu.classList.contains('active') && dynamicCategoryNav.classList.contains('active')) {
                dynamicCategoryNav.classList.remove('active');
            }
        });

        // Cierra el menú y el overlay si se hace clic en el overlay (fondo gris)
        // Se ha simplificado la condición para asegurar que el clic en el overlay siempre lo cierre
        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
                mainContent.classList.remove('menu-open');
                if (dynamicCategoryNav) {
                    dynamicCategoryNav.classList.remove('active');
                }
                navMenu.style.removeProperty('display'); // Asegura que no haya estilo inline
                mobileMenuOverlay.style.pointerEvents = 'none'; // Asegura que no capture más eventos
            });
        }


        // Cierra el menú y el overlay al hacer clic en un enlace (para navegación móvil)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    mobileMenuOverlay.classList.remove('active');
                    document.body.classList.remove('menu-open'); // Permite el scroll del body
                    mainContent.classList.remove('menu-open'); // Permite pointer-events del mainContent
                }
                // Asegúrate de que el menú de categorías también se cierre
                if (dynamicCategoryNav && dynamicCategoryNav.classList.contains('active')) { // Asegura que exista
                    dynamicCategoryNav.classList.remove('active');
                }
                // IMPORTANTE: Eliminar el estilo 'display' en línea también al cerrar desde un enlace
                navMenu.style.removeProperty('display');
                mobileMenuOverlay.style.pointerEvents = 'none'; // Asegura que no capture más eventos
            });
        });
    }

    // --- Funcionalidad del menú desplegable de categorías en móvil ---
    if (categoryDropdownToggle && dynamicCategoryNav) {
        categoryDropdownToggle.addEventListener('click', (event) => {
            event.preventDefault(); // Previene la navegación por defecto del enlace
            event.stopPropagation(); // Evita que el clic se propague al documento y cierre el menú principal
            dynamicCategoryNav.classList.toggle('active');
        });
    }


    /**
     * Muestra una sección específica de la página y actualiza el historial del navegador.
     * Ahora utiliza clases 'active' para controlar la visibilidad y las transiciones CSS,
     * y 'display: none' para ocultar completamente las secciones no activas.
     * @param {string} sectionId - El ID de la sección a mostrar.
     * @param {boolean} pushState - Si se debe agregar al historial del navegador (por defecto true).
     */
    function showSection(sectionId, pushState = true) {
        // Selecciona todas las secciones principales y contenedores de productos
        const allContentContainers = document.querySelectorAll('#inicio, #nuestro-catalogo, #contacto, #catalog-container, #dynamic-product-sections, .product-category-section');
        const catalogContainer = document.getElementById('catalog-container');
        const dynamicProductSections = document.getElementById('dynamic-product-sections');

        // Oculta explícitamente todos los contenedores de contenido al inicio
        allContentContainers.forEach(container => {
            container.classList.remove('active');
            container.style.display = 'none';
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block'; // Muestra la sección objetivo
            targetSection.classList.add('active'); // Activa las transiciones CSS
            targetSection.scrollIntoView({ behavior: 'smooth' });

            // Controla la visibilidad específica de #catalog-container y #dynamic-product-sections
            if (sectionId === 'nuestro-catalogo') {
                // Si estamos en la sección principal del catálogo, mostramos las tarjetas de categoría
                if (catalogContainer) {
                    catalogContainer.style.display = 'grid'; // O 'block' o 'flex' según tu CSS original para el grid
                }
                // Y ocultamos las secciones de productos individuales
                if (dynamicProductSections) {
                    dynamicProductSections.style.display = 'none';
                }
            } else if (sectionId.startsWith('category-')) {
                // Si es una categoría específica (ej. 'category-respaldos')
                if (catalogContainer) {
                    catalogContainer.style.display = 'none'; // Oculta las tarjetas de categoría
                }
                if (dynamicProductSections) {
                    dynamicProductSections.style.display = 'block'; // Muestra las secciones de productos individuales
                }
                // Asegúrate de que solo la sección de la categoría actual esté visible
                document.querySelectorAll('.product-category-section').forEach(section => {
                    if (section.id === sectionId) {
                        section.style.display = 'block';
                        section.classList.add('active');
                    } else {
                        section.style.display = 'none';
                        section.classList.remove('active');
                    }
                });
            } else {
                // Para 'inicio' o 'contacto', ocultar ambos contenedores de productos
                if (catalogContainer) {
                    catalogContainer.style.display = 'none';
                }
                if (dynamicProductSections) {
                    dynamicProductSections.style.display = 'none';
                }
            }
        }

        // Lógica específica para la sección de contacto: solo visible en Inicio o Contacto
        if (contactSection) { // Asegúrate de que contactSection esté definido
            if (sectionId === 'inicio' || sectionId === 'contacto') {
                contactSection.style.display = 'block';
                contactSection.classList.add('active');
            } else {
                contactSection.style.display = 'none';
                contactSection.classList.remove('active');
            }
        }

        if (pushState) {
            history.pushState({ section: sectionId }, '', `#${sectionId}`);
        }
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

        // Obtener los elementos del DOM justo antes de usarlos en esta función
        const currentCatalogContainer = document.getElementById('catalog-container');
        const currentDynamicProductSections = document.getElementById('dynamic-product-sections');
        const currentDynamicCategoryNav = document.getElementById('dynamic-category-nav');

        console.log("catalogContainer element (inside cargarContenido, after re-fetch):", currentCatalogContainer);
        console.log("dynamicProductSections element (inside cargarContenido, after re-fetch):", currentDynamicProductSections);
        console.log("dynamicCategoryNav element (inside cargarContenido, after re-fetch):", currentDynamicCategoryNav);


        // Check if Firestore DB is initialized
        if (!db) {
            console.error("Error: Firestore database (db) is not initialized. Check firebaseconfig.js and its import.");
            showMessage("Error: La conexión a la base de datos no está disponible. Por favor, revisa la consola para más detalles.", 'error');
            return;
        }

        // Check if critical DOM elements exist
        if (!currentCatalogContainer) {
            console.error("Error: 'catalog-container' not found in HTML. Cannot render categories.");
            showMessage("Error: No se pudo cargar el catálogo. Elemento principal no encontrado en la página.", 'error');
            return;
        }
        if (!currentDynamicProductSections) {
            console.error("Error: 'dynamic-product-sections' not found in HTML. Cannot render product sections.");
            showMessage("Error: No se pudieron cargar las secciones de productos. Elemento principal no encontrado en la página.", 'error');
            return;
        }
        if (!currentDynamicCategoryNav) {
            console.error("Error: 'dynamic-category-nav' not found in HTML. Cannot render category navigation.");
            showMessage("Error: No se pudo cargar la navegación de categorías. Elemento principal no encontrado en la página.", 'error');
            return;
        }

        currentCatalogContainer.innerHTML = '';
        currentDynamicProductSections.innerHTML = '';
        currentDynamicCategoryNav.innerHTML = '';
        allProducts = [];

        try {
            onSnapshot(collection(db, "categorias"), async (categorySnapshot) => {
                console.log("Categories snapshot received.");
                currentCatalogContainer.innerHTML = ''; // Clear existing content
                currentDynamicCategoryNav.innerHTML = ''; // Clear existing content

                const categories = [];
                categorySnapshot.forEach(doc => {
                    categories.push({ id: doc.id, ...doc.data() });
                });

                categories.sort((a, b) => a.nombre.localeCompare(b.nombre));

                // Renderiza las tarjetas de categoría y los enlaces de navegación por categoría
                categories.forEach(category => {
                    const categoryCard = document.createElement('div');
                    categoryCard.className = 'card-base category-card'; // Usar clase general de tarjeta
                    categoryCard.dataset.category = category.nombre.toLowerCase();
                    categoryCard.innerHTML = `
                        <img src="${category.imagen || 'https://placehold.co/400x300/e0d8cf/6d5b4f?text=Categor%C3%ADa'}" alt="${category.nombre}" class="card-image">
                        <h4 class="product-title text-primary-dark">${category.nombre}</h4>
                        <p class="product-description">${category.descripcion}</p>
                        <a href="#" class="view-details-link view-category" data-category="${category.nombre.toLowerCase()}">Ver ${category.nombre} &rarr;</a>
                    `;
                    currentCatalogContainer.appendChild(categoryCard);

                    const navLink = document.createElement('a');
                    navLink.href = `#category-${category.nombre.toLowerCase()}`;
                    navLink.className = 'nav-link-style hover-text-accent py-2 px-4 nav-category-link';
                    navLink.dataset.category = category.nombre.toLowerCase();
                    navLink.textContent = category.nombre;
                    currentDynamicCategoryNav.appendChild(navLink);
                });

                // Esto va dentro de cargarContenido(), después de appending las categorías
                if (currentDynamicCategoryNav.classList.contains('active')) {
                    currentDynamicCategoryNav.style.display = 'flex'; // fuerza visibilidad por si se activó antes
                }

                // Escucha cambios en la colección de muebles (productos)
                try {
                    onSnapshot(collection(db, "muebles"), (productSnapshot) => {
                        console.log("Products snapshot received.");
                        currentDynamicProductSections.innerHTML = ''; // Limpia las secciones de productos existentes

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
                            currentDynamicProductSections.appendChild(categorySection);
                        }

                        // Muestra la sección de INICIO por defecto al cargar el contenido
                        showSection('inicio', false); // Mostrar la sección de inicio por defecto

                        // Configura los eventos de búsqueda después de cargar los productos
                        if (searchInput && searchButton) {
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

        // Solo prevenir el comportamiento por defecto si es un enlace interno (empieza con #)
        if (href && href.startsWith('#')) {
            event.preventDefault();
            const sectionId = href.replace('#', '');

            if (sectionId === 'inicio') {
                showSection('inicio');
            } else if (sectionId === 'nuestro-catalogo') {
                showSection(sectionId);
            } else if (sectionId === 'contacto') {
                showSection(sectionId);
            }
            else if (link.classList.contains('nav-category-link')) {
                const category = link.dataset.category;
                showSection(`category-${category}`);
                // Cierra el menú de categorías después de seleccionar una opción
                if (dynamicCategoryNav && dynamicCategoryNav.classList.contains('active')) { // Asegura que exista
                    dynamicCategoryNav.classList.remove('active');
                }
            } else if (link.classList.contains('view-category')) {
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

    // Nuevo: Evento para el enlace "Contacto" en el menú principal
    if (contactLink) {
        contactLink.addEventListener('click', (event) => {
            event.preventDefault();
            showSection('contacto');
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
            section.style.display = 'none'; // Asegurarse de que estén ocultas
        });
        document.getElementById('nuestro-catalogo').classList.add('active');
        document.getElementById('nuestro-catalogo').style.display = 'block'; // Asegurarse de que esté visible

        // Oculta las tarjetas de categoría dentro de 'nuestro-catalogo' durante la búsqueda
        const catalogContainer = document.getElementById('catalog-container');
        if (catalogContainer) {
            catalogContainer.style.display = 'none';
        }

        // Oculta la sección de contacto durante la búsqueda
        if (contactSection) {
            contactSection.style.display = 'none';
            contactSection.classList.remove('active');
        }

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
                section.style.display = 'block'; // Asegurarse de que estén visibles
            });
            // Si el término de búsqueda está vacío, y estamos en el catálogo principal, muestra las tarjetas de categoría
            if (catalogContainer && document.getElementById('nuestro-catalogo').classList.contains('active')) {
                catalogContainer.style.display = 'grid'; // O 'block' o 'flex' según tu CSS original para el grid
            }
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
        const target = event.target.closest('.view-details-link'); // Usa closest para asegurar que es el enlace
        if (target) {
            // Solo prevenir el comportamiento por defecto y abrir el modal si tiene un data-product-id
            if (target.dataset.productId) {
                event.preventDefault();
                const productId = target.dataset.productId;
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
            // Si no tiene data-product-id, se permite el comportamiento por defecto (navegar a la URL)
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


    // Llama a cargarContenido
    cargarContenido();
});
