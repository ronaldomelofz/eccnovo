/* ECC Gestor — UI do coordenador */
const state = {
  grupos: [],
  grupoId: localStorage.getItem('eccGrupoId') || null,
  grupo: null,
  encontros: [],
  rodada: null,
  proximo: null,
  casaisDraft: [],
  tab: 'config',
}

const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]

async function api(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.erro || res.statusText)
  return data
}

function fmtData(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function descricao(e) {
  return `${e.numeroNoTemario}º ENCONTRO ${e.temario}º TEMÁRIO`
}

async function carregarGrupos() {
  state.grupos = await api('/api/grupos')
  const sel = $('#selGrupo')
  sel.innerHTML = state.grupos.length
    ? state.grupos.map((g) => `<option value="${g.id}">${g.nome}</option>`).join('')
    : '<option value="">Nenhum grupo</option>'

  if (!state.grupoId || !state.grupos.find((g) => g.id === state.grupoId)) {
    state.grupoId = state.grupos[0]?.id || null
  }
  if (state.grupoId) sel.value = state.grupoId
  localStorage.setItem('eccGrupoId', state.grupoId || '')
}

async function carregarGrupo() {
  if (!state.grupoId) {
    state.grupo = null
    state.encontros = []
    state.rodada = null
    state.proximo = null
    state.casaisDraft = []
    render()
    return
  }
  const data = await api(`/api/grupos/${state.grupoId}`)
  state.grupo = data.grupo
  state.encontros = data.encontros
  state.rodada = data.rodada
  state.proximo = data.proximo
  state.casaisDraft = [...(data.grupo.casais || [])].sort((a, b) => a.ordem - b.ordem)
  render()
}

function setTab(tab) {
  state.tab = tab
  $$('#navTabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab))
  $$('.tab').forEach((el) => el.classList.toggle('active', el.id === `tab-${tab}`))
}

function render() {
  const g = state.grupo
  $('#tituloGrupo').textContent = g ? g.nome : 'Selecione ou crie um grupo'
  $('#subGrupo').textContent = g
    ? `Período: ${fmtData(g.periodoInicio)} → ${g.periodoFim ? fmtData(g.periodoFim) : 'em andamento'} · ${g.casais?.length || 0} casais · ${state.encontros.length} encontros`
    : ''

  if (g) {
    const form = $('#formGrupo')
    form.nome.value = g.nome || ''
    form.periodoInicio.value = g.periodoInicio || ''
    form.periodoFim.value = g.periodoFim || ''
  }

  renderCasais()
  renderSelectAnfitriao()
  renderEncontros()
  renderOrdem()
  renderAlertaProximo()
}

function renderCasais() {
  const ul = $('#listaCasais')
  ul.innerHTML = state.casaisDraft
    .map(
      (c, i) => `
    <li data-id="${c.id}">
      <span class="ord">${c.ordem}</span>
      <span class="nome">${c.nome}</span>
      <span class="move">
        <button type="button" class="btn ghost" data-up="${i}" title="Subir">↑</button>
        <button type="button" class="btn ghost" data-down="${i}" title="Descer">↓</button>
        <button type="button" class="btn danger" data-rm="${i}">Remover</button>
      </span>
    </li>`
    )
    .join('')
}

function renderSelectAnfitriao() {
  const sel = $('#formEncontro').anfitriao
  const casais = state.casaisDraft
  sel.innerHTML = casais.length
    ? casais.map((c) => `<option value="${c.nome}">${c.nome}</option>`).join('')
    : '<option value="">Cadastre casais na Configuração</option>'
}

function renderEncontros() {
  const box = $('#listaEncontros')
  if (!state.encontros.length) {
    box.innerHTML = '<p class="muted">Nenhum encontro cadastrado.</p>'
    return
  }
  const sorted = [...state.encontros].sort((a, b) => b.ordem - a.ordem)
  box.innerHTML = sorted
    .map((e) => {
      const thumb = e.foto
        ? `<img src="/api/grupos/${state.grupoId}/fotos/${encodeURIComponent(e.foto)}" alt="" />`
        : `<div class="sem">SEM FOTO</div>`
      return `
      <div class="encontro-item" data-id="${e.id}">
        ${thumb}
        <div>
          <strong>${descricao(e)}</strong>
          <div class="muted">${fmtData(e.data)} · Ordem ${e.ordem}</div>
          <div>${e.anfitriao}</div>
        </div>
        <div>
          <button type="button" class="btn ghost btn-edit" data-id="${e.id}">Editar</button>
          <button type="button" class="btn danger btn-del" data-id="${e.id}">Excluir</button>
        </div>
      </div>`
    })
    .join('')
}

function renderOrdem() {
  const r = state.rodada
  const p = state.proximo
  const resumo = $('#resumoRodada')
  const lista = $('#listaOrdem')
  const enRodada = $('#encontrosRodada')

  if (!r || !state.grupo) {
    resumo.innerHTML = '<p class="muted">Crie um grupo e cadastre casais para ver a rodada.</p>'
    lista.innerHTML = ''
    enRodada.innerHTML = ''
    return
  }

  resumo.innerHTML = `
    <p class="destaque">${r.completos} de ${r.totalCasais} casais já foram anfitriões nesta rodada</p>
    <p class="muted">${r.numeroInicioCiclo}º a ${r.numeroFimCiclo}º encontro no temário${r.temario ? ` · ${r.temario}º temário` : ''}</p>
    ${
      r.pendentes.length
        ? `<p><strong style="color:var(--red)">Ainda faltam:</strong> ${r.pendentes.map((x) => x.casal).join(' · ')}</p>`
        : `<p style="color:var(--green)">Rodada completa! Todos os casais já receberam.</p>`
    }
    ${p?.anfitriao ? `<p class="prox">Próximo sugerido: <strong>${p.anfitriao}</strong> (ordem ${p.ordem}, ${p.numeroNoTemario}º / ${p.temario}º temário)</p>` : ''}
    <p class="muted" style="margin-top:0.75rem">${p?.mensagem || ''}</p>
  `

  lista.innerHTML = r.statusCasais
    .map(
      (item) => `
    <div class="ordem-item ${item.jaFoiAnfitriao ? 'ok' : 'pendente'}">
      <span class="ord">${item.ordem}</span>
      <span class="badge ${item.jaFoiAnfitriao ? 'ok' : 'pendente'}">${item.jaFoiAnfitriao ? '✓' : '!'}</span>
      <div>
        <strong>${item.casal}</strong>
        <div class="muted">${
          item.jaFoiAnfitriao
            ? `${item.descricaoUltimoEncontro || ''} — ${fmtData(item.dataUltimoEncontro)}`
            : 'Aguardando vez na rodada atual'
        }</div>
      </div>
    </div>`
    )
    .join('')

  enRodada.innerHTML = r.encontrosNaRodada.length
    ? r.encontrosNaRodada
        .map(
          (e) =>
            `<li><span style="color:var(--pink)">${descricao(e)}</span> — ${fmtData(e.data)} (${e.anfitriao})</li>`
        )
        .join('')
    : '<li class="muted">Nenhum encontro nesta rodada ainda.</li>'
}

function renderAlertaProximo() {
  const el = $('#alertaProximo')
  const p = state.proximo
  if (!p || !state.grupo) {
    el.classList.add('hidden')
    return
  }
  el.classList.remove('hidden')
  el.classList.toggle('completa', !!p.rodadaCompleta)
  el.innerHTML = `<strong>Próximo encontro</strong><br>${p.mensagem}<br>
    Sugestão: <strong>${p.anfitriao || '—'}</strong> · ordem ${p.ordem} · ${p.numeroNoTemario}º encontro · ${p.temario}º temário`
}

function aplicarSugestao() {
  const p = state.proximo
  if (!p) return
  const form = $('#formEncontro')
  form.id.value = ''
  form.ordem.value = p.ordem
  form.temario.value = p.temario
  form.numeroNoTemario.value = p.numeroNoTemario
  if (p.anfitriao) form.anfitriao.value = p.anfitriao
  if (!form.data.value) form.data.value = new Date().toISOString().slice(0, 10)
}

function preencherEncontro(e) {
  const form = $('#formEncontro')
  form.id.value = e.id
  form.data.value = e.data
  form.anfitriao.value = e.anfitriao
  form.ordem.value = e.ordem
  form.temario.value = e.temario
  form.numeroNoTemario.value = e.numeroNoTemario
  form.semFoto.checked = !!e.semFoto
  form.foto.value = ''
  setTab('encontros')
  form.scrollIntoView({ behavior: 'smooth' })
}

function limparEncontro() {
  const form = $('#formEncontro')
  form.reset()
  form.id.value = ''
  aplicarSugestao()
}

function renumerarCasais() {
  state.casaisDraft.forEach((c, i) => {
    c.ordem = i + 1
  })
}

// —— Eventos ——
$('#selGrupo').addEventListener('change', async (e) => {
  state.grupoId = e.target.value || null
  localStorage.setItem('eccGrupoId', state.grupoId || '')
  await carregarGrupo()
})

$$('#navTabs button').forEach((b) =>
  b.addEventListener('click', () => setTab(b.dataset.tab))
)

$('#btnNovoGrupo').addEventListener('click', () => $('#dlgNovoGrupo').showModal())
$('#btnCancelarGrupo').addEventListener('click', () => $('#dlgNovoGrupo').close())

$('#formNovoGrupo').addEventListener('submit', async (ev) => {
  ev.preventDefault()
  const fd = new FormData(ev.target)
  const grupo = await api('/api/grupos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: fd.get('nome'),
      periodoInicio: fd.get('periodoInicio') || null,
    }),
  })
  $('#dlgNovoGrupo').close()
  ev.target.reset()
  state.grupoId = grupo.id
  await carregarGrupos()
  await carregarGrupo()
  setTab('config')
})

