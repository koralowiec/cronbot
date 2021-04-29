import {
    Command,
    CommandMessage
} from "@typeit/discord";
import {Main} from "..";
import {newJob, removeInactiveJob} from "../cron.utils";
import {CronJobDto} from "../db/cron-job/cron-job.dto";
import {CronJobRepository} from "../db/cron-job/cron-job.repository";

interface ParsedMessage {
    cronMessage: string;
    cronExpression: string;
}

export abstract class Cron {
    private _cronJobRepository: CronJobRepository;

    constructor() {
        const connection = Main.Connection
        this._cronJobRepository = connection.getCustomRepository(CronJobRepository)
    }

    @Command("new :name")
    async new(command: CommandMessage) {
        const channelId = command.channel.id;
        const guildId = command.guild.id;
        const {name} = command.args
        const message = command.toString()
        const parseMessage = this.parseMessage(name, message)

        const cronJobDto = new CronJobDto()
        cronJobDto.cronExpression = parseMessage.cronExpression
        cronJobDto.cronMessage = parseMessage.cronMessage
        cronJobDto.guildId = guildId
        cronJobDto.channelId = channelId
        cronJobDto.name = name

        const cronJob = await this._cronJobRepository.createOne(cronJobDto)

        const callback = () => {
            command.channel.send(parseMessage.cronMessage)
        }
        newJob(parseMessage.cronExpression, cronJob.id, callback)
    }

    @Command("active :name :isActive")
    async active(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name, isActive} = command.args
        const isActiveBool = isActive === "true"

        const cronJob = await this._cronJobRepository.changeActiveState(isActiveBool, name, guildId)
        command.reply(`\nActive: ${cronJob.isActive}`)

        if (!isActiveBool) {
            removeInactiveJob(cronJob.id)
        } else {
            const callback = () => {
                command.channel.send(cronJob.cronMessage)
            }
            newJob(cronJob.cronExpression, cronJob.id, callback)
        }
    }

    @Command("info :name")
    async info(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name} = command.args

        const cronJob = await this._cronJobRepository.findByNameAndGuild(name, guildId)
        const cronJobInfo = `\nName: ${cronJob.name}\nCron expression: ${cronJob.cronExpression}\nMessage: ${cronJob.cronMessage}\nActive: ${cronJob.isActive}`
        command.reply(cronJobInfo)
    }

    @Command("list")
    async list(command: CommandMessage) {
        const guildId = command.guild.id;
        const cronJobs = await this._cronJobRepository.findByGuildId(guildId)
        let listMessage = "Cron jobs:"
        for (const job of cronJobs) {
            const channelId = job.channelId
            const channel = command.guild.channels.cache.find(c => c.id === channelId)
            const channelName = channel.name

            listMessage = `${listMessage}\n ${job.name} on channel: ${channelName}`
        }

        command.reply(listMessage)
    }

    @Command("remove :name")
    async remove(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name} = command.args
        const {removedJob, id} = await this._cronJobRepository.removeOne(name, guildId)
        command.reply(`Removed the cron job named ${removedJob.name}`)
        removeInactiveJob(id)
    }

    parseMessage(name: string, message: string): ParsedMessage {
        const nameIndex = message.indexOf(name)
        let sliced = message.slice(nameIndex)
        sliced = sliced.slice(name.length + 1)
        const splitted = sliced.split('"')
        const cronMessage = splitted[1]
        const cronExpression = splitted[3]
        return {cronMessage, cronExpression}
    }
}
