-- MariaDB Schema for Nandan Traders Order System
-- Phase 1 Table Definition

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    order_number VARCHAR(20) UNIQUE NOT NULL, -- WEB-YYYY-XXXX
    
    -- Customer Input (Untrusted)
    customer_name_input VARCHAR(255) NOT NULL,
    customer_mobile_input VARCHAR(15) NOT NULL,
    
    -- Order Data
    items_json JSON NOT NULL, -- Storing items as JSON for flexibility in Phase 1
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Workflow Status
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    
    -- ERP Integration (Phase 3/5)
    erp_customer_id VARCHAR(255) DEFAULT NULL,
    erp_sales_order_id VARCHAR(255) DEFAULT NULL,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_status (status),
    INDEX idx_mobile (customer_mobile_input),
    INDEX idx_created (created_at DESC)
);
