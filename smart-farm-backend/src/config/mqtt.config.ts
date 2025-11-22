import { ConfigService } from '@nestjs/config';

export const mqttConfig = (configService: ConfigService) => ({
  url: configService.get('MQTT_BROKER'),
  username: configService.get('MQTT_USER'),
  password: configService.get('MQTT_PASS'),
});
