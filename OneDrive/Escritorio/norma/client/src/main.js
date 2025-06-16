import { createApp } from 'vue';
import App from './App.vue';
import router from './routers';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';

const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_DOMINIO.firebaseapp.com',
  projectId: 'TU_PROJECT_ID',
  storageBucket: 'TU_BUCKET',
  messagingSenderId: 'TU_SENDER_ID',
  appId: 'TU_APP_ID'
};

const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);

const app = createApp(App);

onAuthStateChanged(auth, (user) => {
  if (user) router.push('/home');
  else router.push('/login');
  app.use(router).mount('#app');
});
