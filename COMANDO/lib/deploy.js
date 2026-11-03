const { spawnSync } = require('child_process')
const path = require('path')

function runStep(cwd, command, args) {
  const r = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  })
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim()
  if (r.status !== 0) {
    const err = new Error(out || `Falha: ${command} ${args.join(' ')}`)
    err.code = r.status
    throw err
  }
  return out
}

function publicarSite(root, mensagemCommit) {
  const msg =
    mensagemCommit ||
    'Atualiza encontros e fotos do site via Comando ECC.'

  const log = []
  log.push(runStep(root, 'npm', ['run', 'sync']))
  log.push(runStep(root, 'npm', ['run', 'validate']))

  runStep(root, 'git', ['add', 'AGENDA ENCONTROS.xlsx', 'FOTOS', 'app/data/encontros.ts', 'public/FOTOS'])

  const status = runStep(root, 'git', ['status', '--porcelain'])
  if (!status) {
    return { ok: true, nadaAlterado: true, log: log.join('\n\n') }
  }

  log.push(runStep(root, 'git', ['commit', '-m', msg]))
  log.push(runStep(root, 'git', ['push', 'origin', 'main']))

  return { ok: true, nadaAlterado: false, log: log.join('\n\n') }
}

module.exports = { publicarSite }
