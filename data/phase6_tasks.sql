-- Phase 6: Admin Tasks Table

CREATE TABLE IF NOT EXISTS admin_tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    status ENUM('Pending', 'In Progress', 'Done') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    
    -- Optional linking
    order_id VARCHAR(36),
    assigned_to VARCHAR(255),
    
    due_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_task_status (status),
    INDEX idx_task_order (order_id)
);
