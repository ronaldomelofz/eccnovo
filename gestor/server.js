/**
 * ECC Gestor Local — API + interface para coordenadores
 * Docs: memoria/
 */
const express = require('express')
const multer = require('multer')
const path = require('path')
const os = require('os')
const store = require('./lib/store')
const { calcularRodada, sugerirProximo, descricaoEncontro } = require('./lib/rodada')

const PORT = Number(process.env.GESTOR_PORT) || 3847
const app = express()
const upload = multer({ dest: path.join(os.tmpdir(), 'ecc-gestor-uploads') })

app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, nome: 'ECC Gestor Local', porta: PORT })
})

app.get('/api/grupos', (_req, res) => {
  res.json(store.listGrupos())
})

app.post('/api/grupos', (req, res) => {
  const { nome, periodoInicio, periodoFim } = req.body || {}
  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ erro: 'Nome do grupo é obrigatório' })
  }
  const grupo = store.createGrupo({ nome, periodoInicio, periodoFim })
  res.status(201).json(grupo)
})

app.get('/api/grupos/:id', (req, res) => {
  const grupo = store.getGrupo(req.params.id)
  if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
  const encontros = store.listEncontros(grupo.id)
  const rodada = calcularRodada(grupo.casais, encontros)
  const proximo = sugerirProximo(grupo.casais, encontros)
  res.json({ grupo, encontros, rodada, proximo })
})

app.put('/api/grupos/:id', (req, res) => {
  const grupo = store.updateGrupo(req.params.id, req.body || {})
  if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
  res.json(grupo)
})

app.delete('/api/grupos/:id', (req, res) => {
  store.deleteGrupo(req.params.id)
  res.json({ ok: true })
})

app.get('/api/grupos/:id/rodada', (req, res) => {
  const grupo = store.getGrupo(req.params.id)
  if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
  const encontros = store.listEncontros(grupo.id)
  res.json({
    rodada: calcularRodada(grupo.casais, encontros),
    proximo: sugerirProximo(grupo.casais, encontros),
  })
})

app.get('/api/grupos/:id/proximo', (req, res) => {
  const grupo = store.getGrupo(req.params.id)
  if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
  res.json(sugerirProximo(grupo.casais, store.listEncontros(grupo.id)))
})

app.post('/api/grupos/:id/encontros', upload.single('foto'), (req, res) => {
  const grupo = store.getGrupo(req.params.id)
  if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })

  try {
    const body = req.body || {}
    const encontro = store.upsertEncontro(
      grupo.id,
      {
        id: body.id || undefined,
        ordem: body.ordem,
        data: body.data,
        anfitriao: body.anfitriao,
        temario: body.temario,
        numeroNoTemario: body.numeroNoTemario,
        semFoto: body.semFoto === 'true' || body.semFoto === true,
      },
      req.file
    )

    const encontros = store.listEncontros(grupo.id)
    const rodada = calcularRodada(grupo.casais, encontros)
    const proximo = sugerirProximo(grupo.casais, encontros)

    res.status(201).json({
      encontro: { ...encontro, descricao: descricaoEncontro(encontro) },
      rodada,
      proximo,
      alertaRodadaCompleta: rodada.rodadaCompleta,
    })
  } catch (err) {
    res.status(400).json({ erro: err.message || String(err) })
  }
})

app.delete('/api/grupos/:id/encontros/:encontroId', (req, res) => {
  const ok = store.deleteEncontro(req.params.id, req.params.encontroId)
  if (!ok) return res.status(404).json({ erro: 'Encontro não encontrado' })
  const grupo = store.getGrupo(req.params.id)
  const encontros = store.listEncontros(req.params.id)
  res.json({
    ok: true,
    rodada: calcularRodada(grupo.casais, encontros),
    proximo: sugerirProximo(grupo.casais, encontros),
  })
})

app.get('/api/grupos/:id/fotos/:arquivo', (req, res) => {
  const file = path.join(store.fotosDir(req.params.id), path.basename(req.params.arquivo))
  res.sendFile(file, (err) => {
    if (err) res.status(404).end()
  })
})

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

store.ensureDir(store.DADOS_DIR)

app.listen(PORT, () => {
  console.log('')
  console.log('  ECC Gestor Local')
  console.log(`  → http://localhost:${PORT}`)
  console.log(`  Dados: ${store.DADOS_DIR}`)
  console.log('')
})
