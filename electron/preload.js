const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  selectFolder: async () => {
    return await ipcRenderer.invoke("select-folder");
  },
});
