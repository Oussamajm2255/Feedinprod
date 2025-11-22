-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: smart_farm
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `action_logs`
--

DROP TABLE IF EXISTS `action_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `action_logs` (
  `id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `trigger_source` varchar(10) NOT NULL,
  `device_id` varchar(100) NOT NULL,
  `sensor_id` varchar(100) DEFAULT NULL,
  `sensor_type` varchar(50) DEFAULT NULL,
  `value` float DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `violation_type` varchar(30) DEFAULT NULL,
  `action_uri` varchar(255) NOT NULL,
  `status` enum('queued','sent','ack','error','timeout','failed') NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `error_message` text,
  `payload` json DEFAULT NULL,
  `action_id` varchar(100) DEFAULT NULL,
  `action_type` varchar(20) DEFAULT NULL,
  `qos_level` int DEFAULT NULL,
  `retain_flag` tinyint(1) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `ack_at` datetime DEFAULT NULL,
  `timeout_at` datetime DEFAULT NULL,
  `failed_at` datetime DEFAULT NULL,
  `retry_count` int NOT NULL DEFAULT '0',
  `max_retries` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `IDX_action_logs_device` (`device_id`),
  KEY `IDX_action_logs_sensor` (`sensor_id`),
  KEY `IDX_action_logs_action_id` (`action_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `action_logs`
--

LOCK TABLES `action_logs` WRITE;
/*!40000 ALTER TABLE `action_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `action_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crops`
--

DROP TABLE IF EXISTS `crops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crops` (
  `crop_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`crop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crops`
--

LOCK TABLES `crops` WRITE;
/*!40000 ALTER TABLE `crops` DISABLE KEYS */;
/*!40000 ALTER TABLE `crops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `device_id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `farm_id` varchar(36) NOT NULL,
  PRIMARY KEY (`device_id`),
  KEY `FK_devices_farms` (`farm_id`),
  CONSTRAINT `FK_devices_farms` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`farm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
INSERT INTO `devices` VALUES ('dht11H','DHT11 Sensor','Green house 1','offline','ab873638-7589-11f0-81f9-508140fba651');
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farms`
--

DROP TABLE IF EXISTS `farms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farms` (
  `farm_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` text,
  `owner_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`farm_id`),
  KEY `FK_farms_users` (`owner_id`),
  CONSTRAINT `FK_farms_users` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farms`
--

LOCK TABLES `farms` WRITE;
/*!40000 ALTER TABLE `farms` DISABLE KEYS */;
INSERT INTO `farms` VALUES ('ab873638-7589-11f0-81f9-508140fba651','Feedin','Mornag, Tunisia','32b2c284-7ffd-4b65-9223-285f3f4f82e6'),('ab873638-7589-11f0-81f9-508140fba652','Chahia','Ben Arous','32b2c284-7ffd-4b65-9223-285f3f4f82e6');
/*!40000 ALTER TABLE `farms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `level` varchar(10) NOT NULL,
  `source` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text,
  `context` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read_created` (`user_id`,`is_read`,`created_at`),
  KEY `idx_notifications_created` (`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensor_readings`
--

DROP TABLE IF EXISTS `sensor_readings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensor_readings` (
  `id` varchar(36) NOT NULL,
  `sensor_id` varchar(36) NOT NULL,
  `value1` float DEFAULT NULL,
  `value2` float DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_d1df5a824e4467f5a645d7b362a` (`sensor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensor_readings`
--

LOCK TABLES `sensor_readings` WRITE;
/*!40000 ALTER TABLE `sensor_readings` DISABLE KEYS */;
INSERT INTO `sensor_readings` VALUES ('000ff7da-95f2-4da3-8fdf-9b3a47f8b9a0','dht11',27,NULL,'2025-09-28 01:31:28.819230'),('001fca61-e278-4c43-9a08-b7f4acd05734','dht11',25,NULL,'2025-09-28 00:59:40.370335'),('00240b41-3699-44f6-b839-88f12d31f701','YL-69',1,NULL,'2025-10-03 02:21:11.333337'),('00279aab-87d4-425b-b6d3-49749aa673ee','BH1750',0,NULL,'2025-10-02 23:52:12.117800'),('0028a439-0e29-4cba-81f4-13d668477e94','YL-69',0,NULL,'2025-10-02 23:45:37.282275'),('0028dcef-4121-4272-85fa-1d3be6afd26d','dht11',24.9,68.1,'2025-10-05 09:41:28.062407'),('0033256f-8e0a-43c3-9791-f02fc96c72d0','dht11',25.4,68.8,'2025-10-05 09:54:14.672011'),('0040f6f2-f995-4da3-a948-63a6f8ec1d74','BH1750',489.6,NULL,'2025-10-05 09:39:41.856448'),('004fe86a-f27f-40be-afc8-5a14a4ed1542','dht11',29.6,40.7,'2025-10-05 11:14:20.851085'),('005384ac-b5ae-46f1-87be-df2337589835','YL-69',0,NULL,'2025-10-05 11:06:02.747214'),('0054db4a-f796-460f-9fbf-1b1d4f989b9f','YL-69',1,NULL,'2025-09-21 19:04:30.946574'),('005f040e-54f5-4f93-8fae-cfca0bd39194','BH1750',224.4,NULL,'2025-10-05 09:31:00.798487'),('007aed61-18ea-45f3-bbdf-3d50a3eb051c','YL-69',0,NULL,'2025-09-13 22:58:57.279594'),('0080b4e9-aaa3-4b59-bdcc-2b102c03dc0e','dht11',29,NULL,'2025-09-21 19:35:13.408333'),('00816088-7369-4412-9e62-375616c318c5','YL-69',0,NULL,'2025-10-05 09:52:19.944798'),('0088a0b3-0ea8-4196-ab6f-1ee5d862463e','BH1750',246.1,NULL,'2025-10-05 09:28:49.178898'),('0088de03-3285-46ee-80fd-ebf88d940111','BH1750',646.1,NULL,'2025-10-05 10:04:30.347365'),('008d24aa-a979-4577-b276-e7d5fbe22714','YL-69',1,NULL,'2025-10-05 09:39:51.840681'),('00930e52-e5e8-4f01-b701-f109c93fc430','YL-69',1,NULL,'2025-10-05 11:32:06.823204'),('009def26-1472-4e9d-86b5-5843403507e0','YL-69',1,NULL,'2025-09-21 19:26:05.286369'),('00a5529f-93a2-4858-b896-7ec896081915','YL-69',1,NULL,'2025-09-21 19:16:27.449068'),('00a6fbb5-393f-4fc6-881b-6d0c8989fa40','dht11',26,NULL,'2025-10-02 23:54:42.033040'),('00afcd1d-d5a4-4bd7-8408-4a0b7ab5a5bd','YL-69',1,NULL,'2025-10-05 09:40:33.691579'),('00b8be5c-d43a-4ade-ae57-ec91766e7635','YL-69',1,NULL,'2025-09-21 19:32:27.436343'),('00c649e5-c2ef-471a-8ef3-830d8a4f0a1d','YL-69',1,NULL,'2025-10-05 09:47:27.510124'),('fffdfa8b-e99a-41b1-8b3c-4119d597d009','BH1750',373.1,NULL,'2025-10-05 11:04:37.988725');
/*!40000 ALTER TABLE `sensor_readings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensors`
--

DROP TABLE IF EXISTS `sensors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sensor_id` varchar(36) NOT NULL,
  `farm_id` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `device_id` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `crop_id` varchar(36) DEFAULT NULL,
  `min_critical` decimal(10,2) DEFAULT NULL,
  `min_warning` decimal(10,2) DEFAULT NULL,
  `max_warning` decimal(10,2) DEFAULT NULL,
  `max_critical` decimal(10,2) DEFAULT NULL,
  `action_low` text,
  `action_high` text,
  PRIMARY KEY (`id`),
  KEY `FK_45ff6a0d69b0148dfa218164c48` (`farm_id`),
  KEY `FK_c0ef47063cec8a3ccad77f3bbc6` (`crop_id`),
  KEY `FK_sensors_devices` (`device_id`),
  CONSTRAINT `FK_45ff6a0d69b0148dfa218164c48` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`farm_id`),
  CONSTRAINT `FK_c0ef47063cec8a3ccad77f3bbc6` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`crop_id`),
  CONSTRAINT `FK_sensors_devices` FOREIGN KEY (`device_id`) REFERENCES `devices` (`device_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensors`
--

LOCK TABLES `sensors` WRITE;
/*!40000 ALTER TABLE `sensors` DISABLE KEYS */;
INSERT INTO `sensors` VALUES (1,'dht11','ab873638-7589-11f0-81f9-508140fba651','temperature','°C','dht11H','Green house 1 ',NULL,15.00,17.00,28.00,50.00,'mqtt:smartfarm/actuators/dht11H/ventilator_off','mqtt:smartfarm/actuators/dht11H/ventilator_on'),(2,'dht11','ab873638-7589-11f0-81f9-508140fba651','humidity','%','dht11H','Green house 1 ',NULL,60.00,62.00,73.00,75.00,'mqtt:smartfarm/actuators/dht11H/humidifier_on','mqtt:smartfarm/actuators/dht11H/open_roof'),(3,'YL-69','ab873638-7589-11f0-81f9-508140fba651','humidity','%','dht11H','Greenhouse 1',NULL,0.00,0.00,0.80,1.00,'mqtt:smartfarm/actuators/dht11H/water_pump_on',NULL),(4,'BH1750','ab873638-7589-11f0-81f9-508140fba651','light','lux','dht11H','Greenhouse 1',NULL,200.00,300.00,900.00,1000.00,'mqtt:smartfarm/actuators/dht11H/light_on',NULL);
/*!40000 ALTER TABLE `sensors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(36) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','farmer','viewer') NOT NULL DEFAULT 'farmer',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `profile_picture` text,
  `last_login` datetime DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `IDX_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('32b2c284-7ffd-4b65-9223-285f3f4f82e6','oussema.jomaaa@gmail.com','$2b$10$qg5ifFfKGsKVA/53TDqyoeXU9z3mOxY3CIBECE0DJtXMLG7a4xvDm','oussama','jomaa','58577690','farmer','active',NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-05 09:24:14',NULL,NULL,'2025-09-29 03:23:49.866347','2025-10-05 09:24:14.000000'),('user-001-sample-uuid-here','farmer@example.com','$2b$10$K7L/oQNkjF5Ej5zXcP8nNOq8rJ9mK2L8nP4qR6sT8uV0wX2yZ4aB6','John','Farmer',NULL,'farmer','active',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-08-13 03:47:29.300287','2025-08-13 03:47:29.300287');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-05 12:53:38
