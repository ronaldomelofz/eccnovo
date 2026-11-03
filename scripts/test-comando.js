/**
 * Smoke test do Comando ECC (API local).
 */
const http = require('http')

const PORT = Number(process.env.COMANDO_TEST_PORT) || 3850

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${PORT}${path}`, (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) })
          } catch {
            reject(new Error(`Resposta inválida em ${path}`))
          }
        })
      })
      .on('error', reject)
  })
}

async function main() {
  const { startServer } = require('../COMANDO/server')
  const { server } = await startServer(PORT)

  try {
    const st = await get('/api/status')
    if (st.status !== 200 || !st.data.ok) throw new Error('status falhou')
    if (typeof st.data.totalEncontros !== 'number') throw new Error('totalEncontros')

    const cas = await get('/api/casais')
    if (!Array.isArray(cas.data.casais) || cas.data.casais.length < 10) {
      throw new Error('casais incompleto')
    }

    const enc = await get('/api/encontros')
    if (!Array.isArray(enc.data.encontros) || enc.data.encontros.length !== st.data.totalEncontros) {
      throw new Error('encontros inconsistente com status')
    }

    console.log(`OK Comando ECC — ${st.data.totalEncontros} encontros, porta ${PORT}`)
  } finally {
    server.close()
  }
}

main().catch((err) => {
  console.error('Falha test-comando:', err.message || err)
  process.exit(1)
})
