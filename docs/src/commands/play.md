---
title: Golem - play
description: Documentation for Golem Bot's play command.
tags:
  - play
  - command
---

# play <badge text="LocalMusic*" type="localmusic-badge optional-mod-badge tooltip-root"/> <badge text="Youtube*" type="youtube-badge optional-mod-badge tooltip-root"/>

Play a Local Track retrieved via searching for the provided query, a YouTube track retrievied via YouTube search if the Local Track search misses; A YouTube Track from a provided absolute url; A YouTube playlist from a provided absolute YouTube Playlist URL.

## Examples

### Legacy Command

```
$go play twice tt
$go play <youtube url>
$go play <youtube playlist url>
```

### Slash Command

```
/goplay twice tt
/goplay <youtube url>
/goplay <youtube playlist url>
```

## Arguments
- **query*** - `string`: If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play. If a Youtube link is provided it will be played - if the link is a playlist it will have the first 20 tracks shuffled and queued. This number can be modified using the extended argument `limit=20`.



## Extended Arguments

- **no-cache**
	- Type: `boolean`
	- Opt to not use a cached version of a streamed track. Will also delete any existing cached version.
- **limit**
	- Type: `number`
	- Requires a YouTube playlist - Override the default fetch limit of 20
- **shuffle**
	- Type: `boolean`
	- Requires a YouTube playlist - Shuffle the tracks pulled from the YouTube playlist

### Help Message
```
Command play:
  Play a Local Track retrieved via searching for the provided query, a YouTube track retrievied via YouTube search if the Local Track search misses; A YouTube Track from a provided absolute url; A YouTube playlist from a provided absolute YouTube Playlist URL.  
--Arguments--
    [query]
      If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play. If a Youtube link is provided it will be played - if the link is a playlist it will have the first 20 tracks shuffled and queued. This number can be modified using the extended argument `limit=20`.
  
--Extended Arguments--
    no-cache: boolean
      Opt to not use a cached version of a streamed track. Will also delete any existing cached version.
    limit: number
      Requires a YouTube playlist - Override the default fetch limit of 20
    shuffle: boolean
      Requires a YouTube playlist - Shuffle the tracks pulled from the YouTube playlist
  
--Required Modules--
    Requires One Of:
      - LocalMusic
      - Youtube
  
--Example Usage--
    $go play twice tt
    $go play <youtube url>
    $go play <youtube playlist url>


*************
arguments marked [] are required
arguments marked <> are optional```

