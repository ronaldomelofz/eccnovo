/**
 * ECC Gestor — Electron (Windows / macOS)
 */
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const PORT = Number(process.env.GESTOR_PORT) || 3847
let mainWindow
let serverRef

async function boot() {
  const dadosDir = path.join(app.getPath('userData'), 'dados')
  fs.mkdirSync(dadosDir, { recursive: true })
  process.env.ECC_GESTOR_DADOS = dadosDir

  // Preferência do projeto em desenvolvimento; ao lado do .exe em produção
  const projAtualizacoes = path.join(__dirname, '..', 'EXECUTAVEL', 'ATUALIZACOES')
  const exeAtualizacoes = path.join(path.dirname(process.execPath), 'ATUALIZACOES')
  if (fs.existsSync(projAtualizacoes)) {
    process.env.ECC_ATUALIZACOES_DIR = projAtualizacoes
  } else {
    fs.mkdirSync(exeAtualizacoes, { recursive: true })
    process.env.ECC_ATUALIZACOES_DIR = exeAtualizacoes
  }

  const { startServer } = require('./server')
  const { server } = await startServer(PORT)
  serverRef = server

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'ECC Gestor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  app.whenReady().then(boot)
}

app.on('window-all-closed', () => {
  if (serverRef) {
    try {
      serverRef.close()
    } catch (_) {}
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) boot()
})
