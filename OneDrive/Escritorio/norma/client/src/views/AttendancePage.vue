<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Gestión de Asistencia</h1>
    <p class="text-lg mb-6">
      Clase:
      <span v-if="loadingClassName" class="text-gray-500">Cargando nombre...</span>
      <span v-else-if="className" class="font-semibold text-blue-700">{{ className }}</span>
      <span v-else class="text-red-500">Nombre no encontrado</span>
    </p>

    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">Configurar Fechas Cuatrimestrales</h2>

      <div v-for="(cuatrimestre, index) in cuatrimestreDates" :key="index" class="mb-4">
        <label :for="`cuatrimestre-${index}`" class="block text-sm font-medium text-gray-700 mb-1">
          Cuatrimestre {{ index + 1 }} Fechas:
        </label>
        <DatePicker
          :id="`cuatrimestre-${index}`"
          v-model="cuatrimestre.range"
          range
          :partial-range="false"
          :enable-time-picker="false"
          :format="dateFormat"
          placeholder="Selecciona un rango de fechas"
          :class="{ 'border-red-500': cuatrimestre.error }"
          class="w-full"
        />
        <p v-if="cuatrimestre.error" class="text-red-500 text-sm mt-1">{{ cuatrimestre.error }}</p>
      </div>

      <button
        @click="saveCuatrimestreDates"
        class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
      >
        Guardar Fechas Cuatrimestrales
      </button>

      <div v-if="saveMessage" :class="saveMessageClass" class="mt-4 p-3 rounded-md">
        {{ saveMessage }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">Gestionar Asistencia por Día</h2>

      <label for="select-day" class="block text-sm font-medium text-gray-700 mb-1">
        Selecciona un Día para Asistencia:
      </label>
      <DatePicker
        id="select-day"
        v-model="selectedDayForAttendance"
        :enable-time-picker="false"
        :format="singleDayFormat"
        placeholder="Selecciona un día"
        :max-date="new Date()" :min-date="minAvailableDate" :disabled-week-days="[0, 6]" class="w-full mb-4"
      />

      <div v-if="selectedDayForAttendance" class="mt-4 text-center">
        <p class="text-lg font-medium mb-4">Día seleccionado: {{ selectedDayForAttendance.toLocaleDateString('es-ES') }}</p>
        <button
          @click="openAttendanceForDay(selectedDayForAttendance)"
          class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md text-lg font-semibold"
        >
          Pasar / Ver Lista del Día
        </button>
      </div>
      <div v-else class="mt-4 text-center text-gray-500">
        <p>Selecciona un día del calendario para gestionar la asistencia.</p>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">Resumen de Asistencia por Cuatrimestre</h2>

      <div v-if="loadingAttendanceSummary" class="text-gray-500 text-center py-8">
        Cargando resumen de asistencia...
      </div>
      <div v-else-if="enrolledStudents.length === 0" class="text-gray-500 text-center py-8">
        No hay alumnos inscritos en esta clase.
      </div>
      <div v-else>
        <div v-for="(cuatrimestre, cIndex) in cuatrimestreDates" :key="cIndex" class="mb-8">
          <h3 class="text-lg font-bold mb-3">
            Cuatrimestre {{ cIndex + 1 }}
            <span v-if="cuatrimestre.range && cuatrimestre.range.length === 2">
              ({{ dateFormat([cuatrimestre.range[0], cuatrimestre.range[1]]) }})
            </span>
            <span v-else class="text-red-500 text-sm">(Fechas no definidas)</span>
          </h3>
          <p v-if="!cuatrimestre.range || cuatrimestre.range.length !== 2" class="text-red-500 text-sm mb-2">
            Define las fechas de inicio y fin para este cuatrimestre para ver el resumen.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Alumno</th>
                  <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Asistencias</th>
                  <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Total Días Clases</th>
                  <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Porcentaje (%)</th>
                  <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in enrolledStudents" :key="student.uid" class="hover:bg-gray-50">
                  <td class="py-2 px-4 border-b text-sm text-gray-800">{{ student.name }}</td>
                  <td class="py-2 px-4 border-b text-sm text-gray-800">{{ student.attendanceSummary[cIndex]?.totalPresent || 0 }}</td>
                  <td class="py-2 px-4 border-b text-sm text-gray-800">{{ student.attendanceSummary[cIndex]?.totalClassDays || 0 }}</td>
                  <td class="py-2 px-4 border-b text-sm text-gray-800">
                    {{ student.attendanceSummary[cIndex]?.percentage.toFixed(2) || '0.00' }}%
                  </td>
                  <td class="py-2 px-4 border-b text-sm text-gray-800">
                    <button
                      @click="viewStudentDailyAttendance(student.uid, student.name, cuatrimestre.range[0], cuatrimestre.range[1])"
                      class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs"
                      :disabled="!cuatrimestre.range || cuatrimestre.range.length !== 2"
                    >
                      Ver Días
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <button
      @click="goBack"
      class="mt-6 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow"
    >
      &larr; Volver a Mis Clases
    </button>

    <StudentDailyAttendanceModal
      v-if="showStudentDailyAttendanceModal"
      :class-id="classId"
      :student-uid="selectedStudentDailyAttendance.uid"
      :student-name="selectedStudentDailyAttendance.name"
      :start-date="selectedStudentDailyAttendance.startDate"
      :end-date="selectedStudentDailyAttendance.endDate"
      @close="showStudentDailyAttendanceModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import DatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

import StudentDailyAttendanceModal from '../components/StudentDailyAttendanceModal.vue';


const props = defineProps<{
  id: string;
}>();

const classId = props.id;
const className = ref<string | null>(null);
const loadingClassName = ref(true);

const router = useRouter();
const db = getFirestore();

interface CuatrimestreRange {
  range: Date[];
  error: string | null;
}

const cuatrimestreDates = reactive<CuatrimestreRange[]>([
  { range: [], error: null },
  { range: [], error: null },
  { range: [], error: null },
]);

const saveMessage = ref<string | null>(null);
const saveMessageClass = ref<string>('');

const selectedDayForAttendance = ref<Date | null>(null);

interface StudentAttendanceSummary {
  uid: string;
  name: string;
  attendanceSummary: {
    totalPresent: number;
    totalClassDays: number;
    percentage: number;
    dailyAttendance: { [date: string]: 'Presente' | 'Ausente' | 'Tardanza' }; 
  }[];
}
const enrolledStudents = ref<StudentAttendanceSummary[]>([]);
const loadingAttendanceSummary = ref(false);

const showStudentDailyAttendanceModal = ref(false);
const selectedStudentDailyAttendance = reactive({
  uid: '',
  name: '',
  startDate: new Date(),
  endDate: new Date(),
});


const singleDayFormat = (date: Date) => {
  return date.toLocaleDateString('es-ES');
};

const minAvailableDate = computed(() => {
  let minDate: Date | undefined = undefined;
  cuatrimestreDates.forEach(cuat => {
    if (cuat.range && cuat.range[0]) {
      if (!minDate || cuat.range[0] < minDate) {
        minDate = cuat.range[0];
      }
    }
  });
  return minDate;
});


const dateFormat = (date: Date[]) => {
  if (!date || date.length !== 2 || !date[0] || !date[1]) return '';
  const startDate = date[0].toLocaleDateString('es-ES');
  const endDate = date[1].toLocaleDateString('es-ES');
  return `${startDate} - ${endDate}`;
};

const loadCuatrimestreDates = async () => {
  try {
    const classDocRef = doc(db, 'clases', classId);
    const docSnap = await getDoc(classDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.cuatrimestres && Array.isArray(data.cuatrimestres)) {
        data.cuatrimestres.forEach((cuat: any, index: number) => {
          if (index < 3 && cuat.start && cuat.end) {
            cuatrimestreDates[index].range = [cuat.start.toDate(), cuat.end.toDate()];
          }
        });
      }
    }
  } catch (error) {
    console.error('Error al cargar fechas cuatrimestrales:', error);
  }
};

