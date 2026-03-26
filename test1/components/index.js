/* Page Transition */
function login(){
  document.body.classList.add("fade-out");
  setTimeout(()=>{
    window.location.href="dashboard.html"; // tukar ke page dashboard Ahmad
  },800);
}

/* Particle System */
const canvas=document.getElementById("particleCanvas");
const ctx=canvas.getContext("2d");

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let mouse={x:null,y:null,radius:120};

window.addEventListener("mousemove",e=>{
  mouse.x=e.x;
  mouse.y=e.y;
});

let particles=[];
for(let i=0;i<90;i++){
  particles.push({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height,
    vx:(Math.random()-0.5)*1.2,
    vy:(Math.random()-0.5)*1.2,
    size:2
  });
}

function animate(){
  ctx.fillStyle="rgba(7,12,22,0.35)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  particles.forEach((p,i)=>{
    p.x+=p.vx;
    p.y+=p.vy;

    if(p.x<0||p.x>canvas.width) p.vx*=-1;
    if(p.y<0||p.y>canvas.height) p.vy*=-1;

    let dx=mouse.x-p.x;
    let dy=mouse.y-p.y;
    let dist=Math.sqrt(dx*dx+dy*dy);

    if(dist<mouse.radius){
      p.x-=dx/20;
      p.y-=dy/20;
    }

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fillStyle="#00e5ff";
    ctx.fill();

    for(let j=i+1;j<particles.length;j++){
      let dx=p.x-particles[j].x;
      let dy=p.y-particles[j].y;
      let d=Math.sqrt(dx*dx+dy*dy);
      if(d<100){
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(particles[j].x,particles[j].y);
        ctx.strokeStyle="rgba(0,229,255,"+(1-d/100)+")";
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize",()=>{
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
});

/*===========================
====log in===========
===========================*/
async function login(){

showLoading();
  
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPass").value;

  if(!username || !password){
    alert("Please enter username and password");
    return;
  }

  const res = await fetch("https://script.google.com/macros/s/AKfycbwHDAybRqO3zs6SXSaP3wQcdkNH9bU6v2QAGNy2yKT2GqfRRfcOczkCCI94oWxZEVcbPw/exec",{
    method:"POST",
    body: JSON.stringify({
      action:"login",
      username:username,
      password:password
    })
  });

  const data = await res.json();

  console.log(data);

  if(data.status === "success"){

    sessionStorage.setItem("cmmsUser", username);
    sessionStorage.setItem("cmmsRole", data.role);

    setTimeout(()=>{
window.location.href="db/dashboard.html";
},500);

  }else{
    hideLoading();
    alert("Invalid username or password");
  }
}