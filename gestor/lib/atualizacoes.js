/**
 * Pacotes de atualização do ECC Gestor
 * Pasta oficial: EXECUTAVEL/ATUALIZACOES
 */
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const store = require('./store')

const ROOT = path.resolve(__dirname, '..', '..')

function resolveAtualizacoesDir() {
  if (process.env.ECC_ATUALIZACOES_DIR) return process.env.ECC_ATUALIZACOES_DIR
  const candidatos = [
    path.join(ROOT, 'EXECUTAVEL', 'ATUALIZACOES'),
    path.join(path.dirname(process.execPath || ''), 'ATUALIZACOES'),
    path.join(process.cwd(), 'EXECUTAVEL', 'ATUALIZACOES'),
  ]
  for (const c of candidatos) {
    if (c && fs.existsSync(c)) return c
  }
  const fallback = path.join(ROOT, 'EXECUTAVEL', 'ATUALIZACOES')
  return fallback
}

const ATUALIZACOES_DIR = resolveAtualizacoesDir()

function ensureAtualizacoesDir() {
  const dir = resolveAtualizacoesDir()
  store.ensureDir(dir)
  return dir
}

function appVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
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
    .filter((f) => /\.(exe|zip|dmg)$/i.test(f))
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
  const pacotes = listPacotes()
  const maisNovo = pacotes.find((p) => p.versao && compareVersions(p.versao, atual) > 0) || null
  return {
    versaoAtual: atual,
    pasta: ensureAtualizacoesDir(),
    pacotes,
    atualizacaoDisponivel: Boolean(maisNovo),
    pacoteSugerido: maisNovo,
  }
}

/**
 * Recebe/aplica um pacote: .exe abre o instalador; .zip extrai manifesto (futuro).
 */
function receberAtualizacao(nomeArquivo) {
  const dir = ensureAtualizacoesDir()
  const base = path.basename(nomeArquivo || '')
  const full = path.join(dir, base)
  if (!base || !fs.existsSync(full)) {
    throw new Error('Pacote de atualização não encontrado em ATUALIZACOES')
  }
  const ext = path.extname(full).toLowerCase()

  if (ext === '.exe' || ext === '.dmg') {
    openFile(full)
    return {
      ok: true,
      acao: 'abrir-instalador',
      arquivo: full,
      mensagem: 'Instalador aberto. Conclua a instalação para atualizar o ECC Gestor.',
    }
  }

  if (ext === '.zip') {
    return {
      ok: true,
      acao: 'pacote-zip',
      arquivo: full,
      mensagem:
        'Pacote ZIP encontrado. Use o instalador .exe correspondente ou extraia manualmente. Preferência: abrir o Setup .exe na mesma pasta.',
    }
  }

  throw new Error('Tipo de pacote não suportado. Use .exe (Windows) ou .dmg (Mac).')
}

function openFile(filePath) {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${filePath}"`
      : process.platform === 'darwin'
        ? `open "${filePath}"`
        : `xdg-open "${filePath}"`
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
  ATUALIZACOES_DIR,
  ensureAtualizacoesDir,
  appVersion,
  compareVersions,
  listPacotes,
  statusAtualizacoes,
  receberAtualizacao,
  openFolder,
}
