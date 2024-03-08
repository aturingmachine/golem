---
title: Golem - playlist
description: Documentation for Golem Bot's playlist command.
tags:
  - playlist
  - command
---

# playlist <badge text="Plex" type="plex-badge" /> <badge text="LocalMusic" type="localmusic-badge" />

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

## Subcommands
- **list**: List all playlists available on this server.

- **create**: Create a new playlist.
	### Arguments
	- **playlistname*** - `string`: The name for the new playlist.

- **play**: Play a playlist by name.
	### Arguments
	- **playlistname*** - `string`: The playlist to play

- **add**: Add the current track or the result of a query.
	### Arguments
	- **playlistname*** - `string`: The playlist to add a track to.
	- **query** - `string`: A search term to add.


