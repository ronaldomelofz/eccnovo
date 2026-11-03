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

$('#btnDeploy').addEventListener('click', async () => {
  const log = $('#msgDeploy')
  log.hidden = false
  log.textContent = 'Publicando… (sync, validate, commit, push)'
  $('#btnDeploy').disabled = true
  try {
    const mensagem = $('#msgCommit').value.trim()
    const data = await api('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: mensagem || undefined }),
    })
    log.textContent = data.nadaAlterado
      ? 'Nada novo para enviar — planilha e site já estavam iguais.'
      : data.log || 'Deploy concluído.'
  } catch (err) {
    log.textContent = err.message
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
