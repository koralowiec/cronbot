import {
    Client,
    Command,
    CommandMessage,
    Description
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
    @Description("Create a new cron job (the job will \"belong\" to the channel the command was run). Example: !cron new *job_name* \"Message that will be send by bot every minute on this channel\" \"* * * * *\"")
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
    @Description("Enable (true) or disable (false) the cron job. Example: !cron active *job_name* false")
    async active(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name, isActive} = command.args
        const isActiveBool = isActive === "true"

        const cronJob = await this._cronJobRepository.changeActiveState(isActiveBool, name, guildId)
        command.reply(` Active: ${cronJob.isActive}`)

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
    @Description("Shows information about the cron job. Example: !cron info *job_name*")
    async info(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name} = command.args

        const cronJob = await this._cronJobRepository.findByNameAndGuild(name, guildId)
        const cronJobInfo = ` Name: ${cronJob.name} Cron expression: ${cronJob.cronExpression} Message: ${cronJob.cronMessage} Active: ${cronJob.isActive}`
        command.reply(cronJobInfo)
    }

    @Command("list")
    @Description("Lists all cron jobs that belongs to this channel. Example: !cron list")
    async list(command: CommandMessage) {
        const guildId = command.guild.id;
        const cronJobs = await this._cronJobRepository.findByGuildId(guildId)
        let listMessage = "Cron jobs:"
        for (const job of cronJobs) {
            const channelId = job.channelId
            const channel = command.guild.channels.cache.find(c => c.id === channelId)
            const channelName = channel.name

            listMessage = `${listMessage}  ${job.name} on channel: ${channelName}`
        }

        command.reply(listMessage)
    }

    @Command("remove :name")
    @Description("Remove the cron job. Example: !cron remove *job_name*")
    async remove(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name} = command.args
        const {removedJob, id} = await this._cronJobRepository.removeOne(name, guildId)
        command.reply(`Removed the cron job named ${removedJob.name}`)
        removeInactiveJob(id)
    }

    @Command("help")
    @Description("Show the basic info about available commands. Example: !cron help")
    async help(command: CommandMessage) {
        const commands = Client.getCommands()
        let helpMessage = "Help:"
        commands.forEach((c) => {
            const subcommand = c.commandName.toString().split(" ")[0]
            const desc = c.description.toString()

            helpMessage = `${helpMessage}\n**${subcommand}** ${desc}`
        })

        command.reply(helpMessage)
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
