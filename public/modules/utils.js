// Utility functions
export function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

export function zoomImg(img) {
  const modal = document.getElementById("zoom-modal");
  const zoomImg = document.getElementById("zoom-img");
  const closeBtn = document.getElementById("zoom-close");

  zoomImg.src = img;
  modal.style.display = "flex";

  // Adiciona evento de clique no botão X para fechar
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  // Fecha o modal também ao clicar fora da imagem
  modal.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}
