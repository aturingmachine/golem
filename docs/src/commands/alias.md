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
$go alias delete hype
```

### Slash Command

```
/goalias create hype => $go play darude sandstorm
/goalias list
/goalias delete hype
```



## Subcommands
- **create**: Create a new alias using GolemAlias format. [name of alias] => [full Golem command]. The alias will be made by removing white space within the "name of alias" section.
	### Arguments
	- **aliascommand*** - `string`: A GolemAlias string. Strings are formatted as "aliasName => $command". Everything to the left of the => delimiter will be stripped of whitespace to make the new alias name. When Golem recieves an alias it will execute the right side of the delimiter **as is**, and interperet it as if it is a new command.

- **delete**: Delete an alias by name. Requires the target alias to be created by the same user requesting the deletion or the requesting user to have elevated privileges.
	### Arguments
	- **aliasname*** - `string`: The name of the alias to delete. The name is equivalent to what one runs for the command without the prefixed $.

- **list**: List aliases registered to this server.



### Help Message
```
Command alias:
  Interact with the aliases registered for this server.  
--Sub Commands--
    - create [aliascommand]
        Create a new alias using GolemAlias format. [name of alias] => [full Golem command]. The alias will be made by removing white space within the "name of alias" section.
          [aliascommand]
            A GolemAlias string. Strings are formatted as "aliasName => $command". Everything to the left of the => delimiter will be stripped of whitespace to make the new alias name. When Golem recieves an alias it will execute the right side of the delimiter **as is**, and interperet it as if it is a new command.
    - delete [aliasname]
        Delete an alias by name. Requires the target alias to be created by the same user requesting the deletion or the requesting user to have elevated privileges.
          [aliasname]
            The name of the alias to delete. The name is equivalent to what one runs for the command without the prefixed $.
    - list
        List aliases registered to this server.
  
--Example Usage--
    $go alias create hype => $go play darude sandstorm
    $go alias list
    $go alias delete hype


*************
arguments marked [] are required
arguments marked <> are optional```

