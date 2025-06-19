import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import Login from '../views/login.vue';
import Home from '../views/home.vue';
import SelectRole from '../views/SelectRole.vue';
import Register from '../views/Register.vue';
import pruebas from '../views/geolocalizacionpruebas.vue';
import NotFound from '../views/NotFound.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/select-role', component: SelectRole },
  { path: '/register', component: Register },
  { path: '/login', component: Login },
  {
    path: '/home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/pruebas',
    component: pruebas,
    meta: { requiresAuth: true }
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 👮‍♂️ Guard global para proteger rutas
router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  const unsubscribe = onAuthStateChanged(auth, user => {
    unsubscribe(); // importante para no mantener el observer activo
    if (requiresAuth && !user) {
      next('/login'); // redirige si no ha iniciado sesión
    } else {
      next(); // permite navegación normal
    }
  });
});

export default router;
