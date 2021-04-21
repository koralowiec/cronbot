import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class CronJob extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    cronExpression: string;

    @Column()
    cronMessage: string;

    @Column()
    guildId: number;

    @Column()
    channelId: number;

    @Column()
    isActive: boolean;
}
