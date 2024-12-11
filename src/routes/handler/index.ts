import logger from '@/shared/Logger'
import StatusCodes from 'http-status-codes'
import { Request, Response } from 'express'
const { BAD_REQUEST, OK } = StatusCodes

/**
 * Get users name.
 *
 * @param req
 * @param res
 * @returns
 */
export function getHealthCheck(req: Request, res: Response) {
  try {
    return res.status(OK).json({ healthCheck: 'OK' })
  } catch (error) {
    logger.err(error)
    return res.status(BAD_REQUEST).json(error)
  }
}
