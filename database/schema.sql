-- Executed automatically on first initialization of the MySQL Docker volume.
CREATE DATABASE IF NOT EXISTS id_service
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin;
USE id_service;

CREATE TABLE IF NOT EXISTS user_mappings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id1 VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL,
    id2 VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL,
    user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_user_mappings_id_pair UNIQUE (id1, id2)
) ENGINE=InnoDB;
