import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { FinetuneOutputRunParams } from '../dto/finetune-output-run-params.dto';
import { FinetuneOutput } from './finetune-output';
import { GenerateParamsDTO } from 'src/presets/dto/generate-params.dto';

@Entity()
export class FinetuneOutputDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => FinetuneOutput, { onDelete: 'CASCADE' })
  @JoinColumn()
  output: FinetuneOutput;

  @Column({ type: 'json' })
  // runParams: FinetuneOutputRunParams
  runParams: GenerateParamsDTO;

  @Column({ type: 'json', nullable: true })
  rawResult: any;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
