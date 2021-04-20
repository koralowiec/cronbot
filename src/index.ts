import {Client} from "@typeit/discord";
import * as dotenv from "dotenv";
dotenv.config();

const onShutdown = () => {
    console.log("Shutting down the cronbot");
    process.exit(0);
}

process.on("SIGTERM", onShutdown)
process.on("SIGINT", onShutdown)

export class Main {
    private static _client: Client;

    static get Client(): Client {
        return this._client;
    }

    static start() {
        this._client = new Client();
        const token = process.env.TOKEN
        this._client.login(
            token,
            `${__dirname}/DiscordApp.ts`,
            `${__dirname}/DiscordApp.js`
        );
    }
}

Main.start();
