# Mod Helper
A discord bot that allows users to send moderator requests privately in public servers.
This project is still heavily WIP. 

## Current Features 
Set a request and a moderator channel for the bot to work in. Whenever a user posts in the request channel or in the bot's DMs their message is forwarded to the moderator channel, assigned an id and the original message is deleted. The user also has the option to send the message anonymously by prefixing it with `!anon`. Moderators then can reply to the message in the moderator channel with `!r [requestId] [message]` which will be then sent to requester's via DM.

## Missing Features
Checking roles or permissions meaning that everyone can set the request and the moderator channel.
Allow the requester respond to the moderator's response instead of sending a new request.
Persist request and moderator channel settings as well as requests between restarts.
Allow for easier setup.
Probably lots of other stuff.
