import env from '../config/env.js'

function base(level, msg, meta) {
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
  info(msg, meta = {}) {
    if (env.logLevel === 'silent') return
    base('info', msg, meta)
  },
  error(msg, meta = {}) {
    base('error', msg, meta)
  },
  warn(msg, meta = {}) {
    if (env.logLevel === 'silent') return
    base('warn', msg, meta)
  }
}

export default logger

