import env from '../config/env.js'

function base(level: string, msg: string, meta: Record<string, any> = {}) {
  const payload = {
    level,
    msg,
    time: new Date().toISOString(),
    ...meta
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload))
}

const logger = {
  info(msg: string, meta: Record<string, any> = {}) {
    if (env.logLevel === 'silent') return
    base('info', msg, meta)
  },
  error(msg: string, meta: Record<string, any> = {}) {
    base('error', msg, meta)
  },
  warn(msg: string, meta: Record<string, any> = {}) {
    if (env.logLevel === 'silent') return
    base('warn', msg, meta)
  }
}

export default logger

