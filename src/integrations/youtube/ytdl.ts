import dargs from 'dargs'
import execa from 'execa'
import { GolemConf } from '../../config'

/**
 * Potentially temporary fix for dealing with an issue in which our
 * previous ytdl package was not mitigating a throttling issue.
 *
 * This makes use of a youtube-dl fork known as yt-dlp in our case. Might need to
 * make this configurable or package this with Golem.
 * @param url
 * @returns
 */
export function youtubeDownload(url: string): execa.ExecaChildProcess<string> {
  const opts = dargs({
    output: '-',
    quiet: true,
    format: 'ba[ext=webm][acodec=opus] / ba',
    limitRate: '100K',
  })

  const process = execa(GolemConf.youtube.ytdlpPath, [url, ...opts], {
    stdio: ['pipe', 'pipe', 'ignore'],
  })

  return process
}
