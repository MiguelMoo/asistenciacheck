<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <div
      class="hidden md:flex flex-col md:w-52 md:h-[90vh] md:sticky md:top-4 p-3 border border-gray-400/20 rounded-2xl shadow-lg bg-white m-4"
    >
      <nav class="flex-1 flex flex-col p-2">
        <ul class="flex-1">
          <li v-for="item in menuItems" :key="item.label" class="mb-2 group">
            <button
              @click="changeView(item.view)"
              :class="[
                'w-full px-2 py-2 rounded flex items-center justify-start gap-2 relative transition-colors duration-200 ease-in-out',
                currentView === item.view
                  ? 'bg-blue-500 text-white'
                  : 'text-gray hover:bg-gray-200 hover:text-blue-600',
              ]"
            >
              <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
              <span
                :class="[
                  'whitespace-nowrap transition-all duration-300 ease-in-out',
                  'md:absolute md:left-8 md:opacity-100 md:w-0',
                  'group-hover:md:opacity-100 group-hover:md:w-auto',
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
              'group-hover:md:opacity-100 group-hover:md:w-auto',
            ]"
            class="md:inline"
          >
            Cerrar Sesión
          </span>
        </button>
      </nav>

      <div
        class="mt-4 text-sm text-gray-600 p-2 bg-gray-50 border-t border-gray-200 rounded-md"
      >
        <p>{{ currentDescription }}</p>
      </div>
    </div>

    <main class="flex-1 p-6 pt-6 md:ml-0 overflow-auto relative">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">
          Bienvenido {{ role === 'profesor' ? 'Profesor' : 'Alumno' }}
          {{ userName }}
        </h2>

        <div v-if="role === 'profesor' && currentView === 'Clases'">
          <button
            @click="openAddClassModal"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-lg"
          >
            + Agregar Clase
          </button>
        </div>

        <div v-if="role === 'alumno' && currentView === 'MisClases'">
          <button
            @click="showJoinClassModal = true"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-lg"
          >
            Unirse
          </button>
        </div>
      </div>

      <div v-if="role === 'profesor' && currentView === 'Clases'">
        <div v-if="loadingClasses" class="text-gray-600">Cargando clases...</div>
        <div v-if="errorClasses" class="text-red-600">Error: {{ errorClasses }}</div>

        <ul v-if="clases.length" class="space-y-4">
          <li v-for="clase in clases" :key="clase.id" class="border p-4 rounded shadow">
            <h3 class="font-semibold text-lg">
              {{ clase.nombreClase }} ({{ clase.codigoClase }})
            </h3>
            <p>Min Asistencias: {{ clase.minAsistencias }}</p>
            <p>Grado: {{ clase.grado }}, Grupo: {{ clase.grupo }}</p>
            <p>Carrera: {{ clase.nombreCarrera }}</p>
            <p>Horarios:</p>
            <ul class="list-disc list-inside">
              <li v-for="(horario, dia) in clase.horarios" :key="dia">
                {{ dia }}: {{ horario }}
              </li>
            </ul>
            <div class="mt-4 flex gap-2">
              <button
                @click="openEditClassModal(clase)"
                class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
              >
                Editar
              </button>
            </div>
          </li>
        </ul>
        <div v-else-if="!loadingClasses" class="text-gray-500">No tienes clases aún.</div>
      </div>

      <div v-if="role === 'alumno' && currentView === 'MisClases'">
        <div v-if="loadingStudentClasses" class="text-gray-600">
          Cargando tus clases...
        </div>
        <div v-if="errorStudentClasses" class="text-red-600">
          Error: {{ errorStudentClasses }}
        </div>

        <ul v-if="studentClasses.length" class="space-y-4">
          <li v-for="clase in studentClasses" :key="clase.id" class="border p-4 rounded shadow">
            <h3 class="font-semibold text-lg">
              {{ clase.nombreClase }} ({{ clase.codigoClase }})
            </h3>
            <p>Profesor: {{ clase.nombreProfesor }}</p>
            <p>Grado: {{ clase.grado }}, Grupo: {{ clase.grupo }}</p>
            <p>Carrera: {{ clase.nombreCarrera }}</p>
            <p>Horarios:</p>
            <ul class="list-disc list-inside">
              <li v-for="(horario, dia) in clase.horarios" :key="dia">
                {{ dia }}: {{ horario }}
              </li>
            </ul>
          </li>
        </ul>
        <div v-else-if="!loadingStudentClasses" class="text-gray-500">
          No estás inscrito en ninguna clase. ¡Usa el botón "Unirse" para empezar!
        </div>
      </div>

      <component :is="currentViewComponent" v-else />
    </main>

    <ClaseModal
      v-if="showClassModal"
      :editando="isEditingClass"
      @close="showClassModal = false"
      @saved="handleClassSaved"
    />

    <JoinClassModal
      v-if="showJoinClassModal"
      @close="showJoinClassModal = false"
      @joined="handleClassJoined"
    />

    <nav
      v-if="role"
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around items-center px-4 py-2 md:hidden z-10"
    >
      <button
        @click="changeView(leftButton.view)"
        :class="[
          'flex-1 text-center flex flex-col items-center justify-center p-1 group relative transition-colors duration-200 ease-in-out',
          currentView === leftButton.view
            ? 'text-blue-500'
            : 'text-gray-700 hover:text-blue-600',
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
            : 'bg-white text-gray-700 hover:bg-gray-100',
        ]"
      >
        <component :is="centerButton.icon" class="h-6 w-6" />
        <span
          v-if="centerButton.label"
          class="text-xs absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none"
        >
          {{ centerButton.label }}
        </span>
      </button>

      <button
        @click="changeView(rightButton.view)"
        :class="[
          'flex-1 text-center flex flex-col items-center justify-center p-1 group relative transition-colors duration-200 ease-in-out',
          currentView === rightButton.view
            ? 'text-blue-500'
            : 'text-gray-700 hover:text-blue-600',
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
import { ref, computed, onMounted } from 'vue';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/vue/24/outline';
import type { MenuItem, Clase } from '../types/types'; // Ajusta la ruta

