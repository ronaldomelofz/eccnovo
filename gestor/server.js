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
const netlify = require('./lib/netlify')
const { generateSite, zipExport } = require('./lib/site-generator')

const PORT = Number(process.env.GESTOR_PORT) || 3847
const upload = multer({ dest: path.join(os.tmpdir(), 'ecc-gestor-uploads') })

function createApp() {
  const app = express()
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

  app.post('/api/grupos/:id/logo', upload.single('logo'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ erro: 'Envie um arquivo de logo' })
      const grupo = store.saveLogo(req.params.id, req.file)
      res.json(grupo)
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.get('/api/grupos/:id/logo', (req, res) => {
    const p = store.logoPath(req.params.id)
    if (!p) return res.status(404).end()
    res.sendFile(p)
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

  // —— Netlify ——
  app.get('/api/netlify/status', (_req, res) => {
    const auth = netlify.getAuth()
    res.json(
      auth
        ? { connected: true, email: auth.email, fullName: auth.fullName }
        : { connected: false }
    )
  })

  app.post('/api/netlify/login', async (_req, res) => {
    try {
      const data = await netlify.startLogin()
      res.json(data)
    } catch (err) {
      res.status(500).json({ erro: err.message })
    }
  })

  app.post('/api/netlify/login/poll', async (req, res) => {
    try {
      const { ticketId } = req.body || {}
      if (!ticketId) return res.status(400).json({ erro: 'ticketId obrigatório' })
      const data = await netlify.checkLoginTicket(ticketId)
      res.json(data)
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.post('/api/netlify/token', async (req, res) => {
    try {
      const data = await netlify.saveTokenManual(req.body?.token)
      res.json(data)
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.post('/api/netlify/logout', (_req, res) => {
    netlify.clearAuth()
    res.json({ ok: true })
  })

  app.get('/api/grupos/:id/netlify/sugestoes', (req, res) => {
    const grupo = store.getGrupo(req.params.id)
    if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
    res.json({ sugestoes: netlify.sugerirNomesSite(grupo.nome) })
  })

  app.post('/api/grupos/:id/netlify/publicar', async (req, res) => {
    try {
      const grupo = store.getGrupo(req.params.id)
      if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
      let nome = String(req.body?.nomeSite || '').trim().toLowerCase()
      nome = nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      if (!nome || nome.length < 3) {
        return res.status(400).json({ erro: 'Informe um nome de site válido (mín. 3 caracteres)' })
      }

      const site = await netlify.createOrGetSite(nome)
      const zip = await zipExport(grupo.id)
      const deploy = await netlify.deployZip(site.id, zip)

      const netlifyInfo = {
        siteId: site.id,
        siteName: site.name,
        url: deploy.url || site.url,
        adminUrl: site.adminUrl,
        lastDeployAt: new Date().toISOString(),
        lastDeployId: deploy.id,
      }
      store.updateGrupo(grupo.id, { netlify: netlifyInfo })

      // também gera pasta local para conferência
      const exportPath = generateSite(grupo.id)

      res.json({
        ok: true,
        site,
        deploy,
        url: netlifyInfo.url,
        exportPath,
        mensagem: site.created
          ? `Site criado e publicado: ${netlifyInfo.url}`
          : `Site atualizado: ${netlifyInfo.url}`,
      })
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.post('/api/grupos/:id/exportar', (req, res) => {
    try {
      const exportPath = generateSite(req.params.id)
      res.json({ ok: true, exportPath })
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })

  return app
}

function startServer(port = PORT) {
  store.ensureDir(store.DADOS_DIR)
  const app = createApp()
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log('')
      console.log('  ECC Gestor Local')
      console.log(`  → http://localhost:${port}`)
      console.log(`  Dados: ${store.DADOS_DIR}`)
      console.log('')
      resolve({ app, server, port })
    })
  })
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

module.exports = { createApp, startServer, PORT }
