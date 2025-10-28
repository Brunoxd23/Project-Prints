const { contextBridge, ipcRenderer } = require("electron");
const Store = require("electron-store");

const store = new Store();

// Lista de canais IPC permitidos
const validChannels = [
  "gerar-prints",
  "atualizar-prints",
  "update-prints",
  "select-folder",
  "check-folder",
  "show-error",
  "show-success",
  "print-progress",
  "print-complete",
];

contextBridge.exposeInMainWorld("electron", {
  // Gerenciamento de estado persistente
  store: {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key),
  },

  // Comunicação IPC
  ipcRenderer: {
    invoke: (channel, data) => {
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      return Promise.reject(new Error(`Canal IPC não permitido: ${channel}`));
    },
    on: (channel, func) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once: (channel, func) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    },
  },
});
