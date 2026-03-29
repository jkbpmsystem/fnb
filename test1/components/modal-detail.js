// ==========================
// MODAL CONTROL
// ==========================

export function openModal(content) {
  document.getElementById("modalDetail").innerHTML = content;
  document.getElementById("globalModal").style.display = "block";
}

export function closeModal() {
  document.getElementById("globalModal").style.display = "none";
}


// ==========================
// MODAL EVENTS (TAB + CLOSE)
// ==========================

export function initModalEvents() {

  document.addEventListener("click", function(e) {

    // CLOSE MODAL
    if (e.target.matches("[data-close]")) {
      closeModal();
    }

    // TAB SWITCH
    if (e.target.matches(".tab-btn")) {

      const container = e.target.closest(".tab-container");

      container.querySelectorAll(".tab-btn")
        .forEach(btn => btn.classList.remove("active"));

      container.querySelectorAll(".tab-content")
        .forEach(tab => tab.classList.remove("active"));

      e.target.classList.add("active");

      container.querySelector("#" + e.target.dataset.tab)
        .classList.add("active");
    }

  });

}
