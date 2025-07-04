import { auth } from "./firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

function showMessage(message, isError = false) {
  const box = document.getElementById("msg");
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

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html";
  } catch (error) {
    showMessage("Credenciales inválidas", true);
    console.error("Error de inicio de sesión:", error);
  }
});

