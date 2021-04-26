import {Client} from "@typeit/discord";
import {TextChannel} from "discord.js";
import * as dotenv from "dotenv";
import {Connection} from "typeorm";
import {newJob} from "./cron.utils";
import {getConnection} from "./db/connection";
import {CronJobRepository} from "./db/cron-job/cron-job.repository";
dotenv.config();

const onShutdown = () => {
    console.log("Shutting down the cronbot");
    process.exit(0);
}

process.on("SIGTERM", onShutdown)
process.on("SIGINT", onShutdown)

export class Main {
    private static _client: Client;
    private static _connection: Connection;

    static get Client(): Client {
        return this._client;
    }

    static get Connection(): Connection {
        return this._connection
    }

    static async start() {
        try {
            this._connection = await getConnection()
        } catch (e) {
            console.error(e);
            onShutdown()
        }

        this._client = new Client();
        const token = process.env.TOKEN
        this._client.login(
            token,
            `${__dirname}/DiscordApp.ts`,
            `${__dirname}/DiscordApp.js`
        );

        await this.loadCronJobs()
    }

    private static async loadCronJobs() {
        const cronJobRepo = this.Connection.getCustomRepository(CronJobRepository)
        const jobs = await cronJobRepo.findAllActive()
        jobs.forEach(j => newJob(j.cronExpression, j.id, () => {
            const channel = this.Client.channels.cache.find(ch => ch.id === j.channelId);
            if (channel.isText()) {
                (<TextChannel>channel).send(j.cronMessage)
            }
        }))
    }
}

Main.start();
