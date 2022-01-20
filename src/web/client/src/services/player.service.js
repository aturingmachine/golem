import axios from 'axios'

export class PlayerService {
  http

  constructor(channelId) {
    this.http = axios.create({
      baseURL: `http://${window.location.hostname}:3828/api/player/${channelId}`
    })
  }

  async playPause() {
    const res = await this.http.post('/playPause')

    console.log(res)
  }

  async skip() {
    const res = await this.http.post('/skip')

    console.log(res)
  }
}
