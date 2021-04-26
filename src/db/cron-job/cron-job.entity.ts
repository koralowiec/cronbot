import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class CronJob extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    cronExpression: string;

    @Column()
    cronMessage: string;

    @Column()
    guildId: string;

    @Column()
    channelId: string;

    @Column({default: true})
    isActive: boolean;
}
