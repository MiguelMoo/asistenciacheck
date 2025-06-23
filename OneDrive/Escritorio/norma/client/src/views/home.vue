<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-gray-50">
    <aside
      :class="{ 'translate-x-0': isMobileNavOpen, '-translate-x-full': !isMobileNavOpen }"
      class="fixed inset-y-0 left-0 w-64 bg-white text-gray-800 p-4 space-y-4 z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:border-r md:border-gray-200"
    >
      <div class="text-2xl font-bold text-center border-b border-gray-200 pb-4 text-indigo-700">
        Asistencia App
      </div>
      <nav>
        <ul class="space-y-2">
          <li v-for="item in menuItems" :key="item.label">
            <a
              @click="changeView(item.view)"
              :class="{ 'bg-indigo-50 text-indigo-700': currentView === item.view, 'text-gray-700': currentView !== item.view }"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-100 hover:text-indigo-800 cursor-pointer transition-colors duration-200 ease-in-out"
            >
              <component :is="item.icon" class="h-6 w-6" />
              <span>{{ item.label }}</span>
            </a>
          </li>
          <li>
            <a
              @click="handleLogout"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 hover:text-red-700 cursor-pointer text-red-600 transition-colors duration-200 ease-in-out"
            >
              <ArrowLeftOnRectangleIcon class="h-6 w-6" />
              <span>Cerrar Sesión</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col">
      <header
        class="bg-white shadow-sm p-4 flex justify-between items-center md:sticky md:top-0 md:z-30"
      >
        <button @click="isMobileNavOpen = !isMobileNavOpen" class="md:hidden text-gray-600">
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
        <div class="flex-grow">
          <h1 class="text-xl font-semibold text-gray-800 ml-4 md:ml-0">
            {{ currentView }}
          </h1>
          <p class="text-sm text-gray-500 ml-4 md:ml-0">{{ currentDescription }}</p>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-gray-700 font-medium">{{ userName }} ({{ role }})</span>
        </div>
      </header>

      <main class="flex-1 p-6 pt-6 md:ml-0 overflow-auto relative">
        <div
          v-if="isMobileNavOpen"
          @click="isMobileNavOpen = false"
          class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        ></div>

        <div v-if="currentViewComponent">
          <component :is="currentViewComponent" />
        </div>
        <div v-else-if="role === 'profesor' && currentView === 'Clases'">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Tus Clases</h2>
            <button
              @click="openAddClassModal"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
            >
              + Añadir Clase
            </button>
          </div>
          <div v-if="loadingClasses" class="text-gray-500 text-center py-8">
            Cargando clases...
          </div>
          <div v-else-if="errorClasses" class="text-red-600 text-center py-8">
            Error al cargar clases: {{ errorClasses }}
          </div>
          <ul v-else-if="clases.length" class="space-y-4">
            <li v-for="clase in clases" :key="clase.id" class="border p-4 rounded shadow">
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
              <div class="mt-4 flex gap-2">
                <button
                  @click="openEditClassModal(clase)"
                  class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                >
                  Editar
                </button>
                <button
                  @click="viewAttendance(clase.id)"
                  class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                >
                  Ver/Pasar Lista
                </button>
              </div>
            </li>
          </ul>
          <div v-else class="text-gray-500 text-center py-8">
            No tienes clases creadas aún. ¡Crea una para empezar!
          </div>
        </div>

        <div v-else-if="role === 'alumno' && currentView === 'MisClases'">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Mis Clases</h2>
            <button
              @click="showJoinClassModal = true"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
            >
              + Unirse a Clase
            </button>
          </div>
          <div v-if="loadingStudentClasses" class="text-gray-500 text-center py-8">
            Cargando tus clases...
          </div>
          <div v-else-if="errorStudentClasses" class="text-red-600 text-center py-8">
            Error al cargar clases: {{ errorStudentClasses }}
          </div>
          <ul v-else-if="studentClasses.length" class="space-y-4">
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
              <div class="mt-4 flex gap-2">
                <button
                  @click="openMarkAttendanceModal(clase.id ?? '', clase.codigoClase ?? '')"
                  class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Asistir
                </button>
              </div>
            </li>
          </ul>
          <div v-else-if="!loadingStudentClasses" class="text-gray-500 text-center py-8">
            No estás inscrito en ninguna clase. ¡Usa el botón "Unirse" para empezar!
          </div>
        </div>
      </main>
    </div>

    <ClaseModal
      v-if="showClassModal"
      :editando="isEditingClass"
      @close="showClassModal = false"
      @saved="handleClassSaved"
    />
    <JoinClassModal
      v-if="showJoinClassModal"
      @close="showJoinClassModal = false"
      @class-joined="handleClassJoined"
    />
    <MarkAttendanceModal
      v-if="showMarkAttendanceModal"
      :class-id="selectedClassForAttendance.id"
      :class-code="selectedClassForAttendance.code"
      @close="showMarkAttendanceModal = false"
      @attendance-marked="handleAttendanceMarked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/vue/24/outline';
