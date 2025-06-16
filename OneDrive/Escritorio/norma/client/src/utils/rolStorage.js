export function setSelectedRol(rol) {
  if (rol === 'alumno' || rol === 'profesor') {
    localStorage.setItem('rolSeleccionado', rol);
  }
}

export function getSelectedRol() {
  return localStorage.getItem('rolSeleccionado');
}

export function clearSelectedRol() {
  localStorage.removeItem('rolSeleccionado');
}
