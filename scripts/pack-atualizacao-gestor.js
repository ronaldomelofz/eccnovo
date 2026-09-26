/**
 * Empacota atualização do Gestor em EXECUTAVEL/ATUALIZACOES
 * Uso: npm run gestor:pack-update
 *
 * Copia o instalador Windows (se existir) e grava manifesto version.json
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

  const candidatos = [
    path.join(DIST, nomeSetup),
    path.join(EXEC, nomeSetup),
    path.join(DIST, 'ECC-Gestor-Setup-0.2.0.exe'),
  ]

  let origem = candidatos.find((p) => fs.existsSync(p))
  if (!origem) {
    // qualquer setup mais recente em dist ou EXECUTAVEL
    const list = []
    for (const dir of [DIST, EXEC]) {
      if (!fs.existsSync(dir)) continue
      for (const f of fs.readdirSync(dir)) {
        if (/ECC-Gestor-Setup-.*\.exe$/i.test(f)) {
          list.push(path.join(dir, f))
        }
      }
    }
    list.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    origem = list[0]
  }

  if (!origem) {
    console.error('Nenhum instalador encontrado. Rode antes: npm run gestor:dist:win')
    process.exit(1)
  }

  const destExe = path.join(OUT, path.basename(origem).includes(version)
    ? path.basename(origem)
    : nomeSetup)
  fs.copyFileSync(origem, destExe)

  const manifesto = {
    produto: 'ECC Gestor',
    versao: version,
    geradoEm: new Date().toISOString(),
    arquivo: path.basename(destExe),
    instrucao: 'No app: aba Atualizações → Receber atualização, ou execute o .exe.',
  }
  fs.writeFileSync(path.join(OUT, `ECC-Gestor-${version}.json`), JSON.stringify(manifesto, null, 2))
  fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(manifesto, null, 2))

  console.log('✓ Pacote de atualização salvo em:')
  console.log(`  ${destExe}`)
  console.log(`  ${path.join(OUT, 'latest.json')}`)
}

main()
