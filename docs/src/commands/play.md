---
title: Golem - play
description: Documentation for Golem Bot's play command.
tags:
  - play
  - command
---

# play <badge text="Music*" type="music-badge optional-mod-badge tooltip-root"/> <badge text="Youtube*" type="youtube-badge optional-mod-badge tooltip-root"/>

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


