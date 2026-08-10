






Tổng hợp số liệu thú y.xlsx
Spreadsheet










Fri, Jul 17 at 7:28 AM



dienbien_xa(5).geojson
File





index(4).html
File

map.js
JavaScript



Tổng hợp số liệu thú y(1).xlsx
Spreadsheet
mình có e này




dienbien_xa(6).geojson
File



map (1).js
JavaScript


style (2)(2).css
File

sheets(2).js
JavaScript

index (1)(2).html
File





32(103).JPG
32(104).JPG

như này là sao


Văn bản đã dán (1)(21).txt
Document


sheets (1).js
JavaScript

index (2).html
File





map (2).js
JavaScript


index (3).html
File

style (3).css
File


dienbien_xa(7).geojson
File

sheets (2).js
JavaScript

index (3)(1).html
File

style (3)(1).css
File


dienbien_xa (2).geojson
File

sheets (2)(1).js
JavaScript

index (3)(2).html
File

style (3)(2).css
File

map (2)(1).js
JavaScript

phần này mình chưa ưng

bên phải hiển thị thế này là đc và mình muốn phần bản đồ to hơn, b sửa lại code

Generated image: Bản đồ giám sát dịch tả lợn


Edit



Tổng hợp số liệu thú y (1).xlsx
Spreadsheet


Văn bản đã dán (1)(22).txt
Document
b xem có chưa

cũng ok r, nhưng mình mốn chỉnh panel giống phần hiện lên khi chỉ vào xã, bên trái thể hiện số liệu toàn tỉnh, biểu đò rộng hơn



style (5).css
File


Văn bản đã dán (1)(23).txt
Document


Văn bản đã dán (1)(24).txt
Document




Văn bản đã dán (1)(25).txt
Document


Văn bản đã dán (1)(26).txt
Document


utils.js
JavaScript









Văn bản đã dán (1)(27).txt
Document



Văn bản đã dán (1)(28).txt
Document



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

    return 

    <div class="info-row">

        <span>${label}</span>

        <span class="info-value">

            ${value ?? "--"}

        </span>

    </div>

    ;

}

//==============================
// TẠO CARD
//==============================

function createCard(title,color,content){

    return 

    <div class="info-card"
         style="border-left:5px solid ${color}">

        <h4>${title}</h4>

        ${content}

    </div>

    ;

}

//==============================
// XÓA PANEL
//==============================

function clearPanel(){

    if(!panel) return;

    panel.innerHTML = 

        <h3>

            Chọn xã/phường trên bản đồ

        </h3>

        <p style="margin-top:12px;color:#666;">

            Nhấn vào một xã/phường để xem
            thông tin chi tiết.

        </p>

    ;

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
        ${formatNumber(animalValue)} con
    );

    if(weight!==null){

        html+=createRow(
            "Khối lượng",
            ${formatNumber(weight)} kg
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

        ${icon} ${title},

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
        ${formatNumber(row["PHUN_Diện tích"])} m²
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
        ${formatNumber(row["DAI_Chết"])} con
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
console.log("showPanel chạy");
    if(!panel) return;

    const row = getRow(feature);

    if(!row){

        clearPanel();

        return;

    }

    let html = 
    <h2 class="panel-title">
        📍 ${row["Tên xã"] || getName(feature)}
    </h2>
;

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
            ${formatNumber(row["VDNC_Mắc"])} con
        );

        vdnc += createRow(
            "Chết",
            ${formatNumber(row["VDNC_Chết"])} con
        );

        vdnc += createRow(
            "Khối lượng",
            ${formatNumber(row["VDNC_Trọng lượng"])} kg
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

        html += 

            <div class="info-card">

                <p style="text-align:center">

                    Không có dữ liệu chi tiết.

                </p>

            </div>

        ;

    }


    panel.innerHTML = html;

}



Văn bản đã dán (1)(29).txt
Document

mình đã làm hết r



Văn bản đã dán (1)(30).txt
Document

thôi bây giờ mình muốn sửa lại sao cho bản đồ nổi hơn so với vùng xung quanh

lỗi sau khi đổi màu, ko phải tạo ảnh


màu quê quá t muốn bỏ đg viền

Generated image: Bảng điều khiển GIS dịch bệnh động vật


Edit


ko taoj anhr, hayx suawr looix

teen xax bi de leen nhau


Văn bản đã dán (1)(31).txt
Document

vẫn đè nhau


Văn bản đã dán (1)(32).txt
Document

Wed, Jul 22 at 1:52 PM


Văn bản đã dán (1)(33).txt
Document



Văn bản đã dán (1)(34).txt
Document


Văn bản đã dán (1)(36).txt
Document