const saveCuatrimestreDates = async () => {
  saveMessage.value = null;
  saveMessageClass.value = '';
  let isValid = true;

  cuatrimestreDates.forEach((cuatrimestre, index) => {
    if (!cuatrimestre.range || cuatrimestre.range.length !== 2 || !cuatrimestre.range[0] || !cuatrimestre.range[1]) {
      cuatrimestre.error = 'Debes seleccionar un rango de fechas para este cuatrimestre.';
      isValid = false;
    } else {
      cuatrimestre.error = null;
    }
  });

  if (!isValid) {
    saveMessage.value = 'Por favor, completa todos los rangos de fechas.';
    saveMessageClass.value = 'bg-red-100 text-red-700';
    return;
  }

  try {
    const classDocRef = doc(db, 'clases', classId);
    const cuatrimestresToSave = cuatrimestreDates.map(cuat => ({
      start: cuat.range[0],
      end: cuat.range[1],
    }));

    await updateDoc(classDocRef, {
      cuatrimestres: cuatrimestresToSave,
    });

    saveMessage.value = 'Fechas cuatrimestrales guardadas con éxito.';
    saveMessageClass.value = 'bg-green-100 text-green-700';
    console.log('Fechas cuatrimestrales guardadas:', cuatrimestresToSave);

    await loadAttendanceSummary();

  } catch (error) {
    console.error('Error al guardar fechas cuatrimestrales:', error);
    saveMessage.value = 'Error al guardar las fechas. Inténtalo de nuevo.';
    saveMessageClass.value = 'bg-red-100 text-red-700';
  }
};

const openAttendanceForDay = (date: Date) => {
  if (!date) return;

  const formattedDate = date.toISOString().split('T')[0]; 

  router.push({
    name: 'DailyAttendancePage', 
    params: { classId: classId, date: formattedDate }
  });
};


