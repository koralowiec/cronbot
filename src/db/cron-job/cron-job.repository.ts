import {EntityRepository, Repository} from "typeorm";
import {CronJobDto} from "./cron-job.dto";
import {CronJob} from "./cron-job.entity";

@EntityRepository(CronJob)
export class UserRepository extends Repository<CronJob> {
    createOne(cronJobDto: CronJobDto): Promise<CronJob> {
        const {cronMessage, cronExpression, guildId, channelId} = cronJobDto
        const cronJob = this.create()
        cronJob.cronExpression = cronExpression
        cronJob.cronMessage = cronMessage
        cronJob.guildId = guildId
        cronJob.channelId = channelId

        return this.save(cronJob)
    }

    async changeActiveState(isActive: boolean, cronJobId: number): Promise<CronJob> {
        const cronJob = await this.findOne(cronJobId)
        cronJob.isActive = isActive
        return this.save(cronJob)
    }

    findAllActive(): Promise<CronJob[]> {
        return this.find({isActive: true})
    }
}
