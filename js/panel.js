//======================================================
// PANEL.JS
// WebGIS Điện Biên
//======================================================

//==============================
// PANEL
//==============================

const panel = document.getElementById("info-panel");

//==============================
// FORMAT
//==============================

function formatNumber(value){

    const num = Number(value);

    if(isNaN(num)) return "--";

    return num.toLocaleString("vi-VN");

}

function formatDate(value){

    if(!value) return "--";

    const d = new Date(value);

    if(isNaN(d)) return value;

    return d.toLocaleDateString("vi-VN");

}

//==============================
// TẠO DÒNG
//==============================

function createRow(label,value){

    return `

    <div class="info-row">

        <span>${label}</span>

        <span class="info-value">

            ${value ?? "--"}

        </span>

    </div>

    `;

}

//==============================
// TẠO CARD
//==============================

function createCard(title,color,content){

    return `

    <div class="info-card"
         style="border-left:5px solid ${color}">

        <h4>${title}</h4>

        ${content}

    </div>

    `;

}

//==============================
// XÓA PANEL
//==============================

function clearPanel(){

    if(!panel) return;

    panel.innerHTML = `

        <h3>

            Chọn xã/phường trên bản đồ

        </h3>

        <p style="margin-top:12px;color:#666;">

            Nhấn vào một xã/phường để xem
            thông tin chi tiết.

        </p>

    `;

}

//==============================
// KHỞI TẠO
//==============================

clearPanel();//==============================
// CARD DỊCH BỆNH
//==============================

function createDiseaseCard(options){

    const{

        icon="🐷",

        title="",

        color="#1976D2",

        status="--",

        outbreak=0,

        animalLabel="Tiêu hủy",

        animalValue=0,

        weight=null,

        date=null,

        days=null

    }=options;

    let html="";

    html+=createRow(
        "Trạng thái",
        status||"--"
    );

    html+=createRow(
        "Ổ dịch",
        outbreak||0
    );

    html+=createRow(
        animalLabel,
        `${formatNumber(animalValue)} con`
    );

    if(weight!==null){

        html+=createRow(
            "Khối lượng",
            `${formatNumber(weight)} kg`
        );

    }

    if(date!==null){

        html+=createRow(
            "Ngày cuối",
            formatDate(date)
        );

    }

    if(days!==null){

        html+=createRow(
            "Số ngày",
            days
        );

    }

    return createCard(

        `${icon} ${title}`,

        color,

        html

    );

}
//==============================
// CARD PHUN KHỬ TRÙNG
//==============================

function createSprayCard(row){

    let html="";

    html+=createRow(
        "Tiến độ",
        row["PHUN_Tiến độ"]||"--"
    );

    html+=createRow(
        "Vòng",
        row["PHUN_Vòng"]||"--"
    );

    html+=createRow(
        "Số hộ",
        formatNumber(row["PHUN_Số hộ"])
    );

    html+=createRow(
        "Diện tích",
        `${formatNumber(row["PHUN_Diện tích"])} m²`
    );

    html+=createRow(
        "Ngày",
        formatDate(row["PHUN_Ngày"])
    );

    return createCard(

        "🧴 PHUN KHỬ TRÙNG",

        "#00ACC1",

        html

    );

}


//==============================
// CARD KIỂM SOÁT GIẾT MỔ
//==============================

function createKSGMCard(row){

    let html="";

    html+=createRow(

        "Trạng thái",

        row["KSGM_Trạng thái"]||"--"

    );

    html+=createRow(

        "Số cơ sở",

        formatNumber(row["KSGM_Cơ sở"])

    );

    return createCard(

        "🏭 KIỂM SOÁT GIẾT MỔ",

        "#8D6E63",

        html

    );

}


//==============================
// CARD CƠ SỞ THUỐC THÚ Y
//==============================

function createDrugStoreCard(row){

    let html="";

    html+=createRow(

        "Số cơ sở",

        formatNumber(row["CSBBTTY_Cơ sở"])

    );

    return createCard(

        "💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y",

        "#43A047",

        html

    );

}


//==============================
// CARD BỆNH DẠI
//==============================

function createRabiesCard(row){

    let html="";

    html+=createRow(
        "Trạng thái",
        row["DAI_Trạng thái"]||"--"
    );

    html+=createRow(
        "Ổ dịch",
        row["DAI_Ổ dịch"]||0
    );

    html+=createRow(
        "Số chết",
        `${formatNumber(row["DAI_Chết"])} con`
    );

    html+=createRow(
        "Ngày cuối",
        formatDate(row["DAI_Ngày cuối"])
    );

    html+=createRow(
        "Số ngày",
        row["DAI_Số ngày"]||"--"
    );

    return createCard(

        "🐕 BỆNH DẠI",

        "#43A047",

        html

    );

}//======================================================
// HIỂN THỊ PANEL
//======================================================

