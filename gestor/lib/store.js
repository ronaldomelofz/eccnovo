/**
 * Persistência local — JSON + fotos por grupo
 * Ver memoria/Modelo-de-Dados.md
 */
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

const DADOS_DIR = path.join(__dirname, '..', 'dados')
const INDEX_FILE = path.join(DADOS_DIR, 'index.json')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

function slugify(nome) {
  return String(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || randomUUID().slice(0, 8)
}

function grupoDir(grupoId) {
  return path.join(DADOS_DIR, grupoId)
}

function grupoPath(grupoId) {
  return path.join(grupoDir(grupoId), 'grupo.json')
}

function encontrosPath(grupoId) {
  return path.join(grupoDir(grupoId), 'encontros.json')
}

function fotosDir(grupoId) {
  return path.join(grupoDir(grupoId), 'fotos')
}

function listGrupos() {
  ensureDir(DADOS_DIR)
  const index = readJson(INDEX_FILE, { grupos: [] })
  return index.grupos.map((g) => {
    const full = readJson(grupoPath(g.id), null)
    return full || g
  })
}

function getGrupo(grupoId) {
  const g = readJson(grupoPath(grupoId), null)
  if (!g) return null
  return g
}

function saveGrupo(grupo) {
  ensureDir(grupoDir(grupo.id))
  ensureDir(fotosDir(grupo.id))
  grupo.atualizadoEm = new Date().toISOString()
  writeJson(grupoPath(grupo.id), grupo)

  const index = readJson(INDEX_FILE, { grupos: [] })
  const i = index.grupos.findIndex((x) => x.id === grupo.id)
  const meta = { id: grupo.id, nome: grupo.nome }
  if (i >= 0) index.grupos[i] = meta
  else index.grupos.push(meta)
  writeJson(INDEX_FILE, index)
  return grupo
}

function createGrupo({ nome, periodoInicio, periodoFim }) {
  let id = slugify(nome)
  if (fs.existsSync(grupoPath(id))) id = `${id}-${randomUUID().slice(0, 4)}`
  const agora = new Date().toISOString()
  const grupo = {
    id,
    nome: String(nome).trim(),
    periodoInicio: periodoInicio || null,
    periodoFim: periodoFim || null,
    casais: [],
    criadoEm: agora,
    atualizadoEm: agora,
  }
  return saveGrupo(grupo)
}

function updateGrupo(grupoId, patch) {
  const grupo = getGrupo(grupoId)
  if (!grupo) return null
  if (patch.nome !== undefined) grupo.nome = String(patch.nome).trim()
  if (patch.periodoInicio !== undefined) grupo.periodoInicio = patch.periodoInicio
  if (patch.periodoFim !== undefined) grupo.periodoFim = patch.periodoFim
  if (Array.isArray(patch.casais)) {
    grupo.casais = patch.casais.map((c, idx) => ({
      id: c.id || randomUUID(),
      nome: String(c.nome).trim().toUpperCase(),
      ordem: c.ordem ?? idx + 1,
    }))
  }
  return saveGrupo(grupo)
}

function deleteGrupo(grupoId) {
  const dir = grupoDir(grupoId)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  const index = readJson(INDEX_FILE, { grupos: [] })
  index.grupos = index.grupos.filter((g) => g.id !== grupoId)
  writeJson(INDEX_FILE, index)
}

function listEncontros(grupoId) {
  return readJson(encontrosPath(grupoId), [])
}

function saveEncontros(grupoId, encontros) {
  writeJson(encontrosPath(grupoId), encontros)
  return encontros
}

function upsertEncontro(grupoId, encontro, fotoFile) {
  const lista = listEncontros(grupoId)
  const agora = new Date().toISOString()
  let item

  if (encontro.id) {
    const idx = lista.findIndex((e) => e.id === encontro.id)
    if (idx < 0) throw new Error('Encontro não encontrado')
    item = { ...lista[idx], ...encontro, atualizadoEm: agora }
    lista[idx] = item
  } else {
    item = {
      id: randomUUID(),
      grupoId,
      ordem: Number(encontro.ordem),
      data: encontro.data,
      anfitriao: String(encontro.anfitriao).trim().toUpperCase(),
      temario: Number(encontro.temario),
      numeroNoTemario: Number(encontro.numeroNoTemario),
      foto: null,
      semFoto: Boolean(encontro.semFoto),
      criadoEm: agora,
      atualizadoEm: agora,
    }
    lista.push(item)
  }

  item.ordem = Number(encontro.ordem ?? item.ordem)
  item.data = encontro.data ?? item.data
  item.anfitriao = String(encontro.anfitriao ?? item.anfitriao).trim().toUpperCase()
  item.temario = Number(encontro.temario ?? item.temario)
  item.numeroNoTemario = Number(encontro.numeroNoTemario ?? item.numeroNoTemario)
  item.semFoto = encontro.semFoto !== undefined ? Boolean(encontro.semFoto) : item.semFoto

  if (fotoFile) {
    ensureDir(fotosDir(grupoId))
    const ext = path.extname(fotoFile.originalname) || '.jpeg'
    const [y, m, d] = String(item.data).split('-')
    const nome = `ENCONTRO-${String(item.ordem).padStart(2, '0')}-${d}-${m}-${y}${ext}`
    const dest = path.join(fotosDir(grupoId), nome)
    fs.copyFileSync(fotoFile.path, dest)
    if (fs.existsSync(fotoFile.path)) fs.unlinkSync(fotoFile.path)
    item.foto = nome
    item.semFoto = false
  } else if (item.semFoto) {
    item.foto = null
  }

  lista.sort((a, b) => a.ordem - b.ordem || a.data.localeCompare(b.data))
  saveEncontros(grupoId, lista)
  return item
}

function deleteEncontro(grupoId, encontroId) {
  const lista = listEncontros(grupoId)
  const item = lista.find((e) => e.id === encontroId)
  if (!item) return false
  if (item.foto) {
    const f = path.join(fotosDir(grupoId), item.foto)
    if (fs.existsSync(f)) fs.unlinkSync(f)
  }
  saveEncontros(
    grupoId,
    lista.filter((e) => e.id !== encontroId)
  )
  return true
}

module.exports = {
  DADOS_DIR,
  listGrupos,
  getGrupo,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  listEncontros,
  upsertEncontro,
  deleteEncontro,
  fotosDir,
  ensureDir,
}
