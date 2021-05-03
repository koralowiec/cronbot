import * as cron from "node-cron";

let jobs = []

const validate = (cronExpression: string): boolean => {
    return cron.validate(cronExpression)
}

const schedule = (cronExpression: string, callback: () => void): cron.ScheduledTask => {
    return cron.schedule(cronExpression, callback)
}

export const newJob = (cronExpression: string, id: number, callback: () => void) => {
    const isValid = validate(cronExpression)
    if (!isValid) {
        console.error("Not valid");
        return
    }

    const job = schedule(cronExpression, callback)
    jobs.push({...job, id})
}

export const removeInactiveJob = (id: number) => {
    const jobToUnshedule = jobs.filter(j => j.id === id)
    if (jobToUnshedule.length > 0) {
        const job = jobToUnshedule[0]
        job.stop()
    }

    const filteredJobs = jobs.filter(j => j.id !== id)
    jobs = filteredJobs
}

export const updateCronMessage = (id: number, expression: string, callback: () => void) => {
    removeInactiveJob(id)
    newJob(expression, id, callback)
}
