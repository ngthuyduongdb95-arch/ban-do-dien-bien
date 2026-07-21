//======================================================
// SHEETS.JS
//======================================================

// URL Apps Script Web App
const SHEET_URL = "";

// Toàn bộ dữ liệu Google Sheets
let sheetData = {};

//======================================================
// LOAD DỮ LIỆU
//======================================================

async function loadSheet(){

    if(!SHEET_URL){

        console.warn("Chưa cấu hình SHEET_URL");

        return;

    }

    try{

        const res = await fetch(SHEET_URL);

        if(!res.ok){

            throw new Error("Không đọc được Google Sheets");

        }

        const data = await res.json();

        buildSheetData(data);

    }

    catch(err){

        console.error(err);

    }

}
//======================================================
// CHUYỂN DANH SÁCH THÀNH OBJECT
//======================================================

function buildSheetData(rows){

    sheetData={};

    rows.forEach(row=>{

        const name=(row["Tên xã"]||"").trim();

        if(name){

            sheetData[name]=row;

        }

    });

}//======================================================
// LẤY DỮ LIỆU XÃ
//======================================================

function getRow(feature){

    const name=getName(feature);

    return sheetData[name] || null;

}//======================================================
// TÌM XÃ
//======================================================

function getByName(name){

    return sheetData[name] || null;

}

//======================================================
// DANH SÁCH
//======================================================

function getRows(){

    return Object.values(sheetData);

}
