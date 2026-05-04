// Firebase bootstrap for legacy non-module pages
// Optional: create js/firebase-config.local.js to override config without editing this file.

window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.firebasestorage.app",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

window.firebaseReady = (async function(){
  const [appMod, authMod, fsMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js')
  ]);

  const app = appMod.initializeApp(window.FIREBASE_CONFIG);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);

  const services = { app, auth, db, appMod, authMod, fsMod };
  window.firebaseServices = services;
  return services;
})();