// Composables
import { useClasses } from '../composables/useClasses'; // Ajusta la ruta
import { useStudentClasses } from '../composables/useStudentClasses'; // Ajusta la ruta

// Componentes
import ClaseModal from '../components/ClaseModal.vue'; // Ajusta la ruta
import JoinClassModal from '../components/JoinClassModal.vue'; // Ajusta la ruta
// Importa tus componentes de vista reales aquí
// import ListasProfesor from '@/views/ListasProfesor.vue';
// import PerfilProfesor from '@/views/PerfilProfesor.vue';
// import PerfilAlumno from '@/views/PerfilAlumno.vue';


const auth = getAuth();
const db = getFirestore();
const router = useRouter();

const role = ref<string | null>(null);
const userName = ref('');
const currentView = ref('');
const showClassModal = ref(false);
const isEditingClass = ref(false); // New state for modal

// Using composables
const {
  clases,
  loading: loadingClasses,
  error: errorClasses,
  cargarClases,
  editarClase,
  resetFormulario: resetClassForm, // Rename to avoid conflict
} = useClasses();
const {
  clasesAlumno: studentClasses,
  loadingClasesAlumno: loadingStudentClasses,
  errorClasesAlumno: errorStudentClasses,
  showJoinClassModal,
  cargarClasesAlumno,
} = useStudentClasses();

const menuProfesor: MenuItem[] = [
  { label: 'Listas', view: 'Listas', icon: ClipboardDocumentListIcon },
  { label: 'Clases', view: 'Clases', icon: AcademicCapIcon },
  { label: 'Perfil', view: 'PerfilProfesor', icon: UserCircleIcon },
];
const menuAlumno: MenuItem[] = [
  { label: 'Mis Clases', view: 'MisClases', icon: AcademicCapIcon },
  { label: 'Perfil', view: 'PerfilAlumno', icon: UserCircleIcon },
];

const descriptions: { [key: string]: { [key: string]: string } } = {
  profesor: {
    Listas: 'Gestiona tus listas de asistencia de todas tus clases.',
    Clases: 'Administra y organiza las clases que impartes.',
    PerfilProfesor: 'Edita tu perfil y preferencias como profesor.',
  },
  alumno: {
    MisClases: 'Consulta las clases en las que estás inscrito.',
    PerfilAlumno: 'Actualiza tu perfil como estudiante.',
  },
};

const currentDescription = computed(() => {
  if (!role.value || !currentView.value) return '';
  return descriptions[role.value as 'profesor' | 'alumno']?.[currentView.value] || '';
});
const menuItems = computed(() => (role.value === 'profesor' ? menuProfesor : menuAlumno));

// Consider unifying mobile navigation logic if possible, or keep as is if distinct.
const leftButton = computed(() =>
  role.value === 'profesor' ? menuProfesor[0] : menuAlumno[0]
);
const centerButton = computed(() =>
  role.value === 'profesor' ? menuProfesor[1] : menuAlumno[0]
);
const rightButton = computed(() =>
  role.value === 'profesor' ? menuProfesor[2] : menuAlumno[1]
);

const componentsMap: { [key: string]: any } = {
  // 'Listas': ListasProfesor, // Uncomment and import your actual components
  // 'PerfilProfesor': PerfilProfesor,
  // 'PerfilAlumno': PerfilAlumno,
  // Fallback for current template rendering
  Listas: { template: '<div><h2>Listas</h2><p>Contenido de listas para profesor</p></div>' },
  PerfilProfesor: { template: '<div><h2>Perfil</h2><p>Perfil del profesor</p></div>' },
  PerfilAlumno: { template: '<div><h2>Perfil</h2><p>Perfil del alumno</p></div>' },
};

const currentViewComponent = computed(() => {
  // If the view is 'Clases' or 'MisClases', we handle rendering directly in this component's template.
  // Otherwise, we use the componentsMap to dynamically render.
  if (currentView.value === 'Clases' && role.value === 'profesor') return null;
  if (currentView.value === 'MisClases' && role.value === 'alumno') return null;
  return componentsMap[currentView.value] || { template: '<p>Seleccione una opción</p>' };
});

const openAddClassModal = () => {
  isEditingClass.value = false;
  resetClassForm(); // Ensure form is reset for new entry
  showClassModal.value = true;
};

const openEditClassModal = (clase: Clase) => {
  isEditingClass.value = true;
  editarClase(clase); // This populates the form in the composable
  showClassModal.value = true;
};

const handleClassSaved = () => {
  // Logic to run after a class is saved (e.g., refresh lists if needed)
  if (role.value === 'profesor' && currentView.value === 'Clases') {
    cargarClases(); // Reload classes after save/edit
  }
};

const handleClassJoined = () => {
  if (role.value === 'alumno' && currentView.value === 'MisClases') {
    cargarClasesAlumno(); // Reload student classes after joining
  }
};

function changeView(view: string) {
  currentView.value = view;
  if (view === 'Clases' && role.value === 'profesor') {
    cargarClases();
  } else if (view === 'MisClases' && role.value === 'alumno') {
    cargarClasesAlumno();
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
      } else if (currentView.value === 'MisClases' && role.value === 'alumno') {
        cargarClasesAlumno();
      }
    }
  } catch (e: any) {
    console.error('Error al cargar datos del usuario:', e);
  }
});
</script>