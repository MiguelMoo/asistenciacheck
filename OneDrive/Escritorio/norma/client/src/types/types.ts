export interface HorarioDia {
  split(arg0: string): [any, any];
  start: string;
  end: string;
}

export interface Horarios {
  [key: string]: string; // ejemplo: "Lunes": "11:00-12:00"
}

export interface Clase {
  id?: string;
  codigoClase: string;
  nombreClase: string;
  minAsistencias: number;
  grado: string;
  grupo: string;
  nombreCarrera: string;
  horarios: Horarios;
  profesorUid: string;
  creadoEn: Date;
  alumnosInscritos: string[];
  nombreProfesor?: string; 
}


export interface MenuItem {
  label: string;
  view: string;
  icon: any; 
}