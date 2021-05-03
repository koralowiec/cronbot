import {
    Client,
    Command,
    CommandMessage,
    Description
} from "@typeit/discord";
import {Main} from "..";
import {newJob, NotValidCronExpression, removeInactiveJob, updateCronMessage, validateCronExpression} from "./cron.utils";
import {CronJobDto} from "./cron-job.dto";
import {CronJobRepository, NotFoundError} from "./cron-job.repository";
import {CronJob} from "./cron-job.entity";

interface ParsedMessage {
    cronMessage: string;
    cronExpression: string;
}

enum ParsingMessageMode {
    MessageOnly,
    ExpressionOnly,
    Both,
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
        try {
            newJob(parseMessage.cronExpression, cronJob.id, callback)
        } catch (e) {
            if (e instanceof NotValidCronExpression) {
                command.reply(e.message)
                await this._cronJobRepository.removeOne(cronJob.name, cronJob.guildId)
            }
            return
        }
    }

    @Command("active :name :isActive")
    @Description("Enable (true) or disable (false) the cron job. Example: !cron active *job_name* false")
    async active(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name, isActive} = command.args
        const isActiveBool = isActive === "true"

        let cronJob: CronJob

        try {
            cronJob = await this._cronJobRepository.changeActiveState(isActiveBool, name, guildId)
        } catch (e) {
            if (e instanceof NotFoundError) {
                command.reply(e.message)
            } else {
                command.reply("Unknown error occured! :cry:")
            }
            return
        }

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

        let cronJob: CronJob
        try {
            cronJob = await this._cronJobRepository.findByNameAndGuild(name, guildId)
        } catch (e) {
            if (e instanceof NotFoundError) {
                command.reply(e.message)
            } else {
                command.reply("Unknown error occured! :cry:")
            }
            return
        }
        const cronJobInfo = `\nName: ${cronJob.name} \nCron expression: ${cronJob.cronExpression} \nMessage: ${cronJob.cronMessage} \nActive: ${cronJob.isActive}`
        command.reply(cronJobInfo)
    }

    @Command("edit msg :name")
    @Description("Edit the cron job's message. Example: !cron edit msg *job_name* \"New message\"")
    async editMessage(command: CommandMessage) {
        this.edit(command, ParsingMessageMode.MessageOnly)
    }

    @Command("edit exp :name")
    @Description("Edit the cron job's expression. Example: !cron edit exp *job_name* \"*/5 * * * *\"")
    async editExpression(command: CommandMessage) {
        this.edit(command, ParsingMessageMode.ExpressionOnly)
    }

    @Command("list")
    @Description("Lists all cron jobs that belongs to this channel. Example: !cron list")
    async list(command: CommandMessage) {
        const guildId = command.guild.id;

        let cronJobs: CronJob[]
        try {
            cronJobs = await this._cronJobRepository.findByGuildId(guildId)
        } catch (e) {
            if (e instanceof NotFoundError) {
                command.reply(e.message)
            } else {
                command.reply("Unknown error occured! :cry:")
            }
            return
        }

        let listMessage = "Cron jobs:"
        for (const job of cronJobs) {
            const channelId = job.channelId
            const channel = command.guild.channels.cache.find(c => c.id === channelId)
            const channelName = channel.name

            listMessage = `${listMessage}\n${job.name} on channel: ${channelName}`
        }

        command.reply(listMessage)
    }

    @Command("remove :name")
    @Description("Remove the cron job. Example: !cron remove *job_name*")
    async remove(command: CommandMessage) {
        const guildId = command.guild.id;
        const {name} = command.args

        let cronJob
        try {
            cronJob = await this._cronJobRepository.removeOne(name, guildId)
        } catch (e) {
            if (e instanceof NotFoundError) {
                command.reply(e.message)
            } else {
                command.reply("Unknown error occured! :cry:")
            }
            return
        }

        const {removedJob, id} = cronJob
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

    async edit(command: CommandMessage, mode: ParsingMessageMode) {
        const guildId = command.guild.id;
        const {name} = command.args
        const message = command.toString()
        const {cronMessage, cronExpression} = this.parseMessage(name, message, mode)

        const isValid = validateCronExpression(cronExpression)
        if (!isValid) {
            command.reply(`Cron expression: "${cronExpression}" is not valid!`)
            return
        }

        let updatedCronJob: CronJob
        let replyMessage = `Updated cron job: ${name}`
        if (mode == ParsingMessageMode.MessageOnly) {
            try {
                updatedCronJob = await this._cronJobRepository.updateMessage(name, guildId, cronMessage)
            } catch (e) {
                if (e instanceof NotFoundError) {
                    command.reply(e.message)
                } else {
                    command.reply("Unknown error occured! :cry:")
                }
                return
            }
            replyMessage = `${replyMessage} - set message to: ${updatedCronJob.cronMessage}`
        } else if (mode == ParsingMessageMode.ExpressionOnly) {
            try {
                updatedCronJob = await this._cronJobRepository.updateExpression(name, guildId, cronExpression)
            } catch (e) {
                if (e instanceof NotFoundError) {
                    command.reply(e.message)
                } else {
                    command.reply("Unknown error occured! :cry:")
                }
                return
            }
            replyMessage = `${replyMessage} - set expression to: ${updatedCronJob.cronExpression}`
        }

        const callback = () => {
            command.channel.send(updatedCronJob.cronMessage)
        }
        updateCronMessage(updatedCronJob.id, updatedCronJob.cronExpression, callback)
        command.reply(replyMessage)
    }

    parseMessage(name: string, message: string, mode: ParsingMessageMode = ParsingMessageMode.Both): ParsedMessage {
        const nameIndex = message.indexOf(name)
        let sliced = message.slice(nameIndex)
        sliced = sliced.slice(name.length + 1)
        const splitted = sliced.split('"')

        let cronMessage: string
        let cronExpression: string
        switch (mode) {
            case ParsingMessageMode.MessageOnly: {
                cronMessage = splitted[1]
                break;
            }
            case ParsingMessageMode.ExpressionOnly: {
                cronExpression = splitted[1]
                break;
            }
            case ParsingMessageMode.Both:
            default: {
                cronMessage = splitted[1]
                cronExpression = splitted[3]
            }
        }
        return {cronMessage, cronExpression}
    }
}
