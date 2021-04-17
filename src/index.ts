import * as dotenv from "dotenv";
dotenv.config();

import {Client} from "@typeit/discord";

async function start() {
    const client = new Client({
        classes: [
            `${__dirname}/*Discord.ts`, // glob string to load the classes
            `${__dirname}/*Discord.js` // If you compile using "tsc" the file extension change to .js
        ],
        silent: false,
        variablesChar: ":"
    });

    const token = process.env.TOKEN;

    await client.login(token);
}

start();