function showPanel(feature){

    if(!panel) return;

    const row = getRow(feature);

    if(!row){

        clearPanel();

        return;

    }

    let html = `
        <h2 class="panel-title">
            📍 ${getName(feature)}
        </h2>
    `;

    //==================================================
    // DTLCP
    //==================================================

    if(
        row["DTLCP_Trạng thái"] ||
        Number(row["DTLCP_Ổ dịch"])>0 ||
        Number(row["DTLCP_Chết"])>0
    ){

        html += createDiseaseCard({

            icon:"🐷",

            title:"DỊCH TẢ LỢN CHÂU PHI",

            color:"#E53935",

            status:row["DTLCP_Trạng thái"],

            outbreak:row["DTLCP_Ổ dịch"],

            animalLabel:"Tiêu hủy",

            animalValue:row["DTLCP_Chết"],

            weight:row["DTLCP_Trọng lượng"],

            date:row["DTLCP_Ngày cuối"],

            days:row["DTLCP_Số ngày"]

        });

    }


    //==================================================
    // CÚM GIA CẦM
    //==================================================

    if(
        row["CGC_Trạng thái"] ||
        Number(row["CGC_Ổ dịch"])>0 ||
        Number(row["CGC_Chết"])>0
    ){

        html += createDiseaseCard({

            icon:"🐔",

            title:"CÚM GIA CẦM",

            color:"#FB8C00",

            status:row["CGC_Trạng thái"],

            outbreak:row["CGC_Ổ dịch"],

            animalLabel:"Tiêu hủy",

            animalValue:row["CGC_Chết"],

            weight:row["CGC_Trọng lượng"],

            date:row["CGC_Ngày cuối"],

            days:row["CGC_Số ngày"]

        });

    }    //==================================================
    // VIÊM DA NỔI CỤC
    //==================================================

    if(
        row["VDNC_Trạng thái"] ||
        Number(row["VDNC_Ổ dịch"]) > 0 ||
        Number(row["VDNC_Mắc"]) > 0 ||
        Number(row["VDNC_Chết"]) > 0
    ){

        let vdnc = "";

        vdnc += createRow(
            "Trạng thái",
            row["VDNC_Trạng thái"] || "--"
        );

        vdnc += createRow(
            "Ổ dịch",
            row["VDNC_Ổ dịch"] || 0
        );

        vdnc += createRow(
            "Mắc",
            `${formatNumber(row["VDNC_Mắc"])} con`
        );

        vdnc += createRow(
            "Chết",
            `${formatNumber(row["VDNC_Chết"])} con`
        );

        vdnc += createRow(
            "Khối lượng",
            `${formatNumber(row["VDNC_Trọng lượng"])} kg`
        );

        vdnc += createRow(
            "Ngày cuối",
            formatDate(row["VDNC_Ngày cuối"])
        );

        vdnc += createRow(
            "Số ngày",
            row["VDNC_Số ngày"] || "--"
        );

        html += createCard(
            "🐄 VIÊM DA NỔI CỤC",
            "#8E24AA",
            vdnc
        );

    }


    //==================================================
    // PHUN KHỬ TRÙNG
    //==================================================

    if(
        row["PHUN_Tiến độ"] ||
        Number(row["PHUN_Số hộ"]) > 0
    ){

        html += createSprayCard(row);

    }


    //==================================================
    // KIỂM SOÁT GIẾT MỔ
    //==================================================

    if(
        row["KSGM_Trạng thái"] ||
        Number(row["KSGM_Cơ sở"]) > 0
    ){

        html += createKSGMCard(row);

    }


    //==================================================
    // CƠ SỞ BUÔN BÁN THUỐC THÚ Y
    //==================================================

    if(
        Number(row["CSBBTTY_Cơ sở"]) > 0
    ){

        html += createDrugStoreCard(row);

    }


    //==================================================
    // KHÔNG CÓ DỮ LIỆU
    //==================================================

    if(html.indexOf("info-card") === -1){

        html += `

            <div class="info-card">

                <p style="text-align:center">

                    Không có dữ liệu chi tiết.

                </p>

            </div>

        `;

    }


    panel.innerHTML = html;

}
