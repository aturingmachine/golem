import dargs from 'dargs'
import execa from 'execa'

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

  // TODO
  const process = execa('/usr/local/bin/yt-dlp', [url, ...opts], {
    stdio: ['ignore', 'pipe', 'ignore'],
  })

  return process
}
