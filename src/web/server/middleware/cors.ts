import express, { NextFunction } from 'express'

const allowedOrigins = ['http://localhost:8080', 'http://192.168.1.4:8080']

export function cors(
  req: express.Request,
  res: express.Response,
  next: NextFunction
): void {
  const origin = req.headers.origin
  console.log(req.headers)
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    'X-requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization'
  )
  res.header('Access-Control-Max-Age', '10000')

  next()
}
