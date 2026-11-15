const { app, BrowserWindow, ipcMain, Menu, dialog, shell, session } = require('electron');
const path = require('path');
const MainMenuapp = require('./menu-config');
const RightMenuapp = require('./right-menu-config');
const PrintOptions = require('./right-menu-config');
const appConfig = require('./config');
const allowedOrigin = new URL(appConfig.websiteUrl).origin;
let mainWindow;
let mainMenu = Menu.buildFromTemplate(MainMenuapp);
let rightMenu = Menu.buildFromTemplate(RightMenuapp);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: appConfig.width, height: appConfig.height,
    minWidth: appConfig.minWidth, minHeight: appConfig.minHeight,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  Menu.setApplicationMenu(mainMenu);
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://') || new URL(url).origin === allowedOrigin) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });
  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (url.startsWith('file://') || new URL(url).origin === allowedOrigin) return;
    event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  mainWindow.webContents.on('context-menu', (event) => { event.preventDefault(); rightMenu.popup({ window: mainWindow }); });
  loadWebContent();
}
function loadWebContent() {
  mainWindow.loadFile(path.join(__dirname, 'public/loading.html'));
  mainWindow.webContents.once('did-finish-load', () => mainWindow.loadURL(appConfig.websiteUrl));
  mainWindow.webContents.on('did-fail-provisional-load', () => mainWindow.loadFile(path.join(__dirname, 'public/offline.html')));
}
ipcMain.on('online-status-changed', () => loadWebContent());
ipcMain.on('printPage', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.webContents.print(PrintOptions, (success, failureReason) => {
    if (!success) dialog.showMessageBox(mainWindow, { message: failureReason || 'No se pudo imprimir.', type: 'error', buttons: ['Cerrar'], title: 'Error de impresión' });
  });
});
module.exports = (pageId) => pageId === 'home' ? loadWebContent() : mainWindow.loadFile(path.join(__dirname, `public/${pageId}.html`));
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
