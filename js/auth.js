
function checkAuth(){
  const user = sessionStorage.getItem("cmmsUser");
  if(!user){ window.location.href = "index.html"; }
  const el = document.getElementById("userDisplay");
  if(el) el.innerText = user;
}
function logout(){
  sessionStorage.clear();
  window.location.href = "index.html";
}


function setModule(module){
  sessionStorage.setItem("cmmsModule", module);
  window.location.href = "dashboard.html";
}

function getModule(){
  return sessionStorage.getItem("cmmsModule") || "FEMS";
}
