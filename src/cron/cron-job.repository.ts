import {EntityRepository, Repository} from "typeorm";
import {CronJobDto} from "./cron-job.dto";
import {CronJob} from "./cron-job.entity";

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "NotFoundError"
    }
}

@EntityRepository(CronJob)
export class CronJobRepository extends Repository<CronJob> {
    createOne(cronJobDto: CronJobDto): Promise<CronJob> {
        const {cronMessage, cronExpression, guildId, channelId, name} = cronJobDto
        const cronJob = this.create()
        cronJob.cronExpression = cronExpression
        cronJob.cronMessage = cronMessage
        cronJob.guildId = guildId
        cronJob.channelId = channelId
        cronJob.name = name

        return this.save(cronJob)
    }

    async findByNameAndGuild(name: string, guildId: string): Promise<CronJob> {
        const job = await this.findOne({name, guildId})
        if (!job) {
            throw new NotFoundError(`Could not find the cron job with name: ${name} and guildId: ${guildId}`)
        }

        return job
    }

    async changeActiveState(isActive: boolean, name: string, guildId: string): Promise<CronJob> {
        const cronJob = await this.findByNameAndGuild(name, guildId)
        if (!cronJob) {
            throw new NotFoundError(`Could not find the cron job with name: ${name} and guildId: ${guildId}`)
        }
        cronJob.isActive = isActive
        return this.save(cronJob)
    }

    findAllActive(): Promise<CronJob[]> {
        return this.find({isActive: true})
    }

    findByGuildId(guildId: string): Promise<CronJob[]> {
        return this.find({guildId})
    }

    async removeOne(name: string, guildId: string): Promise<{removedJob: CronJob, id: number}> {
        let cronJob = await this.findByNameAndGuild(name, guildId)
        if (!cronJob) {
            throw new NotFoundError(`Could not find the cron job with name: ${name} and guildId: ${guildId}`)
        }

        const {id} = cronJob
        const removedJob = await this.remove(cronJob)

        return {removedJob, id}
    }

    async updateMessage(name: string, guildId: string, newMessage: string): Promise<CronJob> {
        let cronJob = await this.findByNameAndGuild(name, guildId)
        if (!cronJob) {
            throw new NotFoundError(`Could not find the cron job with name: ${name} and guildId: ${guildId}`)
        }

        cronJob.cronMessage = newMessage
        return cronJob.save()
    }

    async updateExpression(name: string, guildId: string, newExpression: string): Promise<CronJob> {
        let cronJob = await this.findByNameAndGuild(name, guildId)
        if (!cronJob) {
            throw new NotFoundError(`Could not find the cron job with name: ${name} and guildId: ${guildId}`)
        }

        cronJob.cronExpression = newExpression
        return cronJob.save()
    }
}
