//======================================================
// UTILS.JS
//======================================================

//------------------------------------------------------
// Định dạng số
//------------------------------------------------------

function formatNumber(value){

    const num = Number(value || 0);

    return num.toLocaleString("vi-VN");

}

//------------------------------------------------------
// Định dạng ngày
//------------------------------------------------------

function formatDate(value){

    if(!value) return "--";

    const d = new Date(value);

    if(isNaN(d.getTime())){

        return value;

    }

    return d.toLocaleDateString("vi-VN");

}

//------------------------------------------------------
// Lấy tên xã từ GeoJSON
//------------------------------------------------------

function getName(feature){

    if(!feature) return "";

    const p = feature.properties || {};

    return (
        p["Tên xã"] ||
        p["TEN_XA"] ||
        p["ten_xa"] ||
        p["NAME"] ||
        p["name"] ||
        p["Name"] ||
        ""
    ).trim();

}

//------------------------------------------------------
// Có dữ liệu hay không
//------------------------------------------------------

function hasValue(value){

    return value!==null &&
           value!==undefined &&
           value!=="" &&
           value!=="0";

}

//------------------------------------------------------
// Chuyển sang số
//------------------------------------------------------

function toNumber(value){

    return Number(value || 0);

}

//------------------------------------------------------
// Cộng một trường
//------------------------------------------------------

function sumField(rows,field){

    return rows.reduce(function(sum,row){

        return sum + Number(row[field] || 0);

    },0);

}

//------------------------------------------------------
// Đếm số xã có dữ liệu
//------------------------------------------------------

function countField(rows,field){

    return rows.filter(function(row){

        return Number(row[field] || 0) > 0;

    }).length;

}

//------------------------------------------------------
// Màu trạng thái
//------------------------------------------------------

function getStatusColor(status){

    if(!status) return "#9E9E9E";

    status=status.toLowerCase();

    if(status.includes("có dịch"))
        return "#D32F2F";

    if(status.includes("hết dịch"))
        return "#388E3C";

    if(status.includes("đang"))
        return "#F57C00";

    if(status.includes("phun"))
        return "#1976D2";

    return "#757575";

}

//------------------------------------------------------
// Tạo dòng thông tin
//------------------------------------------------------

function createRow(label,value){

    if(
        value===undefined ||
        value===null ||
        value===""
    ){
        value="--";
    }

    return `
        <div class="info-row">
            <span>${label}</span>
            <span>${value}</span>
        </div>
    `;

}

//------------------------------------------------------
// Lấy phần tử HTML
//------------------------------------------------------

function $(id){

    return document.getElementById(id);

}
