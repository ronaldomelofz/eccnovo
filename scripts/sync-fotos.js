const fs = require('fs')
const path = require('path')
const { FOTOS_DIR, PUBLIC_FOTOS_DIR } = require('./fontes')

function syncFotos() {
  if (!fs.existsSync(FOTOS_DIR)) {
    fs.mkdirSync(FOTOS_DIR, { recursive: true })
    console.log(`Pasta FOTOS/ criada em: ${FOTOS_DIR}`)
    console.log('Coloque aqui as fotos dos encontros (ENCONTRO-XX-DD-MM-AAAA.jpeg).')
    return 0
  }

  fs.mkdirSync(PUBLIC_FOTOS_DIR, { recursive: true })

  const files = fs.readdirSync(FOTOS_DIR).filter((f) => {
    if (f === 'Thumbs.db') return false
    const full = path.join(FOTOS_DIR, f)
    return fs.statSync(full).isFile() && /\.(jpe?g|png|gif|webp|mp3)$/i.test(f)
  })

  let copied = 0

  for (const file of files) {
    const src = path.join(FOTOS_DIR, file)
    const dest = path.join(PUBLIC_FOTOS_DIR, file)
    if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
      fs.copyFileSync(src, dest)
      copied++
      console.log('Copiado:', file)
    }
  }

  console.log(`✓ Fotos sincronizadas: FOTOS/ → public/FOTOS/ (${copied} atualizado(s))`)
  return copied
}

if (require.main === module) {
  syncFotos()
}

module.exports = { syncFotos }
