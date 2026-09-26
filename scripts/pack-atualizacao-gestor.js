/**
 * Empacota atualização do Gestor em EXECUTAVEL/ATUALIZACOES
 * Gera .exe (instalador) e .eccupdate (mesmo arquivo — duplo clique no app)
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const OUT = path.join(ROOT, 'EXECUTAVEL', 'ATUALIZACOES')
const DIST = path.join(ROOT, 'dist-gestor')
const EXEC = path.join(ROOT, 'EXECUTAVEL')

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function main() {
  ensure(OUT)
  const version = PKG.version
  const nomeSetup = `ECC-Gestor-Setup-${version}.exe`
  const nomeUpdate = `ECC-Gestor-Update-${version}.eccupdate`

  const candidatos = [
    path.join(DIST, nomeSetup),
    path.join(EXEC, nomeSetup),
  ]

  let origem = candidatos.find((p) => fs.existsSync(p))
  if (!origem) {
    const list = []
    for (const dir of [DIST, EXEC]) {
      if (!fs.existsSync(dir)) continue
      for (const f of fs.readdirSync(dir)) {
        if (/ECC-Gestor-Setup-.*\.exe$/i.test(f)) list.push(path.join(dir, f))
      }
    }
    list.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    origem = list[0]
  }

  if (!origem) {
    console.error('Nenhum instalador encontrado. Rode antes: npm run gestor:dist:win')
    process.exit(1)
  }

  const destExe = path.join(OUT, nomeSetup)
  const destEcc = path.join(OUT, nomeUpdate)
  fs.copyFileSync(origem, destExe)
  fs.copyFileSync(origem, destEcc)
  fs.copyFileSync(origem, path.join(EXEC, nomeSetup))

  const manifesto = {
    produto: 'ECC Gestor',
    versao: version,
    geradoEm: new Date().toISOString(),
    arquivoSetup: path.basename(destExe),
    arquivoDuploClique: path.basename(destEcc),
    instrucao:
      'No app: Localizar arquivo → Atualizar. Ou dê duplo clique no .eccupdate. O instalador informa que o sistema está em processo de atualização.',
  }
  fs.writeFileSync(path.join(OUT, `ECC-Gestor-${version}.json`), JSON.stringify(manifesto, null, 2))
  fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(manifesto, null, 2))

  console.log('✓ Pacotes de atualização:')
  console.log(`  ${destExe}`)
  console.log(`  ${destEcc}`)
  console.log(`  ${path.join(OUT, 'latest.json')}`)
}

main()
