// src/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

// Inicializar Firebase en el Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyAf_SwODFEG-OGL2vkfsjFos4kWAYQKKPA",
  authDomain: "filograficos-web.firebaseapp.com",
  projectId: "filograficos-web",
  storageBucket: "filograficos-web.firebasestorage.app",
  messagingSenderId: "755399036988",
  appId: "1:755399036988:web:86b9f75081575d5527b339",
  measurementId: "G-R6P90QZMWL"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);
  const notificationTitle = payload.notification?.title || 'Notificación';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon || '/assets/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en las notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Redirige al hacer clic en la notificación
  );
});