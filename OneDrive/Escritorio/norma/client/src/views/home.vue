<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <!-- Menú lateral -->
    <div
      class="hidden md:flex flex-col md:w-52 md:h-[90vh] md:sticky md:top-4
             p-3 border border-gray-400/20 rounded-2xl shadow-lg bg-white m-4"
    >
      <nav class="flex-1 flex flex-col p-2">
        <ul class="flex-1">
          <li v-for="item in menuItems" :key="item.label" class="mb-2 group">
            <button
              @click="changeView(item.view)"
              :class="[
                'w-full px-2 py-2 rounded flex items-center justify-start gap-2 relative transition-colors duration-200 ease-in-out',
                currentView === item.view ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-blue-600'
              ]"
            >
              <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
              <span
                :class="[
                  'whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out',
                  'md:absolute md:left-8 md:opacity-0 md:w-0',
                  'group-hover:md:opacity-100 group-hover:md:w-auto'
                ]"
                class="md:inline"
              >
                {{ item.label }}
              </span>
            </button>
          </li>
        </ul>

        <button
          @click="handleLogout"
          class="mt-auto w-full px-2 py-2 rounded flex items-center justify-start gap-2 group relative transition-colors duration-200 ease-in-out text-gray-700 hover:bg-red-100 hover:text-red-600"
        >
          <ArrowLeftOnRectangleIcon class="h-5 w-5 flex-shrink-0" />
          <span
            :class="[
              'whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out',
              'md:absolute md:left-8 md:opacity-0 md:w-0',
              'group-hover:md:opacity-100 group-hover:md:w-auto'
            ]"
            class="md:inline"
          >
            Cerrar Sesión
          </span>
        </button>
      </nav>

      <div class="mt-4 text-sm text-gray-600 p-2 bg-gray-50 border-t border-gray-200 rounded-md">
        <p>{{ currentDescription }}</p>
      </div>
    </div>

    <!-- Contenido principal -->
    <main class="flex-1 p-6 pt-6 md:ml-0 overflow-auto relative">
      <h2 class="text-xl font-semibold mb-4">
        Bienvenido {{ role === 'profesor' ? 'Profesor' : 'Alumno' }} {{ userName }}
      </h2>

      <!-- Botón Agregar Clase (visible solo profesor en vista Clases) -->
      <div v-if="role === 'profesor' && currentView === 'Clases'" class="fixed bottom-6 right-6 z-50">
        <button
          @click="showModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-lg"
        >
          + Agregar Clase
        </button>
      </div>

      <!-- Mostrar listado de clases para profesor -->
      <div v-if="role === 'profesor' && currentView === 'Clases'">
        <div v-if="loading" class="text-gray-600">Cargando clases...</div>
        <div v-if="error" class="text-red-600">Error: {{ error }}</div>

        <ul v-if="clases.length" class="space-y-4">
          <li v-for="clase in clases" :key="clase.id" class="border p-4 rounded shadow">
            <h3 class="font-semibold text-lg">{{ clase.nombreClase }} ({{ clase.codigoClase }})</h3>
            <p>Min Asistencias: {{ clase.minAsistencias }}</p>
            <p>Grado: {{ clase.grado }}, Grupo: {{ clase.grupo }}</p>
            <p>Carrera: {{ clase.nombreCarrera }}</p>
            <p>Horarios:</p>
            <ul class="list-disc list-inside">
              <li v-for="(horario, dia) in clase.horarios" :key="dia">{{ dia }}: {{ horario }}</li>
            </ul>
          </li>
        </ul>
        <div v-else class="text-gray-500">No tienes clases aún.</div>
      </div>

      <!-- Otros componentes para otras vistas -->
      <component v-else :is="currentViewComponent" />
    </main>

    <!-- Modal para agregar clase -->
    <!-- Modal para agregar clase -->
<div
  v-if="showModal"
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
>
  <div class="bg-white rounded-lg max-w-3xl w-full p-6 relative shadow-lg max-h-[90vh] overflow-auto">
    <h3 class="text-2xl font-bold mb-6">Clases - agregar clase</h3>
    <form @submit.prevent="guardarClase">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block font-medium text-sm mb-1">Nombre de la clase*</label>
          <input v-model="form.nombreClase" required class="w-full border px-3 py-2 rounded" placeholder="Nombre de la clase" />
        </div>
        <div>
          <label class="block font-medium text-sm mb-1">%mín asistencias*</label>
          <input v-model.number="form.minAsistencias" type="number" min="0" required class="w-full border px-3 py-2 rounded" placeholder="% min asistencias" />
        </div>
        <div>
          <label class="block font-medium text-sm mb-1">Grado y grupo</label>
          <div class="flex gap-2">
            <input v-model="form.grado" required class="w-full border px-3 py-2 rounded" placeholder="Grado" />
            <input v-model="form.grupo" required class="w-full border px-3 py-2 rounded" placeholder="Grupo" />
          </div>
        </div>
      </div>

      <div class="mt-4">
        <label class="block font-medium text-sm mb-1">Nombre de la carrera</label>
        <input v-model="form.nombreCarrera" required class="w-full border px-3 py-2 rounded" placeholder="Nombre de la carrera" />
      </div>

      <div class="mt-6">
        <p class="text-lg font-semibold mb-2">Escoge el horario de clases:</p>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="dia in diasSemana" :key="dia">
            <label class="block text-sm font-medium">{{ dia }}</label>
            <input
              v-model="form.horarios[dia]"
              class="w-full border px-3 py-2 rounded"
              placeholder="Horario de clase"
            />
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button type="button" @click="showModal = false" class="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100">
          Cancelar
        </button>
        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </form>
  </div>
