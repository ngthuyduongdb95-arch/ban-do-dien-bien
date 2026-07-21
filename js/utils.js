//======================================================
// UTILS.JS
// Hàm dùng chung
//======================================================

//==============================
// ĐỊNH DẠNG SỐ
//==============================

function formatNumber(value){

    const num = Number(value);

    if(isNaN(num)) return "0";

    return num.toLocaleString("vi-VN");

}

//==============================
// ĐỊNH DẠNG NGÀY
//==============================

function formatDate(value){

    if(!value) return "--";

    const d = new Date(value);

    if(isNaN(d)) return value;

    return d.toLocaleDateString("vi-VN");

}//==============================
// LẤY TÊN XÃ
//==============================

function getName(feature){

    return feature.properties["Tên xã"] ||
           feature.properties["ten_xa"] ||
           feature.properties["NAME"] ||
           "";

}

//==============================
// TÌM DÒNG GOOGLE SHEET
//==============================

function getRow(feature){

    if(!window.sheetData) return null;

    const name = getName(feature).trim();

    return sheetData.find(r=>

        (r["Tên xã"]||"").trim()===name

    );

}//==============================
// KIỂM TRA CÓ DỮ LIỆU
//==============================

function hasValue(value){

    return !(

        value===null ||

        value===undefined ||

        value==="" ||

        value==="--"

    );

}

//==============================
// CHUYỂN SỐ
//==============================

function toNumber(value){

    return Number(value)||0;

}//==============================
// TỔNG
//==============================

function sumField(field){

    if(!window.sheetData) return 0;

    return sheetData.reduce((t,row)=>{

        return t+toNumber(row[field]);

    },0);

}

//==============================
// ĐẾM
//==============================

function countField(field){

    if(!window.sheetData) return 0;

    return sheetData.filter(r=>

        toNumber(r[field])>0

    ).length;

}//==============================
// MÀU THEO TRẠNG THÁI
//==============================

function getStatusColor(status){

    switch((status||"").toLowerCase()){

        case "có dịch":

            return "#E53935";

        case "an toàn":

            return "#43A047";

        case "đang xử lý":

            return "#FB8C00";

        default:

            return "#90A4AE";

    }

}