import type { MenuItem, Clase } from '../types/types';

// Composables
import { useClasses } from '../composables/useClasses';
import { useStudentClasses } from '../composables/useStudentClasses';

// Components
import ClaseModal from '../components/ClaseModal.vue';
import JoinClassModal from '../components/JoinClassModal.vue';
import MarkAttendanceModal from '../components/MarkAttendanceModal.vue';

// Views
import ListasProfesor from '../views/ListasProfesor.vue';

const auth = getAuth();
const db = getFirestore();
const router = useRouter();

const role = ref<string | null>(null);
const userName = ref('');
const currentView = ref('');
const isMobileNavOpen = ref(false);
const showClassModal = ref(false);
const isEditingClass = ref(false);

const {
  clases,
  loading: loadingClasses,
  error: errorClasses,
  cargarClases,
  editarClase,
  resetFormulario: resetClassForm,
} = useClasses();
const {
  clasesAlumno: studentClasses,
  loadingClasesAlumno: loadingStudentClasses,
  errorClasesAlumno: errorStudentClasses,
  showJoinClassModal,
  cargarClasesAlumno,
} = useStudentClasses();

const showMarkAttendanceModal = ref(false);
const selectedClassForAttendance = reactive({ id: '', code: '' });

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

const componentsMap: { [key: string]: any } = {
  'Listas': ListasProfesor,
  'PerfilProfesor': { template: '<div><h2>Perfil</h2><p>Perfil del profesor</p></div>' },
  'PerfilAlumno': { template: '<div><h2>Perfil</h2><p>Perfil del alumno</p></div>' },
};

const currentViewComponent = computed(() => {
  if (currentView.value === 'Clases' && role.value === 'profesor') return null;
  if (currentView.value === 'MisClases' && role.value === 'alumno') return null;
  return componentsMap[currentView.value] || null;
});

const openAddClassModal = () => {
  isEditingClass.value = false;
  resetClassForm();
  showClassModal.value = true;
};

const openEditClassModal = (clase: Clase) => {
  isEditingClass.value = true;
  editarClase(clase);
  showClassModal.value = true;
};

const handleClassSaved = () => {
  if (role.value === 'profesor' && currentView.value === 'Clases') {
    cargarClases();
  }
};

const handleClassJoined = () => {
  if (role.value === 'alumno' && currentView.value === 'MisClases') {
    cargarClasesAlumno();
  }
};

const viewAttendance = (classId: string | undefined) => {
  if (classId) {
    router.push({ name: 'AttendancePage', params: { id: classId } });
  }
};

const openMarkAttendanceModal = (classId: string, classCode: string) => {
  selectedClassForAttendance.id = classId;
  selectedClassForAttendance.code = classCode;
  showMarkAttendanceModal.value = true;
};

const handleAttendanceMarked = () => {
  alert('¡Asistencia marcada con éxito!');
  cargarClasesAlumno();
};

function changeView(view: string) {
  currentView.value = view;
  isMobileNavOpen.value = false;
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
    userName.value = '';
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
    } else {
      console.warn('User document not found for UID:', user.uid);
      router.push('/select-role');
    }
  } catch (e: any) {
    console.error('Error al cargar datos del usuario:', e);
    router.push('/login');
  }
});
</script>

<style scoped>

</style>