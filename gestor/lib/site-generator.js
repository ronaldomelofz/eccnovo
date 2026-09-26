/**
 * Gera site estático do grupo (HTML + fotos + logo) para deploy Netlify
 */
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const store = require('./store')
const { calcularRodada, descricaoEncontro } = require('./rodada')

const MESES = [
  '',
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function parseData(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return { ano: y, mes: MESES[m] || String(m), dia: String(d).padStart(2, '0'), mesNum: m }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml(grupo, encontros, rodada) {
  const porAno = {}
  for (const e of encontros) {
    const { ano } = parseData(e.data)
    if (!porAno[ano]) porAno[ano] = []
    porAno[ano].push(e)
  }
  const anos = Object.keys(porAno)
    .map(Number)
    .sort((a, b) => b - a)

  const logoTag = grupo.logo
    ? `<img src="logo/${escapeHtml(grupo.logo)}" alt="Logo ${escapeHtml(grupo.nome)}" class="logo" />`
    : ''

  const tabsAnos = anos
    .map(
      (a, i) =>
        `<button type="button" class="tab-btn ${i === 0 ? 'active' : ''}" data-ano="${a}">${a}</button>`
    )
    .join('')

  const painéis = anos
    .map((ano, i) => {
      const cards = porAno[ano]
        .slice()
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((e) => {
          const { dia, mes } = parseData(e.data)
          const desc = descricaoEncontro(e)
          const foto = e.foto && !e.semFoto
            ? `<img src="fotos/${escapeHtml(e.foto)}" alt="${escapeHtml(desc)}" loading="lazy" />`
            : `<div class="sem-foto">SEM FOTO</div>`
          return `<article class="card">
          <div class="info">
            <h3>Encontro de ${escapeHtml(mes)}</h3>
            <p><strong>Data:</strong> ${escapeHtml(dia)} de ${escapeHtml(mes)} de ${ano}</p>
            <p><strong>Casal Anfitrião:</strong> ${escapeHtml(e.anfitriao)}</p>
            <p><strong>Descrição:</strong> ${escapeHtml(desc)}</p>
          </div>
          <div class="foto">${foto}</div>
        </article>`
        })
        .join('\n')
      return `<section class="ano-panel ${i === 0 ? 'active' : ''}" data-ano="${ano}">${cards}</section>`
    })
    .join('\n')

  const ordemLista = (rodada?.statusCasais || [])
    .map((c) => {
      const cls = c.jaFoiAnfitriao ? 'ok' : 'pendente'
      const mark = c.jaFoiAnfitriao ? '✓' : '!'
      return `<li class="${cls}"><span class="n">${c.ordem}</span><span class="m">${mark}</span><span>${escapeHtml(c.casal)}</span></li>`
    })
    .join('')

  const periodoTexto =
    (grupo.periodo && (grupo.periodo.texto || require('./periodo').formatPeriodoCabecalho(grupo.periodo))) ||
    (grupo.periodoInicio
      ? `Período: ${escapeHtml(grupo.periodoInicio)}${grupo.periodoFim ? ` → ${escapeHtml(grupo.periodoFim)}` : ''}`
      : '')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(grupo.nome)}</title>
  <style>
    :root { --bg:#1e293b; --bg2:#0f172a; --pink:#f472b6; --amber:#fbbf24; --text:#f1f5f9; --muted:#94a3b8; --border:#475569; }
    *{box-sizing:border-box} body{margin:0;font-family:Segoe UI,system-ui,sans-serif;background:linear-gradient(160deg,var(--bg2),var(--bg));color:var(--text);min-height:100vh}
    header{padding:2rem 1.5rem;text-align:center;background:linear-gradient(90deg,#1e293b,#334155)}
    .logo{max-height:140px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
    h1{margin:.75rem 0 .75rem;font-size:clamp(1.6rem,4vw,2.6rem)}
    .periodo-box{display:inline-block;background:#1e293b;border:2px solid var(--border);border-radius:.75rem;padding:.65rem 1.25rem;color:#e2e8f0;font-size:clamp(0.95rem,2.5vw,1.15rem);font-weight:500}
    .tabs{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin:1.5rem 0}
    .tab-btn{padding:.65rem 1.1rem;border-radius:.7rem;border:2px solid var(--border);background:#334155;color:var(--muted);cursor:pointer;font-weight:600}
    .tab-btn.active{background:#db2777;border-color:#f9a8d4;color:#fff}
    .ano-panel,.ordem-panel{display:none}.ano-panel.active,.ordem-panel.active{display:block}
    main{max-width:960px;margin:0 auto;padding:1.5rem}
    .card{display:flex;gap:1rem;justify-content:space-between;align-items:center;background:linear-gradient(90deg,#374151,#4b5563);border:1px solid var(--border);border-radius:.9rem;padding:1.1rem 1.25rem;margin-bottom:.9rem}
    .card img{width:128px;height:96px;object-fit:cover;border-radius:.5rem;cursor:pointer}
    .sem-foto{width:128px;height:96px;display:grid;place-items:center;border:2px dashed var(--border);border-radius:.5rem;color:var(--muted);font-size:.75rem}
    .info h3{margin:0 0 .4rem;color:var(--pink)}
    .resumo{background:#334155;border:1px solid var(--border);border-radius:.9rem;padding:1rem;text-align:center;margin-bottom:1rem}
    .resumo .d{color:var(--amber);font-weight:700;font-size:1.15rem}
    ul.ordem{list-style:none;padding:0;margin:0}
    ul.ordem li{display:flex;gap:.75rem;align-items:center;padding:.7rem;border-radius:.65rem;border:2px solid var(--border);margin-bottom:.4rem}
    ul.ordem li.ok{border-color:#166534;background:rgba(22,101,52,.25)}
    ul.ordem li.pendente{border-color:#991b1b;background:rgba(127,29,29,.35)}
    .n,.m{width:1.8rem;height:1.8rem;border-radius:999px;display:grid;place-items:center;font-weight:700;background:#0f172a}
    li.ok .m{background:#16a34a} li.pendente .m{background:#dc2626}
    footer{text-align:center;padding:2rem;color:var(--muted);font-size:.9rem}
    #modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:50;align-items:center;justify-content:center;flex-direction:column;padding:1rem}
    #modal.open{display:flex} #modal img{max-width:95vw;max-height:70vh;object-fit:contain;border-radius:.5rem}
    #modal .cap{color:#fff;text-align:center;margin-bottom:1rem}
    @media(max-width:700px){.card{flex-direction:column-reverse;text-align:center}}
  </style>
</head>
<body>
  <header>
    ${logoTag}
    <h1>${escapeHtml(grupo.nome)}</h1>
    ${periodoTexto ? `<div class="periodo-box">${escapeHtml(periodoTexto)}</div>` : ''}
  </header>
  <main>
    <div class="tabs">
      <button type="button" class="tab-btn" data-view="ordem">Ordem dos Casais</button>
      ${tabsAnos}
    </div>
    <section class="ordem-panel" id="panel-ordem">
      <div class="resumo">
        <p class="d">${rodada.completos} de ${rodada.totalCasais} casais já foram anfitriões nesta rodada</p>
        <p>${
          rodada.pendentes.length
            ? `Ainda faltam: ${rodada.pendentes.map((p) => escapeHtml(p.casal)).join(' · ')}`
            : 'Rodada completa!'
        }</p>
      </div>
      <ul class="ordem">${ordemLista}</ul>
    </section>
    ${painéis}
  </main>
  <footer>© ${new Date().getFullYear()} ${escapeHtml(grupo.nome)} · Encontros de Casais com Cristo</footer>
  <div id="modal"><div class="cap" id="cap"></div><img id="modalImg" alt="" /><button type="button" id="fechar" style="margin-top:1rem;padding:.5rem 1rem;border:0;border-radius:999px;background:#dc2626;color:#fff;font-size:1.2rem;cursor:pointer">✕</button></div>
  <script>
    const tabs=[...document.querySelectorAll('.tab-btn')];
    const anos=[...document.querySelectorAll('.ano-panel')];
    const ordem=document.getElementById('panel-ordem');
    tabs.forEach(btn=>btn.addEventListener('click',()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view=btn.dataset.view;
      const ano=btn.dataset.ano;
      ordem.classList.toggle('active', view==='ordem');
      anos.forEach(p=>p.classList.toggle('active', !view && p.dataset.ano===ano));
    }));
    const modal=document.getElementById('modal');
    document.querySelectorAll('.foto img').forEach(img=>{
      img.addEventListener('click',()=>{
        document.getElementById('modalImg').src=img.src;
        document.getElementById('cap').textContent=img.alt;
        modal.classList.add('open');
      });
    });
    document.getElementById('fechar').onclick=()=>modal.classList.remove('open');
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
  </script>
</body>
</html>`
}

function exportDir(grupoId) {
  return path.join(store.grupoDir(grupoId), 'export')
}

function generateSite(grupoId) {
  const grupo = store.getGrupo(grupoId)
  if (!grupo) throw new Error('Grupo não encontrado')
  const encontros = store.listEncontros(grupoId)
  const rodada = calcularRodada(grupo.casais || [], encontros)
  const out = exportDir(grupoId)

  if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true })
  store.ensureDir(out)
  store.ensureDir(path.join(out, 'fotos'))
  store.ensureDir(path.join(out, 'logo'))

  // fotos
  const srcFotos = store.fotosDir(grupoId)
  if (fs.existsSync(srcFotos)) {
    for (const f of fs.readdirSync(srcFotos)) {
      fs.copyFileSync(path.join(srcFotos, f), path.join(out, 'fotos', f))
    }
  }
  // logo
  if (grupo.logo) {
    const logoSrc = path.join(store.grupoDir(grupoId), grupo.logo)
    if (fs.existsSync(logoSrc)) {
      fs.copyFileSync(logoSrc, path.join(out, 'logo', grupo.logo))
    }
  }

  fs.writeFileSync(path.join(out, 'index.html'), buildHtml(grupo, encontros, rodada), 'utf8')
  fs.writeFileSync(
    path.join(out, '_headers'),
    `/*
  X-Frame-Options: DENY
`,
    'utf8'
  )

  return out
}

function zipExport(grupoId) {
  const out = generateSite(grupoId)
  return new Promise((resolve, reject) => {
    const chunks = []
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('data', (c) => chunks.push(c))
    archive.on('error', reject)
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.directory(out, false)
    archive.finalize()
  })
}

module.exports = { generateSite, zipExport, exportDir, buildHtml }
