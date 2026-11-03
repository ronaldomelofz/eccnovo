const fs = require('fs')
const path = require('path')

function getSiteRoot() {
  if (process.env.ECC_SITE_ROOT) {
    return path.resolve(process.env.ECC_SITE_ROOT)
  }
  return path.resolve(__dirname, '..', '..')
}

function assertSiteRoot(root) {
  const xlsx = path.join(root, 'AGENDA ENCONTROS.xlsx')
  const fotos = path.join(root, 'FOTOS')
  if (!fs.existsSync(xlsx)) {
    throw new Error(
      `Projeto ECC não encontrado em ${root}. Execute o Comando na pasta COMANDO do repositório SITEECC (npm run comando).`
    )
  }
  if (!fs.existsSync(fotos)) fs.mkdirSync(fotos, { recursive: true })
  return root
}

module.exports = { getSiteRoot, assertSiteRoot }
