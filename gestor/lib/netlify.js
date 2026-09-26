/**
 * Integração Netlify — login (ticket OAuth), nomes, criar site, deploy
 * Ver memoria/Publicacao-Netlify-Desktop.md
 */
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const store = require('./store')

/** Client ID público do Netlify CLI (fluxo ticket — permite login Google/Gmail) */
const NETLIFY_CLIENT_ID =
  process.env.NETLIFY_OAUTH_CLIENT_ID ||
  'd6f37de6614df7ae58664cfca524744d73807a377f5ee71f1a254f78412e3750'

const API = 'https://api.netlify.com/api/v1'
const AUTH_FILE = path.join(store.DADOS_DIR, 'netlify-auth.json')

function openBrowser(url) {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`
  exec(cmd)
}

function getAuth() {
  return store.readJson(AUTH_FILE, null)
}

function saveAuth(data) {
  store.ensureDir(store.DADOS_DIR)
  store.writeJson(AUTH_FILE, data)
}

function clearAuth() {
  if (fs.existsSync(AUTH_FILE)) fs.unlinkSync(AUTH_FILE)
}

async function apiFetch(pathname, { method = 'GET', token, body, headers = {} } = {}) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  }
  if (body && !(body instanceof Buffer) && typeof body !== 'string') {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  } else if (body) {
    opts.body = body
  }
  const res = await fetch(`${API}${pathname}`, opts)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || text || res.statusText
    throw new Error(`Netlify: ${msg}`)
  }
  return data
}

async function createTicket() {
  const res = await fetch(`${API}/oauth/tickets?client_id=${encodeURIComponent(NETLIFY_CLIENT_ID)}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(
      `Não foi possível iniciar login Netlify (${res.status}). ${t || 'Verifique a conexão.'}`
    )
  }
  return res.json()
}

async function showTicket(ticketId) {
  const res = await fetch(`${API}/oauth/tickets/${ticketId}`)
  if (!res.ok) throw new Error('Ticket Netlify inválido ou expirado')
  return res.json()
}

async function exchangeTicket(ticketId) {
  const res = await fetch(`${API}/oauth/tickets/${ticketId}/exchange`, { method: 'POST' })
  if (!res.ok) throw new Error('Falha ao obter token Netlify')
  return res.json()
}

/**
 * Inicia login: abre o navegador (usuário pode usar Gmail/Google).
 * Retorna ticketId para o front fazer polling.
 */
async function startLogin() {
  const ticket = await createTicket()
  const url = `https://app.netlify.com/authorize?response_type=ticket&ticket=${ticket.id}`
  openBrowser(url)
  return { ticketId: ticket.id, authorizeUrl: url }
}

async function checkLoginTicket(ticketId) {
  const ticket = await showTicket(ticketId)
  if (!ticket.authorized) {
    return { pending: true }
  }
  const exchanged = await exchangeTicket(ticketId)
  const token = exchanged.access_token
  const user = await apiFetch('/user', { token })
  saveAuth({
    accessToken: token,
    email: user.email,
    fullName: user.full_name,
    connectedAt: new Date().toISOString(),
  })
  return { ok: true, pending: false, email: user.email, fullName: user.full_name }
}

/** @deprecated use checkLoginTicket in loop */
async function pollLogin(ticketId, { maxMs = 300000, intervalMs = 2000 } = {}) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const result = await checkLoginTicket(ticketId)
    if (!result.pending) return result
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Tempo esgotado aguardando autorização no Netlify. Tente novamente.')
}

function saveTokenManual(token) {
  if (!token || !String(token).trim()) throw new Error('Token vazio')
  return apiFetch('/user', { token: String(token).trim() }).then((user) => {
    saveAuth({
      accessToken: String(token).trim(),
      email: user.email,
      fullName: user.full_name,
      connectedAt: new Date().toISOString(),
    })
    return { ok: true, email: user.email, fullName: user.full_name }
  })
}

function requireToken() {
  const auth = getAuth()
  if (!auth?.accessToken) throw new Error('Conecte-se ao Netlify primeiro')
  return auth.accessToken
}

function sugerirNomesSite(nomeGrupo) {
  const base = store.slugify(nomeGrupo).replace(/^ecc-/, 'ecc-') || 'ecc-grupo'
  const variants = [
    base,
    base.startsWith('ecc-') ? base : `ecc-${base}`,
    `${base}-encontros`,
    `ecc-${base.replace(/^ecc-/, '')}-encontros`,
    `${base}-casais`,
  ]
  // únicos, máx 63 chars (limite subdomain)
  const seen = new Set()
  return variants
    .map((v) => v.slice(0, 63).replace(/-+$/g, ''))
    .filter((v) => {
      if (seen.has(v) || v.length < 3) return false
      seen.add(v)
      return true
    })
}

function normalizarNomeSite(nome) {
  return String(nome || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63)
}

function validarFormatoNomeSite(nome) {
  if (!nome || nome.length < 3) {
    return { ok: false, erro: 'Use no mínimo 3 caracteres (a-z, 0-9 e hífen).' }
  }
  if (nome.length > 63) {
    return { ok: false, erro: 'Máximo de 63 caracteres.' }
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(nome)) {
    return {
      ok: false,
      erro: 'Nome inválido. Use letras minúsculas, números e hífen (não comece/termine com hífen).',
    }
  }
  return { ok: true }
}

