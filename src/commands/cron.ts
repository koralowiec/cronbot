import {
    Command,
    CommandMessage
} from "@typeit/discord";
import {newJob} from "../cron.utils";

interface ParsedMessage {
    cronMessage: string;
    cronExpression: string;
}

export abstract class Cron {
    @Command("new :name")
    async new(command: CommandMessage) {
        const {name} = command.args
        const message = command.toString()
        const parseMessage = this.parseMessage(name, message)
        const callback = () => {
            command.reply(parseMessage.cronMessage)
        }
        newJob(parseMessage.cronExpression, callback)
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
