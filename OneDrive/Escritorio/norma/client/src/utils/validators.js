const allowedDomains = [
  "gmail.com",
  "outlook.com",
  "alumno.universidad.mx",
  "profesor.universidad.mx"
];

export function isValidEmail(email) {
  const trimmed = email.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(trimmed)) return false;

  const domain = trimmed.split("@")[1];
  return allowedDomains.includes(domain);
}


export function isValidText(text) {
  const regex = /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\\s]+$/;
  return regex.test(text.trim());
}

export function isValidNumber(num) {
  const regex = /^[0-9]+$/;
  return regex.test(num.trim());
}

export function sanitize(text) {
  return text.replace(/[<>{}"'`]/g, '').trim();
}
