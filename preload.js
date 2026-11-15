const { contextBridge, ipcRenderer } = require('electron');
const appConfig = require('./config');

contextBridge.exposeInMainWorld('electronAPI', Object.freeze({
  retryConnection: () => ipcRenderer.send('online-status-changed', true),
  printPage: () => ipcRenderer.send('printPage'),
  appName: appConfig.appName,
  toolbar: Object.freeze({
    back: () => ipcRenderer.send('toolbar-back'),
    forward: () => ipcRenderer.send('toolbar-forward'),
    home: () => ipcRenderer.send('toolbar-home'),
    reload: () => ipcRenderer.send('toolbar-reload'),
    print: () => ipcRenderer.send('printPage'),
    minimize: () => ipcRenderer.send('window-minimize'),
    toggleMaximize: () => ipcRenderer.send('window-toggle-maximize'),
    close: () => ipcRenderer.send('window-close'),
  }),
}));

function installToolbar() {
  if (document.getElementById('operant-electron-toolbar-host')) return;
  const host = document.createElement('div');
  host.id = 'operant-electron-toolbar-host';
  host.style.cssText = 'position:fixed;top:0;left:0;right:0;height:42px;z-index:2147483647;pointer-events:none;';
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = ':host{all:initial}.bar{box-sizing:border-box;height:42px;display:flex;align-items:center;gap:4px;padding:5px 9px;background:#fff;color:#111;border-bottom:1px solid #e5e7eb;font:12px Arial,sans-serif;box-shadow:0 1px 5px #0004;pointer-events:auto;-webkit-app-region:drag}.bar button{ -webkit-app-region:no-drag}.window-actions{display:flex;gap:3px;margin-left:8px}.window-actions button{min-width:30px;padding:0}.window-close{background:#fff!important;color:#991b1b!important}.window-close:hover{background:#fee2e2!important}button{border:0;border-radius:4px;background:#f4f4f5;color:#111;min-width:30px;height:30px;padding:0 9px;font:inherit;cursor:pointer}button:hover{background:#e4e4e7}button:disabled{opacity:.4;cursor:default}.brand{font-weight:700;margin-right:6px;letter-spacing:.2px}.status{margin-left:auto;color:#b8f2c8}.collapsed .action,.collapsed .status{display:none}.collapsed .brand{display:none}';
  root.append(style);
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML = '<span class="brand">Operant Cloud</span><button data-action="back" title="Atrás" aria-label="Atrás">←</button><button data-action="forward" title="Adelante" aria-label="Adelante">→</button><button data-action="home" title="Inicio" aria-label="Inicio">⌂</button><button data-action="reload" title="Recargar" aria-label="Recargar">↻</button><button data-action="print" title="Imprimir" aria-label="Imprimir">⎙</button><button data-action="collapse" title="Contraer barra" aria-label="Contraer barra">−</button><span class="status">En línea</span><span class="window-actions"><button data-action="minimize" title="Minimizar" aria-label="Minimizar">−</button><button data-action="toggleMaximize" title="Maximizar" aria-label="Maximizar">□</button><button class="window-close" data-action="close" title="Cerrar" aria-label="Cerrar">×</button></span>';
  root.append(bar);
  const api = window.electronAPI.toolbar;
  const updateConnection = () => { const status = bar.querySelector('.status'); if (status) { status.textContent = navigator.onLine ? 'En línea' : 'Sin conexión'; status.style.color = navigator.onLine ? '#b8f2c8' : '#ffb4ab'; } };
  bar.addEventListener('click', event => { const button = event.target.closest('button'); if (!button) return; const action = button.dataset.action; if (action === 'collapse') { bar.classList.toggle('collapsed'); button.textContent = bar.classList.contains('collapsed') ? '+' : '−'; button.title = bar.classList.contains('collapsed') ? 'Expandir barra' : 'Contraer barra'; return; } if (api[action]) api[action](); });
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  updateConnection();
  document.documentElement.style.paddingTop = '42px';
  document.body.appendChild(host);
}

window.addEventListener('DOMContentLoaded', () => {
  for (const id of appConfig.hideElementsId || []) { const element = document.getElementById(id); if (element) element.style.display = 'none'; }
  for (const className of appConfig.hideElementsClass || []) for (const element of document.getElementsByClassName(className)) element.style.visibility = 'hidden';
  document.title = appConfig.appName;
  const tryAgain = document.getElementById('tryagain');
  if (tryAgain) tryAgain.onclick = () => window.electronAPI.retryConnection();
  {
    const desktopStyle = document.createElement('style');
    desktopStyle.textContent = '.sidebar.collapsed .nav-item .icon,.pos-sidebar.collapsed .pos-nav-item>span:first-child,.pos-sidebar.collapsed .pos-nav-group>span:first-child{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 20px!important;width:20px!important;min-width:20px!important;overflow:visible!important}.sidebar.collapsed .sidebar-nav,.pos-sidebar.collapsed{scrollbar-width:none!important}.sidebar.collapsed .sidebar-nav::-webkit-scrollbar,.pos-sidebar.collapsed::-webkit-scrollbar{display:none!important;width:0!important}';
    document.head.appendChild(desktopStyle);
    installToolbar();
  }
});
