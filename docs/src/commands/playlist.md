---
title: Golem - playlist
description: Documentation for Golem Bot's playlist command.
tags:
  - playlist
  - command
---

# playlist <badge text="Plex" type="plex-badge" /> <badge text="Music" type="music-badge" />

Play a given playlist by name. Presents a select of all playlists if no playlist name is provided. Requires enabling the Plex module and a local Plex Media Server.

## Examples

### Legacy Command

```
$go playlist my-playlist
$go playlist
```

### Slash Command

```
/goplaylist my-playlist
/goplaylist
```

## Arguments
- **playlist** - `string`: The name of the playlist to queue.


