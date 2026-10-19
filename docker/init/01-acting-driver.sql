-- Runs on first container init: create the driver-module database alongside
-- the travels database (POSTGRES_DB).
CREATE DATABASE acting_driver;
GRANT ALL PRIVILEGES ON DATABASE acting_driver TO booking;