</div>

    <!-- Menú móvil -->
    <nav
      v-if="role"
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around items-center px-4 py-2 md:hidden z-10"
    >
      <button
        @click="changeView(leftButton.view)"
        :class="[
          'flex-1 text-center flex flex-col items-center justify-center p-1 group relative transition-colors duration-200 ease-in-out',
          currentView === leftButton.view ? 'text-blue-500' : 'text-gray-700 hover:text-blue-600'
        ]"
      >
        <component :is="leftButton.icon" class="h-6 w-6" />
        <span
          class="text-xs absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none"
        >
          {{ leftButton.label }}
        </span>
      </button>

      <button
        @click="changeView(centerButton.view)"
        :class="[
          'p-3 rounded-full shadow-lg -translate-y-4 flex items-center justify-center group relative transition-colors duration-200 ease-in-out',
          currentView === centerButton.view
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        <component :is="centerButton.icon" class="h-6 w-6" />
        <span v-if="centerButton.label"
          class="text-xs absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none"
        >
          {{ centerButton.label }}
        </span>
      </button>

      <button
        @click="changeView(rightButton.view)"
        :class="[
          'flex-1 text-center flex flex-col items-center justify-center p-1 group relative transition-colors duration-200 ease-in-out',
          currentView === rightButton.view ? 'text-blue-500' : 'text-gray-700 hover:text-blue-600'
        ]"
      >
        <component :is="rightButton.icon" class="h-6 w-6" />
        <span
          class="text-xs absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none"
        >
          {{ rightButton.label }}
        </span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { getAuth, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useRouter } from 'vue-router';
