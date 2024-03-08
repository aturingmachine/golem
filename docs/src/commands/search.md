---
title: Golem - search
description: Documentation for Golem Bot's search command.
tags:
  - search
  - command
---

# search <badge text="LocalMusic*" type="localmusic-badge optional-mod-badge tooltip-root"/> <badge text="Youtube*" type="youtube-badge optional-mod-badge tooltip-root"/>

Search for a local track and view the result set.

## Examples

### Legacy Command

```
$go search twice tt
```

### Slash Command

```
/gosearch twice tt
```

## Arguments
- **query*** - `string`: The query to run against the Local Search Index.





### Help Message
```
Command search:
  Search for a local track and view the result set.  
--Arguments--
    [query]
      The query to run against the Local Search Index.
  
--Required Modules--
    Requires One Of:
      - LocalMusic
      - Youtube
  
--Example Usage--
    $go search twice tt


*************
arguments marked [] are required
arguments marked <> are optional```

