/**
 * ECC Gestor Local — API + interface para coordenadores
 * Docs: memoria/
 */
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
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
    const body = req.body || {}
    if (!body.nome || !String(body.nome).trim()) {
      return res.status(400).json({ erro: 'Nome do grupo é obrigatório' })
    }
    const { periodoFromForm } = require('./lib/periodo')
    const periodo = body.periodo || periodoFromForm(body)
    const grupo = store.createGrupo({
      nome: body.nome,
      periodoInicio: body.periodoInicio,
      periodoFim: body.periodoFim,
      periodo,
    })
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
    const body = req.body || {}
    const { periodoFromForm } = require('./lib/periodo')
    if (
      body.periodoNumero !== undefined ||
      body.periodoAno !== undefined ||
      body.periodoDias !== undefined ||
      body.periodoMes !== undefined ||
      body.periodoTextoManual !== undefined
    ) {
      body.periodo = periodoFromForm(body)
    }
    const grupo = store.updateGrupo(req.params.id, body)
    if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
    res.json(grupo)
  })

  app.delete('/api/grupos/:id', (req, res) => {
    store.deleteGrupo(req.params.id)
    res.json({ ok: true })
  })

  // —— Importar site existente ——
  app.post('/api/importar-site/preview', async (req, res) => {
    try {
      const importar = require('./lib/importar-site')
      const dados = await importar.extrairDadosDoSite(req.body?.url)
      res.json({
        ok: true,
        nome: dados.nome,
        origem: dados.origem,
        fonte: dados.fonte,
        periodo: dados.periodo,
        encontros: dados.encontros.length,
        casais: dados.casais.length,
        amostra: dados.encontros.slice(0, 3).map((e) => ({
          data: e.data,
          anfitriao: e.anfitriao,
          descricao: e.descricao,
        })),
      })
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.post('/api/importar-site', async (req, res) => {
    try {
      const importar = require('./lib/importar-site')
      const resultado = await importar.importarGrupoDeUrl(req.body?.url, {
        substituirGrupoId: req.body?.substituirGrupoId || null,
        nomeGrupo: req.body?.nomeGrupo || null,
      })
      res.status(201).json(resultado)
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
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

  // ordem auto no upsert
  app.post('/api/grupos/:id/encontros', upload.single('foto'), (req, res) => {
    const grupo = store.getGrupo(req.params.id)
    if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })

    try {
      const body = req.body || {}
      const encontro = store.upsertEncontro(
        grupo.id,
        {
          id: body.id || undefined,
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
  app.get('/api/netlify/status', async (_req, res) => {
    const auth = netlify.getAuth()
    if (!auth?.accessToken) {
      return res.json({ connected: false })
    }
    try {
      await netlify.ensureAccountReady()
      const fresh = netlify.getAuth()
      res.json({
        connected: true,
        email: fresh?.email || auth.email,
        fullName: fresh?.fullName || auth.fullName,
        accountSlug: fresh?.accountSlug || auth.accountSlug,
        incomplete: false,
      })
    } catch (err) {
      res.json({
        connected: true,
        email: auth.email,
        fullName: auth.fullName,
        incomplete: true,
        aviso: err.message,
      })
    }
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

  app.post('/api/netlify/verificar-nome', async (req, res) => {
    try {
      const nome = req.body?.nome || req.body?.nomeSite || ''
      const resultado = await netlify.checkNameAvailable(nome)
      res.json(resultado)
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.post('/api/grupos/:id/netlify/publicar', async (req, res) => {
    try {
      const grupo = store.getGrupo(req.params.id)
      if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' })
      let nome = String(req.body?.nomeSite || '').trim().toLowerCase()
      nome = netlify.normalizarNomeSite(nome)
      const formato = netlify.validarFormatoNomeSite(nome)
      if (!formato.ok) {
        return res.status(400).json({ erro: formato.erro })
      }

      // Garante conta completa antes de gerar ZIP (falha rápida se cadastro incompleto)
      await netlify.ensureAccountReady()

      const { buffer: zip, exportPath } = await zipExport(grupo.id)
      const resultado = await netlify.publicarSiteCompleto(nome, zip)

      const netlifyInfo = {
        siteId: resultado.site.id,
        siteName: resultado.site.name,
        url: resultado.url,
        adminUrl: resultado.site.adminUrl,
        lastDeployAt: new Date().toISOString(),
        lastDeployId: resultado.deploy.id,
      }
      store.updateGrupo(grupo.id, { netlify: netlifyInfo })

      try {
        netlify.openBrowser(resultado.url)
      } catch (_) {}

      res.json({
        ok: true,
        site: resultado.site,
        deploy: resultado.deploy,
        url: resultado.url,
        exportPath,
        passos: resultado.passos,
        mensagem: resultado.mensagem,
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

  // —— Atualizações ——
  app.get('/api/atualizacoes/status', (_req, res) => {
    try {
      const atualizacoes = require('./lib/atualizacoes')
      res.json(atualizacoes.statusAtualizacoes())
    } catch (err) {
      res.status(500).json({ erro: err.message })
    }
  })

  app.post('/api/atualizacoes/aplicar', async (req, res) => {
    try {
      const atualizacoes = require('./lib/atualizacoes')
      const caminho = req.body?.caminho || req.body?.arquivo
      const resultado = await atualizacoes.aplicarAtualizacao(caminho)
      res.json(resultado)
      if (resultado.encerrarApp) {
        setTimeout(() => atualizacoes.encerrarProcesso(), 1200)
      }
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.post('/api/atualizacoes/receber', async (req, res) => {
    try {
      const atualizacoes = require('./lib/atualizacoes')
      const caminho = req.body?.caminho || req.body?.arquivo
      const resultado = await atualizacoes.aplicarAtualizacao(caminho)
      res.json(resultado)
      if (resultado.encerrarApp) {
        setTimeout(() => atualizacoes.encerrarProcesso(), 1200)
      }
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.post('/api/atualizacoes/upload', upload.single('pacote'), async (req, res) => {
    try {
      const atualizacoes = require('./lib/atualizacoes')
      if (!req.file) return res.status(400).json({ erro: 'Selecione um arquivo de atualização' })
      const pasta = atualizacoes.ensureAtualizacoesDir()
      const nome = req.file.originalname || `update-${Date.now()}.exe`
      const dest = path.join(pasta, path.basename(nome))
      fs.copyFileSync(req.file.path, dest)
      try {
        fs.unlinkSync(req.file.path)
      } catch (_) {}
      const resultado = await atualizacoes.aplicarAtualizacao(dest)
      res.json({ ...resultado, salvoEm: dest })
      if (resultado.encerrarApp) {
        setTimeout(() => atualizacoes.encerrarProcesso(), 1200)
      }
    } catch (err) {
      res.status(400).json({ erro: err.message })
    }
  })

  app.get('/api/atualizacoes/abrir-pasta', (_req, res) => {
    try {
      const atualizacoes = require('./lib/atualizacoes')
      const pasta = atualizacoes.openFolder()
      res.json({ ok: true, pasta })
    } catch (err) {
      res.status(500).json({ erro: err.message })
    }
  })

  // página de atualização (rota explícita antes do *)
  app.get('/atualizando.html', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'atualizando.html'))
  })

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })

  return app
}

function startServer(port = PORT) {
  store.ensureDir(store.DADOS_DIR)
  const app = createApp()
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log('')
      console.log('  ECC Gestor Local')
      console.log(`  → http://localhost:${port}`)
      console.log(`  Dados: ${store.DADOS_DIR}`)
      console.log('')
      resolve({ app, server, port })
    })
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `A porta ${port} já está em uso. Feche o outro ECC Gestor (ou o terminal com npm run gestor) e tente de novo.`
          )
        )
      } else {
        reject(err)
      }
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
