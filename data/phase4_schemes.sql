-- Phase 4: Schemes Table

CREATE TABLE IF NOT EXISTS schemes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Conditions (stored as JSON for v1 flexibility)
    -- e.g. { "type": "qty_threshold", "item_code": "ABC", "min_qty": 10 }
    conditions_json JSON NOT NULL, 
    
    -- Rewards (stored as JSON)
    -- e.g. { "type": "free_item", "item_code": "XYZ", "qty": 1 }
    rewards_json JSON NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    valid_from DATE,
    valid_to DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for active schemes
INDEX idx_active_schemes (is_active, valid_from, valid_to);
