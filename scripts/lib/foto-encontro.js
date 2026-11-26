const fs = require('fs')
const path = require('path')
const { FOTOS_DIR } = require('../fontes')

function findPhotoFile(num, fotosDir = FOTOS_DIR) {
  if (!fs.existsSync(fotosDir)) return null
  const prefix = `ENCONTRO-${String(num).padStart(2, '0')}-`
  return (
    fs
      .readdirSync(fotosDir)
      .find((f) => f.toUpperCase().startsWith(prefix.toUpperCase())) || null
  )
}

/** Remove todas as fotos ENCONTRO-NN-* desse número em FOTOS/. */
function removePhotoFiles(num, fotosDir = FOTOS_DIR) {
  if (!fs.existsSync(fotosDir)) return []
  const prefix = `ENCONTRO-${String(num).padStart(2, '0')}-`
  const removed = []
  for (const f of fs.readdirSync(fotosDir)) {
    if (!f.toUpperCase().startsWith(prefix.toUpperCase())) continue
    fs.unlinkSync(path.join(fotosDir, f))
    removed.push(f)
  }
  return removed
}

module.exports = { findPhotoFile, removePhotoFiles }