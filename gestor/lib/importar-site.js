/**
 * Importa grupo a partir de um site ECC já publicado (URL).
 * Suporta:
 * - Site Next.js (ex.: eccalimentodoamor.netlify.app) via chunk /_next/static/chunks/app/page-*.js
 * - Site estático gerado pelo próprio Gestor (HTML com cards)
 */
const fs = require('fs')
const path = require('path')
const os = require('os')
const { randomUUID } = require('crypto')
const store = require('./store')
const { periodoFromForm } = require('./periodo')

const MESES = {
  janeiro: '01',
  fevereiro: '02',
  março: '03',
  marco: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12',
}

function decodeJsString(s) {
  return String(s || '')
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function normalizarUrl(urlRaw) {
  let u = String(urlRaw || '').trim()
  if (!u) throw new Error('Informe o endereço do site')
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  const parsed = new URL(u)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('URL inválida — use http:// ou https://')
  }
  // remove path profundas; usa origem + /
  return `${parsed.origin}/`
}

function mesParaNum(mes) {
  const key = String(mes || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return MESES[key] || MESES[String(mes || '').toLowerCase()] || null
}

function parseDescricao(descricao) {
  const d = decodeJsString(descricao)
  const m = d.match(/(\d+)\s*º\s*ENCONTRO.*?(\d+)\s*º\s*TEM[ÁA]RIO/i)
  return {
    descricao: d,
    numeroNoTemario: m ? Number(m[1]) : 1,
    temario: m ? Number(m[2]) : 1,
  }
}

function parsePeriodoTexto(texto) {
  const t = decodeJsString(texto || '').trim()
  const m = t.match(/(\d+)\s*º\s*\/\s*(\d{4})\s*-\s*(.+)/i)
  if (!m) return null
  const resto = m[3].trim()
  const mesMatch = resto.match(/de\s+([A-Za-zçÇáéíóúÁÉÍÓÚãõÃÕ]+)\s+de\s+\d{4}/i)
  let dias = resto
  let mes = ''
  if (mesMatch) {
    mes = mesMatch[1]
    dias = resto.slice(0, mesMatch.index).replace(/\s+de\s*$/i, '').trim()
  }
  return {
    numero: Number(m[1]),
    ano: Number(m[2]),
    dias,
    mes,
    texto: t,
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'ECC-Gestor/1.0', Accept: 'text/html,*/*' },
  })
  if (!res.ok) throw new Error(`Não foi possível acessar ${url} (${res.status})`)
  return { text: await res.text(), finalUrl: res.url }
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'ECC-Gestor/1.0' },
  })
  if (!res.ok) return null
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

