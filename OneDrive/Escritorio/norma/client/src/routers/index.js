import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import Login from '../views/login.vue';
import Home from '../views/home.vue'; // This is likely your AppLayout based on previous context
import SelectRole from '../views/SelectRole.vue';
import Register from '../views/Register.vue';
import pruebas from '../views/geolocalizacionpruebas.vue';
import NotFound from '../views/NotFound.vue';
import AttendancePage from '../views/AttendancePage.vue'; 
import ListasProfesor from '../views/ListasProfesor.vue'; 
import DailyAttendancePage from '../views/DailyAttendancePage.vue'; 


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
  {
    path: '/profesor/clases/:id/asistencia', 
    name: 'AttendancePage',
    component: AttendancePage,
    props: true, 
    meta: { requiresAuth: true, role: 'profesor' } 
  },
  {
    path: '/profesor/listas', 
    name: 'ListasProfesor',
    component: ListasProfesor,
    meta: { requiresAuth: true, role: 'profesor' }
  },
  {
    path: '/profesor/clases/:classId/asistencia/:date',
    name: 'DailyAttendancePage',
    component: DailyAttendancePage,
    props: true, 
    meta: { requiresAuth: true, role: 'profesor' }
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard global para proteger rutas,no mover 
router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  const unsubscribe = onAuthStateChanged(auth, user => {
    unsubscribe(); 

    if (requiresAuth && !user) {
      next('/login');
    } else if (!requiresAuth && user && (to.path === '/login' || to.path === '/register' || to.path === '/select-role')) {
      next('/home'); 
    }
    else {
      next(); 
    }
  });
});

export default router;