import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Controller, Get, Header, Param, Response } from '@nestjs/common'
import { Response as Res } from 'express'

@Controller()
export class AppController {
  constructor() {
    //
  }

  @Get('/app/assets/:path(*)')
  getAsset(@Param('path') path: string, @Response() res: Res): Res {
    const header = path.endsWith('css') ? 'text/css' : 'application/javascript'

    const file = readFileSync(resolve(__dirname, '../client/assets', path), {
      encoding: 'utf-8',
    })

    console.log(`${path} using ${header}`)

    return res.set('Content-Type', header).send(file)
  }

  @Get('/app/*')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getApp(): string {
    return readFileSync(resolve(__dirname, '../client/index.html'), {
      encoding: 'utf-8',
    })
  }
}
