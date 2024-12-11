import { Router } from 'express'
// import { getAllUsers, addOneUser, updateOneUser, deleteOneUser } from './Users'
import { lstepCSV } from '@/routes/handler/LstepV1Handler'
import { google } from '@/routes/handler/GoogleV1Handler'

import { getHealthCheck } from '@/routes/handler/'

const apiRouter = Router()
apiRouter.get('/', getHealthCheck)

const lstepRouter = Router()
lstepRouter.post('/csv', lstepCSV)

// Export the base-router
const baseRouter = Router()
// baseRouter.use('/users', userRouter)
baseRouter.use('/', apiRouter)
// baseRouter.use('/v1/buyma', buymaV1Router)
baseRouter.use('/v1/lstep', lstepRouter)

// google
baseRouter.post('/v1/google', google)

export default baseRouter
