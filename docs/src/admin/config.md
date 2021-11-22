---
title: Golem Config
tags:
  - config
  - options
  - setup
---

# Golem Configuration

Golem is configured via a `config.js` file. This file control everything from being able to log Golem into Discord, to what modules to load.

## Example Configuration File

This is an example configuration file, with specifics blocked out. A detailed explanation of these fields can be found below.

```javascript
module.exports = {
  discord: {
    token: 'xxxxx',
    clientId: 'xxxxxx',
    serverIds: ['xxxxx'],
  },
  image: {
    fallbackPath: './plex-logo.png',
    avgColorAlgorithm: 'sqrt',
  },
  lastfm: {
    apiKey: '********',
  },
  library: {
    paths: ['/path/to/library1', '/path/to/library2'],
  },
  mongo: {
    uri: 'mongodb:xxxxx',
    dbName: 'golem',
  },
  plex: {
    uri: 'http://xxxxx',
    appId: 'xxxxxx',
    username: '*******',
    password: '********',
  },
  search: {
    forceWeightTerms: [
      'instrumental',
      'inst.',
      'remix',
    ],
  },
  web: {
    apiPort: 3000,
  },
  youtube: true,
}
```

## Configuration Breakdown

### Discord <badge text="Core" type="core-badge" />

Configures how Golem will interact with Discord. Golem will exit during startup if these values are not present.

- token - `string`: The token of your Golem, can be found in the [Discord Developer Portal](https://discord.com/developers/applications)
- clientId - `string`: The client id of your Golem
- serverIds - `string[]`: A list of servers that you wish to register slash commands to. These are not the servers that your Golem can join.

### Image

- fallbackPath - `string`: The default image to display for album art in the case that the playing track has no album art
- avgColorAlgorithm - `'sqrt' | 'dominant' | 'simple'`: The algorithm to use when determining the average color of an image. This is used to style the embed accent when presenting track information. Defaults to `'sqrt`'.

### LastFm <badge text="LastFM" type="lastfm-badge" />

Omitting this field or setting it to a falsy value will disable the [LastFM Module](../reference/modules.md#lastfm).

- apiKey - `string`: Your API Key to LastFm. Used for the [`$go mix`](../commands/playlist.md) command.

### Library <badge text="Music" type="music-badge" />

- paths - `string[]`: Absolute paths to your local libraries.

### Mongo

- uri - `string`: The URI of your Mongo instance. Mongo is used to store [Custom Aliases](../reference/alias-string.md), Track Play Records, and Library Caches.
- dbName - `string`: The name of this Database in Mongo. Defaults to `'golem'`

### Plex <badge text="Plex" type="plex-badge" />

 - uri - `string`: The URI of the Plex Media Server to pull playlists from
 - appId - `string`: A unique id for your Golem to talk to Plex. It is **highly** recommended to set this value, without it Plex will register a new log in each time Golem starts.
 - username - `string`: The username of the Plex account that will be used to access the above Plex Media Server
 - password - `string`: The password of the above Plex account.

### Search

- forceWeightTerms - `string[]`: Terms that should reduce search relevance. For example, `TWICE - I Can't Stop Me` and `TWICE - I Can't Stop Me English Ver.` may both score the same on a LocalTrack search query. By adding `english` to `forceWeightTerms` you are more likely to receive the original version unless you query with `english` explicitly.

### Web <badge text="Web" type="web-badge" />

- apiPort - `string`: The port to start the Web server on. Defaults to `3000`

### YouTube <badge text="Youtube" type="youtube-badge" />

At this time there is no configuration for the YouTube module outside of enabling/disabling it.
