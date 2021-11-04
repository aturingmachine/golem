---
title: Golem - alias
description: Documentation for Golem Bot's alias command.
tags:
  - alias
  - command
---

# alias

Interact with the aliases registered for this server.

## Examples

### Legacy Command

```
$go alias create hype => $go play darude sandstorm
$go alias list
```

### Slash Command

```
/goalias create hype => $go play darude sandstorm
/goalias list
```



## Subcommands
- **create**: Create a new alias using GolemAlias format. [name of alias] => [full Golem command]. The alias will be made by removing white space within the "name of alias" section.
	### Arguments
	- **aliascommand*** - `string`: A GolemAlias string. Strings are formatted as "aliasName => $command". Everything to the left of the => delimiter will be stripped of whitespace to make the new alias name. When Golem recieves an alias it will execute the right side of the delimiter **as is**, and interperet it as if it is a new command.,- **list**: List aliases registered to this server.
