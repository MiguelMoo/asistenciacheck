<template>
  <div class="min-h-screen flex flex-col md:flex-row">
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

    <main class="flex-1 p-6 pt-6 md:ml-0 overflow-auto relative">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">
          Bienvenido {{ role === 'profesor' ? 'Profesor' : 'Alumno' }} {{ userName }}
        </h2>

        <div v-if="role === 'profesor' && currentView === 'Clases'">
          <button
            @click="showModal = true; resetFormulario()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-lg"
          >
            + Agregar Clase
          </button>
        </div>

        <div v-if="role === 'alumno' && currentView === 'MisClases'">
          <button
            @click="showJoinClassModal = true; joinClassCode = '';"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-lg"
          >
            Unirse
          </button>
        </div>
      </div>

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
            <div class="mt-4">
              <button @click="editarClase(clase)" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                Editar
              </button>
            </div>
          </li>
        </ul>
        <div v-else class="text-gray-500">No tienes clases aún.</div>
      </div>

      <div v-if="role === 'alumno' && currentView === 'MisClases'">
        <div v-if="loadingClasesAlumno" class="text-gray-600">Cargando tus clases...</div>
        <div v-if="errorClasesAlumno" class="text-red-600">Error: {{ errorClasesAlumno }}</div>

        <ul v-if="clasesAlumno.length" class="space-y-4">
          <li v-for="clase in clasesAlumno" :key="clase.id" class="border p-4 rounded shadow">
            <h3 class="font-semibold text-lg">{{ clase.nombreClase }} ({{ clase.codigoClase }})</h3>
            <p>Profesor: {{ clase.nombreProfesor }}</p>
            <p>Grado: {{ clase.grado }}, Grupo: {{ clase.grupo }}</p>
            <p>Carrera: {{ clase.nombreCarrera }}</p>
            <p>Horarios:</p>
            <ul class="list-disc list-inside">
              <li v-for="(horario, dia) in clase.horarios" :key="dia">{{ dia }}: {{ horario }}</li>
            </ul>
          </li>
        </ul>
        <div v-else class="text-gray-500">No estás inscrito en ninguna clase. ¡Usa el botón "Unirse" para empezar!</div>
      </div>

      <component v-else :is="currentViewComponent" />
    </main>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg max-w-3xl w-full p-6 relative shadow-lg max-h-[90vh] overflow-auto">
        <h3 class="text-2xl font-bold mb-6">{{ editando ? 'Editar Clase' : 'Clases - agregar clase' }}</h3>
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
                <div class="flex gap-2">
                  <select v-model="form.horarios[dia].start" class="w-1/2 border px-2 py-2 rounded">
                    <option value="">No hay clase</option>
                    <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
                  </select>
                  <select v-model="form.horarios[dia].end" class="w-1/2 border px-2 py-2 rounded">
                    <option value="">No hay clase</option>
                    <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
                  </select>
                </div>
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

    <div
      v-if="showJoinClassModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg">
        <h3 class="text-2xl font-bold mb-4">Unirse a una clase</h3>
        <form @submit.prevent="unirseAClase">
          <div class="mb-4">
            <label class="block font-medium text-sm mb-1">Código de la clase</label>
            <input v-model="joinClassCode" type="text" required class="w-full border px-3 py-2 rounded text-center text-lg font-mono tracking-widest uppercase" placeholder="EJ: ABC123" maxlength="6" />
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" @click="showJoinClassModal = false" class="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded" :disabled="joining">
              {{ joining ? 'Uniéndose...' : 'Unirse' }}
            </button>
          </div>
        </form>
      </div>
    </div>

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
  getDocs,
  arrayUnion // Import arrayUnion
} from 'firebase/firestore';
import { useRouter } from 'vue-router';
import {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  UserCircleIcon,
  QrCodeIcon,
  CameraIcon as HeroCameraIcon, // Renamed to avoid conflict if CameraIcon is used elsewhere
  ArrowLeftOnRectangleIcon
} from '@heroicons/vue/24/outline';

const auth = getAuth();
const db = getFirestore();
const router = useRouter();

