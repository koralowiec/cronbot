import * as Path from "path";
import {
    Discord,
    CommandMessage,
    CommandNotFound,
} from "@typeit/discord";

// The prefix will be applied to the imported commands
@Discord("!cron ", {
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
