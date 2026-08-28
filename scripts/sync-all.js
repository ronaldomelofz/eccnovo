const { syncFotos } = require('./sync-fotos')
const { syncEncontros } = require('./sync-encontros')

console.log('=== Sincronizando fontes oficiais (FOTOS/ + planilha) ===\n')

syncFotos()
console.log('')
syncEncontros()

console.log('\n=== Sincronização concluída ===')
