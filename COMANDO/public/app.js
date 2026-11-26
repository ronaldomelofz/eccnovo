const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const $ = (s) => document.querySelector(s)
const form = $('#formEncontro')
const mesSel = $('#mes')
const anfSel = $('#anfitriao')

MESES.forEach((m) => {
  const o = document.createElement('option')
  o.value = m
  o.textContent = m
  mesSel.appendChild(o)
})

async function api(path, opts) {
  const r = await fetch(path, opts)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.erro || r.statusText)
  return data
}

async function carregarStatus() {
  const st = await api('/api/status')
  $('#statusProjeto').textContent = `${st.totalEncontros} encontros · projeto: ${st.siteRoot} · próximo nº sugerido: ${st.proximoNumero}`
  if (!$('#num').value) $('#num').value = st.proximoNumero
  if (!$('#ano').value && st.ultimo) $('#ano').value = st.ultimo.ano
}

async function carregarCasais() {
  const { casais } = await api('/api/casais')
  anfSel.innerHTML = casais.map((c) => `<option value="${c}">${c}</option>`).join('')
}

async function carregarTabela() {
  const { encontros } = await api('/api/encontros')
  const tbody = $('#tabelaEncontros')
  tbody.innerHTML = [...encontros]
    .reverse()
    .map(
      (e) => `
    <tr>
      <td>${e.num}</td>
      <td>${e.dia}/${e.mes}/${e.ano}</td>
      <td>${e.anfitriao}</td>
      <td>${e.descricao}${e.observacao ? `<small>${e.observacao}</small>` : ''}</td>
      <td><button type="button" class="btn ghost small btn-edit" data-num="${e.num}">Editar</button></td>
    </tr>`
    )
    .join('')

  tbody.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => editar(Number(btn.dataset.num)))
  })
}

async function editar(num) {
  const { encontro: e } = await api(`/api/encontros/${num}`)
  $('#num').value = e.num
  $('#ano').value = e.ano
  $('#mes').value = e.mes
  $('#dia').value = Number.parseInt(e.dia, 10)
  $('#anfitriao').value = e.anfitriao
  $('#descricao').value = e.descricao
  $('#observacao').value = e.observacao || ''
  $('#semFoto').checked = e.fotoStatus === 'SEM FOTO'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault()
  const log = $('#msgSalvar')
  log.hidden = false
  log.textContent = 'Salvando…'
  try {
    const fd = new FormData(form)
    fd.set('semFoto', $('#semFoto').checked ? 'true' : 'false')
    const data = await api('/api/encontros/salvar', { method: 'POST', body: fd })
    log.textContent = data.fotoArquivo
      ? `Salvo. Foto: FOTOS/${data.fotoArquivo}`
      : 'Salvo na planilha.'
    await carregarTabela()
    await carregarStatus()
  } catch (err) {
    log.textContent = err.message
  }
})

$('#btnLimpar').addEventListener('click', () => {
  form.reset()
  carregarStatus()
})

const deployUI = {
  wrap: $('#deployProgress'),
  label: $('#deployStepLabel'),
  percent: $('#deployPercent'),
  fill: $('#deployFill'),
  bar: $('#deployBar'),
  list: $('#deployStepsList'),
}

function setDeployProgress(doneCount, total, activeLabel, state) {
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  deployUI.fill.style.width = `${pct}%`
  deployUI.percent.textContent = `${pct}%`
  deployUI.bar.setAttribute('aria-valuenow', String(pct))
  if (activeLabel) deployUI.label.textContent = activeLabel
  if (state && deployUI.list) {
    deployUI.list.querySelectorAll('li').forEach((li) => {
      const id = li.dataset.id
      li.className = ''
      if (state[id] === 'done') li.classList.add('done')
      else if (state[id] === 'active') li.classList.add('active')
      else if (state[id] === 'fail') li.classList.add('fail')
      else if (state[id] === 'skip') li.classList.add('skip')
    })
  }
}

async function apiDeployPasso(passo, mensagem) {
  const r = await fetch('/api/deploy/passo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passo, mensagem: mensagem || undefined }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.erro || r.statusText)
  return data
}

$('#btnDeploy').addEventListener('click', async () => {
  const log = $('#msgDeploy')
  const mensagem = $('#msgCommit').value.trim()
  $('#btnDeploy').disabled = true
  log.hidden = true
  deployUI.wrap.hidden = false

  let passosMeta = []
  try {
    const meta = await api('/api/deploy/passos')
    passosMeta = meta.passos
  } catch {
    passosMeta = [
      { id: 'sync', label: 'Sincronizar' },
      { id: 'validate', label: 'Validar' },
      { id: 'stage', label: 'Git add' },
      { id: 'commit', label: 'Commit' },
      { id: 'push', label: 'Push' },
    ]
  }

  deployUI.list.innerHTML = passosMeta
    .map((p) => `<li data-id="${p.id}"><span>○</span> ${p.label}</li>`)
    .join('')

  const state = Object.fromEntries(passosMeta.map((p) => [p.id, 'pending']))
  const logs = []
  let done = 0
  let nadaAlterado = false

  const mark = (id, st) => {
    state[id] = st
    const li = deployUI.list.querySelector(`li[data-id="${id}"] span`)
    if (li) {
      li.textContent = st === 'done' ? '✓' : st === 'fail' ? '✗' : st === 'skip' ? '—' : '…'
    }
  }

  try {
    for (const { id, label } of passosMeta) {
      if (nadaAlterado && (id === 'commit' || id === 'push')) {
        mark(id, 'skip')
        continue
      }
      mark(id, 'active')
      setDeployProgress(done, passosMeta.length, label, { ...state, [id]: 'active' })

      const data = await apiDeployPasso(id, mensagem)
      if (data.log) logs.push(`=== ${label} ===\n${data.log}`)
      if (id === 'stage' && data.nadaAlterado) nadaAlterado = true

      state[id] = 'done'
      mark(id, 'done')
      done += 1
      setDeployProgress(done, passosMeta.length, id === 'push' || nadaAlterado ? 'Concluído' : '…', { ...state })
    }

    log.hidden = false
    log.textContent = nadaAlterado
      ? 'Nada novo para enviar — rode sync localmente; arquivos no Git já estavam atualizados.'
      : logs.join('\n\n') || 'Publicação concluída. O Netlify atualiza em alguns minutos.'
    deployUI.label.textContent = nadaAlterado ? 'Sem alterações no Git' : 'Publicado com sucesso'
    setDeployProgress(passosMeta.length, passosMeta.length, deployUI.label.textContent, state)
  } catch (err) {
    log.hidden = false
    log.textContent = err.message
    deployUI.label.textContent = 'Falha na publicação'
    const active = passosMeta.find((p) => state[p.id] === 'active')
    if (active) mark(active.id, 'fail')
    setDeployProgress(done, passosMeta.length, 'Falha', state)
  } finally {
    $('#btnDeploy').disabled = false
  }
})

;(async () => {
  try {
    await carregarCasais()
    await carregarStatus()
    await carregarTabela()
  } catch (err) {
    $('#statusProjeto').textContent = err.message
  }
})()