$('#formGrupo').addEventListener('submit', async (ev) => {
  ev.preventDefault()
  if (!state.grupoId) return alert('Crie um grupo primeiro')
  const fd = new FormData(ev.target)
  await api(`/api/grupos/${state.grupoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: fd.get('nome'),
      periodoInicio: fd.get('periodoInicio') || null,
      periodoFim: fd.get('periodoFim') || null,
    }),
  })
  await carregarGrupos()
  await carregarGrupo()
})

$('#formCasal').addEventListener('submit', (ev) => {
  ev.preventDefault()
  const nome = new FormData(ev.target).get('nome').toString().trim().toUpperCase()
  if (!nome) return
  state.casaisDraft.push({
    id: crypto.randomUUID(),
    nome,
    ordem: state.casaisDraft.length + 1,
  })
  ev.target.reset()
  renderCasais()
  renderSelectAnfitriao()
})

$('#listaCasais').addEventListener('click', (ev) => {
  const up = ev.target.closest('[data-up]')
  const down = ev.target.closest('[data-down]')
  const rm = ev.target.closest('[data-rm]')
  if (up) {
    const i = Number(up.dataset.up)
    if (i > 0) {
      ;[state.casaisDraft[i - 1], state.casaisDraft[i]] = [
        state.casaisDraft[i],
        state.casaisDraft[i - 1],
      ]
      renumerarCasais()
      renderCasais()
    }
  }
  if (down) {
    const i = Number(down.dataset.down)
    if (i < state.casaisDraft.length - 1) {
      ;[state.casaisDraft[i], state.casaisDraft[i + 1]] = [
        state.casaisDraft[i + 1],
        state.casaisDraft[i],
      ]
      renumerarCasais()
      renderCasais()
    }
  }
  if (rm) {
    state.casaisDraft.splice(Number(rm.dataset.rm), 1)
    renumerarCasais()
    renderCasais()
    renderSelectAnfitriao()
  }
})

$('#btnSalvarCasais').addEventListener('click', async () => {
  if (!state.grupoId) return alert('Crie um grupo primeiro')
  await api(`/api/grupos/${state.grupoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ casais: state.casaisDraft }),
  })
  await carregarGrupo()
  alert('Ordem dos casais salva.')
})

