//=========================================
// GOOGLE SHEETS API
//=========================================

const API_URL =
"https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

let gisData = {};

//=========================================
// LOAD DATA
//=========================================

async function loadGISData(){

    try{

        console.log("Đang tải dữ liệu...");

        const response = await fetch(API_URL);

        if(!response.ok){

            throw new Error(
                "Không đọc được API."
            );

        }

        const data =
            await response.json();

        gisData = {};

        data.forEach(row=>{

            const id = Number(
                row.ID
            );

            if(!isNaN(id)){

                gisData[id] = row;

            }

        });

        console.log(
            "Đã tải",
            Object.keys(gisData).length,
            "xã/phường."
        );

        return gisData;

    }
    catch(err){

        console.error(err);

        alert(
            "Không kết nối được Google Sheets."
        );

        return {};

    }

}

//=========================================
// LẤY DỮ LIỆU THEO ID
//=========================================

function getRowByID(id){

    return gisData[
        Number(id)
    ] || null;

}

//=========================================
// LẤY GIÁ TRỊ
//=========================================

function getField(id,field){

    const row =
        getRowByID(id);

    if(!row) return 0;

    return row[field];

}

//=========================================
// ĐỊNH DẠNG SỐ
//=========================================

function formatNumber(value){

    return Number(
        value || 0
    ).toLocaleString(
        "vi-VN"
    );

}

//=========================================
// KIỂM TRA DỮ LIỆU
//=========================================

function hasData(id){

    return gisData.hasOwnProperty(
        Number(id)
    );

}
