// src/modules/farms/farm.entity.ts
import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Sensor } from '../../entities/sensor.entity';
import { Device } from '../../entities/device.entity';

@Entity('farms')
export class Farm {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  farm_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  owner_id: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updated_at: Date;

  // Relationship with User (owner)
  @ManyToOne('User', (user: any) => user.farms)
  @JoinColumn({ name: 'owner_id' })
  owner: Promise<any>;

  // Relationship with Sensors
  @OneToMany(() => Sensor, (sensor) => sensor.farm)
  sensors: Sensor[];

  // Relationship with Devices
  @OneToMany(() => Device, (device) => device.farm)
  devices: Device[];
}