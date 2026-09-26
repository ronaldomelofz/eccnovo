/**
 * ECC Gestor — Electron (Windows / macOS)
 * Suporta abrir arquivo .eccupdate com duplo clique.
 * Startup otimizado: janela só aparece quando pronta.
 */
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const PORT = Number(process.env.GESTOR_PORT) || 3847
let mainWindow
let serverRef
let pendingUpdateFile = null

function isUpdateArg(arg) {
  if (!arg || typeof arg !== 'string') return false
  if (arg.startsWith('-')) return false
  const lower = arg.toLowerCase()
  if (lower.endsWith('.eccupdate')) return fs.existsSync(arg)
  if (lower.endsWith('.exe') && /ecc-gestor.*(setup|update)/i.test(path.basename(arg))) {
    return fs.existsSync(arg)
  }
  return false
}

function findUpdateInArgv(argv = process.argv) {
  for (const a of argv) {
    const cleaned = a.replace(/^--/g, '')
    if (isUpdateArg(a)) return path.resolve(a)
    if (isUpdateArg(cleaned)) return path.resolve(cleaned)
  }
  return null
}

function setupAtualizacoesDir() {
  const projeto = path.join(__dirname, '..', 'EXECUTAVEL', 'ATUALIZACOES')
  const docs = path.join(os.homedir(), 'Documents', 'ECC Gestor', 'ATUALIZACOES')
  const besideExe = path.join(path.dirname(process.execPath), 'ATUALIZACOES')

  if (!__dirname.includes('app.asar') && fs.existsSync(path.join(__dirname, '..', 'gestor'))) {
    fs.mkdirSync(projeto, { recursive: true })
    process.env.ECC_ATUALIZACOES_DIR = projeto
    return projeto
  }

  const prefer =
    process.env.ECC_ATUALIZACOES_DIR && !process.env.ECC_ATUALIZACOES_DIR.includes('app.asar')
      ? process.env.ECC_ATUALIZACOES_DIR
      : docs
  fs.mkdirSync(prefer, { recursive: true })
  try {
    fs.mkdirSync(besideExe, { recursive: true })
  } catch (_) {}
  process.env.ECC_ATUALIZACOES_DIR = prefer
  return prefer
}

function showUpdateOverlay(filePath) {
  if (!mainWindow) return
  const q = encodeURIComponent(filePath)
  mainWindow.loadURL(`http://localhost:${PORT}/atualizando.html?file=${q}`)
  mainWindow.show()
  mainWindow.focus()
}

async function boot(updateFile) {
  const dadosDir = path.join(app.getPath('userData'), 'dados')
  fs.mkdirSync(dadosDir, { recursive: true })
  process.env.ECC_GESTOR_DADOS = dadosDir
  setupAtualizacoesDir()

  const { startServer } = require('./server')
  const { server } = await startServer(PORT)
  serverRef = server

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'ECC Gestor',
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: true,
      spellcheck: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  const file = updateFile || pendingUpdateFile
  pendingUpdateFile = null

  if (file && fs.existsSync(file)) {
    showUpdateOverlay(file)
  } else {
    mainWindow.loadURL(`http://localhost:${PORT}`)
  }

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
  app.on('second-instance', (_event, argv) => {
    const file = findUpdateInArgv(argv)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      if (file) showUpdateOverlay(file)
    } else if (file) {
      pendingUpdateFile = file
    }
  })

  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    if (mainWindow) showUpdateOverlay(filePath)
    else pendingUpdateFile = filePath
  })

  app.whenReady().then(() => boot(findUpdateInArgv(process.argv)))
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
  if (BrowserWindow.getAllWindows().length === 0) boot(null)
})
