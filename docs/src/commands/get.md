---
title: Golem - get
description: Documentation for Golem Bot's get command.
tags:
  - get
  - command
---

# get 

Retrieve information about the current Golem instance.

## Examples

### Legacy Command

```
$go get
$go get nowplaying
$go get count
```

### Slash Command

```
/goget
/goget nowplaying
/goget count
```

## Arguments
- **value** - `string`: The property to get information about.

## Subcommands
- **nowplaying**: Display the current playing resource.



### Help Message
```
Command get:
  Retrieve information about the current Golem instance.  
--Arguments--
    <value>
      The property to get information about.
  
--Sub Commands--
    - nowplaying
        Display the current playing resource.
  
--Example Usage--
    $go get
    $go get nowplaying
    $go get count


*************
arguments marked [] are required
arguments marked <> are optional```

