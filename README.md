# CronBot

The Discord bot that can send a message at specified time (via cron expression). 

![](./cronjob_pudzian.png)

Written in TypeScript and with these lovely modules:
- [discord.ts](https://github.com/OwenCalvin/discord.ts/)
- [TypeORM](https://github.com/typeorm/typeorm)

You can add the bot to your server by clicking [this
link](https://discord.com/oauth2/authorize?client_id=832325066393649192&scope=bot)
and choosing the server from the list. But note that it's a dev server and I
may shut it down someday, so...

## Run on your own

You can also self-host the bot! 

The docker image is available at [Docker Hub](https://hub.docker.com/r/koralowiec/cronbot) and I placed an example docker compose file at this repository (check `docker-compose.host.yml`).

Remember to create an app on Discord to get a token!
