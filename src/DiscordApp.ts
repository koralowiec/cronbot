import * as Path from "path";
import {
    Discord,
    CommandMessage,
    CommandNotFound,
} from "@typeit/discord";

async function getPrefix() {
    const middlePrefix = process.env.PREFIX || "cron"
    return `!${middlePrefix} `
}

@Discord(getPrefix, {
    import: [
        Path.join(__dirname, "commands", "*.ts"),
        Path.join(__dirname, "commands", "*.js")
    ]
})
export abstract class DiscordApp {
    @CommandNotFound()
    notFoundAasd(command: CommandMessage) {
        command.reply("Command not found");
    }
}
