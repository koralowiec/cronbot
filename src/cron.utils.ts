import * as cron from "node-cron";

const jobs: cron.ScheduledTask[] = []

const validate = (cronExpression: string): boolean => {
    return cron.validate(cronExpression)
}

const schedule = (cronExpression: string, callback: () => void): cron.ScheduledTask => {
    return cron.schedule(cronExpression, callback)
}

export const newJob = (cronExpression: string, callback: () => void) => {
    const isValid = validate(cronExpression)
    if (!isValid) {
        console.error("Not valid");
        return
    }

    const job = schedule(cronExpression, callback)
    jobs.push(job)
}
