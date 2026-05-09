async function login(username, password) {
  const errEl = document.getElementById('loginError');
  const btnEl = document.getElementById('btnLogin');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  if (!username || !password) {
    showLoginError('Sila masukkan username dan password.');
    return;
  }

  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Logging in...'; }

  try {
    const { auth, db, authMod, fsMod } = await window.firebaseReady;
    let email = String(username || '').trim();

    if (!email.includes('@')) {
      const q = fsMod.query(fsMod.collection(db, 'users'), fsMod.where('username', '==', email), fsMod.limit(1));
      const snap = await fsMod.getDocs(q);
      if (snap.empty) {
        showLoginError('Username tidak dijumpai.');
        return;
      }
      email = snap.docs[0].data().email;
    }

    const cred = await authMod.signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    let profile = null;

    try {
      const profSnap = await fsMod.getDoc(fsMod.doc(db, 'users', user.uid));
      if (profSnap.exists()) profile = profSnap.data();
      if (!profile) {
        const q2 = fsMod.query(fsMod.collection(db, 'users'), fsMod.where('email', '==', user.email), fsMod.limit(1));
        const snap2 = await fsMod.getDocs(q2);
        if (!snap2.empty) profile = snap2.docs[0].data();
      }
    } catch (e) {
      console.warn('User profile lookup failed:', e);
    }

    sessionStorage.setItem('cmmsUser', profile?.username || user.email || username);
    sessionStorage.setItem('cmmsRole', profile?.role || 'user');
    sessionStorage.setItem('cmmsToken', await user.getIdToken());
    sessionStorage.setItem('cmmsUid', user.uid);
    if (profile?.defaultModule) {
      sessionStorage.setItem('cmmsModule', String(profile.defaultModule).toUpperCase());
    }

    window.location.href = 'module.html';
  } catch (err) {
    console.error('login error:', err);
    showLoginError('Login gagal. Semak username/email dan password.');
  } finally {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Log Masuk'; }
  }
}

async function checkAuth() {
  try {
    const { auth, authMod } = await window.firebaseReady;
    await new Promise(resolve => {
      const unsub = authMod.onAuthStateChanged(auth, (user) => {
        unsub();
        if (!user) {
          sessionStorage.clear();
          window.location.href = 'index.html';
          resolve(null);
          return;
        }
        sessionStorage.setItem('cmmsUser', sessionStorage.getItem('cmmsUser') || user.email || 'user');
        sessionStorage.setItem('cmmsUid', user.uid);
        const el = document.getElementById('userDisplay');
        if (el) el.innerText = sessionStorage.getItem('cmmsUser');
        resolve(user);
      });
    });
  } catch (err) {
    console.error('checkAuth error:', err);
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
}

async function logout() {
  try {
    const { auth, authMod } = await window.firebaseReady;
    await authMod.signOut(auth);
  } catch (err) {
    console.warn('logout warning:', err);
  } finally {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
}

function setModule(module) {
  sessionStorage.setItem('cmmsModule', module);
  window.location.href = 'dashboard.html';
}

function getModule() {
  return (sessionStorage.getItem('cmmsModule') || 'FEMS').toUpperCase().trim();
}

function showLoginError(msg) {
  const errEl = document.getElementById('loginError');
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  } else {
    alert(msg);
  }
}
