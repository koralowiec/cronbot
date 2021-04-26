import {Connection, createConnection} from "typeorm";
import {CronJob} from "./cron-job/cron-job.entity";
import {CronJobRepository} from "./cron-job/cron-job.repository";

const host: string = process.env.POSTGRES_HOST
const port: number = parseInt(process.env.POSTGRES_PORT)
const username: string = process.env.POSTGRES_USER
const password: string = process.env.POSTGRES_PASSWORD
const database: string = process.env.POSTGRES_DB

const getConnection = async (): Promise<Connection> => {
    return createConnection({
        type: "postgres",
        host,
        port,
        username,
        password,
        database,
        entities: [CronJob, CronJobRepository],
        synchronize: true
    })
}

export {getConnection}
