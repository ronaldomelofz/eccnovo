/**
 * Comando ECC — edição do site Alimento do Amor (planilha + fotos + deploy)
 */
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { getSiteRoot, assertSiteRoot } = require('./lib/paths')
const { publicarSite } = require('./lib/deploy')
const { ORDEM_CASAIS } = require('./lib/casais')
const { parseAgendaExcel } = require('../scripts/lib/agenda')
const { upsertEncontroPlanilha, nomeArquivoFoto } = require('../scripts/lib/agenda-write')
const { FOTOS_DIR, AGENDA_XLSX } = require('../scripts/fontes')

const PORT = Number(process.env.COMANDO_PORT) || 3848

function resolveRoot() {
  const root = assertSiteRoot(getSiteRoot())
  process.env.ECC_SITE_ROOT = root
  process.chdir(root)
  return root
}

function startServer(port = PORT) {
  const root = resolveRoot()
  const app = express()
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

  app.use(express.json({ limit: '2mb' }))
  app.use(express.static(path.join(__dirname, 'public')))

  app.get('/api/status', (_req, res) => {
    const items = parseAgendaExcel(AGENDA_XLSX) || []
    const ultimo = items[items.length - 1]
    res.json({
      ok: true,
      siteRoot: root,
      totalEncontros: items.length,
      proximoNumero: ultimo ? ultimo.num + 1 : 1,
      ultimo,
      siteUrl: 'https://eccalimentodoamor.netlify.app',
    })
  })

  app.get('/api/casais', (_req, res) => {
    res.json({ casais: ORDEM_CASAIS })
  })

  app.get('/api/encontros', (_req, res) => {
    res.json({ encontros: parseAgendaExcel(AGENDA_XLSX) || [] })
  })

  app.get('/api/encontros/:num', (req, res) => {
    const num = Number(req.params.num)
    const item = (parseAgendaExcel(AGENDA_XLSX) || []).find((e) => e.num === num)
    if (!item) return res.status(404).json({ erro: 'Encontro não encontrado.' })
    res.json({ encontro: item })
  })

  app.post('/api/encontros/salvar', upload.single('foto'), (req, res) => {
    try {
      const body = req.body
      const num = Number(body.num)
      const ano = Number(body.ano) || (num >= 37 ? 2026 : num >= 25 ? 2025 : num >= 11 ? 2024 : 2023)
      const item = {
        num,
        mes: body.mes,
        dia: String(body.dia).padStart(2, '0'),
        anfitriao: body.anfitriao,
        descricao: body.descricao,
        observacao: body.observacao || '',
        fotoStatus: body.semFoto === 'true' || body.semFoto === true ? 'SEM FOTO' : 'FOTO',
      }

      if (!item.mes || !item.anfitriao || !item.descricao) {
        return res.status(400).json({ erro: 'Preencha mês, casal anfitrião e descrição.' })
      }

      const saved = upsertEncontroPlanilha(item, AGENDA_XLSX)
      let fotoArquivo = null

      if (req.file && item.fotoStatus !== 'SEM FOTO') {
        const ext = path.extname(req.file.originalname).replace(/^\./, '').toLowerCase() || 'jpeg'
        fotoArquivo = nomeArquivoFoto({ ...item, ano, ext: ext === 'jpg' ? 'jpeg' : ext })
        fs.writeFileSync(path.join(FOTOS_DIR, fotoArquivo), req.file.buffer)
      }

      res.json({ ok: true, encontro: saved, fotoArquivo })
    } catch (err) {
      res.status(500).json({ erro: err.message || String(err) })
    }
  })

  app.post('/api/deploy', async (req, res) => {
    try {
      const result = publicarSite(root, req.body?.mensagem)
      res.json(result)
    } catch (err) {
      res.status(500).json({ ok: false, erro: err.message || String(err) })
    }
  })

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Comando ECC — http://localhost:${port}`)
      console.log(`Projeto: ${root}`)
      resolve({ app, server, port })
    })
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Porta ${port} em uso. Feche outra instância do Comando ECC.`))
      } else reject(err)
    })
  })
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err.message || err)
    process.exit(1)
  })
}

module.exports = { startServer, PORT }