// --- FUNCIONES PARA CARGAR ALUMNOS Y RESUMEN DE ASISTENCIA ---

const loadEnrolledStudents = async () => {
  const students: StudentAttendanceSummary[] = [];
  try {
    const enrolledStudentsRef = collection(db, 'clases', classId, 'alumnosInscritos');
    const q = query(enrolledStudentsRef);
    const querySnapshot = await getDocs(q);

    for (const docSnapshot of querySnapshot.docs) {
      const studentUid = docSnapshot.id;
      // Get student name from 'usuarios' collection
      const userDocRef = doc(db, 'usuarios', studentUid);
      const userDocSnap = await getDoc(userDocRef);
      let studentName = 'Alumno Desconocido';
      if (userDocSnap.exists()) {
        studentName = userDocSnap.data().nombre || studentName;
      }
      students.push({
        uid: studentUid,
        name: studentName,
        attendanceSummary: [],
      });
    }
    enrolledStudents.value = students;
  } catch (error) {
    console.error('Error al cargar alumnos inscritos:', error);
    enrolledStudents.value = [];
  }
};

const loadAttendanceSummary = async () => {
  loadingAttendanceSummary.value = true;
  await loadEnrolledStudents(); 

  if (enrolledStudents.value.length === 0) {
    loadingAttendanceSummary.value = false;
    return;
  }

  const attendanceCollectionRef = collection(db, 'asistencias', classId, 'dias');
  const allAttendanceSnap = await getDocs(attendanceCollectionRef);
  const allAttendanceData: { [date: string]: any } = {};
  allAttendanceSnap.forEach(docSnap => {
    allAttendanceData[docSnap.id] = docSnap.data();
  });

  for (const student of enrolledStudents.value) {
    student.attendanceSummary = [];

    cuatrimestreDates.forEach((cuat, index) => {
      let totalPresent = 0;
      let totalClassDays = 0;
      const dailyAttendance: { [date: string]: 'Presente' | 'Ausente' | 'Tardanza' } = {};

      if (cuat.range && cuat.range.length === 2 && cuat.range[0] && cuat.range[1]) {
        const startDate = cuat.range[0];
        const endDate = cuat.range[1];

        let currentDate = new Date(startDate);
        currentDate.setHours(0,0,0,0); 
        let loopEndDate = new Date(endDate);
        loopEndDate.setHours(23,59,59,999); 


        while (currentDate <= loopEndDate) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalClassDays++;
            const formattedDate = currentDate.toISOString().split('T')[0]; 
            const attendanceRecord = allAttendanceData[formattedDate];
            if (attendanceRecord && attendanceRecord[student.uid]) {
              const status = attendanceRecord[student.uid].status;
              if (status === 'Presente') {
                totalPresent++;
              }
              dailyAttendance[formattedDate] = status;
            } else {
              dailyAttendance[formattedDate] = 'Ausente'; 
            }
          }
          currentDate.setDate(currentDate.getDate() + 1); 
        }
      }

      const percentage = totalClassDays > 0 ? (totalPresent / totalClassDays) * 100 : 0;

      student.attendanceSummary[index] = {
        totalPresent,
        totalClassDays,
        percentage,
        dailyAttendance,
      };
    });
  }
  loadingAttendanceSummary.value = false;
};


const viewStudentDailyAttendance = (uid: string, name: string, startDate: Date, endDate: Date) => {
  selectedStudentDailyAttendance.uid = uid;
  selectedStudentDailyAttendance.name = name;
  selectedStudentDailyAttendance.startDate = startDate;
  selectedStudentDailyAttendance.endDate = endDate;
  showStudentDailyAttendanceModal.value = true;
};

const goBack = () => {
  router.back();
};

const fetchClassName = async () => {
  loadingClassName.value = true;
  try {
    const classDocRef = doc(db, 'clases', classId);
    const docSnap = await getDoc(classDocRef);

    if (docSnap.exists()) {
      className.value = docSnap.data().nombreClase;
    } else {
      console.warn('No se encontró el documento de la clase con ID:', classId);
      className.value = null;
    }
  } catch (error) {
    console.error('Error al cargar el nombre de la clase:', error);
    className.value = 'Error al cargar';
  } finally {
    loadingClassName.value = false;
  }
};

// --- Watcher para recargar el resumen de asistencia cuando cambien las fechas de los cuatrimestres ---
watch(cuatrimestreDates, async (newDates, oldDates) => {
    if (JSON.stringify(newDates) !== JSON.stringify(oldDates)) {
        console.log("Cuatrimestre dates changed, reloading attendance summary.");
        await loadAttendanceSummary();
    }
}, { deep: true }); 

onMounted(async () => {
  await fetchClassName();
  await loadCuatrimestreDates();
  await loadAttendanceSummary();
});
</script>

<style scoped>
</style>