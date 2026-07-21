//======================================================
// SHEETS.JS
//======================================================

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

let sheetData = {};

//==============================
// LOAD GOOGLE SHEETS
//==============================

async function loadSheet(){

    try{

        const res = await fetch(SHEET_URL);

        const data = await res.json();

        buildSheetData(data);

    }catch(err){

        console.error(err);

    }

}

//==============================
// BUILD OBJECT THEO ID
//==============================

function buildSheetData(rows){

    sheetData = {};

    rows.forEach(row=>{

        const id = Number(row.ID);

        if(!isNaN(id)){

            sheetData[id] = row;

        }

    });

}

//==============================
// LẤY DỮ LIỆU XÃ
//==============================

function getRow(feature){

    const id = Number(feature.properties.ID);

    return sheetData[id] || null;

}

//==============================

function getRows(){

    return Object.values(sheetData);

}
