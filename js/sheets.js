//======================================================
// SHEETS.JS
// Dữ liệu Google Sheets - giữ nguyên cách lấy dữ liệu cũ
//======================================================

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

let sheetData = {};

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

function buildSheetData(rows){

    const nextData = {};

    rows.forEach(row=>{

        if(!row) return;

        const id = Number(row.ID);

        if(!isNaN(id)){

            nextData[id] = row;

        }

    });

    sheetData = nextData;

}

//======================================================
// LẤY DỮ LIỆU XÃ
//======================================================

function getRow(feature){

    const id = Number(
        feature?.properties?.ID
    );

    return sheetData[id] || null;

}

//======================================================
// LẤY TOÀN BỘ DỮ LIỆU
//======================================================

function getRows(){

    return Object.values(sheetData);

}