const role = ref<string | null>(null);
const userName = ref('');
const currentView = ref('');
const showModal = ref(false); // Modal for adding/editing professor's classes
const saving = ref(false);
const loading = ref(false); // Loading for professor's classes
const error = ref(''); // Error for professor's classes

const clases = ref<Array<any>>([]); // Professor's classes

const editando = ref(false);
const claseEnEdicionId = ref('');

// Alumno specific states
const showJoinClassModal = ref(false); // Modal for student to join class
const joinClassCode = ref(''); // Input for class code
const joining = ref(false); // Loading state for joining class
const clasesAlumno = ref<Array<any>>([]); // Student's enrolled classes
const loadingClasesAlumno = ref(false); // Loading state for student's classes
const errorClasesAlumno = ref(''); // Error for student's classes


const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sabado'];

// Generate time options for select inputs (e.g., "07:00", "07:30")
const timeOptions = computed(() => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
});

const form = reactive({
  nombreClase: '',
  minAsistencias: 0,
  grado: '',
  grupo: '',
  nombreCarrera: '',
  horarios: {
    Lunes: { start: '', end: '' },
    Martes: { start: '', end: '' },
    Miércoles: { start: '', end: '' },
    Jueves: { start: '', end: '' },
    Viernes: { start: '', end: '' },
    Sabado: { start: '', end: '' }
  }
});

const menuProfesor = [
  { label: 'Listas', view: 'Listas', icon: ClipboardDocumentListIcon },
  { label: 'Clases', view: 'Clases', icon: AcademicCapIcon },
  { label: 'Perfil', view: 'PerfilProfesor', icon: UserCircleIcon }
];
const menuAlumno = [
  { label: 'Mis Clases', view: 'MisClases', icon: AcademicCapIcon },
  { label: 'Escanear', view: 'UnirteClase', icon: QrCodeIcon }, // Keeping this for the side menu, but using a button in the main view for joining
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
    : { label: 'Escanear', view: 'UnirteClase', icon: HeroCameraIcon } // This button could potentially open the join modal directly on mobile
);
const rightButton = computed(() => (role.value === 'profesor' ? menuProfesor[2] : menuAlumno[2]));

const currentViewComponent = computed(() => {
  // If a specific view needs custom content outside the list, define it here.
  // For 'Clases' (profesor) and 'MisClases' (alumno), the content is directly in the template.
  if (currentView.value === 'Clases' && role.value === 'profesor') return { template: '<div></div>' };
  if (currentView.value === 'MisClases' && role.value === 'alumno') return { template: '<div></div>' }; // Content directly in template
  return componentsMap[currentView.value] || { template: '<p>Seleccione una opción</p>' };
});

const componentsMap = {
  Listas: { template: '<div><h2>Listas</h2><p>Contenido de listas para profesor</p></div>' },
  PerfilProfesor: { template: '<div><h2>Perfil</h2><p>Perfil del profesor</p></div>' },
  // MisClases and UnirteClase content will be handled directly in the main template now for better integration
  // with the join button and class list display.
  // MisClases: { template: '<div><h2>Mis Clases</h2><p>Contenido de mis clases para alumno</p></div>' },
  UnirteClase: { template: '<div><h2>Unirte a una clase</h2><p>Contenido para escanear/unirse a clase</p></div>' }, // This might change to directly open the modal
  PerfilAlumno: { template: '<div><h2>Perfil</h2><p>Perfil del alumno</p></div>' }
};

// Professor functions
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

    const horariosParaGuardar: { [key: string]: string } = {};
    let hasValidHorario = false;

    for (const dia of diasSemana) {
      const { start, end } = form.horarios[dia];
      if (start && end) {
        if (start >= end) {
          alert(`La hora de inicio para ${dia} debe ser anterior a la hora de fin.`);
          saving.value = false;
          return;
        }
        horariosParaGuardar[dia] = `${start}-${end}`;
        hasValidHorario = true;
      } else if (start || end) {
        alert(`Por favor, selecciona tanto la hora de inicio como la de fin para ${dia}, o deja ambas como "No hay clase".`);
        saving.value = false;
        return;
      }
    }

    if (!hasValidHorario) {
      alert('Debes ingresar al menos un horario válido (hora de inicio y fin).');
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
        horarios: horariosParaGuardar
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
        horarios: horariosParaGuardar,
        profesorUid: user.uid,
        creadoEn: new Date(),
        alumnosInscritos: [] // Initialize with empty array for enrolled students
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
  diasSemana.forEach(d => {
    form.horarios[d] = { start: '', end: '' };
  });
  editando.value = false;
  claseEnEdicionId.value = '';
}

