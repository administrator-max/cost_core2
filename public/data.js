// ═══ DATA CONSTANTS ═══
// Pricing logic, shipping parameters, and static dropdowns

const TRK_BB = {
    Cakung: { r: 36000, rt: 1800000 },
    Marunda: { r: 36000, rt: 1800000 },
    "Ujung Menteng": { r: 38400, rt: 1920000 },
    Bekasi: { r: 42000, rt: 2100000 },
    "Dadap / Kapuk": { r: 46000, rt: 2300000 },
    Cibitung: { r: 48000, rt: 2400000 },
    Tambun: { r: 48000, rt: 2400000 },
    Cikarang: { r: 52800, rt: 2640000 },
    Cileungsi: { r: 52800, rt: 2640000 },
    Depok: { r: 54000, rt: 2700000 },
    Tigaraksa: { r: 55200, rt: 2760000 },
    "Curug Tanggerang": { r: 55200, rt: 2760000 },
    "Pasar Kemis": { r: 55200, rt: 2760000 },
    Jatake: { r: 57600, rt: 2880000 },
    Balaraja: { r: 60000, rt: 3000000 },
    Karawang: { r: 60000, rt: 3000000 },
    Cikande: { r: 72000, rt: 3600000 },
    Purwakarta: { r: 78000, rt: 3900000 },
    "Serang Banten": { r: 84000, rt: 4200000 },
    Cilegon: { r: 96000, rt: 4800000 }
};

const TRK_CT = {
    Cakung: { f20: 1440000, f40: 1800000, cb: 2160000 },
    Marunda: { f20: 1440000, f40: 1800000, cb: 2160000 },
    Tambun: { f20: 1920000, f40: 2160000, cb: 2640000 },
    "Dadap / Kapuk": { f20: 2000000, f40: 2250000, cb: 2750000 },
    Cibitung: { f20: 2040000, f40: 2280000, cb: 2760000 },
    Cikarang: { f20: 2160000, f40: 2520000, cb: 3000000 },
    Cileungsi: { f20: 2160000, f40: 2520000, cb: 3000000 },
    Tigaraksa: { f20: 2280000, f40: 2640000, cb: 3120000 },
    "Curug Tanggerang": { f20: 2280000, f40: 2640000, cb: 3120000 },
    "Pasar Kemis": { f20: 2280000, f40: 2640000, cb: 3120000 },
    Karawang: { f20: 2640000, f40: 3000000, cb: 3360000 },
    Balaraja: { f20: 2760000, f40: 3000000, cb: 3600000 },
    "Serang Banten": { f20: 3120000, f40: 3480000, cb: 3960000 },
    Purwakarta: { f20: 3240000, f40: 3480000, cb: 3960000 }
};

const PBM_MAP = { breakbulk: 230, container20: 350, container40: 509 };

const PAY_OPTS = [
    "Cash Before Delivery (CBD)",
    "DP 50% + Balance Before Delivery",
    "DP 30% + Balance Before Delivery",
    "DP 10%, Balance Payment 90% 3 days after BL",
    "Full Payment 100% Before Delivery",
    "Cash on Delivery (COD)",
    "NET 7 Days",
    "NET 14 Days",
    "NET 30 Days"
];