import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot, 
  deleteDoc,    
  doc,          
  updateDoc     
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


function showMessage(message, isError = false) {
  const box = document.getElementById("message-box");
  box.textContent = message;
  box.classList.remove("hidden", "bg-green-500", "bg-red-500");
  box.classList.add("show");
  if (isError) {
    box.classList.add("bg-red-500");
  } else {
    box.classList.add("bg-green-500");
  }
  setTimeout(() => box.classList.remove("show"), 3000);
}




async function cargarCategorias() {
  const ul = document.getElementById("ul-categorias");
  const selectProducto = document.getElementById("categoria-producto");
  const selectEditProducto = document.getElementById("edit-product-category"); 

  ul.innerHTML = "";
  selectProducto.innerHTML = "<option value=''>Seleccionar categoría</option>";
  selectEditProducto.innerHTML = "<option value=''>Seleccionar categoría</option>";

  onSnapshot(collection(db, "categorias"), (snapshot) => {
    ul.innerHTML = "";
    selectProducto.innerHTML = "<option value=''>Seleccionar categoría</option>";
    selectEditProducto.innerHTML = "<option value=''>Seleccionar categoría</option>";

    snapshot.forEach(docItem => {
      const data = docItem.data();
      const li = document.createElement("li");
      li.className = "flex justify-between items-center"; 
      li.innerHTML = `
        <span>${data.nombre}</span>
        <div>
          <button class="text-blue-400 hover:text-blue-600 mr-2 edit-category-btn" data-id="${docItem.id}" data-nombre="${data.nombre}" data-imagen="${data.imagen}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-red-400 hover:text-red-600 delete-category-btn" data-id="${docItem.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      ul.appendChild(li);

      const option = document.createElement("option");
      option.value = data.nombre.toLowerCase();
      option.textContent = data.nombre;
      selectProducto.appendChild(option);

      const optionEdit = document.createElement("option");
      optionEdit.value = data.nombre.toLowerCase();
      optionEdit.textContent = data.nombre;
      selectEditProducto.appendChild(optionEdit);
    });

    
    document.querySelectorAll('.edit-category-btn').forEach(button => {
      button.addEventListener('click', (e) => openEditCategoryModal(e.currentTarget.dataset.id, e.currentTarget.dataset.nombre, e.currentTarget.dataset.imagen));
    });
    document.querySelectorAll('.delete-category-btn').forEach(button => {
      button.addEventListener('click', (e) => deleteCategory(e.currentTarget.dataset.id));
    });
  });
}


async function deleteCategory(id) {
  if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) { // Usar confirm temporalmente, reemplazar con modal
    try {
      await deleteDoc(doc(db, "categorias", id));
      showMessage("Categoría eliminada ✅");
    } catch (err) {
      showMessage("Error al eliminar categoría ❌", true);
      console.error("Error al eliminar categoría:", err);
    }
  }
}


function openEditCategoryModal(id, nombre, imagen) {
  document.getElementById('edit-category-id').value = id;
  document.getElementById('edit-category-name').value = nombre;
  document.getElementById('edit-category-image').value = imagen;
  document.getElementById('edit-category-modal').classList.add('show');
}


document.getElementById('close-category-modal').addEventListener('click', () => {
  document.getElementById('edit-category-modal').classList.remove('show');
});


document.getElementById('edit-category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-category-id').value;
  const nombre = document.getElementById('edit-category-name').value.trim();
  const imagen = document.getElementById('edit-category-image').value.trim();

  if (!nombre || !imagen) {
    showMessage("Completá todos los campos para editar categoría", true);
    return;
  }

  try {
    await updateDoc(doc(db, "categorias", id), { nombre, imagen });
    document.getElementById('edit-category-modal').classList.remove('show');
    showMessage("Categoría actualizada ✅");
  } catch (err) {
    showMessage("Error al actualizar categoría ❌", true);
    console.error("Error al actualizar categoría:", err);
  }
});




async function cargarProductos() {
  const ul = document.getElementById("ul-productos");
  ul.innerHTML = "";

  onSnapshot(collection(db, "muebles"), (snapshot) => {
    ul.innerHTML = "";

    snapshot.forEach(docItem => {
      const data = docItem.data();
      const li = document.createElement("li");
      li.className = "flex justify-between items-center";
      li.innerHTML = `
        <span>${data.nombre} (Cat: ${data.categoria}) - $${data.precio.toFixed(2)}</span>
        <div>
          <button class="text-blue-400 hover:text-blue-600 mr-2 edit-product-btn" 
                  data-id="${docItem.id}" 
                  data-nombre="${data.nombre}" 
                  data-descripcion="${data.descripcion}" 
                  data-precio="${data.precio}" 
                  data-imagen="${data.imagen}" 
                  data-categoria="${data.categoria}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-red-400 hover:text-red-600 delete-product-btn" data-id="${docItem.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      ul.appendChild(li);
    });

    
    document.querySelectorAll('.edit-product-btn').forEach(button => {
      button.addEventListener('click', (e) => openEditProductModal(
        e.currentTarget.dataset.id,
        e.currentTarget.dataset.nombre,
        e.currentTarget.dataset.descripcion,
        e.currentTarget.dataset.precio,
        e.currentTarget.dataset.imagen,
        e.currentTarget.dataset.categoria
      ));
    });
    document.querySelectorAll('.delete-product-btn').forEach(button => {
      button.addEventListener('click', (e) => deleteProduct(e.currentTarget.dataset.id));
    });
  });
}

