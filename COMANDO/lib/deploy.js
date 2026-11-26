const { spawnSync } = require('child_process')

/** Artefatos que o sync gera e o Git publica (planilha e FOTOS/ ficam locais). */
const GIT_PATHS = ['app/data/encontros.ts', 'public/FOTOS']

const PASSOS_ORDEM = ['sync', 'validate', 'stage', 'commit', 'push']

const PASSOS_LABEL = {
  sync: 'Sincronizar planilha → site',
  validate: 'Validar dados',
  stage: 'Preparar arquivos (git add)',
  commit: 'Criar commit',
  push: 'Enviar para GitHub (main)',
}

function runStep(cwd, command, args) {
  const shell = process.platform === 'win32' && command !== 'git'
  const r = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell,
    env: process.env,
    windowsHide: true,
  })
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim()
  if (r.error) {
    throw new Error(r.error.message || String(r.error))
  }
  if (r.status !== 0) {
    const err = new Error(out || `Falha: ${command} ${args.join(' ')}`)
    err.code = r.status
    throw err
  }
  return out
}

function passoSync(root) {
  const log = runStep(root, 'npm', ['run', 'sync'])
  return { passo: 'sync', ok: true, log }
}

function passoValidate(root) {
  const log = runStep(root, 'npm', ['run', 'validate'])
  return { passo: 'validate', ok: true, log }
}

function passoStage(root) {
  for (const p of GIT_PATHS) {
    runStep(root, 'git', ['add', '--', p])
  }
  const status = runStep(root, 'git', ['status', '--porcelain'])
  const hasChanges = Boolean(status)
  return {
    passo: 'stage',
    ok: true,
    hasChanges,
    nadaAlterado: !hasChanges,
    log: status || '(nenhuma alteração para publicar)',
  }
}

function passoCommit(root, mensagemCommit) {
  const msg = mensagemCommit || 'Atualiza encontros e fotos do site via Comando ECC.'
  const log = runStep(root, 'git', ['commit', '-m', msg])
  return { passo: 'commit', ok: true, log }
}

function passoPush(root) {
  const log = runStep(root, 'git', ['push', 'origin', 'main'])
  return { passo: 'push', ok: true, log }
}

/**
 * @param {'sync'|'validate'|'stage'|'commit'|'push'} passo
 */
function executarPassoDeploy(passo, root, opts = {}) {
  switch (passo) {
    case 'sync':
      return passoSync(root)
    case 'validate':
      return passoValidate(root)
    case 'stage':
      return passoStage(root)
    case 'commit':
      return passoCommit(root, opts.mensagem)
    case 'push':
      return passoPush(root)
    default:
      throw new Error(`Passo de deploy inválido: ${passo}`)
  }
}

/** Uso legado — um único request. */
function publicarSite(root, mensagemCommit) {
  const log = []
  log.push(passoSync(root).log)
  log.push(passoValidate(root).log)
  const staged = passoStage(root)
  if (staged.nadaAlterado) {
    return { ok: true, nadaAlterado: true, log: log.join('\n\n') }
  }
  log.push(staged.log)
  log.push(passoCommit(root, mensagemCommit).log)
  log.push(passoPush(root).log)
  return { ok: true, nadaAlterado: false, log: log.join('\n\n') }
}

module.exports = {
  publicarSite,
  executarPassoDeploy,
  PASSOS_ORDEM,
  PASSOS_LABEL,
  GIT_PATHS,
}