/**
 * Verifica se o nome pode ser usado no Netlify (subdomínio *.netlify.app).
 * - Se já for site da conta conectada → disponível para publicar/atualizar
 * - Se existir na internet como site Netlify → indisponível
 * - Caso contrário → disponível para criar
 */
async function checkNameAvailable(nameRaw) {
  const name = normalizarNomeSite(nameRaw)
  const formato = validarFormatoNomeSite(name)
  if (!formato.ok) {
    return {
      available: false,
      name,
      motivo: 'formato',
      mensagem: formato.erro,
      url: name ? `https://${name}.netlify.app` : null,
    }
  }

  let owned = false
  let token = null
  try {
    token = requireToken()
  } catch {
    token = null
  }

  if (token) {
    try {
      const sites = await apiFetch('/sites?per_page=100', { token })
      const mine = (sites || []).find((s) => s.name === name || s.subdomain === name)
      if (mine) {
        owned = true
        return {
          available: true,
          owned: true,
          name,
          siteId: mine.id,
          motivo: 'proprio',
          mensagem: `Este nome já é seu no Netlify. Pode publicar em https://${name}.netlify.app`,
          url: mine.ssl_url || mine.url || `https://${name}.netlify.app`,
        }
      }
    } catch (_) {
      /* segue para checagem pública */
    }
  }

  // Checagem pública: site existente responde diferente de "Site not found"
  try {
    const res = await fetch(`https://${name}.netlify.app/`, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'ECC-Gestor/1.0' },
    })
    const text = await res.text().catch(() => '')
    const notFound =
      res.status === 404 &&
      (/site not found/i.test(text) || /failed to find site/i.test(text) || /page not found/i.test(text))

    if (!notFound && res.status !== 404) {
      return {
        available: false,
        owned: false,
        name,
        motivo: 'ocupado',
        mensagem: `Nome indisponível. Já existe um site em https://${name}.netlify.app — escolha outro nome.`,
        url: `https://${name}.netlify.app`,
      }
    }

    // 404 "site not found" ou similar → livre
    if (notFound || res.status === 404) {
      return {
        available: true,
        owned: false,
        name,
        motivo: 'livre',
        mensagem: `Nome disponível! É possível criar https://${name}.netlify.app`,
        url: `https://${name}.netlify.app`,
      }
    }
  } catch (_) {
    // rede falhou — tenta via API se tiver token
  }

  if (token) {
    // Sem confirmação pública: assume disponível se não estiver na conta
    return {
      available: true,
      owned: false,
      name,
      motivo: 'livre-estimado',
      mensagem: `Nome parece disponível para criar https://${name}.netlify.app (confirme ao publicar).`,
      url: `https://${name}.netlify.app`,
    }
  }

  return {
    available: false,
    name,
    motivo: 'sem-conexao',
    mensagem: 'Conecte-se ao Netlify para verificar a disponibilidade deste nome.',
    url: `https://${name}.netlify.app`,
  }
}

async function createOrGetSite(nameRaw) {
  const name = normalizarNomeSite(nameRaw)
  const formato = validarFormatoNomeSite(name)
  if (!formato.ok) throw new Error(formato.erro)

  const check = await checkNameAvailable(name)
  if (!check.available && !check.owned) {
    throw new Error(check.mensagem || 'Nome de site indisponível no Netlify')
  }

  const token = requireToken()
  const sites = await apiFetch('/sites?per_page=100', { token })
  const existing = (sites || []).find((s) => s.name === name || s.subdomain === name)
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      url: existing.ssl_url || existing.url,
      adminUrl: existing.admin_url,
      created: false,
    }
  }
  try {
    const site = await apiFetch('/sites', {
      method: 'POST',
      token,
      body: { name },
    })
    return {
      id: site.id,
      name: site.name,
      url: site.ssl_url || site.url,
      adminUrl: site.admin_url,
      created: true,
    }
  } catch (err) {
    const msg = String(err.message || err)
    if (/unique|taken|exist|subdomain|already/i.test(msg)) {
      throw new Error(`Nome "${name}" indisponível no Netlify. Escolha outro.`)
    }
    throw err
  }
}

async function deployZip(siteId, zipBuffer) {
  const token = requireToken()
  const res = await fetch(`${API}/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/zip',
    },
    body: zipBuffer,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Falha no deploy Netlify')
  return {
    id: data.id,
    url: data.ssl_url || data.url,
    state: data.state,
    deployUrl: data.deploy_ssl_url || data.deploy_url,
  }
}

module.exports = {
  NETLIFY_CLIENT_ID,
  getAuth,
  clearAuth,
  startLogin,
  pollLogin,
  checkLoginTicket,
  saveTokenManual,
  sugerirNomesSite,
  checkNameAvailable,
  createOrGetSite,
  deployZip,
  requireToken,
  openBrowser,
  normalizarNomeSite,
  validarFormatoNomeSite,
}
