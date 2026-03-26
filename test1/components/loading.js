/* =========================
   GLOBAL LOADING MANAGER
========================= */

let loadingCount = 0;

/* show loading */
function showLoading(){
  const loader = document.getElementById("loadingScreen");
  if(loader){
    loader.style.display = "flex";
  }
}

/* hide loading */
function hideLoading(){
  const loader = document.getElementById("loadingScreen");
  if(loader){
    loader.style.display = "none";
  }
}

/* universal fetch with loading */
async function fetchData(url, options = {}){

  try{

    loadingCount++;
    showLoading();

    const res = await fetch(url, options);

    if(!res.ok){
      throw new Error("Network response error");
    }

    const data = await res.json();

    return data;

  }
  catch(err){

    console.error("Fetch error:", err);
    return null;

  }
  finally{

    loadingCount--;

    /* hide loading only when all fetch finished */
    if(loadingCount === 0){

      setTimeout(()=>{
        hideLoading();
      },200);

    }

  }

}