function extrairDoChunkNext(js) {
  const decoded = decodeJsString(js)
  const encontros = []
  const re =
    /\{ano:(\d+),mes:"([^"]+)",dia:"([^"]+)",anfitriao:"([^"]+)",(?:foto:"([^"]+)",)?(?:semFoto:(?:!0|true),)?descricao:"([^"]+)"\}/g
  let m
  while ((m = re.exec(decoded))) {
    const mes = m[2]
    const dia = m[3]
    const ano = Number(m[1])
    const mesNum = mesParaNum(mes)
    if (!mesNum) continue
    const desc = parseDescricao(m[6])
    const fotoPath = m[5] || null
    encontros.push({
      data: `${ano}-${mesNum}-${String(dia).padStart(2, '0')}`,
      anfitriao: m[4].toUpperCase(),
      temario: desc.temario,
      numeroNoTemario: desc.numeroNoTemario,
      descricao: desc.descricao,
      fotoRel: fotoPath,
      semFoto: !fotoPath,
    })
  }

  let casais = []
  const ordemMatch =
    decoded.match(/\["ROBERVAL E IARA"(?:,"[^"]+"){5,20}\]/) ||
    decoded.match(/\["[A-ZÀ-Ü][^"]* E [^"]+"(?:,"[^"]* E [^"]+"){3,30}\]/)
  if (ordemMatch) {
    try {
      const arr = JSON.parse(ordemMatch[0])
      casais = arr.map((nome, i) => ({
        id: `c${i + 1}`,
        nome: String(nome).toUpperCase(),
        ordem: i + 1,
      }))
    } catch (_) {}
  }
  if (!casais.length) {
    const seen = new Set()
    for (const e of encontros) {
      if (seen.has(e.anfitriao)) continue
      seen.add(e.anfitriao)
      casais.push({ id: `c${seen.size}`, nome: e.anfitriao, ordem: seen.size })
    }
  }

  return { encontros, casais }
}

function extrairDoHtmlGestor(html) {
  const encontros = []
  const cardRe =
    /<article class="card">([\s\S]*?)<\/article>/gi
  let m
  while ((m = cardRe.exec(html))) {
    const block = m[1]
    const dataM = block.match(
      /Data:<\/strong>\s*(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i
    )
    const anfM = block.match(/Casal Anfitri[aã]o:<\/strong>\s*([^<]+)/i)
    const descM = block.match(/Descri[cç][aã]o:<\/strong>\s*([^<]+)/i)
    const imgM = block.match(/src="([^"]+)"/i)
    if (!dataM || !anfM || !descM) continue
    const mesNum = mesParaNum(dataM[2])
    if (!mesNum) continue
    const desc = parseDescricao(descM[1].trim())
    const fotoRel = imgM && !/sem-foto/i.test(block) ? imgM[1] : null
    encontros.push({
      data: `${dataM[3]}-${mesNum}-${String(dataM[1]).padStart(2, '0')}`,
      anfitriao: anfM[1].trim().toUpperCase(),
      temario: desc.temario,
      numeroNoTemario: desc.numeroNoTemario,
      descricao: desc.descricao,
      fotoRel,
      semFoto: !fotoRel,
    })
  }

  const casais = []
  const ordemRe = /<ul class="ordem">([\s\S]*?)<\/ul>/i
  const ordemBlock = html.match(ordemRe)
  if (ordemBlock) {
    const items = [...ordemBlock[1].matchAll(/<li[^>]*>[\s\S]*?<span>([^<]+)<\/span>/gi)]
    items.forEach((it, i) => {
      casais.push({
        id: `c${i + 1}`,
        nome: it[1].trim().toUpperCase(),
        ordem: i + 1,
      })
    })
  }
  if (!casais.length) {
    const seen = new Set()
    for (const e of encontros) {
      if (seen.has(e.anfitriao)) continue
      seen.add(e.anfitriao)
      casais.push({ id: `c${seen.size}`, nome: e.anfitriao, ordem: seen.size })
    }
  }

  return { encontros, casais }
}

function dedupeEncontros(lista) {
  const seen = new Set()
  const out = []
  for (const e of lista) {
    const k = `${e.data}|${e.anfitriao}|${e.descricao}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  out.sort((a, b) => String(a.data).localeCompare(String(b.data)))
  return out
}

async function extrairDadosDoSite(urlRaw) {
  const base = normalizarUrl(urlRaw)
  const { text: html, finalUrl } = await fetchText(base)
  const origin = new URL(finalUrl).origin

  const h1 = (html.match(/<h1[^>]*>([^<]+)/i) || [])[1] || ''
  const periodoBox =
    (html.match(/periodo-box[^>]*>([^<]+)/i) ||
      html.match(/(\d+\s*º\s*\/\s*\d{4}\s*-\s*[^<]+)/i) ||
      [])[1] || ''
  const periodo = parsePeriodoTexto(periodoBox)
  const logoMatch = html.match(/\/FOTOS\/logo\.[a-z0-9]+/i) || html.match(/logo\/(logo\.[a-z0-9]+)/i)
  const logoRel = logoMatch ? logoMatch[0].replace(/^logo\//, '/logo/') : null

  let encontros = []
  let casais = []
  let fonte = 'html'

  // Next.js App Router — dados no chunk da página
  const pageChunks = [
    ...new Set([...html.matchAll(/\/_next\/static\/chunks\/app\/page-[^"']+\.js/g)].map((x) => x[0])),
  ]
  for (const chunkPath of pageChunks) {
    try {
      const { text: js } = await fetchText(`${origin}${chunkPath}`)
      const parsed = extrairDoChunkNext(js)
      if (parsed.encontros.length > encontros.length) {
        encontros = parsed.encontros
        casais = parsed.casais
        fonte = 'next-chunk'
      }
    } catch (_) {}
  }

  // Site estático do Gestor
  if (encontros.length < 3) {
    const parsed = extrairDoHtmlGestor(html)
    if (parsed.encontros.length > encontros.length) {
      encontros = parsed.encontros
      casais = parsed.casais
      fonte = 'gestor-html'
    }
  }

  // Fallback: cards Next SSR (só aba ativa)
  if (encontros.length < 1) {
    const parsed = extrairDoHtmlGestor(
      html.replace(/class="[^"]*card[^"]*"/gi, 'class="card"')
    )
    // try generic strong labels
    const generic = []
    const re =
      /Data:<\/strong>\s*(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})[\s\S]{0,400}?Casal Anfitri[aã]o:<\/strong>\s*([^<]+)[\s\S]{0,200}?Descri[cç][aã]o:<\/strong>\s*([^<]+)/gi
    let gm
    while ((gm = re.exec(html))) {
      const mesNum = mesParaNum(gm[2])
      if (!mesNum) continue
      const desc = parseDescricao(gm[5].trim())
      generic.push({
        data: `${gm[3]}-${mesNum}-${String(gm[1]).padStart(2, '0')}`,
        anfitriao: gm[4].trim().toUpperCase(),
        temario: desc.temario,
        numeroNoTemario: desc.numeroNoTemario,
        descricao: desc.descricao,
        fotoRel: null,
        semFoto: true,
      })
    }
    const merged = dedupeEncontros([...parsed.encontros, ...generic])
    if (merged.length > encontros.length) {
      encontros = merged
      casais = parsed.casais.length ? parsed.casais : casais
      fonte = 'html-ssr'
    }
  }

  encontros = dedupeEncontros(encontros)
  if (!encontros.length) {
    throw new Error(
      'Não encontrei encontros neste endereço. Confirme se é um site ECC (Netlify) gerado pelo Gestor ou o site Alimento do Amor.'
    )
  }

  const nome =
    decodeJsString(h1).trim() ||
    new URL(origin).hostname.replace(/\.netlify\.app$/i, '').replace(/-/g, ' ')

  return {
    origem: origin,
    url: base,
    fonte,
    nome: nome.toUpperCase().includes('ECC') ? nome : `ECC ${nome}`,
    periodo,
    logoRel: logoRel
      ? logoRel.startsWith('http')
        ? logoRel
        : `${origin}${logoRel.startsWith('/') ? '' : '/'}${logoRel}`
      : `${origin}/FOTOS/logo.jpeg`,
    casais,
    encontros,
  }
}

function absAssetUrl(origin, rel) {
  if (!rel) return null
  if (/^https?:\/\//i.test(rel)) return rel
  if (rel.startsWith('/')) return `${origin}${rel}`
  return `${origin}/${rel}`
}

/**
 * Importa para um novo grupo (ou substitui se substituirGrupoId for informado).
 */
async function importarGrupoDeUrl(urlRaw, { substituirGrupoId = null, nomeGrupo = null } = {}) {
  const dados = await extrairDadosDoSite(urlRaw)
  const passos = [`Fonte: ${dados.fonte}`, `Encontros lidos: ${dados.encontros.length}`, `Casais: ${dados.casais.length}`]

  if (substituirGrupoId) {
    store.deleteGrupo(substituirGrupoId)
    passos.push(`Grupo anterior removido (${substituirGrupoId})`)
  }

  const periodoObj = dados.periodo
    ? periodoFromForm({
        periodoNumero: dados.periodo.numero,
        periodoAno: dados.periodo.ano,
        periodoDias: dados.periodo.dias,
        periodoMes: dados.periodo.mes,
      })
    : periodoFromForm({})

  if (dados.periodo?.texto) periodoObj.texto = dados.periodo.texto

  let grupo = store.createGrupo({
    nome: nomeGrupo || dados.nome,
    periodo: periodoObj,
  })

  // Garante flag antes dos upserts (preserva nº do temário do site)
  grupo = store.updateGrupo(grupo.id, {
    casais: dados.casais,
    preservarNumerosTemario: true,
    netlify: {
      siteName: new URL(dados.origem).hostname.replace(/\.netlify\.app$/i, ''),
      url: dados.origem,
      importadoDe: dados.url,
      importadoEm: new Date().toISOString(),
    },
    importadoDe: dados.url,
  })

  // Logo
  try {
    const logoBuf = await fetchBuffer(dados.logoRel)
    if (logoBuf && logoBuf.length > 100) {
      const tmp = path.join(os.tmpdir(), `ecc-logo-${Date.now()}.jpeg`)
      fs.writeFileSync(tmp, logoBuf)
      store.saveLogo(grupo.id, { originalname: 'logo.jpeg', path: tmp })
      passos.push('Logo importada')
    }
  } catch (_) {
    passos.push('Logo não encontrada (opcional)')
  }

  let fotosOk = 0
  let fotosFalhou = 0
  for (const e of dados.encontros) {
    let fotoFile = null
    const fotoUrl = absAssetUrl(dados.origem, e.fotoRel)
    if (fotoUrl && !e.semFoto) {
      try {
        const buf = await fetchBuffer(fotoUrl)
        if (buf && buf.length > 100) {
          const ext = path.extname(new URL(fotoUrl).pathname) || '.jpeg'
          const tmp = path.join(os.tmpdir(), `ecc-foto-${Date.now()}-${randomUUID()}${ext}`)
          fs.writeFileSync(tmp, buf)
          fotoFile = {
            originalname: path.basename(new URL(fotoUrl).pathname) || `foto${ext}`,
            path: tmp,
          }
          fotosOk += 1
        } else {
          fotosFalhou += 1
        }
      } catch (_) {
        fotosFalhou += 1
      }
    }

    store.upsertEncontro(
      grupo.id,
      {
        data: e.data,
        anfitriao: e.anfitriao,
        temario: e.temario,
        numeroNoTemario: e.numeroNoTemario,
        semFoto: !fotoFile,
        _preservarNumero: true,
      },
      fotoFile
    )
  }

  // Restaura números oficiais do site (ordem global já recalculada)
  const lista = store.listEncontros(grupo.id)
  const byKey = new Map(dados.encontros.map((e) => [`${e.data}|${e.anfitriao}`, e]))
  for (const item of lista) {
    const src = byKey.get(`${item.data}|${item.anfitriao}`)
    if (src) {
      item.numeroNoTemario = src.numeroNoTemario
      item.temario = src.temario
    }
  }
  store.saveEncontros(grupo.id, lista)
  store.reordenarEncontrosPorData(grupo.id)

  passos.push(`Fotos baixadas: ${fotosOk}${fotosFalhou ? ` · falhas: ${fotosFalhou}` : ''}`)

  const finalGrupo = store.getGrupo(grupo.id)
  return {
    ok: true,
    grupo: finalGrupo,
    encontros: store.listEncontros(grupo.id).length,
    casais: (finalGrupo.casais || []).length,
    origem: dados.origem,
    fonte: dados.fonte,
    passos,
    mensagem: `Importado: ${finalGrupo.nome} — ${store.listEncontros(grupo.id).length} encontros, ${(finalGrupo.casais || []).length} casais.`,
  }
}

module.exports = {
  normalizarUrl,
  extrairDadosDoSite,
  importarGrupoDeUrl,
  decodeJsString,
}