// Eliminar producto
async function deleteProduct(id) {
  if (confirm("¿Estás seguro de que quieres eliminar este producto?")) { // Usar confirm temporalmente, reemplazar con modal
    try {
      await deleteDoc(doc(db, "muebles", id));
      showMessage("Producto eliminado ✅");
    } catch (err) {
      showMessage("Error al eliminar producto ❌", true);
      console.error("Error al eliminar producto:", err);
    }
  }
}

function openEditProductModal(id, nombre, descripcion, precio, imagen, categoria) {
  document.getElementById('edit-product-id').value = id;
  document.getElementById('edit-product-name').value = nombre;
  document.getElementById('edit-product-description').value = descripcion;
  document.getElementById('edit-product-price').value = precio;
  document.getElementById('edit-product-image').value = imagen;
  document.getElementById('edit-product-category').value = categoria; 
  document.getElementById('edit-product-modal').classList.add('show');
}


document.getElementById('close-product-modal').addEventListener('click', () => {
  document.getElementById('edit-product-modal').classList.remove('show');
});


document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-product-id').value;
  const nombre = document.getElementById('edit-product-name').value.trim();
  const descripcion = document.getElementById('edit-product-description').value.trim();
  const precio = Number(document.getElementById('edit-product-price').value);
  const imagen = document.getElementById('edit-product-image').value.trim();
  const categoria = document.getElementById('edit-product-category').value.trim().toLowerCase();

  if (!nombre || !descripcion || !precio || !imagen || !categoria) {
    showMessage("Completá todos los campos para editar producto", true);
    return;
  }

  try {
    await updateDoc(doc(db, "muebles", id), { nombre, descripcion, precio, imagen, categoria });
    document.getElementById('edit-product-modal').classList.remove('show');
    showMessage("Producto actualizado ✅");
  } catch (err) {
    showMessage("Error al actualizar producto ❌", true);
    console.error("Error al actualizar producto:", err);
  }
});




document.getElementById("form-categorias").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("categoria").value.trim();
  const imagen = document.getElementById("imagen-categoria").value.trim();

  if (!nombre || !imagen) {
    showMessage("Completá todos los campos", true);
    return;
  }

  try {
    await addDoc(collection(db, "categorias"), { nombre, imagen });
    document.getElementById("form-categorias").reset();
    showMessage("Categoría agregada ✅");
  } catch (err) {
    showMessage("Error al agregar categoría ❌", true);
    console.error("Error al agregar categoría:", err);
  }
});

document.getElementById("form-productos").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre-producto").value.trim();
  const descripcion = document.getElementById("descripcion-producto").value.trim();
  const precio = Number(document.getElementById("precio-producto").value);
  const imagen = document.getElementById("imagen-producto").value.trim();
  const categoria = document.getElementById("categoria-producto").value.trim().toLowerCase();

  if (!nombre || !descripcion || !precio || !imagen || !categoria) {
    showMessage("Completá todos los campos", true);
    return;
  }

  try {
    await addDoc(collection(db, "muebles"), {
      nombre, descripcion, precio, imagen, categoria
    });
    document.getElementById("form-productos").reset();
    showMessage("Producto agregado ✅");
  } catch (err) {
    showMessage("Error al agregar producto ❌", true);
    console.error("Error al agregar producto:", err);
  }
});



document.getElementById("logout").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
    showMessage("Error al cerrar sesión ❌", true);
  }
});

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    cargarCategorias(); 
    cargarProductos();
  }
});

