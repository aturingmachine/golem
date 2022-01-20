---
title: Golem - perms
description: Documentation for Golem Bot's perms command.
tags:
  - perms
  - command
---

# perms 

View and modify user permissions.

## Examples

### Legacy Command

```
$go perms get @Kim Dahyun
$go perms set @Kim Dahyun alias.create alias.edit moderator
$go perms add @Kim Dahyun alias.delete
$go perms remove @Kim Dahyun moderator
```

### Slash Command

```
/goperms get @Kim Dahyun
/goperms set @Kim Dahyun alias.create alias.edit moderator
/goperms add @Kim Dahyun alias.delete
/goperms remove @Kim Dahyun moderator
```



## Subcommands
- **describe**: View all grantable permissions.

- **get**: View permissions for a user
	### Arguments
	- **user*** - `user`: The mentioned user to fetch permissions for. Autocompleting the user using the `@` syntax will select the proper user.

- **set**: Set the permissions for a user.
	### Arguments
	- **user*** - `user`: The mentioned user whos permissions should be set. Autocompleting the user using the `@` syntax will select the proper user.
	- **permissions*** - `string`: The dot notation based permission strings to set on the user. Delimit seperate permissions with a space to set multiple permissions. This will overwrite the users existing permissions

- **add**: Grant a permission to a user
	### Arguments
	- **user*** - `user`: The mentioned user to grant permissions to. Autocompleting the user using the `@` syntax will select the proper user.
	- **permission*** - `string`: The dot notation based permission string to grant to the user.

- **remove**: Remove a permission from a user
	### Arguments
	- **user*** - `user`: The mentioned user to remove permissions from. Autocompleting the user using the `@` syntax will select the proper user.
	- **permission*** - `string`: The dot notation based permission to remove from the user.


