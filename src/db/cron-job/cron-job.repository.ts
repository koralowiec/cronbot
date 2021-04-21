import {EntityRepository, Repository} from "typeorm";
import {CronJob} from "./cron-job.entity";

@EntityRepository(CronJob)
export class UserRepository extends Repository<CronJob> {}
