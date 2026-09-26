/**
 * Pacotes de atualização do ECC Gestor
 * Pasta preferencial (dev): EXECUTAVEL/ATUALIZACOES
 * Em app instalado: Documentos/ECC Gestor/ATUALIZACOES (nunca dentro do asar)
 */
const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec, spawn } = require('child_process')
const store = require('./store')

const ROOT = path.resolve(__dirname, '..', '..')

function isAsarPath(p) {
  return String(p || '').includes('app.asar')
}

function resolveAtualizacoesDir() {
  if (process.env.ECC_ATUALIZACOES_DIR && !isAsarPath(process.env.ECC_ATUALIZACOES_DIR)) {
    return process.env.ECC_ATUALIZACOES_DIR
  }

  const docs = path.join(os.homedir(), 'Documents', 'ECC Gestor', 'ATUALIZACOES')
  const exeDir = process.execPath
    ? path.join(path.dirname(process.execPath), 'ATUALIZACOES')
    : null
  const projeto = path.join(ROOT, 'EXECUTAVEL', 'ATUALIZACOES')

  // Dev: pasta do projeto se existir e não for asar
  if (!isAsarPath(projeto) && fs.existsSync(path.dirname(projeto))) {
    if (fs.existsSync(projeto) || process.env.NODE_ENV !== 'production') {
      // Prefer project folder when developing
      if (fs.existsSync(path.join(ROOT, 'gestor')) && !isAsarPath(ROOT)) {
        store.ensureDir(projeto)
        return projeto
      }
    }
  }

  const candidatos = [docs, exeDir, projeto].filter(Boolean)
  for (const c of candidatos) {
    if (c && !isAsarPath(c)) {
      store.ensureDir(c)
      return c
    }
  }
  store.ensureDir(docs)
  return docs
}

function ensureAtualizacoesDir() {
  const dir = resolveAtualizacoesDir()
  store.ensureDir(dir)
  return dir
}

function appVersion() {
  try {
    const candidates = [
      path.join(__dirname, '..', 'package.json'),
      path.join(__dirname, '..', '..', 'package.json'),
    ]
    for (const file of candidates) {
      if (!fs.existsSync(file)) continue
      try {
        const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
        if (pkg.version) return pkg.version
      } catch (_) {}
    }
  } catch (_) {}
  return '0.0.0'
}

function parseVersion(v) {
  return String(v || '0')
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
}

function compareVersions(a, b) {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0
    const db = pb[i] || 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

function listPacotes() {
  const dir = ensureAtualizacoesDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(exe|eccupdate|zip|dmg)$/i.test(f))
    .map((f) => {
      const full = path.join(dir, f)
      const st = fs.statSync(full)
      const versionMatch = f.match(/(\d+\.\d+\.\d+)/)
      return {
        arquivo: f,
        caminho: full,
        tamanho: st.size,
        modificadoEm: st.mtime.toISOString(),
        versao: versionMatch ? versionMatch[1] : null,
        tipo: path.extname(f).toLowerCase().replace('.', ''),
      }
    })
    .sort((a, b) => {
      if (a.versao && b.versao) return compareVersions(b.versao, a.versao)
      return b.modificadoEm.localeCompare(a.modificadoEm)
    })
}

function statusAtualizacoes() {
  const atual = appVersion()
  const pasta = ensureAtualizacoesDir()
  const pacotes = listPacotes()
  const maisNovo = pacotes.find((p) => p.versao && compareVersions(p.versao, atual) > 0) || null
  return {
    versaoAtual: atual,
    pasta,
    pacotes,
    atualizacaoDisponivel: Boolean(maisNovo),
    pacoteSugerido: maisNovo,
  }
}

