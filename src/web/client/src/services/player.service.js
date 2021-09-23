import axios from 'axios'

export class PlayerService {
  http

  constructor(channelId) {
    this.http = axios.create({
      baseURL: `http://${window.location.hostname}:3000/api/player/${channelId}`
    })
  }

  async skip() {
    const res = await this.http.post('/skip')

    console.log(res)
  }
}