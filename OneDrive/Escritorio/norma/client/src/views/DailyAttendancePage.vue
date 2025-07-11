<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Asistencia Diaria</h1>

      <div class="mb-8 p-4 border-b pb-6">
        <p class="text-xl text-gray-700 mb-2">
          Clase:
          <span v-if="loadingClassName" class="text-gray-500">Cargando...</span>
          <span v-else-if="className" class="font-semibold text-blue-700">{{ className }}</span>
          <span v-else class="text-red-500">Nombre de clase no encontrado</span>
        </p>
        <p class="text-xl text-gray-700">
          Fecha: <span class="font-semibold text-blue-700">{{ formattedDate }}</span>
        </p>
      </div>

      <div class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 class="text-2xl font-semibold text-blue-800 mb-4">Código Temporal de Asistencia</h2>
        <div class="flex flex-col items-center justify-center space-y-4 mb-4">
          <p v-if="generatingCode" class="text-lg text-gray-600">Generando código...</p>
          <div v-else-if="currentAttendanceCode" class="text-center">
            <p v-if="showCode" class="text-4xl font-extrabold text-blue-600 tracking-wide mb-2">
              {{ currentAttendanceCode }}
            </p>
            <p v-else class="text-4xl font-extrabold text-gray-400 tracking-wide mb-2 cursor-pointer" @click="showCode = true">
              ****
            </p>
            <button
              v-if="!showCode"
              @click="showCode = true"
              class="text-blue-500 hover:text-blue-700 text-sm focus:outline-none"
            >
              Mostrar Código
            </button>
            <button
              v-else
              @click="showCode = false"
              class="text-blue-500 hover:text-blue-700 text-sm focus:outline-none"
            >
              Ocultar Código
            </button>
          </div>
          <p v-else class="text-lg text-red-600">No hay código activo.</p>

          <div v-if="currentAttendanceCode" class="mt-4 p-2 bg-white rounded-lg shadow">
            <qrcode-vue :value="currentAttendanceCode" :size="200" level="H" />
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button
            @click="generateNewCode"
            :disabled="generatingCode"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="generatingCode">Generando...</span>
            <span v-else>Generar Nuevo Código</span>
          </button>
          <button
            v-if="currentAttendanceCode"
            @click="copyCodeToClipboard"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg shadow-md transition duration-200 ease-in-out"
          >
            Copiar Código
          </button>
        </div>
        <p v-if="copyMessage" class="text-sm mt-2 text-center text-green-600">{{ copyMessage }}</p>
        <p class="text-sm text-gray-500 mt-4 text-center">
          Este código es válido por un tiempo limitado (ej. 5 minutos).
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">Lista de Alumnos</h2>

        <div v-if="loadingStudents" class="text-center text-gray-600 py-8">
          Cargando alumnos inscritos...
        </div>
        <div v-else-if="students.length === 0" class="text-center text-gray-500 py-8">
          No hay alumnos inscritos en esta clase aún.
        </div>
        <div v-else>
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Alumno
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado de Asistencia
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="student in students" :key="student.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ student.nombre }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span
                    :class="{
                      'text-green-600 font-semibold': student.attendanceStatus === 'Presente',
                      'text-red-600 font-semibold': student.attendanceStatus === 'Ausente',
                      'text-orange-600 font-semibold': student.attendanceStatus === 'Tardanza',
                      'text-gray-500': !student.attendanceStatus
                    }"
                  >
                    {{ student.attendanceStatus || 'Pendiente' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <select
                    v-model="student.attendanceStatus"
                    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Pendiente</option>
                    <option value="Presente">Presente</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Tardanza">Tardanza</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
          <button
            @click="saveDailyAttendance"
            class="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md text-lg font-semibold transition duration-200 ease-in-out"
          >
            Guardar Asistencia del Día
          </button>
        </div>
      </div>

      <button
        @click="goBack"
        class="mt-8 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 ease-in-out"
      >
        &larr; Volver a Gestión de Clase
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import QrcodeVue from 'qrcode.vue';

interface Student {
  id: string;
  nombre: string;
  attendanceStatus: string | null;
}

const props = defineProps<{
  classId: string;
  date: string;
}>();

const router = useRouter();
const db = getFirestore();

const className = ref<string | null>(null);
const loadingClassName = ref(true);
const formattedDate = computed(() => {
  const dateObj = new Date(props.date + 'T00:00:00'); // Ensure UTC parsing for consistency
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }
  return dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

const students = ref<Student[]>([]);
const loadingStudents = ref(true);

const currentAttendanceCode = ref<string | null>(null);
const generatingCode = ref(false);
const copyMessage = ref<string | null>(null);
let codeTimeout: ReturnType<typeof setTimeout> | null = null;
const showCode = ref(false); // Nuevo estado para controlar la visibilidad del código

const fetchClassName = async () => {
  loadingClassName.value = true;
  try {
    const classDocRef = doc(db, 'clases', props.classId);
    const docSnap = await getDoc(classDocRef);
    if (docSnap.exists()) {
      className.value = docSnap.data().nombreClase;
    } else {
      className.value = null;
    }
  } catch (error) {
    console.error('Error al cargar el nombre de la clase:', error);
    className.value = 'Error al cargar';
  } finally {
    loadingClassName.value = false;
  }
};

const fetchStudentsAndAttendance = async () => {
  loadingStudents.value = true;
  students.value = []; 

  try {
    const classStudentsQuery = query(
      collection(db, 'clases', props.classId, 'alumnosInscritos')
    );
    const classStudentsSnapshot = await getDocs(classStudentsQuery);
    const studentIds: string[] = classStudentsSnapshot.docs.map(doc => doc.id); 

    if (studentIds.length === 0) {
      loadingStudents.value = false;
      return;
    }

    const usersQuery = query(
      collection(db, 'usuarios'),
      where('__name__', 'in', studentIds) 
    );
    const usersSnapshot = await getDocs(usersQuery);

    const fetchedStudents: Student[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre || 'Nombre Desconocido',
      attendanceStatus: null 
    }));

    const attendanceDocRef = doc(db, 'asistencias', props.classId, 'dias', props.date);
    const attendanceDocSnap = await getDoc(attendanceDocRef);

    if (attendanceDocSnap.exists()) {
      const dailyAttendanceData = attendanceDocSnap.data();
      fetchedStudents.forEach(student => {
        if (dailyAttendanceData[student.id]) {
          student.attendanceStatus = dailyAttendanceData[student.id].status || null;
        }
      });
    }

    students.value = fetchedStudents;

  } catch (error) {
    console.error('Error al cargar alumnos o asistencia:', error);
  } finally {
    loadingStudents.value = false;
  }
};

const generateRandomCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateNewCode = async () => {
  generatingCode.value = true;
  copyMessage.value = null;
  showCode.value = false; // Resetear la visibilidad al generar nuevo código

  if (codeTimeout) {
    clearTimeout(codeTimeout);
  }

  const newCode = generateRandomCode();
  currentAttendanceCode.value = newCode;

  try {
    const codeDocRef = doc(db, 'codigos_asistencia', props.classId, 'fechas', props.date);
    await setDoc(codeDocRef, {
      code: newCode,
      generatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000), 
    });
    
    codeTimeout = setTimeout(() => {
      currentAttendanceCode.value = null;
      showCode.value = false; // Ocultar también al expirar
    }, 5 * 60 * 1000); 
  } catch (error) {
    console.error('Error al guardar el código de asistencia:', error);
    currentAttendanceCode.value = null;
    alert('Error al generar y guardar el código. Inténtalo de nuevo.');
  } finally {
    generatingCode.value = false;
  }
};

const copyCodeToClipboard = async () => {
  if (currentAttendanceCode.value) {
    try {
      await navigator.clipboard.writeText(currentAttendanceCode.value);
      copyMessage.value = '¡Código copiado al portapapeles!';
      setTimeout(() => { copyMessage.value = null; }, 2000); 
    } catch (err) {
      console.error('Error al copiar el código:', err);
      copyMessage.value = 'Error al copiar.';
    }
  }
};

const saveDailyAttendance = async () => {
  try {
    const attendanceDocRef = doc(db, 'asistencias', props.classId, 'dias', props.date);
    const attendanceData: { [key: string]: { status: string; timestamp: Timestamp } } = {};

    students.value.forEach(student => {
      if (student.attendanceStatus) {
        attendanceData[student.id] = {
          status: student.attendanceStatus,
          timestamp: Timestamp.now() 
        };
      }
    });

    await setDoc(attendanceDocRef, attendanceData, { merge: true });

    alert('Asistencia guardada con éxito.');
  } catch (error) {
    console.error('Error al guardar la asistencia diaria:', error);
    alert('Error al guardar la asistencia. Inténtalo de nuevo.');
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchClassName();
  fetchStudentsAndAttendance();
});

</script>

<style scoped>
</style>