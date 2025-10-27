// Este archivo simula las exportaciones de 'src/app/environments/firebase-config'
// con objetos vacíos para evitar la inicialización de Firebase Messaging en Jest/JSDOM.

// Simula la exportación del objeto 'messaging' que tu NotificationService intenta importar.
export const messaging = {};

// Si tu archivo original exporta otras cosas (como 'app', 'firebaseConfig', etc.),
// debes mockearlas aquí también para que las importaciones no fallen.
// Ejemplo:
// export const app = {};
