const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // IPC communication
  send: (channel, data) => {
    const validChannels = ['message', 'notification'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  receive: (channel, func) => {
    const validChannels = ['message', 'notification'];
    if (validChannels.includes(channel)) {
      // Remove listener to prevent memory leaks
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  },
  
  invoke: (channel, data) => {
    const validChannels = ['get-data', 'save-data', 'print-content'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  
  // Environment info
  platform: process.platform,
  
  // App info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }
});

// Expose a simple API to check if running in Electron
contextBridge.exposeInMainWorld('isElectron', true);

// CRITICAL FIX: Prevent window.open from creating new windows
window.addEventListener('DOMContentLoaded', () => {
  // Override window.open to prevent new windows
  const originalOpen = window.open;
  window.open = function(...args) {
    console.log('window.open blocked:', args);
    return null;
  };
});

console.log('Preload script loaded successfully');