function editarClase(clase: any) {
  form.nombreClase = clase.nombreClase;
  form.minAsistencias = clase.minAsistencias;
  form.grado = clase.grado;
  form.grupo = clase.grupo;
  form.nombreCarrera = clase.nombreCarrera;
  diasSemana.forEach(d => {
    const horarioStr = clase.horarios?.[d] || '';
    if (horarioStr) {
      const [start, end] = horarioStr.split('-');
      form.horarios[d] = { start: start || '', end: end || '' };
    } else {
      form.horarios[d] = { start: '', end: '' };
    }
  });
  claseEnEdicionId.value = clase.id;
  editando.value = true;
  showModal.value = true;
}

// Student functions
async function cargarClasesAlumno() {
  loadingClasesAlumno.value = true;
  errorClasesAlumno.value = '';
  clasesAlumno.value = [];
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    // Query for classes where the student's UID is in the alumnosInscritos array
    const q = query(collection(db, 'clases'), where('alumnosInscritos', 'array-contains', user.uid));
    const querySnapshot = await getDocs(q);

    // Fetch professor names for enrolled classes
    const enrolledClasses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const classesWithProfesorNames = await Promise.all(enrolledClasses.map(async (clase) => {
      const profesorUid = (clase as any).profesorUid;
      const profesorDoc = await getDoc(doc(db, 'usuarios', profesorUid));
      const nombreProfesor = profesorDoc.exists() ? profesorDoc.data()?.nombre || 'Desconocido' : 'Desconocido';
      return { ...clase, nombreProfesor };
    }));
    clasesAlumno.value = classesWithProfesorNames;

  } catch (e: any) {
    errorClasesAlumno.value = e.message || 'Error al cargar tus clases';
  } finally {
    loadingClasesAlumno.value = false;
  }
}

async function unirseAClase() {
  joining.value = true;
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    if (!joinClassCode.value) {
      alert('Por favor, ingresa un código de clase.');
      return;
    }

    const classCode = joinClassCode.value.toUpperCase().trim();

    // Query for the class by its code
    const q = query(collection(db, 'clases'), where('codigoClase', '==', classCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert('Clase no encontrada. Verifica el código e inténtalo de nuevo.');
      return;
    }

    const classDoc = querySnapshot.docs[0];
    const claseData = classDoc.data();
    const claseRef = doc(db, 'clases', classDoc.id);

    // Check if the student is already enrolled
    if (claseData.alumnosInscritos && claseData.alumnosInscritos.includes(user.uid)) {
      alert('Ya estás inscrito en esta clase.');
      showJoinClassModal.value = false;
      joinClassCode.value = '';
      return;
    }

    // Add student's UID to the alumnosInscritos array
    await updateDoc(claseRef, {
      alumnosInscritos: arrayUnion(user.uid)
    });

    alert('¡Te has unido a la clase exitosamente!');
    showJoinClassModal.value = false;
    joinClassCode.value = '';
    cargarClasesAlumno(); // Refresh the student's class list
  } catch (e: any) {
    alert('Error al unirte a la clase: ' + (e.message || e));
  } finally {
    joining.value = false;
  }
}

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
      currentView.value = role.value === 'profesor' ? 'Listas' : 'MisClases'; // Default view for alumno is MisClases
      if (currentView.value === 'Clases' && role.value === 'profesor') {
        cargarClases();
      } else if (currentView.value === 'MisClases' && role.value === 'alumno') {
        cargarClasesAlumno();
      }
    }
  } catch (e:any) {
    console.error("Error al cargar datos del usuario:", e);
  }
});
</script>