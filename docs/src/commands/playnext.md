---
title: Golem - playnext
description: Documentation for Golem Bot's playnext command.
tags:
  - playnext
  - command
---

# playnext <badge text="LocalMusic*" type="localmusic-badge optional-mod-badge tooltip-root"/> <badge text="Youtube*" type="youtube-badge optional-mod-badge tooltip-root"/>

Execute a Play command, queueing the track ahead of the passive queue, behind other tracks that have been Playnext-ed

## Examples

### Legacy Command

```
$go playnext twice tt
$go playnext <youtube url>
$go playnext <youtube playlist url>
```

### Slash Command

```
/goplaynext twice tt
/goplaynext <youtube url>
/goplaynext <youtube playlist url>
```

## Arguments
- **query*** - `string`: If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play.





### Help Message
```
Command playnext:
  Execute a Play command, queueing the track ahead of the passive queue, behind other tracks that have been Playnext-ed  
--Arguments--
    [query]
      If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play.
  
--Required Modules--
    Requires One Of:
      - LocalMusic
      - Youtube
  
--Example Usage--
    $go playnext twice tt
    $go playnext <youtube url>
    $go playnext <youtube playlist url>


*************
arguments marked [] are required
arguments marked <> are optional```

