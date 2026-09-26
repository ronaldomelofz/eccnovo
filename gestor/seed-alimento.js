/**
 * Importa o grupo Alimento do Amor a partir de app/data (encontros + casais).
 * Uso: npm run gestor:seed
 */
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')
const store = require('./lib/store')

const ROOT = path.join(__dirname, '..')
const ENCONTROS_TS = path.join(ROOT, 'app', 'data', 'encontros.ts')
const CASAIS_TS = path.join(ROOT, 'app', 'data', 'casais.ts')
const PUBLIC_FOTOS = path.join(ROOT, 'public', 'FOTOS')

const MESES = {
  Janeiro: '01',
  Fevereiro: '02',
  Março: '03',
  Abril: '04',
  Maio: '05',
  Junho: '06',
  Julho: '07',
  Agosto: '08',
  Setembro: '09',
  Outubro: '10',
  Novembro: '11',
  Dezembro: '12',
}

function parseCasais() {
  const text = fs.readFileSync(CASAIS_TS, 'utf8')
  return [...text.matchAll(/'([^']+)'/g)].map((m, i) => ({
    id: `c${i + 1}`,
    nome: m[1],
    ordem: i + 1,
  }))
}

function parseEncontrosTs() {
  const content = fs.readFileSync(ENCONTROS_TS, 'utf8')
  const blocks = [...content.matchAll(/\{[^}]+\}/g)].map((m) => m[0])
  return blocks
    .filter((b) => b.includes('ano:'))
    .map((b) => {
      const get = (key) => {
        const m = b.match(new RegExp(`${key}:\\s*"([^"]+)"`))
        return m ? m[1] : undefined
      }
      const getNum = (key) => {
        const m = b.match(new RegExp(`${key}:\\s*(\\d+)`))
        return m ? Number(m[1]) : undefined
      }
      const descricao = get('descricao') || ''
      const numTem = descricao.match(/(\d+)º ENCONTRO.*?(\d+)º TEMÁRIO/)
      const foto = get('foto')
      const mes = get('mes')
      const dia = get('dia')
      const ano = getNum('ano')
      const ordemMatch = foto && foto.match(/ENCONTRO-(\d+)/)
      return {
        ordem: ordemMatch ? Number(ordemMatch[1]) : null,
        data: `${ano}-${MESES[mes]}-${String(dia).padStart(2, '0')}`,
        anfitriao: get('anfitriao'),
        temario: numTem ? Number(numTem[2]) : 1,
        numeroNoTemario: numTem ? Number(numTem[1]) : 1,
        fotoArquivo: foto ? path.basename(foto) : null,
        semFoto: /semFoto:\s*true/.test(b),
      }
    })
    .filter((e) => e.anfitriao)
}

function main() {
  store.ensureDir(store.DADOS_DIR)
  store.deleteGrupo('alimento-do-amor')

  const casais = parseCasais()
  const rows = parseEncontrosTs()
  let seq = 0
  for (const r of rows) {
    seq += 1
    if (!r.ordem) r.ordem = seq
  }

  let grupo = store.createGrupo({
    nome: 'ECC Alimento do Amor',
    periodoInicio: '2023-04-28',
    periodoFim: null,
  })

  // Renomear pasta para id estável alimento-do-amor
  const createdId = grupo.id
  if (createdId !== 'alimento-do-amor') {
    const oldDir = path.join(store.DADOS_DIR, createdId)
    const newDir = path.join(store.DADOS_DIR, 'alimento-do-amor')
    if (fs.existsSync(newDir)) fs.rmSync(newDir, { recursive: true, force: true })
    fs.renameSync(oldDir, newDir)
    const index = JSON.parse(fs.readFileSync(path.join(store.DADOS_DIR, 'index.json'), 'utf8'))
    index.grupos = index.grupos
      .filter((g) => g.id !== createdId)
      .concat([{ id: 'alimento-do-amor', nome: 'ECC Alimento do Amor' }])
    fs.writeFileSync(path.join(store.DADOS_DIR, 'index.json'), JSON.stringify(index, null, 2))
    const gPath = path.join(newDir, 'grupo.json')
    const g = JSON.parse(fs.readFileSync(gPath, 'utf8'))
    g.id = 'alimento-do-amor'
    fs.writeFileSync(gPath, JSON.stringify(g, null, 2))
  }

  store.updateGrupo('alimento-do-amor', { casais })

  const fotosDest = path.join(store.DADOS_DIR, 'alimento-do-amor', 'fotos')
  store.ensureDir(fotosDest)

  for (const r of rows) {
    let fotoFile = null
    const tmp = path.join(require('os').tmpdir(), `seed-${r.ordem}-${Date.now()}`)
    if (r.fotoArquivo && !r.semFoto) {
      const src = path.join(PUBLIC_FOTOS, r.fotoArquivo)
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, tmp)
        fotoFile = {
          originalname: r.fotoArquivo,
          path: tmp,
        }
      }
    }
    store.upsertEncontro(
      'alimento-do-amor',
      {
        ordem: r.ordem,
        data: r.data,
        anfitriao: r.anfitriao,
        temario: r.temario,
        numeroNoTemario: r.numeroNoTemario,
        semFoto: r.semFoto || !fotoFile,
      },
      fotoFile
    )
  }

  console.log(`✓ Seed Alimento do Amor: ${casais.length} casais, ${rows.length} encontros`)
  console.log(`  Pasta: ${path.join(store.DADOS_DIR, 'alimento-do-amor')}`)
}

main()
