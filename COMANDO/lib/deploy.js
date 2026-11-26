const { spawn } = require('child_process')

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
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell,
      env: process.env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d) => {
      stdout += d.toString()
    })
    child.stderr?.on('data', (d) => {
      stderr += d.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      const out = `${stdout}${stderr}`.trim()
      if (code !== 0) {
        const err = new Error(out || `Falha: ${command} ${args.join(' ')}`)
        err.code = code
        reject(err)
      } else resolve(out)
    })
  })
}

async function passoSync(root) {
  const log = await runStep(root, 'npm', ['run', 'sync'])
  return { passo: 'sync', ok: true, log }
}

async function passoValidate(root) {
  const log = await runStep(root, 'npm', ['run', 'validate'])
  return { passo: 'validate', ok: true, log }
}

async function passoStage(root) {
  for (const p of GIT_PATHS) {
    await runStep(root, 'git', ['add', '--', p])
  }
  const status = await runStep(root, 'git', ['status', '--porcelain'])
  const hasChanges = Boolean(status)
  return {
    passo: 'stage',
    ok: true,
    hasChanges,
    nadaAlterado: !hasChanges,
    log: status || '(nenhuma alteração para publicar)',
  }
}

async function passoCommit(root, mensagemCommit) {
  const msg = mensagemCommit || 'Atualiza encontros e fotos do site via Comando ECC.'
  const log = await runStep(root, 'git', ['commit', '-m', msg])
  return { passo: 'commit', ok: true, log }
}

async function passoPush(root) {
  const log = await runStep(root, 'git', ['push', 'origin', 'main'])
  return { passo: 'push', ok: true, log }
}

/**
 * @param {'sync'|'validate'|'stage'|'commit'|'push'} passo
 */
async function executarPassoDeploy(passo, root, opts = {}) {
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
async function publicarSite(root, mensagemCommit) {
  const log = []
  log.push((await passoSync(root)).log)
  log.push((await passoValidate(root)).log)
  const staged = await passoStage(root)
  if (staged.nadaAlterado) {
    return { ok: true, nadaAlterado: true, log: log.join('\n\n') }
  }
  log.push(staged.log)
  log.push((await passoCommit(root, mensagemCommit)).log)
  log.push((await passoPush(root)).log)
  return { ok: true, nadaAlterado: false, log: log.join('\n\n') }
}

module.exports = {
  publicarSite,
  executarPassoDeploy,
  PASSOS_ORDEM,
  PASSOS_LABEL,
  GIT_PATHS,
}