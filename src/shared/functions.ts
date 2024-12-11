import logger from './Logger'
import { Server } from 'http'
import cluster from 'cluster'

export const pErr = (err: Error) => {
  if (err) {
    logger.err(err)
  }
}

export const getRandomInt = () => {
  return Math.floor(Math.random() * 1_000_000_000_000)
}

export const gracefulShutdown = (server: Server, event: NodeJS.Signals) => {
  server.close((err) => {
    logger.err(`${event}です`)
    logger.err('err:' + err)
  })
}

export const workerLog = (text: string) => {
  const workerID = cluster.worker?.id || 'undefined'
  const PID = cluster.worker?.process.pid || 'undefined'
  logger.info(`[${workerID}] [PID ${PID}] ${text}\n`)
}
