/**
 * Persistência local — JSON + fotos por grupo
 * Ver memoria/Modelo-de-Dados.md
 */
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

const { formatPeriodoCabecalho, periodoFromForm } = require('./periodo')

const DADOS_DIR =
  process.env.ECC_GESTOR_DADOS || path.join(__dirname, '..', 'dados')
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

function createGrupo({ nome, periodoInicio, periodoFim, periodo }) {
  let id = slugify(nome)
  if (fs.existsSync(grupoPath(id))) id = `${id}-${randomUUID().slice(0, 4)}`
  const agora = new Date().toISOString()
  const periodoObj = periodo
    ? {
        ...periodo,
        texto: formatPeriodoCabecalho(periodo) || periodo.texto || '',
      }
    : periodoFromForm({
        periodoNumero: null,
        periodoAno: null,
        periodoDias: '',
        periodoMes: '',
      })

  const grupo = {
    id,
    nome: String(nome).trim(),
    periodoInicio: periodoObj.periodoInicio || periodoInicio || null,
    periodoFim: periodoFim || null,
    periodo: periodoObj,
    casais: [],
    logo: null,
    netlify: null,
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
  if (patch.periodo !== undefined) {
    grupo.periodo = {
      ...patch.periodo,
      texto: formatPeriodoCabecalho(patch.periodo) || patch.periodo.texto || '',
    }
    if (grupo.periodo.periodoInicio) grupo.periodoInicio = grupo.periodo.periodoInicio
  }
  if (patch.logo !== undefined) grupo.logo = patch.logo
  if (patch.netlify !== undefined) grupo.netlify = patch.netlify
  if (Array.isArray(patch.casais)) {
    grupo.casais = patch.casais.map((c, idx) => ({
      id: c.id || randomUUID(),
      nome: String(c.nome).trim().toUpperCase(),
      ordem: c.ordem ?? idx + 1,
    }))
  }
  return saveGrupo(grupo)
}

function saveLogo(grupoId, file) {
  const grupo = getGrupo(grupoId)
  if (!grupo) throw new Error('Grupo não encontrado')
  ensureDir(grupoDir(grupoId))
  const ext = path.extname(file.originalname || '').toLowerCase() || '.jpeg'
  const nome = `logo${ext}`
  const dest = path.join(grupoDir(grupoId), nome)
  // remove logos anteriores
  for (const f of fs.readdirSync(grupoDir(grupoId))) {
    if (f.startsWith('logo.')) {
      try {
        fs.unlinkSync(path.join(grupoDir(grupoId), f))
      } catch (_) {}
    }
  }
  fs.copyFileSync(file.path, dest)
  if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
  grupo.logo = nome
  return saveGrupo(grupo)
}

function logoPath(grupoId) {
  const grupo = getGrupo(grupoId)
  if (!grupo?.logo) return null
  const p = path.join(grupoDir(grupoId), grupo.logo)
  return fs.existsSync(p) ? p : null
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

function reordenarEncontrosPorData(grupoId) {
  const lista = listEncontros(grupoId)
  lista.sort((a, b) => String(a.data).localeCompare(String(b.data)) || String(a.id).localeCompare(String(b.id)))
  lista.forEach((e, i) => {
    e.ordem = i + 1
  })
  // Nº no temário: sequência automática pela data, por temário
  const contagemPorTemario = {}
  lista.forEach((e) => {
    const t = Number(e.temario) || 1
    contagemPorTemario[t] = (contagemPorTemario[t] || 0) + 1
    e.numeroNoTemario = contagemPorTemario[t]
  })
  saveEncontros(grupoId, lista)
  return lista
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
      ordem: lista.length + 1,
      data: encontro.data,
      anfitriao: String(encontro.anfitriao).trim().toUpperCase(),
      temario: Number(encontro.temario),
      numeroNoTemario: 0, // definido em reordenarEncontrosPorData
      foto: null,
      semFoto: Boolean(encontro.semFoto),
      criadoEm: agora,
      atualizadoEm: agora,
    }
    lista.push(item)
  }

  item.data = encontro.data ?? item.data
  item.anfitriao = String(encontro.anfitriao ?? item.anfitriao).trim().toUpperCase()
  item.temario = Number(encontro.temario ?? item.temario)
  // numeroNoTemario é sempre recalculado pela data — ignora valor do cliente
  item.semFoto = encontro.semFoto !== undefined ? Boolean(encontro.semFoto) : item.semFoto

  // ordem provisória; será recalculada por data
  if (encontro.ordem !== undefined && encontro.ordem !== null && encontro.ordem !== '') {
    item.ordem = Number(encontro.ordem)
  }

  saveEncontros(grupoId, lista)

  // recalcular ordem global pela data
  const ordenados = reordenarEncontrosPorData(grupoId)
  item = ordenados.find((e) => e.id === item.id) || item

  if (fotoFile) {
    ensureDir(fotosDir(grupoId))
    const ext = path.extname(fotoFile.originalname) || '.jpeg'
    const [y, m, d] = String(item.data).split('-')
    const nome = `ENCONTRO-${String(item.ordem).padStart(2, '0')}-${d}-${m}-${y}${ext}`
    const dest = path.join(fotosDir(grupoId), nome)
    // remove foto antiga se nome diferente
    if (item.foto && item.foto !== nome) {
      const old = path.join(fotosDir(grupoId), item.foto)
      try {
        if (fs.existsSync(old)) fs.unlinkSync(old)
      } catch (_) {}
    }
    fs.copyFileSync(fotoFile.path, dest)
    if (fs.existsSync(fotoFile.path)) fs.unlinkSync(fotoFile.path)
    item.foto = nome
    item.semFoto = false
    const idx2 = ordenados.findIndex((e) => e.id === item.id)
    if (idx2 >= 0) ordenados[idx2] = item
    saveEncontros(grupoId, ordenados)
  } else if (item.semFoto) {
    if (item.foto) {
      const old = path.join(fotosDir(grupoId), item.foto)
      try {
        if (fs.existsSync(old)) fs.unlinkSync(old)
      } catch (_) {}
    }
    item.foto = null
    const idx2 = ordenados.findIndex((e) => e.id === item.id)
    if (idx2 >= 0) ordenados[idx2] = item
    saveEncontros(grupoId, ordenados)
  }

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
  reordenarEncontrosPorData(grupoId)
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
  reordenarEncontrosPorData,
  saveLogo,
  logoPath,
  grupoDir,
  fotosDir,
  slugify,
  ensureDir,
  readJson,
  writeJson,
}
