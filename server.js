const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// JWT Secret - Uses environment variable or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-cost-core-secret';

// --- GOOGLE DRIVE SETUP ---
// Target Shared Drive (ID starts with 0A — must use supportsAllDrives).
// The service account must be a member of this Shared Drive with Editor access.
const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID || '0AAI1KGVmJHZjUk9PVA';

// Resolve service account credentials: inline JSON env > file path env > local file
const loadServiceAccount = () => {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    }
    const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        || path.join(__dirname, 'service-account.json');
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
};

let _driveClient = null;
const getDrive = () => {
    if (_driveClient) return _driveClient;
    const creds = loadServiceAccount();
    if (!creds) throw new Error('Service account credentials not found');
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    _driveClient = google.drive({ version: 'v3', auth });
    return _driveClient;
};

// PostgreSQL Connection (Neon DB)
const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || 'neondb', // Fixed: Forced fallback to 'neondb' if env is misread
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432, // Fixed: Use PGPORT or strictly 5432 for Postgres
    ssl: { rejectUnauthorized: false } // Required for Neon
});

// Auto-Initialize Full Relational Database Schema
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                role VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS import_costings (
                id SERIAL PRIMARY KEY,
                customer VARCHAR(255) NOT NULL,
                ship_type VARCHAR(50) DEFAULT 'breakbulk',
                kurs NUMERIC(15, 2) DEFAULT 17050,
                import_duty NUMERIC(5, 4) DEFAULT 0,
                wht NUMERIC(5, 4) DEFAULT 0.025,
                port_charges NUMERIC(15, 2) DEFAULT 370,
                hedge_rate NUMERIC(10, 2) DEFAULT 2.5,
                hedge_days INTEGER DEFAULT 60,
                tujuan VARCHAR(255) DEFAULT 'Cakung',
                is_pipa BOOLEAN DEFAULT false,
                stripping NUMERIC(15, 2) DEFAULT 0,
                add_cost NUMERIC(15, 2) DEFAULT 0,
                commission NUMERIC(15, 2) DEFAULT 0,
                comm_unit VARCHAR(10) DEFAULT 'idr',
                margin_type VARCHAR(20) DEFAULT 'fixed',
                margin NUMERIC(15, 2) DEFAULT 900,
                pay_terms VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS import_items (
                id SERIAL PRIMARY KEY,
                costing_id INTEGER REFERENCES import_costings(id) ON DELETE CASCADE,
                name VARCHAR(255),
                qty NUMERIC(15, 2),
                cif NUMERIC(15, 2),
                remark TEXT
            );

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

            CREATE TABLE IF NOT EXISTS domestic_margins (
                id SERIAL PRIMARY KEY,
                costing_id INTEGER REFERENCES domestic_costings(id) ON DELETE CASCADE,
                margin_idx INTEGER NOT NULL,
                name VARCHAR(50),
                val NUMERIC(15, 2)
            );

            CREATE TABLE IF NOT EXISTS domestic_items (
                id SERIAL PRIMARY KEY,
                costing_id INTEGER REFERENCES domestic_costings(id) ON DELETE CASCADE,
                name VARCHAR(255),
                qty_kg NUMERIC(15, 2),
                buy_price NUMERIC(15, 2),
                margin_idx INTEGER,
                remark TEXT
            );
        `);
        
        // Create default users if empty
        const userRes = await pool.query('SELECT * FROM users');
        if (userRes.rows.length === 0) {
            const hashA = await bcrypt.hash('1984', 10);
            const hashB = await bcrypt.hash('1945', 10);
            await pool.query('INSERT INTO users (role, password_hash) VALUES ($1, $2), ($3, $4)', 
                ['user', hashA, 'admin', hashB]);
            console.log('Database initialized with default users and relational schema.');
        }
    } catch (err) {
        console.error('Database Initialization Error:', err);
    }
};
initDb();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        const users = await pool.query('SELECT * FROM users');
        let matchedRole = null;
        let expiresIn = null;

        for (let user of users.rows) {
            if (await bcrypt.compare(password, user.password_hash)) {
                matchedRole = user.role;
                break;
            }
        }

        if (matchedRole === 'admin') expiresIn = '24h';
        else if (matchedRole === 'user') expiresIn = '14d';
        else return res.status(401).json({ error: 'Incorrect password' });

        const token = jwt.sign({ role: matchedRole }, JWT_SECRET, { expiresIn });
        res.json({ token, level: matchedRole === 'admin' ? 'B' : 'A' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, level: req.user.role === 'admin' ? 'B' : 'A' });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    
    const { currentAdmin, newUser, newAdmin } = req.body;
    try {
        const adminRes = await pool.query('SELECT password_hash FROM users WHERE role = $1', ['admin']);
        const valid = await bcrypt.compare(currentAdmin, adminRes.rows[0].password_hash);
        if (!valid) return res.status(401).json({ message: 'Current admin password is incorrect' });

        if (newUser && newUser.length > 0) {
            const hashA = await bcrypt.hash(newUser, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE role = $2', [hashA, 'user']);
        }
        if (newAdmin && newAdmin.length > 0) {
            const hashB = await bcrypt.hash(newAdmin, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE role = $2', [hashB, 'admin']);
        }
        res.json({ message: 'Passwords updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- CLOUD STORAGE ENDPOINTS (Relational Logic) ---

app.post('/api/costings', authenticateToken, async (req, res) => {
    const { type, customer, data } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Start Transaction
        
        if (type === 'import') {
            const costRes = await client.query(`
                INSERT INTO import_costings 
                (customer, ship_type, kurs, import_duty, wht, port_charges, hedge_rate, hedge_days, tujuan, is_pipa, stripping, add_cost, commission, comm_unit, margin_type, margin, pay_terms)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id
            `, [customer, data.shipType, data.kurs, data.importDuty, data.wht, data.portCharges, data.hedgeRate, data.hedgeDays, data.tujuan, data.isPipa, data.stripping, data.addCost, data.commission, data.commUnit, data.marginType, data.margin, data.payTerms]);
            
            const costingId = costRes.rows[0].id;

            for (let item of data.items) {
                if (item.name || item.qty || item.cif) {
                    await client.query(`
                        INSERT INTO import_items (costing_id, name, qty, cif, remark)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [costingId, item.name, item.qty || 0, item.cif || 0, item.remark]);
                }
            }
        } 
        else if (type === 'domestic') {
            const costRes = await client.query(`
                INSERT INTO domestic_costings
                (customer, wht_rate, trk_cost, trk_from, trk_to, pay_terms)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
            `, [customer, data.whtRate, data.trkCost, data.trkFrom, data.trkTo, data.payTerms]);
            
            const costingId = costRes.rows[0].id;

            for (let i = 0; i < data.margins.length; i++) {
                let m = data.margins[i];
                await client.query(`
                    INSERT INTO domestic_margins (costing_id, margin_idx, name, val)
                    VALUES ($1, $2, $3, $4)
                `, [costingId, i, m.name, m.val]);
            }

            for (let item of data.items) {
                if (item.name || item.qtyKg || item.buyPrice) {
                    await client.query(`
                        INSERT INTO domestic_items (costing_id, name, qty_kg, buy_price, margin_idx, remark)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [costingId, item.name, item.qtyKg || 0, item.buyPrice || 0, item.marginIdx || 0, item.remark]);
                }
            }
        }

        await client.query('COMMIT'); // Commit Transaction
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK'); // Abort on error
        console.error('Save error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

app.get('/api/costings/:type', authenticateToken, async (req, res) => {
    const { type } = req.params;
    try {
        const table = type === 'import' ? 'import_costings' : 'domestic_costings';
        const result = await pool.query(`SELECT id, customer, created_at FROM ${table} ORDER BY created_at DESC`);
        
        // Prefix ID with type (e.g. 'import_4') so frontend knows which table to fetch from later
        const formattedRows = result.rows.map(r => ({ ...r, id: `${type}_${r.id}` }));
        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/costings/load/:type_id', authenticateToken, async (req, res) => {
    const { type_id } = req.params;
    const [type, id] = type_id.split('_'); // Split 'import_4' back into 'import' and '4'

    try {
        if (type === 'import') {
            const hRes = await pool.query('SELECT * FROM import_costings WHERE id = $1', [id]);
            if (hRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            
            const iRes = await pool.query('SELECT * FROM import_items WHERE costing_id = $1', [id]);
            const h = hRes.rows[0];

            // Reconstruct the JSON object exactly how frontend expects it
            res.json({
                shipType: h.ship_type, customer: h.customer, kurs: Number(h.kurs), 
                importDuty: Number(h.import_duty), wht: Number(h.wht), 
                portCharges: Number(h.port_charges), hedgeRate: Number(h.hedge_rate), 
                hedgeDays: h.hedge_days, tujuan: h.tujuan, isPipa: h.is_pipa, 
                stripping: Number(h.stripping), addCost: Number(h.add_cost), 
                commission: Number(h.commission), commUnit: h.comm_unit, 
                marginType: h.margin_type, margin: Number(h.margin), payTerms: h.pay_terms,
                items: iRes.rows.map(i => ({
                    id: Date.now() + Math.random(), // generate fresh unique ID for UI rendering
                    name: i.name, qty: Number(i.qty), cif: Number(i.cif), remark: i.remark
                }))
            });

        } else if (type === 'domestic') {
            const hRes = await pool.query('SELECT * FROM domestic_costings WHERE id = $1', [id]);
            if (hRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            
            const mRes = await pool.query('SELECT * FROM domestic_margins WHERE costing_id = $1 ORDER BY margin_idx ASC', [id]);
            const iRes = await pool.query('SELECT * FROM domestic_items WHERE costing_id = $1', [id]);
            const h = hRes.rows[0];

            res.json({
                customer: h.customer, whtRate: Number(h.wht_rate), 
                trkCost: Number(h.trk_cost), trkFrom: h.trk_from, trkTo: h.trk_to, payTerms: h.pay_terms,
                margins: mRes.rows.map(m => ({ name: m.name, val: Number(m.val) })),
                items: iRes.rows.map(i => ({
                    id: Date.now() + Math.random(),
                    name: i.name, qtyKg: Number(i.qty_kg), buyPrice: Number(i.buy_price), 
                    marginIdx: i.margin_idx, remark: i.remark
                }))
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/costings/:type_id', authenticateToken, async (req, res) => {
    const { type_id } = req.params;
    const [type, id] = type_id.split('_'); // Split 'import_4' back into 'import' and '4'

    if (type !== 'import' && type !== 'domestic') {
        return res.status(400).json({ error: 'Invalid type' });
    }
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    try {
        const table = type === 'import' ? 'import_costings' : 'domestic_costings';
        // Child rows are removed automatically via ON DELETE CASCADE
        const result = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- GOOGLE DRIVE EXPORT ENDPOINT ---
app.post('/api/export/drive', authenticateToken, async (req, res) => {
    const { filename, contentBase64 } = req.body;
    if (!filename || !contentBase64) {
        return res.status(400).json({ error: 'Missing filename or file content' });
    }

    try {
        const drive = getDrive();
        const buffer = Buffer.from(contentBase64, 'base64');
        const { Readable } = require('stream');

        const result = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [GDRIVE_FOLDER_ID]
            },
            media: {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                body: Readable.from(buffer)
            },
            fields: 'id, name, webViewLink',
            supportsAllDrives: true // required for Shared Drives
        });

        res.json({
            success: true,
            id: result.data.id,
            name: result.data.name,
            link: result.data.webViewLink
        });
    } catch (err) {
        console.error('Drive upload error:', err.message);
        res.status(500).json({ error: 'Drive upload failed: ' + err.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const serverPort = process.env.PORT || 3000;
app.listen(serverPort, () => {
    console.log(`Server running on port ${serverPort}`);
});