function resolvePacotePath(arquivoOuCaminho) {
  if (!arquivoOuCaminho) return null
  const raw = String(arquivoOuCaminho).trim().replace(/^["']|["']$/g, '')
  if (path.isAbsolute(raw) && fs.existsSync(raw)) return raw
  const naPasta = path.join(ensureAtualizacoesDir(), path.basename(raw))
  if (fs.existsSync(naPasta)) return naPasta
  return null
}

/**
 * Prepara arquivo para execução (copia .eccupdate → temp .exe se preciso)
 */
function prepararInstalador(caminho) {
  const full = resolvePacotePath(caminho)
  if (!full) throw new Error('Arquivo de atualização não encontrado. Selecione o caminho correto.')

  const ext = path.extname(full).toLowerCase()
  if (!['.exe', '.eccupdate', '.dmg'].includes(ext)) {
    throw new Error('Use um arquivo .exe, .eccupdate ou .dmg')
  }

  // .eccupdate = mesmo conteúdo do instalador; Windows precisa de .exe para executar
  if (ext === '.eccupdate') {
    const dest = path.join(os.tmpdir(), `ECC-Gestor-Update-${Date.now()}.exe`)
    fs.copyFileSync(full, dest)
    return dest
  }
  return full
}

function openInstaller(filePath) {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      const child = spawn(filePath, [], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      })
      child.on('error', reject)
      child.unref()
      resolve()
      return
    }
    const cmd = process.platform === 'darwin' ? `open "${filePath}"` : `xdg-open "${filePath}"`
    exec(cmd, (err) => (err ? reject(err) : resolve()))
  })
}

/**
 * Aplica atualização a partir de caminho absoluto ou nome na pasta ATUALIZACOES.
 * Abre o instalador e sinaliza para encerrar o app (necessário no Windows).
 */
async function aplicarAtualizacao(caminho) {
  const instalador = prepararInstalador(caminho)
  await openInstaller(instalador)
  return {
    ok: true,
    acao: 'abrir-instalador',
    arquivo: caminho,
    instalador,
    encerrarApp: true,
    mensagem:
      'O sistema está em processo de atualização. O ECC Gestor será fechado para o instalador poder substituir os arquivos. Ao terminar, abra novamente o aplicativo.',
  }
}

function encerrarProcesso() {
  try {
    // Electron (quando disponível)
    const electron = require('electron')
    if (electron?.app) {
      electron.app.quit()
      setTimeout(() => process.exit(0), 800)
      return
    }
  } catch (_) {}
  process.exit(0)
}

/** @deprecated use aplicarAtualizacao */
function receberAtualizacao(nomeArquivo) {
  const full = resolvePacotePath(nomeArquivo)
  if (!full) throw new Error('Pacote de atualização não encontrado')
  // sync wrapper
  const instalador = prepararInstalador(full)
  openFile(instalador)
  return {
    ok: true,
    acao: 'abrir-instalador',
    arquivo: full,
    mensagem: 'O sistema está em processo de atualização. Conclua o instalador.',
  }
}

function openFile(filePath) {
  if (process.platform === 'win32') {
    spawn(filePath, [], { detached: true, stdio: 'ignore' }).unref()
    return
  }
  const cmd =
    process.platform === 'darwin' ? `open "${filePath}"` : `xdg-open "${filePath}"`
  exec(cmd)
}

function openFolder(dir = ensureAtualizacoesDir()) {
  ensureAtualizacoesDir()
  const cmd =
    process.platform === 'win32'
      ? `explorer "${dir}"`
      : process.platform === 'darwin'
        ? `open "${dir}"`
        : `xdg-open "${dir}"`
  exec(cmd)
  return dir
}

module.exports = {
  ensureAtualizacoesDir,
  resolveAtualizacoesDir,
  appVersion,
  compareVersions,
  listPacotes,
  statusAtualizacoes,
  prepararInstalador,
  aplicarAtualizacao,
  receberAtualizacao,
  encerrarProcesso,
  openFolder,
  openInstaller,
  resolvePacotePath,
  isAsarPath,
}
