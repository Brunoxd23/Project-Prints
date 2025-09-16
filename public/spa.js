// SPA navigation and view control
export function goHome(
  homeView,
  folderView,
  folderList,
  folderOutput,
  runScriptBtn
) {
  homeView.style.display = "flex";
  folderView.style.display = "none";
  folderList.innerHTML = "";
  folderOutput.innerHTML = "";
  runScriptBtn.onclick = null;
}

export function voltarParaHome(cursosContainer, cardsContainer, folderView) {
  cursosContainer.style.display = "none";
  cardsContainer.style.display = "flex";
  folderView.style.display = "none";
}

export function ensurePastasVisible(folderList, folderOutput, folderLabel) {
  folderList.style.display = "flex";
  folderOutput.innerHTML = "";
  if (folderLabel) folderLabel.textContent = "Pastas:";
}
