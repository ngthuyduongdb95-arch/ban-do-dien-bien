//======================================================
// SHEETS.JS
//======================================================

// URL Apps Script Web App
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

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

        console.log("HTTP:", res.status);

        const data = await res.json();

        console.log("Google Sheets:", data);
        console.log("Số dòng:", data.length);

        function buildSheetData(rows){

    sheetData = {};

    rows.forEach(row => {

        const id = Number(row["ID"]);

        if(!isNaN(id)){

            sheetData[id] = row;

        }

    });

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
