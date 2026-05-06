-- MySQL Database Schema for Stark Automate Client Dashboard
-- Database: if0_41775688_sas
-- Host: sql305.infinityfree.com

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  wa_id VARCHAR(50),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Message Templates Table
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  purpose ENUM('Utility', 'Marketing') NOT NULL,
  message LONGTEXT NOT NULL,
  cta VARCHAR(10),
  cta_url VARCHAR(2048),
  attachment VARCHAR(2048),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id),
  INDEX idx_status (status)
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  template_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  schedule_date DATE,
  schedule_time TIME,
  timezone VARCHAR(50) DEFAULT 'Asia/Kuala_Lumpur',
  sheets_link VARCHAR(2048),
  status ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
  recipient_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_schedule_date (schedule_date)
);

-- Campaign Messages Table (for tracking individual message delivery)
CREATE TABLE IF NOT EXISTS campaign_messages (
  id VARCHAR(36) PRIMARY KEY,
  campaign_id VARCHAR(36) NOT NULL,
  recipient_phone VARCHAR(20),
  status ENUM('pending', 'sent', 'read', 'failed') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at)
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36),
  action VARCHAR(255),
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  changes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_client_id (client_id),
  INDEX idx_created_at (created_at)
);

-- Indexes for common queries
CREATE INDEX idx_campaign_messages_campaign_status ON campaign_messages(campaign_id, status);
CREATE INDEX idx_templates_client_status ON templates(client_id, status);
CREATE INDEX idx_campaigns_client_date ON campaigns(client_id, schedule_date);

-- Note: Replace placeholder values in worker.js with actual database credentials
-- Current credentials in worker.js:
-- host: sql305.infinityfree.com
-- user: if0_41775688
-- password: E4Z1aMRH6foh
-- database: if0_41775688_sas
-- port: 3306
