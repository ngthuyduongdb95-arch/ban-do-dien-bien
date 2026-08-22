//======================================================
// SHEETS.JS
// Dữ liệu Google Sheets - giữ nguyên cách lấy dữ liệu cũ
//======================================================

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

let sheetData = {};
let sheetRows = [];
let sheetById = {};
let sheetByName = {};

//======================================================
// LOAD GOOGLE SHEETS
//======================================================

async function loadSheet(){

    try{

        const res = await fetch(SHEET_URL, {
            cache: "no-store"
        });

        if(!res.ok){
            throw new Error("Google Sheets HTTP " + res.status);
        }

        const data = await res.json();

        if(!Array.isArray(data)){
            throw new Error("Dữ liệu Google Sheets không phải mảng.");
        }

        buildSheetData(data);

        console.log(
            "Google Sheets: Đã tải",
            Object.keys(sheetData).length,
            "xã/phường"
        );

        return data;

    }catch(err){

        console.error(
            "Google Sheets: Không tải được dữ liệu",
            err
        );

        // Không xóa dữ liệu cũ nếu đang reload và request mới lỗi.
        return [];

    }

}

//======================================================
// BUILD OBJECT THEO ID
//======================================================

function normalizeSheetName(value){
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^(xa|phuong|thi tran)\s+/i, "");
}

function rowName(row){
    return row?.["Tên xã"] || row?.["Tên xã/phường"] || row?.TEN_XA || row?.TENXA || row?.NAME || row?.Name || row?.name || "";
}

function buildSheetData(rows){
    sheetRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
    sheetData = {};
    sheetById = {};
    sheetByName = {};

    sheetRows.forEach((row, index)=>{
        const id = Number(row.ID ?? row.id ?? row.Id ?? row.ID_XA ?? row.id_xa);
        const key = Number.isFinite(id) ? String(id) : `row_${index}`;
        sheetData[key] = row;

        if (Number.isFinite(id)) sheetById[id] = row;

        const nameKey = normalizeSheetName(rowName(row));
        if (nameKey && !sheetByName[nameKey]) sheetByName[nameKey] = row;
    });
}

//======================================================
// LẤY DỮ LIỆU XÃ - ƯU TIÊN ID, FALLBACK THEO TÊN
//======================================================

function getRow(feature){
    const props = feature?.properties || {};

    const rawId = props.ID ?? props.id ?? props.Id ?? props.ID_XA ?? props.id_xa;
    const id = Number(rawId);
    if (Number.isFinite(id) && sheetById[id]) return sheetById[id];

    const geoName = props["Tên xã"] || props["Tên xã/phường"] || props.TEN_XA || props.TENXA || props.NAME || props.Name || props.name || "";
    const target = normalizeSheetName(geoName);
    if (!target) return null;

    return sheetByName[target] || null;
}

//======================================================
// LẤY TOÀN BỘ DỮ LIỆU
//======================================================

function getRows(){

    return sheetRows.slice();

}
