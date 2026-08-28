const fs = require('fs')
const path = require('path')

const rootFotos = path.join(__dirname, '..', 'FOTOS')
const publicFotos = path.join(__dirname, '..', 'public', 'FOTOS')

if (!fs.existsSync(rootFotos)) {
  console.log('Pasta FOTOS/ na raiz não existe. Nada a sincronizar.')
  process.exit(0)
}

fs.mkdirSync(publicFotos, { recursive: true })

const files = fs.readdirSync(rootFotos).filter((f) => {
  if (f === 'Thumbs.db') return false
  const full = path.join(rootFotos, f)
  return fs.statSync(full).isFile() && /\.(jpe?g|png|gif|webp|mp3)$/i.test(f)
})
let copied = 0

for (const file of files) {
  const src = path.join(rootFotos, file)
  const dest = path.join(publicFotos, file)
  if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
    fs.copyFileSync(src, dest)
    copied++
    console.log('Copiado:', file)
  }
}

console.log(`Sincronização concluída. ${copied} arquivo(s) atualizado(s).`)
