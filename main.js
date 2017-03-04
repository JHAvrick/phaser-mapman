const {app, BrowserWindow} = require('electron')

let win;

function createWindow () {

  win = new BrowserWindow({width: 600, height: 800,
                          webPreferences: { 
                                            webSecurity: false
                                          }, 
                          backgroundColor: '',
                          resizable: true,
                          maximizable: false});

  win.loadURL(`file://${__dirname}/index.html`);
  win.setMenu(null);
  win.openDevTools();

  win.on('closed', () => {
    win = null
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
});

