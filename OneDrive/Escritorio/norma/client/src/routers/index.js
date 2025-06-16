import { createRouter, createWebHistory } from 'vue-router';
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
  { path: '/home', component: Home },
  { path: '/pruebas', component: pruebas },

  //Ruta 404 catch-all
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];


export default createRouter({
  history: createWebHistory(),
  routes
});
