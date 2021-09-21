import express, { NextFunction } from 'express'

export function cors(
  req: express.Request,
  res: express.Response,
  next: NextFunction
): void {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    'X-requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization'
  )
  res.header('Access-Control-Max-Age', '10000')

  next()
}