PHUN:{

        field:"PHUN_Vòng",

        title:"Các xã đã triển khai Tháng VSKTTĐ",

        unit:"vòng",

         breaks:[
         0,
         0.5,
         1.5,
         2.5
    ],

    color:[
        "#C8E2B1",   // 0 - Chưa triển khai
        "#83C75D",   // 1 - Vòng 1
        "#5BBD2B",   // 2 - Vòng 2
        "#489620",   // 3 - Vòng 3
        "#367517"    // 4 - Vòng 4 
    ] tôi muốn sửa chú thích

 KSGM:{

        field:"KSGM_Trạng thái",

        title:"Kiểm soát giết mổ",

        unit:"trạng thái",

        color:[
            "#B2F5EA",
            "#0F766E"
        ] tôi muốn sửa theo số lượng cơ sở giết mổ và xã đó đã triển khai ksgm chưa


Văn bản đã dán (1)(37).txt
Document
 b xem có nhầm lẫn j ko



Văn bản đã dán (1)(38).txt
Document


Văn bản đã dán (1)(39).txt
Document

Generated image: Bản đồ giám sát dịch bệnh động vật


Edit



Văn bản đã dán (1)(40).txt
Document



Văn bản đã dán (1)(41).txt
Document

 chuaw hopqj lys


Văn bản đã dán (1)(42).txt
Document


Văn bản đã dán (1)(43).txt
Document
 hết lỗi chưa


Văn bản đã dán (1)(44).txt
Document
tôi cần sửa những gì



Văn bản đã dán (1)(45).txt
Document


Văn bản đã dán (1)(47).txt
Document

Sun, Aug 2 at 10:16 AM

Văn bản đã dán (1)(48).txt
Document


Văn bản đã dán (1)(49).txt
Document

Generated image


Edit


Generated image


Edit



Đã xử lý trong 42s
Được. Mình đã đối chiếu với cấu trúc dữ liệu hiện tại của map.js: dữ liệu đang có các trường DTLCP_Trạng thái, DTLCP_Chết, DTLCP_Trọng lượng, CGC_..., VDNC_Mắc, KSGM_Cơ sở, CSBBTTY_Cơ sở. 

Lưu ý: dữ liệu hiện tại chưa có trường riêng DTLCP_Tiêu hủy và CGC_Tiêu hủy; code hiện đang dùng trường Chết để hiển thị Tiêu hủy. 

 Vì vậy mình không tự tách hai số này thành hai chỉ tiêu khác nhau khi chưa có cột dữ liệu tương ứng.

1. Thay phần Tổng quan bằng hàm này
//======================================================
// TỔNG QUAN TOÀN TỈNH
//======================================================

function updateOverview(){

    const rows = getRows();

    if(!rows || !rows.length) return;

    const num = v => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const format = v =>
        num(v).toLocaleString("vi-VN");

    // -------------------------
    // DTLCP
    // -------------------------

    const dtlcpLuyKe = rows.filter(r =>
        r["DTLCP_Trạng thái"] === "Đang có dịch" ||
        r["DTLCP_Trạng thái"] === "Đã qua 21 ngày"
    ).length;

    const dtlcpDangDich = rows.filter(r =>
        r["DTLCP_Trạng thái"] === "Đang có dịch"
    ).length;

    const dtlcpChet = rows.reduce(
        (s,r) => s + num(r["DTLCP_Chết"]), 0
    );

    const dtlcpTrongLuong = rows.reduce(
        (s,r) => s + num(r["DTLCP_Trọng lượng"]), 0
    );


    // -------------------------
    // CGC
    // -------------------------

    const cgcLuyKe = rows.filter(r =>
        r["CGC_Trạng thái"] === "Đang có dịch" ||
        r["CGC_Trạng thái"] === "Đã qua 21 ngày"
    ).length;

    const cgcDangDich = rows.filter(r =>
        r["CGC_Trạng thái"] === "Đang có dịch"
    ).length;

    const cgcChet = rows.reduce(
        (s,r) => s + num(r["CGC_Chết"]), 0
    );

    const cgcTrongLuong = rows.reduce(
        (s,r) => s + num(r["CGC_Trọng lượng"]), 0
    );


    // -------------------------
    // VDNC
    // -------------------------

    const vdncLuyKe = rows.filter(r =>
        r["VDNC_Trạng thái"] === "Đang có dịch" ||
        r["VDNC_Trạng thái"] === "Đã qua 21 ngày"
    ).length;

    const vdncDangDich = rows.filter(r =>
        r["VDNC_Trạng thái"] === "Đang có dịch"
    ).length;

    const vdncMac = rows.reduce(
        (s,r) => s + num(r["VDNC_Mắc"]), 0
    );


    // -------------------------
    // KSGM
    // -------------------------

    const ksgmSoCoSo = rows.reduce(
        (s,r) => s + num(r["KSGM_Cơ sở"]), 0
    );

    const ksgmSoXa = rows.filter(r =>
        r["KSGM_Trạng thái"] === "Đã triển khai"
    ).length;


    // -------------------------
    // BBTTY
    // -------------------------

    const bbttySoCoSo = rows.reduce(
        (s,r) => s + num(r["CSBBTTY_Cơ sở"]), 0
    );

    const bbttySoXa = rows.filter(r =>
        num(r["CSBBTTY_Cơ sở"]) > 0
    ).length;


    // -------------------------
    // HIỂN THỊ
    // -------------------------

    const panel = document.getElementById("info-panel");

    if(!panel) return;


    panel.innerHTML = `

    <div class="overview-panel">

        <div class="overview-header">
            <div>
                <div class="overview-title">
                    TỔNG QUAN TOÀN TỈNH
                </div>

                <div class="overview-subtitle">
                    Tình hình dịch bệnh và mạng lưới cơ sở
                </div>
            </div>
        </div>


        <!-- DTLCP -->

        <div class="overview-card dtlcp">

            <div class="overview-card-title">
                🐖 DỊCH TẢ LỢN CHÂU PHI
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số xã có dịch lũy kế</span>
                    <strong>${format(dtlcpLuyKe)} xã</strong>
                </div>

                <div>
                    <span>Số xã đang có dịch</span>
                    <strong>${format(dtlcpDangDich)} xã</strong>
                </div>

                <div>
                    <span>Số lợn chết</span>
                    <strong>${format(dtlcpChet)} con</strong>
                </div>

                <div>
                    <span>Số lợn tiêu hủy</span>
                    <strong>${format(dtlcpChet)} con</strong>
                </div>

                <div class="wide">
                    <span>Tổng trọng lượng tiêu hủy</span>
                    <strong>${format(dtlcpTrongLuong)} kg</strong>
                </div>

            </div>

        </div>


        <!-- CGC -->

        <div class="overview-card cgc">

            <div class="overview-card-title">
                🐔 CÚM GIA CẦM
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số xã có dịch lũy kế</span>
                    <strong>${format(cgcLuyKe)} xã</strong>
                </div>

                <div>
                    <span>Số xã đang có dịch</span>
                    <strong>${format(cgcDangDich)} xã</strong>
                </div>

                <div>
                    <span>Số gia cầm chết</span>
                    <strong>${format(cgcChet)} con</strong>
                </div>

                <div>
                    <span>Số gia cầm tiêu hủy</span>
                    <strong>${format(cgcChet)} con</strong>
                </div>

                <div class="wide">
                    <span>Tổng trọng lượng tiêu hủy</span>
                    <strong>${format(cgcTrongLuong)} kg</strong>
                </div>

            </div>

        </div>


        <!-- VDNC -->

        <div class="overview-card vdnc">

            <div class="overview-card-title">
                🐄 VIÊM DA NỔI CỤC
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số xã có dịch lũy kế</span>
                    <strong>${format(vdncLuyKe)} xã</strong>
                </div>

                <div>
                    <span>Số xã đang có dịch</span>
                    <strong>${format(vdncDangDich)} xã</strong>
                </div>

                <div class="wide">
                    <span>Số gia súc mắc bệnh</span>
                    <strong>${format(vdncMac)} con</strong>
                </div>

            </div>

        </div>


        <!-- KSGM -->

        <div class="overview-card ksgm">

            <div class="overview-card-title">
                🔪 KIỂM SOÁT GIẾT MỔ
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số cơ sở</span>
                    <strong>${format(ksgmSoCoSo)} cơ sở</strong>
                </div>

                <div>
                    <span>Số xã đã triển khai</span>
                    <strong>${format(ksgmSoXa)} xã</strong>
                </div>

            </div>

        </div>


        <!-- BBTTY -->

        <div class="overview-card bbtty">

            <div class="overview-card-title">
                💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số cơ sở</span>
                    <strong>${format(bbttySoCoSo)} cơ sở</strong>
                </div>

                <div>
                    <span>Số xã có cơ sở</span>
                    <strong>${format(bbttySoXa)} xã</strong>
                </div>

            </div>

        </div>

    </div>
    `;
}
2. Thêm CSS
Cuối style.css:

.overview-panel{
    padding:4px;
}

.overview-title{
    font-size:21px;
    font-weight:800;
    color:#172033;
}

.overview-subtitle{
    margin-top:4px;
    font-size:13px;
    color:#64748b;
}

.overview-card{
    margin-top:14px;
    padding:14px;
    border-radius:14px;
    background:#fff;
    box-shadow:0 2px 10px rgba(15,23,42,.08);
    border-left:4px solid #64748b;
}

.overview-card-title{
    font-size:15px;
    font-weight:800;
    margin-bottom:12px;
}

.overview-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
}

.overview-grid > div{
    padding:9px 10px;
    border-radius:10px;
    background:#f8fafc;
}

.overview-grid .wide{
    grid-column:1 / -1;
}

.overview-grid span{
    display:block;
    font-size:12px;
    color:#64748b;
    line-height:1.35;
}

.overview-grid strong{
    display:block;
    margin-top:4px;
    font-size:17px;
    font-weight:800;
    color:#172033;
}

.overview-card.dtlcp{
    border-left-color:#009298;
}

.overview-card.cgc{
    border-left-color:#A2007C;
}

.overview-card.vdnc{
    border-left-color:#2563EB;
}

.overview-card.ksgm{
    border-left-color:#0288D1;
}

.overview-card.bbtty{
    border-left-color:#5E35B1;
}

@media(max-width:600px){

    .overview-title{
        font-size:18px;
    }

    .overview-card{
        padding:11px;
        margin-top:10px;
    }

    .overview-grid{
        gap:7px;
    }

    .overview-grid strong{
        font-size:15px;
    }

}
3. Quan trọng: gọi hàm
Sau khi dữ liệu Google Sheet được tải xong, gọi:

updateOverview();
Nếu bạn muốn bấm “Tổng quan” là hiện bảng này, chỗ xử lý nút Tổng quan chỉ cần:

updateOverview();
Có một điểm mình chưa tự ý sửa
Trong dữ liệu hiện tại, DTLCP_Chết và CGC_Chết đang là trường duy nhất được code dùng để tính/hiển thị tiêu hủy; mình chưa tìm thấy trường riêng DTLCP_Tiêu hủy hoặc CGC_Tiêu hủy. 

Vì vậy đoạn trên đang hiển thị:

Số lợn chết = Số lợn tiêu hủy

chỉ vì nguồn dữ liệu hiện tại chưa tách hai trường này. Nếu Google Sheet của bạn thực tế có cột chết và tiêu hủy riêng, gửi tên chính xác 2 cột đó cho mình, mình sẽ sửa đúng ngay, không dùng chung nữa.


chưa có function updateOverview(){  

Đúng. Nếu code hiện tại của bạn chưa có function updateOverview(){} thì không thể chỉ gọi updateOverview(); được.

Với code GIS hiện tại, mình khuyên không thêm updateOverview() vội. Mình sẽ sửa trực tiếp vào cấu trúc đang có của map.js, vì file hiện tại đã có updateLegend(), drawLabels(), getValue(), popupContent()… và đang có dấu hiệu trùng layerSelect/legend. 

Nếu mục đích của bạn là sửa lỗi GIS thuốc thú y lúc trước (FILE_GIS is not defined), thì nói đúng phần đó, mình sẽ sửa trực tiếp code hiện tại, không tạo thêm updateOverview().

Bạn gửi cho mình đoạn code hiện tại của Code.gs và map.js (hoặc nói “dùng file vừa gửi”), mình sửa thành bản hoàn chỉnh để copy đè, tránh phát sinh thêm function không tồn tại.



Pasted text.txt
Document

Đúng rồi. Mình đã xem đúng file MAP.JS V3 bạn vừa gửi. Trong file này chưa có updateOverview(); phần Tổng quan hiện tại đang gọi updateDashboard() ở refreshMap() và loadGeoJSON(). 

Vì vậy không thêm updateOverview(). Ta sửa đúng hệ thống hiện tại bằng cách thay updateDashboard().

Làm như sau
Tìm đoạn hiện tại ở khoảng dòng 1001:

//======================================================
// CẬP NHẬT DASHBOARD
//======================================================

function updateDashboard(){

    if(typeof dashboard==="undefined") return;

    dashboard.update();

}
Xóa toàn bộ đoạn đó và thay bằng:

//======================================================
// CẬP NHẬT TỔNG QUAN
//======================================================

function updateDashboard(){

    const rows = getRows();

    if(!rows || !rows.length) return;

    const num = v => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const fmt = v => num(v).toLocaleString("vi-VN");


    //==================================================
    // DTLCP
    //==================================================

    const dtlcpLuyKe = rows.filter(r =>
        r["DTLCP_Trạng thái"] === "Đang có dịch" ||
        r["DTLCP_Trạng thái"] === "Đã qua 21 ngày"
    ).length;

    const dtlcpDangDich = rows.filter(r =>
        r["DTLCP_Trạng thái"] === "Đang có dịch"
    ).length;

    const dtlcpChet = rows.reduce(
        (s,r) => s + num(r["DTLCP_Chết"]), 0
    );

    const dtlcpTrongLuong = rows.reduce(
        (s,r) => s + num(r["DTLCP_Trọng lượng"]), 0
    );


    //==================================================
    // CGC
    //==================================================

    const cgcLuyKe = rows.filter(r =>
        r["CGC_Trạng thái"] === "Đang có dịch" ||
        r["CGC_Trạng thái"] === "Đã qua 21 ngày"
    ).length;

    const cgcDangDich = rows.filter(r =>
        r["CGC_Trạng thái"] === "Đang có dịch"
    ).length;

    const cgcChet = rows.reduce(
        (s,r) => s + num(r["CGC_Chết"]), 0
    );

    const cgcTrongLuong = rows.reduce(
        (s,r) => s + num(r["CGC_Trọng lượng"]), 0
    );


    //==================================================
    // VDNC
    //==================================================

    const vdncLuyKe = rows.filter(r =>
        r["VDNC_Trạng thái"] === "Đang có dịch" ||
        r["VDNC_Trạng thái"] === "Đã qua 21 ngày"
    ).length;

    const vdncDangDich = rows.filter(r =>
        r["VDNC_Trạng thái"] === "Đang có dịch"
    ).length;

    const vdncMac = rows.reduce(
        (s,r) => s + num(r["VDNC_Mắc"]), 0
    );


    //==================================================
    // KSGM
    //==================================================

    const ksgmCoSo = rows.reduce(
        (s,r) => s + num(r["KSGM_Cơ sở"]), 0
    );

    const ksgmXa = rows.filter(r =>
        r["KSGM_Trạng thái"] === "Đã triển khai"
    ).length;


    //==================================================
    // BBTTY
    //==================================================

    const bbttyCoSo = rows.reduce(
        (s,r) => s + num(r["CSBBTTY_Cơ sở"]), 0
    );

    const bbttyXa = rows.filter(r =>
        num(r["CSBBTTY_Cơ sở"]) > 0
    ).length;


    //==================================================
    // TÌM PANEL TỔNG QUAN HIỆN TẠI
    //==================================================

    const panel =
        document.querySelector("#info-panel") ||
        document.querySelector(".info-panel") ||
        document.querySelector("#dashboard") ||
        document.querySelector(".dashboard");

    if(!panel) return;


    //==================================================
    // GIAO DIỆN TỔNG QUAN
    //==================================================

    panel.innerHTML = `

    <div class="overview">

        <div class="overview-head">
            <div class="overview-title">
                TỔNG QUAN TOÀN TỈNH
            </div>

            <div class="overview-subtitle">
                Tình hình dịch bệnh và mạng lưới cơ sở
            </div>
        </div>


        <!-- DTLCP -->

        <div class="overview-card dtlcp">

            <div class="overview-card-title">
                🐖 DỊCH TẢ LỢN CHÂU PHI
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số xã có dịch lũy kế</span>
                    <b>${fmt(dtlcpLuyKe)} xã</b>
                </div>

                <div>
                    <span>Số xã đang có dịch</span>
                    <b>${fmt(dtlcpDangDich)} xã</b>
                </div>

                <div>
                    <span>Số lợn chết</span>
                    <b>${fmt(dtlcpChet)} con</b>
                </div>

                <div>
                    <span>Số lợn tiêu hủy</span>
                    <b>${fmt(dtlcpChet)} con</b>
                </div>

                <div class="wide">
                    <span>Tổng trọng lượng tiêu hủy</span>
                    <b>${fmt(dtlcpTrongLuong)} kg</b>
                </div>

            </div>

        </div>


        <!-- CGC -->

        <div class="overview-card cgc">

            <div class="overview-card-title">
                🐔 CÚM GIA CẦM
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số xã có dịch lũy kế</span>
                    <b>${fmt(cgcLuyKe)} xã</b>
                </div>

                <div>
                    <span>Số xã đang có dịch</span>
                    <b>${fmt(cgcDangDich)} xã</b>
                </div>

                <div>
                    <span>Số gia cầm chết</span>
                    <b>${fmt(cgcChet)} con</b>
                </div>

                <div>
                    <span>Số gia cầm tiêu hủy</span>
                    <b>${fmt(cgcChet)} con</b>
                </div>

                <div class="wide">
                    <span>Tổng trọng lượng tiêu hủy</span>
                    <b>${fmt(cgcTrongLuong)} kg</b>
                </div>

            </div>

        </div>


        <!-- VDNC -->

        <div class="overview-card vdnc">

            <div class="overview-card-title">
                🐄 VIÊM DA NỔI CỤC
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số xã có dịch lũy kế</span>
                    <b>${fmt(vdncLuyKe)} xã</b>
                </div>

                <div>
                    <span>Số xã đang có dịch</span>
                    <b>${fmt(vdncDangDich)} xã</b>
                </div>

                <div class="wide">
                    <span>Số gia súc mắc bệnh</span>
                    <b>${fmt(vdncMac)} con</b>
                </div>

            </div>

        </div>


        <!-- KSGM -->

        <div class="overview-card ksgm">

            <div class="overview-card-title">
                🔪 KIỂM SOÁT GIẾT MỔ
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số cơ sở</span>
                    <b>${fmt(ksgmCoSo)} cơ sở</b>
                </div>

                <div>
                    <span>Số xã đã triển khai</span>
                    <b>${fmt(ksgmXa)} xã</b>
                </div>

            </div>

        </div>


        <!-- BBTTY -->

        <div class="overview-card bbtty">

            <div class="overview-card-title">
                💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y
            </div>

            <div class="overview-grid">

                <div>
                    <span>Số cơ sở</span>
                    <b>${fmt(bbttyCoSo)} cơ sở</b>
                </div>

                <div>
                    <span>Số xã có cơ sở</span>
                    <b>${fmt(bbttyXa)} xã</b>
                </div>

            </div>

        </div>

    </div>
    `;
}
Sau đó thêm CSS
Thêm cuối CSS hiện tại:

/* ==========================================
   TỔNG QUAN TOÀN TỈNH
========================================== */

.overview{
    padding:4px;
}

.overview-head{
    padding:4px 2px 10px;
}

.overview-title{
    font-size:20px;
    font-weight:800;
    color:#172033;
}

.overview-subtitle{
    margin-top:3px;
    font-size:12px;
    color:#64748b;
}

.overview-card{
    margin-bottom:12px;
    padding:13px;
    border-radius:14px;
    background:#fff;
    border-left:4px solid #64748b;
    box-shadow:0 3px 12px rgba(15,23,42,.08);
}

.overview-card-title{
    margin-bottom:10px;
    font-size:14px;
    font-weight:800;
    color:#172033;
}

.overview-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
}

.overview-grid > div{
    padding:9px;
    background:#f8fafc;
    border-radius:9px;
}

.overview-grid .wide{
    grid-column:1 / -1;
}

.overview-grid span{
    display:block;
    font-size:11px;
    line-height:1.35;
    color:#64748b;
}

.overview-grid b{
    display:block;
    margin-top:4px;
    font-size:16px;
    color:#172033;
}

.overview-card.dtlcp{
    border-left-color:#009298;
}

.overview-card.cgc{
    border-left-color:#A2007C;
}

.overview-card.vdnc{
    border-left-color:#2563EB;
}

.overview-card.ksgm{
    border-left-color:#0288D1;
}

.overview-card.bbtty{
    border-left-color:#5E35B1;
}

@media(max-width:600px){

    .overview-title{
        font-size:18px;
    }

    .overview-card{
        padding:10px;
        margin-bottom:9px;
    }

    .overview-grid{
        gap:6px;
    }

    .overview-grid b{
        font-size:14px;
    }

}
Có 1 điểm cần sửa tiếp
Trong file bạn gửi, DTLCP_Chết đang được code gọi là “Tiêu hủy”, và CGC_Chết cũng vậy. 

Cho nên hiện tại mình **chưa


sai r toàn tỉnh là bên trái cơ mà nhầm r

Đúng, mình nhầm. “Toàn tỉnh” là panel bên trái hiện tại, không phải #info-panel hay dashboard mình vừa giả định.

Trong file của bạn, map.js chỉ đang gọi updateDashboard(), còn phần giao diện Tổng quan thực tế nằm ở HTML/JS của panel bên trái. refreshMap() gọi updateDashboard() sau khi cập nhật dữ liệu. 

Không thay đoạn updateDashboard() như mình vừa đưa. Làm vậy có thể phá bố cục hiện tại.

Bạn gửi cho mình file HTML hiện tại (thường là index.html hoặc file chứa phần bên trái “TOÀN TỈNH”), mình sẽ sửa đúng panel bên trái, giữ nguyên bản đồ và các chức năng khác.


//======================================================
// MAP.JS V3
//======================================================

console.log("WEBGIS ĐIỆN BIÊN V3");

//===============================
// KHỞI TẠO BẢN ĐỒ
//===============================

const map = L.map("map", {
zoomControl: true,
minZoom: 8,
maxZoom: 15
}).setView([21.38, 103.02], 9);

L.tileLayer(
"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
{
attribution: "© OpenStreetMap & CARTO",
subdomains: "abcd",
maxZoom: 20
}
).addTo(map);

window.printer = L.easyPrint({
hidden: true,
exportOnly: true,
sizeModes: ["Current"]
}).addTo(map);
//======================================================
// THANH CÔNG CỤ GIS
//======================================================

function addMapTools() {

const zoom = document.querySelector(".leaflet-control-zoom");

if (!zoom) return;

// ===========================
// NÚT TOÀN MÀN HÌNH
// ===========================
const fullBtn = document.createElement("a");

fullBtn.href = "#";
fullBtn.title = "Toàn màn hình";

fullBtn.innerHTML = `
<svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#444"
    d="M4 9V4h5v2H6v3H4zm10-5h6v6h-2V6h-4V4zM4 20v-6h2v4h4v2H4zm14-2v-4h2v6h-6v-2h4z"/>
</svg>`;

fullBtn.onclick = function (e) {

    e.preventDefault();

    if (!document.fullscreenElement) {

        document.documentElement.requestFullscreen();

    } else {

        document.exitFullscreen();

    }

};

zoom.appendChild(fullBtn);

// ===========================
// NÚT HOME
// ===========================

const homeBtn = document.createElement("a");

homeBtn.href = "#";
homeBtn.title = "Về toàn tỉnh";

homeBtn.innerHTML = "🏠";

homeBtn.onclick = function (e) {

    e.preventDefault();

    if (geojsonLayer) {

        map.fitBounds(geojsonLayer.getBounds());

    }

};

zoom.appendChild(homeBtn);
}
//===============================
// BIẾN TOÀN CỤC
//===============================

let geojsonLayer = null;
let labelLayer = null;
let legendControl = null;
let selectedFeature = null;
let outbreakLayer = null;

let currentLayer = "DTLCP";
let dynamicBreaks = [];
const popupOptions = {
maxWidth: 320,
minWidth: 220,
autoPan: true,
closeButton: true
};

//===============================
// CẤU HÌNH CÁC LỚP
//===============================

const layerConfig = {

DTLCP:{

    field:"DTLCP_Chết",

    title:"Số lượng lợn tiêu hủy do DTLCP (con)",

    unit:"con",

    color:[
        "#CAE5E8",
        "#6EC3C9",
        "#00B2BF",
        "#009298",
        "#00676B"
],

    breaks:[
        0,
        0,
        0,
        0
    ]

},

CGC:{

    field:"CGC_Chết",

    title:"Số lượng gia cầm tiêu hủy (con)",

    unit:"con",

    color:[
        "#E8D3E3",
        "#AF4A92",
        "#A2007C",
        "#780062",
        "#64004B"

    ],

    breaks:[
        0,
        0,
        0,
        0
    ]

},

VDNC:{

    field:"VDNC_Mắc",

    title:"Số gia súc mắc bệnh VDNC (con)",

    unit:"con",

    color:[
        "#BFCAE6",
        "#93C5FD",
        "#3B82F6",
        "#2563EB",
        "#1E3A8A"
    ],

    breaks:[
        0,
        0,
        0,
        0
    ]

},

DAI:{

    field:"DAI_Chết",

    title:"Số chó, mèo mắc bệnh dại",

    unit:"con",

    color:[
        "#FFFFFF",
        "#D8B4FE",
        "#A855F7",
        "#7E22CE",
        "#581C87"
    ],

    breaks:[
        0,
        1,
        3,
        5
    ]

},

PHUN:{

    field:"PHUN_Vòng",

    title:"Các xã đã triển khai Tháng VSKTTĐ",

    unit:"vòng",

     breaks:[
     0,
     0.5,
     1.5,
     2.5
],

color:[
    "#C8E2B1",   // 0 - Chưa triển khai
    "#83C75D",   // 1 - Vòng 1
    "#5BBD2B",   // 2 - Vòng 2
    "#489620",   // 3 - Vòng 3
    "#367517"    // 4 - Vòng 4 
]
},

KSGM:{

    field:"KSGM_Trạng thái",

    title:"Kiểm soát giết mổ",

    unit:"trạng thái",

    color:[
        "#B2F5EA",
        "#0F766E"
    ]

},

CSBBTTY:{

field:"CSBBTTY_Cơ sở",

title:"Cơ sở buôn bán thuốc thú y",

unit:"cơ sở",

color:[
    "#ECEFF1",
    "#B3E5FC",
    "#4FC3F7",
    "#0288D1",
    "#01579B"
],

breaks:[
    0,
    0,
    0,
    0
]
}

};
function jenks(data, classes = 4) {

data = data
    .filter(v => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);

if (data.length <= classes) {
    return [
        0,
        data[0] || 0,
        data[1] || data[0] || 0,
        data[2] || data[data.length - 1] || 0
    ];
}

const lower = [];
const variance = [];

for (let i = 0; i <= data.length; i++) {
    lower.push(new Array(classes + 1).fill(0));
    variance.push(new Array(classes + 1).fill(0));
}

for (let i = 1; i <= classes; i++) {
    lower[1][i] = 1;
    variance[1][i] = 0;
    for (let j = 2; j <= data.length; j++) {
        variance[j][i] = Infinity;
    }
}

let sum = 0;
let sumSq = 0;
let w = 0;

for (let l = 2; l <= data.length; l++) {

    sum = 0;
    sumSq = 0;
    w = 0;

    for (let m = 1; m <= l; m++) {

        const i3 = l - m + 1;
        const val = data[i3 - 1];

        w++;
        sum += val;
        sumSq += val * val;

        const v = sumSq - (sum * sum) / w;

        if (i3 !== 1) {

            for (let j = 2; j <= classes; j++) {

                if (variance[l][j] >= v + variance[i3 - 1][j - 1]) {

                    lower[l][j] = i3;
                    variance[l][j] = v + variance[i3 - 1][j - 1];

                }

            }

        }

    }

    lower[l][1] = 1;
    variance[l][1] = sumSq - (sum * sum) / w;

}

const kclass = new Array(classes + 1);

let k = data.length;

kclass[classes] = data[data.length - 1];

for (let j = classes; j >= 2; j--) {

    const id = lower[k][j] - 2;

    kclass[j - 1] = data[id];

    k = lower[k][j] - 1;

}

return [
    0,
    Math.round(kclass[1]),
    Math.round(kclass[2]),
    Math.round(kclass[3])
];
}
function updateBreaks(){

const cfg = layerConfig[currentLayer];

// Hai lớp phân loại không cần tính khoảng
if(currentLayer==="KSGM" || currentLayer==="PHUN"){
    return;
}

const values = [];

getRows().forEach(row=>{

    const value = Number(row[cfg.field] || 0);

    if(value>0){
        values.push(value);
    }

});

if(values.length===0){
    cfg.breaks=[0,1,2,3];
    return;
}

cfg.breaks = jenks(values,4);
}

//===============================
// LẤY GIÁ TRỊ THEO LỚP
//===============================

function getValue(row){

if(!row) return 0;

// Riêng lớp KSGM
if(currentLayer === "KSGM"){
    return row["KSGM_Trạng thái"] === "Đã triển khai" ? 1 : 0;
}

const field = layerConfig[currentLayer].field;

return Number(row[field] || 0);
}
//======================================================
// MÀU THEO GIÁ TRỊ
//======================================================

function getColor(value){

const cfg = layerConfig[currentLayer];

if(currentLayer==="KSGM"){

    return value>0
        ? cfg.color[1]
        : cfg.color[0];

}

if(value===0) return cfg.color[0];

if(value<=cfg.breaks[1]) return cfg.color[1];

if(value<=cfg.breaks[2]) return cfg.color[2];

if(value<=cfg.breaks[3]) return cfg.color[3];

return cfg.color[4];
}

//======================================================
// STYLE
//======================================================

function style(feature){

const row = getRow(feature);

return {

color: "#F8FAFC",

weight: 0.8,

opacity: 1,

fillColor: getColor(getValue(row)),

fillOpacity: 0.88
};

}

//======================================================
// POPUP
//======================================================

function popupContent(feature){

const row=getRow(feature);

if(!row){

    return `
<b>${getName(feature)}</b>
<hr>
Không có dữ liệu
; } let html=
<div class="popup-card">

    <h3>${layerConfig[currentLayer].title}</h3>

    <hr>

    <b>📍 ${row["Tên xã"] || getName(feature)}</b>
`;

switch(currentLayer){

    case "DTLCP":

        html+=`
            <p>Trạng thái: <b>${row["DTLCP_Trạng thái"]||"--"}</b></p>
            <p>Ổ dịch: <b>${row["DTLCP_Ổ dịch"]||0}</b></p>
            <p>Tiêu hủy: <b>${formatNumber(row["DTLCP_Chết"])} con</b></p>
            <p>Khối lượng: <b>${formatNumber(row["DTLCP_Trọng lượng"])} kg</b></p>
            <p>Ngày cuối: <b>${formatDate(row["DTLCP_Ngày cuối"])}</b></p>
        `;
        break;

    case "CGC":

        html+=`
            <p>Trạng thái: <b>${row["CGC_Trạng thái"]||"--"}</b></p>
            <p>Ổ dịch: <b>${row["CGC_Ổ dịch"]||0}</b></p>
            <p>Tiêu hủy: <b>${formatNumber(row["CGC_Chết"])} con</b></p>
            <p>Khối lượng: <b>${formatNumber(row["CGC_Trọng lượng"])} kg</b></p>
            <p>Ngày cuối: <b>${formatDate(row["CGC_Ngày cuối"])}</b></p>
        `;
        break;

    case "VDNC":

        html+=`
            <p>Trạng thái: <b>${row["VDNC_Trạng thái"]||"--"}</b></p>
            <p>Ổ dịch: <b>${row["VDNC_Ổ dịch"]||0}</b></p>
            <p>Mắc: <b>${formatNumber(row["VDNC_Mắc"])} con</b></p>
            <p>Chết: <b>${formatNumber(row["VDNC_Chết"])} con</b></p>
            <p>Ngày cuối: <b>${formatDate(row["VDNC_Ngày cuối"])}</b></p>
        `;
        break;

    case "PHUN":

        html+=`
            <p>Tiến độ: <b>${row["PHUN_Tiến độ"]||"--"}</b></p>
            <p>Vòng: <b>${row["PHUN_Vòng"]||"--"}</b></p>
            <p>Số hộ: <b>${formatNumber(row["PHUN_Số hộ"])}</b></p>
        `;
        break;

    case "KSGM":

        html+=`
            <p>Trạng thái: <b>${row["KSGM_Trạng thái"]||"--"}</b></p>
            <p>Cơ sở: <b>${formatNumber(row["KSGM_Cơ sở"])}</b></p>
        `;
        break;

    case "CSBBTTY":

        html+=`
            <p>Cơ sở: <b>${formatNumber(row["CSBBTTY_Cơ sở"])}</b></p>
        `;
        break;

}

html+="</div>";

return html;
}

//======================================================
// HOVER
//======================================================

function highlightFeature(e){

const layer=e.target;

layer.setStyle({

weight:2,

color:"#2563EB",

fillOpacity:1
});

if(
    !L.Browser.ie &&
    !L.Browser.opera &&
    !L.Browser.edge
){
    layer.bringToFront();
}
}

function resetHighlight(e){

if(geojsonLayer){

    geojsonLayer.resetStyle(
        e.target
    );

}
}//======================================================
// CLICK XÃ
//======================================================

function zoomToFeature(e){

const layer = e.target;

selectedFeature = layer.feature;

map.fitBounds(
    layer.getBounds(),
    {
        padding:[30,30],
        maxZoom:11
    }
);

showPanel(layer.feature);

// layer.openPopup();
}

//======================================================
// GẮN SỰ KIỆN CHO TỪNG XÃ
//======================================================

function onEachFeature(feature,layer){

layer.on({

    mouseover:highlightFeature,

    mouseout:resetHighlight,

    click:zoomToFeature

});
}

//======================================================
// XÓA LABEL
//======================================================

function clearLabels(){

if(labelLayer){

    map.removeLayer(labelLayer);

    labelLayer=null;

}
}

//======================================================
// VẼ TÊN XÃ
//======================================================
const labelOffset = {
"Điện Biên Phủ": [0.010, -0.012],
"Thanh Yên": [-0.012, 0.015],
"Thanh Nưa": [0.020, -0.060],
"Thanh An": [0.006, 0.000],
"Mường Phăng": [0.000, -0.008],
"Na Sang": [0.006, 0.006],
"Tủa Thàng": [0.006, 0.008],
"Nà Tấu": [-0.005, 0.000],
"Mường Ảng": [0.005, -0.004],
"Mường Lay": [0.000, 0.006],
"Mường Chà": [0.000, -0.006],
"Mường Nhé": [0.006, -0.006],
"Sín Thầu": [-0.004, 0.004],
"Quài Tở": [0.000, 0.005],
"Tuần Giáo": [0.006, -0.004],
"Pú Nhung": [-0.004, 0.004],
"Chà Tở": [0.000, 0.010],

};

function drawLabels(){

clearLabels();

labelLayer = L.layerGroup();

geojsonLayer.eachLayer(function(layer){

    const row = getRow(layer.feature);

    if(getValue(row) > 0){

        const center = layer.getBounds().getCenter();

        const name = row["Tên xã"] || getName(layer.feature);

        let lat = center.lat;
        let lng = center.lng;

        if(labelOffset[name]){
            lat += labelOffset[name][0];
            lng += labelOffset[name][1];
        }

        let html;

        if(currentLayer === "KSGM"){

            const cs = Number(row["KSGM_Cơ sở"] || 0);

            html = `
                <div>
                    ${name}
                    ${cs > 0 ? `<br><span class="ksgm-count">${cs}</span>` : ""}
                </div>
            `;

        }else{

            html = `<div>${name}</div>`;

        }

        const label = L.marker([lat,lng],{
            interactive:false,
            icon:L.divIcon({
                className:"map-label",
                html:html,
                iconSize:null,
                iconAnchor:[0,0]
            })
        });

        labelLayer.addLayer(label);

    } // <-- đóng if(getValue(row)>0)

}); // <-- đóng eachLayer

labelLayer.addTo(map);
}
//======================================================
// CẬP NHẬT CHÚ GIẢI
//======================================================

function updateLegend() {

if (legendControl) {
    map.removeControl(legendControl);
}

legendControl = L.control({ position: "bottomright" });

legendControl.onAdd = function () {

    const div = L.DomUtil.create("div", "legend");
    const cfg = layerConfig[currentLayer];

    //========================
    // PHUN
    //========================
    if (currentLayer === "PHUN") {

        div.innerHTML = `
            <h4>${cfg.title}</h4>

            <div><i style="background:${cfg.color[0]}"></i>Chưa triển khai</div>
            <div><i style="background:${cfg.color[1]}"></i>Vòng 1</div>
            <div><i style="background:${cfg.color[2]}"></i>Vòng 2</div>
            <div><i style="background:${cfg.color[3]}"></i>Vòng 3</div>
            <div><i style="background:${cfg.color[4]}"></i>Vòng 4</div>
        `;

        return div;
    }

    //========================
    // KSGM
    //========================
    if (currentLayer === "KSGM") {

        div.innerHTML = `
            <h4>${cfg.title}</h4>

            <div><i style="background:${cfg.color[0]}"></i>Chưa triển khai</div>
            <div><i style="background:${cfg.color[1]}"></i>Đã triển khai</div>

            <hr>

            <div class="legend-dot-row">
                <span class="legend-red-dot"></span>
                <span>Số màu đỏ trên tên xã<br><b>= Số cơ sở giết mổ</b></span>
            </div>
        `;

        return div;
    }

    //========================
    // CSBBTTY
    //========================
    if (currentLayer === "CSBBTTY") {

        const b = cfg.breaks;

        div.innerHTML = `
            <h4>${cfg.title}</h4>

            <div><i style="background:${cfg.color[1]}"></i>1 - ${b[1]}</div>
            <div><i style="background:${cfg.color[2]}"></i>${b[1] + 1} - ${b[2]}</div>
            <div><i style="background:${cfg.color[3]}"></i>${b[2] + 1} - ${b[3]}</div>
            <div><i style="background:${cfg.color[4]}"></i>> ${b[3]}</div>

            <hr>

            <div><i style="background:${cfg.color[0]}"></i>Không có cơ sở</div>
        `;

        return div;
    }

    //========================
    // DTLCP - CGC - VDNC - DẠI
    //========================

    const b = cfg.breaks;

    div.innerHTML = `
        <h4>${cfg.title}</h4>

        <div><i style="background:${cfg.color[1]}"></i>1 - ${b[1]}</div>
        <div><i style="background:${cfg.color[2]}"></i>${b[1] + 1} - ${b[2]}</div>
        <div><i style="background:${cfg.color[3]}"></i>${b[2] + 1} - ${b[3]}</div>
        <div><i style="background:${cfg.color[4]}"></i>> ${b[3]}</div>

        <hr>

        <div class="legend-dot-row">
            <span class="legend-red-dot"></span>
            <span>Xã đang xảy ra dịch</span>
        </div>

        <div>
            <i style="background:${cfg.color[0]}"></i>
            Không có dịch
        </div>
    `;

    return div;
};

legendControl.addTo(map);
}
//======================================================
// TÌM XÃ
//======================================================

function searchFeature(keyword){

if(!geojsonLayer) return;

keyword=keyword.trim().toLowerCase();

geojsonLayer.eachLayer(function(layer){

    const name=getName(layer.feature).toLowerCase();

    if(name.includes(keyword)){

        selectedFeature=layer.feature;

        map.fitBounds(layer.getBounds(),{

            padding:[30,30],
            maxZoom:11

        });

        showPanel(layer.feature);
// layer.openPopup();

    }

});
}

//======================================================
// LÀM MỚI BẢN ĐỒ
//======================================================

function refreshMap(){

updateBreaks();

if(!geojsonLayer) return;

geojsonLayer.setStyle(style);

geojsonLayer.eachLayer(function(layer){
    layer.unbindPopup();
});


drawOutbreakPoints();
drawLabels();

updateLegend();

updateDashboard();

if(selectedFeature){
    showPanel(selectedFeature);
}
}

function drawOutbreakPoints(){

if(outbreakLayer){
    map.removeLayer(outbreakLayer);
}

if(currentLayer !== "DTLCP") return;

outbreakLayer = L.layerGroup();

geojsonLayer.eachLayer(function(layer){

    const row = getRow(layer.feature);

    if(!row) return;

    if(row["DTLCP_Trạng thái"] !== "Đang có dịch") return;

    const center = layer.getBounds().getCenter();

    const name = row["Tên xã"] || getName(layer.feature);

    let lat = center.lat;
    let lng = center.lng;

    // Dùng đúng offset của tên xã
    if(labelOffset[name]){
        lat += labelOffset[name][0];
        lng += labelOffset[name][1];
    }

    // Chấm đỏ nằm bên trái tên xã
    lng -= 0.004;

    const dot = L.marker([lat,lng],{
        interactive:false,
        icon:L.divIcon({
            className:"",
            html:`
                <div style="
                    width:8px;
                    height:8px;
                    background:#ff0000;
                    border:1.5px solid #ffffff;
                    border-radius:50%;
                    box-shadow:0 0 3px rgba(0,0,0,.35);
                "></div>
            `,
            iconSize:[8,8],
            iconAnchor:[4,4]
        })
    });

    outbreakLayer.addLayer(dot);

});

outbreakLayer.addTo(map);
}
//======================================================
// CẬP NHẬT DASHBOARD
//======================================================

function updateDashboard(){

if(typeof dashboard==="undefined") return;

dashboard.update();
}

//======================================================
// LOAD GEOJSON
//======================================================

async function loadGeoJSON(){

try{

    const res=await fetch("data/dienbien_xa.geojson");

    if(!res.ok){

        throw new Error("Không đọc được GeoJSON");

    }

    const geojson=await res.json();

    if(geojsonLayer){

        map.removeLayer(geojsonLayer);

    }

    geojsonLayer=L.geoJSON(

        geojson,

        {

            style:style,

            onEachFeature:onEachFeature

        }

    ).addTo(map);

    map.fitBounds(
        geojsonLayer.getBounds()
    );

   drawOutbreakPoints();
     drawLabels();
updateLegend();

updateDashboard();

}
catch(err){

    console.error(err);

    alert("Không thể tải dữ liệu bản đồ.");

}
}

//======================================================
// ĐỔI LỚP DỮ LIỆU
//======================================================

function setLayer(layerName){

if(!layerConfig[layerName]) return;

currentLayer=layerName;

refreshMap();
}

//======================================================
// LÀM MỚI DỮ LIỆU GOOGLE SHEETS
//======================================================

async function reloadData(){

try{

    if(typeof loadSheet==="function"){

        await loadSheet();

    }

    refreshMap();

}
catch(err){

    console.error(err);

}
}

//======================================================
// KHỞI TẠO
//======================================================

async function initMap(){

await loadGeoJSON();

if(typeof loadSheet==="function"){

    await loadSheet();

    refreshMap();

}
}

//======================================================
// BẮT ĐẦU
//======================================================

document.addEventListener(
"DOMContentLoaded",
async function(){

    await initMap();

    addMapTools();

}
);