$('#btnUsarSugestao').addEventListener('click', aplicarSugestao)
$('#btnLimparEncontro').addEventListener('click', limparEncontro)

$('#formEncontro').addEventListener('submit', async (ev) => {
  ev.preventDefault()
  if (!state.grupoId) return alert('Crie um grupo primeiro')
  const form = ev.target
  const fd = new FormData(form)
  if (!fd.get('anfitriao')) return alert('Selecione o casal anfitrião')

  const res = await fetch(`/api/grupos/${state.grupoId}/encontros`, {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) return alert(data.erro || 'Erro ao salvar')

  state.rodada = data.rodada
  state.proximo = data.proximo
  await carregarGrupo()

  if (data.alertaRodadaCompleta) {
    alert(
      `Rodada completa!\n\n${data.proximo.mensagem}\n\nPróximo sugerido: ${data.proximo.anfitriao}`
    )
    setTab('ordem')
  } else {
    limparEncontro()
  }
})

$('#listaEncontros').addEventListener('click', async (ev) => {
  const edit = ev.target.closest('.btn-edit')
  const del = ev.target.closest('.btn-del')
  if (edit) {
    const e = state.encontros.find((x) => x.id === edit.dataset.id)
    if (e) preencherEncontro(e)
  }
  if (del) {
    if (!confirm('Excluir este encontro?')) return
    await api(`/api/grupos/${state.grupoId}/encontros/${del.dataset.id}`, { method: 'DELETE' })
    await carregarGrupo()
    limparEncontro()
  }
})

async function init() {
  await carregarGrupos()
  await carregarGrupo()
  if (state.proximo) aplicarSugestao()
  setTab(state.grupo ? 'encontros' : 'config')
}

init().catch((err) => {
  console.error(err)
  alert('Erro ao iniciar o gestor: ' + err.message)
})
