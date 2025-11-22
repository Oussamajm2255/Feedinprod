// src/entities/sensor-reading.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity('sensor_readings')
export class SensorReading {
  // Note: Schema has composite PK (id, created_at) for partitioning
  // TypeORM will handle this, but we define id as primary for queries
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sensor, (sensor) => sensor.readings)
  @JoinColumn({ name: 'sensor_id', referencedColumnName: 'sensor_id' })
  sensor: Sensor;

  @Column({ type: 'varchar', length: 36 })
  sensor_id: string;

  @Column({ type: 'float', nullable: true })
  value1: number;

  @Column({ type: 'float', nullable: true })
  value2: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;
}