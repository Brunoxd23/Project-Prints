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
  zoomImg.src = img;
  modal.style.display = "flex";
}
