/**
 * Empacota o ECC Gestor sem Next/React (somente deps do Express).
 * Uso: node scripts/build-gestor-electron.js --win
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const GESTOR = path.join(ROOT, 'gestor')
const args = process.argv.slice(2)
const target = args.includes('--mac') ? 'mac' : 'win'

function run(cmd, cmdArgs, cwd = ROOT) {
  console.log(`> ${cmd} ${cmdArgs.join(' ')}`)
  const r = spawnSync(cmd, cmdArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  })
  if (r.status !== 0) process.exit(r.status || 1)
}

// Sincroniza versão root ↔ gestor
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const gestorPkgPath = path.join(GESTOR, 'package.json')
const gestorPkg = JSON.parse(fs.readFileSync(gestorPkgPath, 'utf8'))
if (rootPkg.version !== gestorPkg.version) {
  gestorPkg.version = rootPkg.version
  fs.writeFileSync(gestorPkgPath, JSON.stringify(gestorPkg, null, 2) + '\n')
  console.log(`Versão gestor alinhada: ${rootPkg.version}`)
}

// Instala só as 3 deps do gestor (leve)
run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], GESTOR)

const ebArgs =
  target === 'mac'
    ? ['electron-builder', '--mac', 'dmg']
    : ['electron-builder', '--win', 'nsis']

run('npx', ebArgs, ROOT)
console.log('Build Electron concluído.')
