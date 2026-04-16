// =====================
// LOGIN — panggil API.LOGIN
// =====================
async function login(username, password) {
 
  const errEl = document.getElementById('loginError');
  const btnEl = document.getElementById('btnLogin');
 
  // clear error
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
 
  // validation
  if (!username || !password) {
    showLoginError('Sila masukkan username dan password.');
    return;
  }
 
  // loading state
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Logging in...'; }
 
  try {
 
    // Hantar ke API.LOGIN (Google Apps Script)
    const payload = {
      action:   'login',
      username: username,
      password: password
    };
 
    const res = await apiFetch(API.LOGIN, {
      method:   'POST',
      redirect: 'follow',
      headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
      body:     JSON.stringify(payload)
    });
 
    // res null bermakna network error / Apps Script down
    if (!res) {
      showLoginError('Gagal sambung ke server. Cuba semula.');
      return;
    }
 
    // Apps Script harus return { status: "success", username, role, module }
    // atau { status: "error", message: "..." }
    if (res.status !== 'success') {
      showLoginError(res.message || 'Username atau password tidak tepat.');
      return;
    }
 
    // Simpan dalam sessionStorage
    sessionStorage.setItem('cmmsUser',   res.username || username);
    sessionStorage.setItem('cmmsRole',   res.role     || 'user');
    sessionStorage.setItem('cmmsToken',  res.token    || '');
 
    // Set modul dari API jika ada, kalau tak kekalkan default
    if (res.module) {
      sessionStorage.setItem('cmmsModule', res.module.toUpperCase());
    }
 
    // Redirect ke dashboard
    window.location.href = 'dashboard.html';
 
  } catch (err) {
    console.error('login error:', err);
    showLoginError('Ralat tidak dijangka. Cuba semula.');
  } finally {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Log Masuk'; }
  }
}
 
// =====================
// CHECK AUTH
// Letak onload="checkAuth()" dalam setiap page
// =====================
function checkAuth() {
  const user = sessionStorage.getItem('cmmsUser');
 
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
 
  // papar nama user
  const el = document.getElementById('userDisplay');
  if (el) el.innerText = user;
}
 
// =====================
// LOGOUT
// =====================
function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}
 
// =====================
// MODULE (FEMS / BEMS)
// =====================
function setModule(module) {
  sessionStorage.setItem('cmmsModule', module);
  window.location.href = 'dashboard.html';
}
 
function getModule() {
  return (sessionStorage.getItem('cmmsModule') || 'FEMS').toUpperCase().trim();
}
 
// =====================
// HELPER — papar error dalam login page
// =====================
function showLoginError(msg) {
  const errEl = document.getElementById('loginError');
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  } else {
    alert(msg);
  }
}
