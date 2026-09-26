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

async function checkNameAvailable(name) {
  const token = requireToken()
  try {
    // tenta criar em dry-run? Netlify não tem endpoint dedicado — listamos sites
    const sites = await apiFetch('/sites?per_page=100', { token })
    const taken = (sites || []).some((s) => s.name === name || s.subdomain === name)
    return { available: !taken, name }
  } catch {
    return { available: true, name }
  }
}

async function createOrGetSite(name) {
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
}
