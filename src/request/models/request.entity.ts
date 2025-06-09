import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

//ชื่อตาราง
@Entity('request')

//ข้อมูลชื่อ Header และ Header type ของตาราง
export class RequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  team: string;

  @Column({ default: '' })
  repository: string;

  @Column({ default: '' })
  resourceGroup: string;

  @Column('json', { default: { VM: 0, DB: 0, ST: 0 } })
  resources: {
    VM: number;
    DB: number;
    ST: number;
  };

  @Column({ default: '' })
  region: string;

  @Column({ default: '' })
  cloudProvider: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status: 'Pending' | 'Approved' | 'Rejected';

  @Column({ default: '' })
  userId: string;

  @Column({ default: '' })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;
}
