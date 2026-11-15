const { contextBridge, ipcRenderer } = require('electron');
const appConfig = Object.freeze({ appName: 'Operant Cloud', hideElementsId: [], hideElementsClass: [] });

contextBridge.exposeInMainWorld('electronAPI', Object.freeze({
  retryConnection: () => ipcRenderer.send('online-status-changed', true),
  printPage: () => ipcRenderer.send('printPage'),
  appName: appConfig.appName,
}));

window.addEventListener('DOMContentLoaded', () => {
  for (const id of appConfig.hideElementsId || []) {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  }
  for (const className of appConfig.hideElementsClass || []) {
    for (const element of document.getElementsByClassName(className)) element.style.visibility = 'hidden';
  }
  document.title = appConfig.appName;
  const tryAgain = document.getElementById('tryagain');
  if (tryAgain) tryAgain.onclick = () => electronAPI.retryConnection();
});
