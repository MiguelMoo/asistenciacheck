import { ref, watch } from 'vue';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Clase } from '../types/types';

export function useStudentClasses() {
  const db = getFirestore();
  const auth = getAuth();

  const clasesAlumno = ref<Clase[]>([]);
  const loadingClasesAlumno = ref(false);
  const errorClasesAlumno = ref<string | null>(null);
  const showJoinClassModal = ref(false); // Mantener este estado aquí, ya que es parte de la gestión de clases del alumno :p

  const cargarClasesAlumno = async () => {
    loadingClasesAlumno.value = true;
    errorClasesAlumno.value = null;
    clasesAlumno.value = []; 

    const user = auth.currentUser;
    if (!user) {
      errorClasesAlumno.value = 'Usuario no autenticado.';
      loadingClasesAlumno.value = false;
      return;
    }

    try {
      const clasesRef = collection(db, 'clases');
      const clasesSnapshot = await getDocs(clasesRef);
      const enrolledClassIds: Set<string> = new Set(); 

      for (const claseDoc of clasesSnapshot.docs) {
        const classId = claseDoc.id;
        const alumnosInscritosRef = collection(db, 'clases', classId, 'alumnosInscritos');
        const alumnoDocRef = doc(alumnosInscritosRef, user.uid);

        const alumnoDocSnap = await getDoc(alumnoDocRef);
        if (alumnoDocSnap.exists()) {
          enrolledClassIds.add(classId);
        }
      }
      const fetchedClasses: Clase[] = [];
      for (const classId of Array.from(enrolledClassIds)) {
        const classDocRef = doc(db, 'clases', classId);
        const classDocSnap = await getDoc(classDocRef);

        if (classDocSnap.exists()) {
          const classData = classDocSnap.data();

          let nombreProfesor = 'Profesor Desconocido';
          if (classData.profesorId) {
            const profesorDocRef = doc(db, 'usuarios', classData.profesorId);
            const profesorDocSnap = await getDoc(profesorDocRef);
            if (profesorDocSnap.exists()) {
              nombreProfesor = profesorDocSnap.data().nombre || nombreProfesor;
            }
          }

          fetchedClasses.push({
              id: classDocSnap.id,
              nombreClase: classData.nombreClase,
              codigoClase: classData.codigoClase,
              profesorUid: classData.profesorId,
              nombreProfesor: nombreProfesor,
              grado: classData.grado,
              grupo: classData.grupo,
              nombreCarrera: classData.nombreCarrera || 'Carrera Desconocida',
              horarios: classData.horarios || {},
              minAsistencias: 0,
              creadoEn: classData.creadoEn ? new Date(classData.creadoEn.seconds ? classData.creadoEn.seconds * 1000 : classData.creadoEn) : new Date(),
              alumnosInscritos: []
          });
        }
      }

      clasesAlumno.value = fetchedClasses;

    } catch (e: any) {
      console.error('Error al cargar clases del alumno:', e);
      errorClasesAlumno.value = e.message;
    } finally {
      loadingClasesAlumno.value = false;
    }
  };

  return {
    clasesAlumno,
    loadingClasesAlumno,
    errorClasesAlumno,
    showJoinClassModal,
    cargarClasesAlumno,
  };
}