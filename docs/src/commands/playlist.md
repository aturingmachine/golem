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
$go playlist play my playlist
$go playlist list
$go playlist create my playlist
$go playlist create my playlist --fromQueue
$go playlist add
$go playlist add twice tt
```

### Slash Command

```
/goplaylist play my-playlist
/goplaylist list
```

## Arguments
- **playlist** - `string`: The name of the playlist to queue.

## Subcommands
- **list**: List all playlists available on this server. Additionaly lists any Plex playlists if the Plex Module is enabled.

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

## Extended Arguments

- **fromQueue**
	- Type: `boolean`
	- Create a playlist from the current play queue. Useful when wanting to create a Golem Playlist from a YouTube playlist that is currently playing.

### Help Message
```
Command playlist:
  Play a given playlist by name. Presents a select of all playlists if no playlist name is provided. Requires enabling the Plex module and a local Plex Media Server.  
--Arguments--
    <playlist>
      The name of the playlist to queue.
  
--Sub Commands--
    - list
        List all playlists available on this server. Additionaly lists any Plex playlists if the Plex Module is enabled.
    - create [playlistname]
        Create a new playlist.
          [playlistname]
            The name for the new playlist.
    - play [playlistname]
        Play a playlist by name.
          [playlistname]
            The playlist to play
    - add [playlistname] <query>
        Add the current track or the result of a query.
          [playlistname]
            The playlist to add a track to.
          <query>
            A search term to add.
  
--Extended Arguments--
    fromQueue: boolean
      Create a playlist from the current play queue. Useful when wanting to create a Golem Playlist from a YouTube playlist that is currently playing.
  
--Required Modules--
    Requires All Of:
      - Plex
      - LocalMusic
  
--Example Usage--
    $go playlist play my playlist
    $go playlist list
    $go playlist create my playlist
    $go playlist create my playlist --fromQueue
    $go playlist add
    $go playlist add twice tt


*************
arguments marked [] are required
arguments marked <> are optional```

