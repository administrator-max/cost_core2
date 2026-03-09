-- Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- ==========================================
-- IMPORT COSTING TABLES
-- ==========================================

-- Parent Table: Import Projects
CREATE TABLE IF NOT EXISTS import_costings (
    id SERIAL PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    ship_type VARCHAR(50) DEFAULT 'breakbulk', -- 'breakbulk', 'container20', 'container40'
    kurs NUMERIC(15, 2) DEFAULT 17050,
    import_duty NUMERIC(5, 4) DEFAULT 0,
    wht NUMERIC(5, 4) DEFAULT 0.025,
    port_charges NUMERIC(15, 2) DEFAULT 370,
    hedge_rate NUMERIC(10, 2) DEFAULT 1,
    hedge_days INTEGER DEFAULT 60,
    tujuan VARCHAR(255) DEFAULT 'Cakung',
    is_pipa BOOLEAN DEFAULT false,
    stripping NUMERIC(15, 2) DEFAULT 0,
    add_cost NUMERIC(15, 2) DEFAULT 0,
    commission NUMERIC(15, 2) DEFAULT 0,
    comm_unit VARCHAR(10) DEFAULT 'idr', -- 'idr' or 'usd'
    margin_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed' or 'percent'
    margin NUMERIC(15, 2) DEFAULT 900,
    pay_terms VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Child Table: Import Items
CREATE TABLE IF NOT EXISTS import_items (
    id SERIAL PRIMARY KEY,
    costing_id INTEGER REFERENCES import_costings(id) ON DELETE CASCADE,
    name VARCHAR(255),
    qty NUMERIC(15, 2), -- Tonnage
    cif NUMERIC(15, 2), -- USD/T
    remark TEXT
);


-- ==========================================
-- DOMESTIC COSTING TABLES
-- ==========================================

-- Parent Table: Domestic Projects
CREATE TABLE IF NOT EXISTS domestic_costings (
    id SERIAL PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    wht_rate NUMERIC(5, 4) DEFAULT 0.003,
    trk_cost NUMERIC(15, 2) DEFAULT 0,
    trk_from VARCHAR(255),
    trk_to VARCHAR(255),
    pay_terms VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Child Table: Domestic Margin Profiles (Since they are customizable per project)
CREATE TABLE IF NOT EXISTS domestic_margins (
    id SERIAL PRIMARY KEY,
    costing_id INTEGER REFERENCES domestic_costings(id) ON DELETE CASCADE,
    margin_idx INTEGER NOT NULL, -- To map to items (e.g., 0 for 'A', 1 for 'B')
    name VARCHAR(50),
    val NUMERIC(15, 2)
);

-- Child Table: Domestic Items
CREATE TABLE IF NOT EXISTS domestic_items (
    id SERIAL PRIMARY KEY,
    costing_id INTEGER REFERENCES domestic_costings(id) ON DELETE CASCADE,
    name VARCHAR(255),
    qty_kg NUMERIC(15, 2),
    buy_price NUMERIC(15, 2),
    margin_idx INTEGER, -- References the local index of the domestic_margins
    remark TEXT
);