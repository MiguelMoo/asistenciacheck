// main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './routers';

// Firebase Core
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Estilos
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './assets/main.css';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDAf9yTU4io6ZpyphkWFpQu_zo6jrefSfU",
  authDomain: "listapp-f03db.firebaseapp.com",
  projectId: "listapp-f03db",
  storageBucket: "listapp-f03db.appspot.com", // ← ¡CORREGIDO!
  messagingSenderId: "626075471195",
  appId: "1:626075471195:web:d7187202dd7ede49b79e7e",
  measurementId: "G-PTTYVVBBE4"
};

// Inicializar Firebase solo una vez
const firebaseApp = initializeApp(firebaseConfig);

// Inicializar Analytics (opcional)
getAnalytics(firebaseApp);

// Inicializar Auth y Firestore correctamente
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Hacer accesible `auth` y `db` en todo el proyecto (opcional pero recomendado)
export { auth, db };

// Esperar a que se determine el estado de autenticación antes de montar la app
onAuthStateChanged(auth, (user) => {
  // if (user) {
  //   router.push('/home');
  // } else {
  //   router.push('/login');
  // }

  createApp(App).use(router).mount('#app');
});