import {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  UserCircleIcon,
  QrCodeIcon,
  CameraIcon as HeroCameraIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/vue/24/outline';

const auth = getAuth();
const db = getFirestore();
const router = useRouter();

const role = ref<string | null>(null);
const userName = ref('');
const currentView = ref('');
const showModal = ref(false);
const saving = ref(false);
const loading = ref(false);
const error = ref('');
const clases = ref<Array<any>>([]);
const editando = ref(false);
const claseEnEdicionId = ref('');

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sabado'];

const form = reactive({
  nombreClase: '',
  minAsistencias: 0,
  grado: '',
  grupo: '',
  nombreCarrera: '',
  horarios: {
    Lunes: '',
    Martes: '',
    Miércoles: '',
    Jueves: '',
    Viernes: '',
    Sabado: ''
  }
});

const menuProfesor = [
  { label: 'Listas', view: 'Listas', icon: ClipboardDocumentListIcon },
  { label: 'Clases', view: 'Clases', icon: AcademicCapIcon },
  { label: 'Perfil', view: 'PerfilProfesor', icon: UserCircleIcon }
];
const menuAlumno = [
  { label: 'Mis Clases', view: 'MisClases', icon: AcademicCapIcon },
  { label: 'Unirte a una clase', view: 'UnirteClase', icon: QrCodeIcon },
  { label: 'Perfil', view: 'PerfilAlumno', icon: UserCircleIcon }
];

const descriptions = {
  profesor: {
    Listas: 'Gestiona tus listas de asistencia de todas tus clases.',
    Clases: 'Administra y organiza las clases que impartes.',
    PerfilProfesor: 'Edita tu perfil y preferencias como profesor.'
  },
  alumno: {
    MisClases: 'Consulta las clases en las que estás inscrito.',
    UnirteClase: 'Únete a nuevas clases escaneando o ingresando un código.',
    PerfilAlumno: 'Actualiza tu perfil como estudiante.'
  }
};

const currentDescription = computed(() => {
  if (!role.value || !currentView.value) return '';
  return descriptions[role.value as 'profesor' | 'alumno']?.[currentView.value] || '';
});
const menuItems = computed(() => role.value === 'profesor' ? menuProfesor : menuAlumno);
const leftButton = computed(() => (role.value === 'profesor' ? menuProfesor[0] : menuAlumno[0]));
const centerButton = computed(() =>
  role.value === 'profesor'
    ? menuProfesor[1]
    : { label: 'Escanear', view: 'UnirteClase', icon: HeroCameraIcon }
);
const rightButton = computed(() => (role.value === 'profesor' ? menuProfesor[2] : menuAlumno[2]));

const currentViewComponent = computed(() => {
  if (currentView.value === 'Clases' && role.value === 'profesor') return { template: '<div></div>' };
  return componentsMap[currentView.value] || { template: '<p>Seleccione una opción</p>' };
});

const componentsMap = {
  Listas: { template: '<div><h2>Listas</h2><p>Contenido de listas para profesor</p></div>' },
  PerfilProfesor: { template: '<div><h2>Perfil</h2><p>Perfil del profesor</p></div>' },
  MisClases: { template: '<div><h2>Mis Clases</h2><p>Contenido de mis clases para alumno</p></div>' },
  UnirteClase: { template: '<div><h2>Unirte a una clase</h2><p>Formulario para unirse a una clase</p></div>' },
  PerfilAlumno: { template: '<div><h2>Perfil</h2><p>Perfil del alumno</p></div>' }
};

async function cargarClases() {
  loading.value = true;
  error.value = '';
  clases.value = [];
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const q = query(collection(db, 'clases'), where('profesorUid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    clases.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    error.value = e.message || 'Error al cargar clases';
  } finally {
    loading.value = false;
  }
}

function generarCodigoClase(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < length; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

async function guardarClase() {
  saving.value = true;
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const horariosValidos = Object.entries(form.horarios)
      .filter(([_, hora]) => hora.trim() !== '')
      .reduce((acc, [dia, hora]) => {
      acc[dia] = hora;
      return acc;
      }, {});
    if (Object.keys(horariosValidos).length === 0) {
      alert('Debes ingresar al menos un horario.');
      saving.value = false;
      return;
    }

    if (editando.value) {
      const claseRef = doc(db, 'clases', claseEnEdicionId.value);
      await updateDoc(claseRef, {
        nombreClase: form.nombreClase,
        minAsistencias: form.minAsistencias,
        grado: form.grado,
        grupo: form.grupo,
        nombreCarrera: form.nombreCarrera,
        horarios: horariosValidos
      });
      alert('Clase actualizada correctamente.');
    } else {
      let codigo;
      let exists = true;
      while (exists) {
        codigo = generarCodigoClase();
        const q = query(collection(db, 'clases'), where('codigoClase', '==', codigo));
        const snap = await getDocs(q);
        exists = !snap.empty;
      }

      const nuevaClase = {
        codigoClase: codigo,
        nombreClase: form.nombreClase,
        minAsistencias: form.minAsistencias,
        grado: form.grado,
        grupo: form.grupo,
        nombreCarrera: form.nombreCarrera,
        horarios: horariosValidos,
        profesorUid: user.uid,
        creadoEn: new Date()
      };

      await addDoc(collection(db, 'clases'), nuevaClase);
      navigator.clipboard.writeText(codigo);
      alert(`Clase creada con código: ${codigo} (copiado al portapapeles)`);
    }

    resetFormulario();
    showModal.value = false;
    cargarClases();
  } catch (e: any) {
    alert('Error guardando clase: ' + (e.message || e));
  } finally {
    saving.value = false;
  }
}

function resetFormulario() {
  form.nombreClase = '';
  form.minAsistencias = 0;
  form.grado = '';
  form.grupo = '';
  form.nombreCarrera = '';
  diasSemana.forEach(d => (form.horarios[d] = ''));
  editando.value = false;
  claseEnEdicionId.value = '';
}

function editarClase(clase: any) {
  form.nombreClase = clase.nombreClase;
  form.minAsistencias = clase.minAsistencias;
  form.grado = clase.grado;
  form.grupo = clase.grupo;
  form.nombreCarrera = clase.nombreCarrera;
  diasSemana.forEach(d => (form.horarios[d] = clase.horarios?.[d] || ''));
  claseEnEdicionId.value = clase.id;
  editando.value = true;
  showModal.value = true;
}

function changeView(view: string) {
  currentView.value = view;
  if (view === 'Clases' && role.value === 'profesor') {
    cargarClases();
  }
}

const handleLogout = async () => {
  try {
    await signOut(auth);
    router.push('/login');
  } catch {
    alert('Error al cerrar sesión');
  }
};

onMounted(async () => {
  const user = auth.currentUser;
  if (!user) {
    role.value = null;
    currentView.value = '';
    return;
  }
  try {
    const docSnap = await getDoc(doc(db, 'usuarios', user.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      role.value = data.rol || null;
      userName.value = data.nombre || '';
      currentView.value = role.value === 'profesor' ? 'Listas' : 'MisClases';
      if (currentView.value === 'Clases' && role.value === 'profesor') {
        cargarClases();
      }
    }
  } catch {}
});
</script>
