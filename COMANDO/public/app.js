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
  let r
  try {
    r = await fetch(path, opts)
  } catch {
    throw new Error(
      'Sem resposta do servidor. Verifique se o Comando está rodando (npm run comando) e se a planilha não está aberta no Excel.'
    )
  }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.erro || r.statusText)
  return data
}

function ensureCasalOption(nome) {
  if (!nome) return
  const existe = [...anfSel.options].some((o) => o.value === nome)
  if (!existe) {
    const o = document.createElement('option')
    o.value = nome
    o.textContent = nome
    anfSel.appendChild(o)
  }
}

function setModoEdicao(num) {
  const editando = Boolean(num)
  $('#editBanner').hidden = !editando
  $('#btnApagar').hidden = !editando
  if (editando) $('#editBannerNum').textContent = String(num)
  else $('#fotoAtual').hidden = true
}

let deployPorPassos = true

async function carregarStatus() {
  const st = await api('/api/status')
  deployPorPassos = st.deployPorPassos !== false
  let linha = `${st.totalEncontros} encontros · projeto: ${st.siteRoot} · próximo nº sugerido: ${st.proximoNumero}`
  if (!deployPorPassos) {
    linha += ' · ⚠ Servidor desatualizado: feche o terminal e rode npm run comando'
  }
  $('#statusProjeto').textContent = linha
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
      <td class="row-actions">
        <button type="button" class="btn ghost small btn-edit" data-num="${e.num}">Editar</button>
        <button type="button" class="btn danger small btn-del" data-num="${e.num}">Apagar</button>
      </td>
    </tr>`
    )
    .join('')

  tbody.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => editar(Number(btn.dataset.num)))
  })
  tbody.querySelectorAll('.btn-del').forEach((btn) => {
    btn.addEventListener('click', () => apagar(Number(btn.dataset.num)))
  })
}

async function editar(num) {
  const { encontro: e, fotoArquivo } = await api(`/api/encontros/${num}`)
  $('#num').value = e.num
  $('#ano').value = e.ano
  $('#mes').value = e.mes
  $('#dia').value = Number.parseInt(e.dia, 10)
  ensureCasalOption(e.anfitriao)
  $('#anfitriao').value = e.anfitriao
  $('#descricao').value = e.descricao
  $('#observacao').value = e.observacao || ''
  $('#semFoto').checked = e.fotoStatus === 'SEM FOTO'
  $('#foto').value = ''
  const fotoHint = $('#fotoAtual')
  if (fotoArquivo) {
    fotoHint.hidden = false
    fotoHint.textContent = `Foto atual em FOTOS/: ${fotoArquivo} (escolha outro arquivo só se quiser trocar)`
  } else if (e.fotoStatus === 'SEM FOTO') {
    fotoHint.hidden = false
    fotoHint.textContent = 'Marcado como SEM FOTO na planilha.'
  } else {
    fotoHint.hidden = false
    fotoHint.textContent = 'Nenhuma foto em FOTOS/ para este número — envie um arquivo ao salvar.'
  }
  setModoEdicao(e.num)
  $('#msgSalvar').hidden = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function apagar(num) {
  const ok = window.confirm(
    `Apagar o encontro ${num} da planilha e remover foto(s) em FOTOS/?\n\nIsso não envia ao site até você publicar.`
  )
  if (!ok) return
  const log = $('#msgSalvar')
  log.hidden = false
  log.textContent = 'Apagando…'
  try {
    const data = await api(`/api/encontros/${num}?apagarFoto=1`, { method: 'DELETE' })
    log.textContent = data.fotosRemovidas?.length
      ? `Encontro ${num} removido. Fotos apagadas: ${data.fotosRemovidas.join(', ')}`
      : `Encontro ${num} removido da planilha.`
    form.reset()
    setModoEdicao(null)
    await carregarTabela()
    await carregarStatus()
  } catch (err) {
    log.textContent = err.message
  }
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault()
  const log = $('#msgSalvar')
  const btn = $('#btnSalvar')
  log.hidden = false
  log.textContent = 'Salvando…'
  btn.disabled = true
  try {
    const fd = new FormData(form)
    fd.set('semFoto', $('#semFoto').checked ? 'true' : 'false')
    const data = await api('/api/encontros/salvar', { method: 'POST', body: fd })
    log.textContent = data.fotoArquivo
      ? `Salvo. Foto: FOTOS/${data.fotoArquivo}`
      : 'Salvo na planilha.'
    setModoEdicao(Number($('#num').value))
    await carregarTabela()
    await carregarStatus()
  } catch (err) {
    log.textContent = err.message
  } finally {
    btn.disabled = false
  }
})

$('#btnApagar').addEventListener('click', () => {
  const num = Number($('#num').value)
  if (num) apagar(num)
})

$('#btnLimpar').addEventListener('click', () => {
  form.reset()
  setModoEdicao(null)
  $('#msgSalvar').hidden = true
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
  if (r.status === 404) {
    throw new Error(
      data.erro ||
        'API de publicação não encontrada. Pare o Comando no terminal (Ctrl+C) e inicie de novo: npm run comando'
    )
  }
  if (!r.ok) throw new Error(data.erro || r.statusText)
  return data
}

async function publicarDeployLegado(mensagem) {
  return api('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensagem: mensagem || undefined }),
  })
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
  const deployEmUmPasso = !deployPorPassos

    if (deployEmUmPasso) {
      passosMeta.forEach((p) => mark(p.id, 'active'))
      setDeployProgress(0, 1, 'Publicando (servidor em modo compatível)…', state)
      const data = await publicarDeployLegado(mensagem)
      nadaAlterado = Boolean(data.nadaAlterado)
      passosMeta.forEach((p) => {
        state[p.id] = nadaAlterado && (p.id === 'commit' || p.id === 'push') ? 'skip' : 'done'
        mark(p.id, state[p.id])
      })
      if (data.log) logs.push(data.log)
      done = passosMeta.length
    } else {
      for (const { id, label } of passosMeta) {
        if (nadaAlterado && (id === 'commit' || id === 'push')) {
          mark(id, 'skip')
          continue
        }
        mark(id, 'active')
        setDeployProgress(done, passosMeta.length, label, { ...state, [id]: 'active' })

        let data
        try {
          data = await apiDeployPasso(id, mensagem)
        } catch (err) {
          if (err.message.includes('404') || err.message.includes('não encontrada') || err.message === 'Not Found') {
            deployPorPassos = false
            const legado = await publicarDeployLegado(mensagem)
            nadaAlterado = Boolean(legado.nadaAlterado)
            if (legado.log) logs.push(legado.log)
            for (const p of passosMeta) {
              if (nadaAlterado && (p.id === 'commit' || p.id === 'push')) {
                mark(p.id, 'skip')
                state[p.id] = 'skip'
              } else {
                mark(p.id, 'done')
                state[p.id] = 'done'
              }
            }
            done = passosMeta.length
            break
          }
          throw err
        }

        if (data.log) logs.push(`=== ${label} ===\n${data.log}`)
        if (id === 'stage' && data.nadaAlterado) nadaAlterado = true

        state[id] = 'done'
        mark(id, 'done')
        done += 1
        setDeployProgress(done, passosMeta.length, id === 'push' || nadaAlterado ? 'Concluído' : '…', { ...state })
      }
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
