import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// Tu configuración de Firebase (obtenida de la consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAf_SwODFEG-OGL2vkfsjFos4kWAYQKKPA",
  authDomain: "filograficos-web.firebaseapp.com",
  projectId: "filograficos-web",
  storageBucket: "filograficos-web.firebasestorage.app",
  messagingSenderId: "755399036988",
  appId: "1:755399036988:web:86b9f75081575d5527b339",
  measurementId: "G-R6P90QZMWL"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };