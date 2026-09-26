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
  let user
  let accountSlug = null
  let accountName = null
  try {
    const ready = await ensureAccountReady(token)
    user = ready.user
    accountSlug = ready.accountSlug
    accountName = ready.account.name || ready.account.account_name || accountSlug
  } catch (err) {
    // Salva token mesmo assim para o usuário completar cadastro e reconectar
    try {
      user = await apiFetch('/user', { token })
    } catch (_) {
      user = { email: null, full_name: null }
    }
    saveAuth({
      accessToken: token,
      email: user.email,
      fullName: user.full_name,
      connectedAt: new Date().toISOString(),
      incomplete: true,
    })
    return {
      ok: false,
      pending: false,
      incomplete: true,
      email: user.email,
      erro: err.message,
    }
  }
  saveAuth({
    accessToken: token,
    email: user.email,
    fullName: user.full_name,
    accountSlug,
    accountName,
    connectedAt: new Date().toISOString(),
    incomplete: false,
  })
  return { ok: true, pending: false, email: user.email, fullName: user.full_name, accountSlug }
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
  const t = String(token).trim()
  return ensureAccountReady(t).then(({ user, accountSlug, account }) => {
    saveAuth({
      accessToken: t,
      email: user.email,
      fullName: user.full_name,
      accountSlug,
      accountName: account.name || account.account_name || accountSlug,
      connectedAt: new Date().toISOString(),
      incomplete: false,
    })
    return { ok: true, email: user.email, fullName: user.full_name, accountSlug }
  })
}

function requireToken() {
  const auth = getAuth()
  if (!auth?.accessToken) throw new Error('Conecte-se ao Netlify primeiro')
  return auth.accessToken
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Garante que a conta Netlify está pronta (cadastro completo + time).
 * Contas novas param em app.netlify.com/signup-questions e não publicam.
 */
async function ensureAccountReady(token = null) {
  const t = token || requireToken()
  let user
  try {
    user = await apiFetch('/user', { token: t })
  } catch (err) {
    throw new Error(
      `Token Netlify inválido ou expirado. Conecte-se novamente. (${err.message})`
    )
  }

  let accounts = []
  try {
    accounts = (await apiFetch('/accounts', { token: t })) || []
  } catch (_) {
    accounts = []
  }

  if (!accounts.length) {
    openBrowser('https://app.netlify.com/signup-questions')
    throw new Error(
      'Conta Netlify incompleta. Complete o cadastro no navegador (nome e como pretende usar), depois clique em Conectar Netlify de novo.'
    )
  }

  // Preferir conta pessoal / primeira com permissão de criar sites
  const account =
    accounts.find((a) => a.type === 'personal' || a.roles?.includes?.('Owner')) || accounts[0]

  return {
    user,
    account,
    accountSlug: account.slug || account.account_slug || account.id,
    accounts,
  }
}

async function refreshAuthProfile() {
  const token = requireToken()
  const { user, account, accountSlug } = await ensureAccountReady(token)
  const prev = getAuth() || {}
  saveAuth({
    ...prev,
    accessToken: token,
    email: user.email,
    fullName: user.full_name,
    accountSlug,
    accountName: account.name || account.account_name || accountSlug,
    connectedAt: prev.connectedAt || new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
  })
  return getAuth()
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
  const { accountSlug } = await ensureAccountReady(token)

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

  const body = { name, force_ssl: true }
  let site
  try {
    // Preferir criar no time da conta (fluxo oficial Netlify)
    site = await apiFetch(`/${encodeURIComponent(accountSlug)}/sites`, {
      method: 'POST',
      token,
      body,
    })
  } catch (errTeam) {
    try {
      site = await apiFetch('/sites', { method: 'POST', token, body })
    } catch (err) {
      const msg = String(err.message || err)
      if (/unique|taken|exist|subdomain|already/i.test(msg)) {
        throw new Error(`Nome "${name}" indisponível no Netlify. Escolha outro.`)
      }
      if (/signup|onboard|account|team|permission|forbidden|401|403/i.test(msg)) {
        openBrowser('https://app.netlify.com/')
        throw new Error(
          `Não foi possível criar o site. Complete o cadastro no Netlify e tente de novo. (${msg})`
        )
      }
      throw new Error(`Falha ao criar site no Netlify: ${msg} (time: ${errTeam.message})`)
    }
  }

  return {
    id: site.id,
    name: site.name,
    url: site.ssl_url || site.url,
    adminUrl: site.admin_url,
    created: true,
  }
}

async function waitDeployReady(deployId, token, { maxMs = 180000, intervalMs = 2500 } = {}) {
  const start = Date.now()
  let last = null
  while (Date.now() - start < maxMs) {
    last = await apiFetch(`/deploys/${deployId}`, { token })
    const state = String(last.state || '').toLowerCase()
    if (state === 'ready') return last
    if (state === 'error' || state === 'failed') {
      const detail = last.error_message || last.failed_reason || last.state
      throw new Error(`Deploy falhou no Netlify: ${detail}`)
    }
    await sleep(intervalMs)
  }
  throw new Error(
    `Tempo esgotado aguardando o Netlify publicar (estado: ${last?.state || 'desconhecido'}). Abra o painel e confira o deploy.`
  )
}

async function deployZip(siteId, zipBuffer) {
  const token = requireToken()
  const body = Buffer.isBuffer(zipBuffer) ? zipBuffer : Buffer.from(zipBuffer)
  if (!body.length) throw new Error('Arquivo do site está vazio — não há o que publicar.')

  const res = await fetch(
    `${API}/sites/${siteId}/deploys?title=${encodeURIComponent('ECC Gestor')}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/zip',
        'Content-Length': String(body.length),
      },
      body,
    }
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || `Falha no deploy Netlify (${res.status})`)
  }
  if (!data.id) throw new Error('Netlify não retornou ID do deploy')

  const ready = await waitDeployReady(data.id, token)
  return {
    id: ready.id,
    url: ready.ssl_url || ready.url,
    state: ready.state,
    deployUrl: ready.deploy_ssl_url || ready.deploy_url,
    claimed: ready.claimed_at || null,
  }
}

/**
 * Confirma que a URL de produção responde com o site (não "Site not found").
 */
async function confirmarSiteNoAr(url, { maxMs = 60000, intervalMs = 2000 } = {}) {
  const start = Date.now()
  let lastStatus = null
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'ECC-Gestor/1.0', 'Cache-Control': 'no-cache' },
      })
      lastStatus = res.status
      const text = await res.text().catch(() => '')
      const notFound =
        res.status === 404 &&
        (/site not found/i.test(text) || /failed to find site/i.test(text))
      if (!notFound && res.status >= 200 && res.status < 400) {
        return { ok: true, status: res.status }
      }
    } catch (_) {
      /* tenta de novo */
    }
    await sleep(intervalMs)
  }
  return { ok: false, status: lastStatus }
}

/**
 * Fluxo completo automatizado: valida conta → cria/obtém site → deploy ZIP → aguarda ready → confirma URL.
 */
async function publicarSiteCompleto(nameRaw, zipBuffer) {
  const name = normalizarNomeSite(nameRaw)
  await ensureAccountReady()

  const passos = []
  const log = (msg) => {
    passos.push(msg)
    return msg
  }

  log('Validando conta Netlify…')
  const site = await createOrGetSite(name)
  log(site.created ? `Site criado: ${site.name}` : `Site existente: ${site.name}`)

  log('Enviando arquivos (ZIP)…')
  const deploy = await deployZip(site.id, zipBuffer)
  log(`Deploy concluído (${deploy.state})`)

  const token = requireToken()
  const siteFresh = await apiFetch(`/sites/${site.id}`, { token })
  const url =
    siteFresh.ssl_url ||
    siteFresh.url ||
    deploy.url ||
    `https://${siteFresh.name || site.name}.netlify.app`

  log('Confirmando site no ar…')
  const conf = await confirmarSiteNoAr(url)
  if (!conf.ok) {
    openBrowser(siteFresh.admin_url || site.adminUrl || 'https://app.netlify.com/')
    throw new Error(
      `O Netlify aceitou o deploy, mas ${url} ainda não responde. Abra o painel do site e confira o deploy.`
    )
  }

  return {
    site: {
      id: siteFresh.id || site.id,
      name: siteFresh.name || site.name,
      url,
      adminUrl: siteFresh.admin_url || site.adminUrl,
      created: site.created,
    },
    deploy: {
      id: deploy.id,
      state: deploy.state,
      url: deploy.url,
    },
    url,
    passos,
    mensagem: site.created
      ? `Site criado e publicado: ${url}`
      : `Site atualizado e no ar: ${url}`,
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
  waitDeployReady,
  confirmarSiteNoAr,
  publicarSiteCompleto,
  ensureAccountReady,
  refreshAuthProfile,
  requireToken,
  openBrowser,
  normalizarNomeSite,
  validarFormatoNomeSite,
}
