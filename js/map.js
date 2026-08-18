//======================================================
// MAP.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT ĐIỆN BIÊN
//======================================================
//
// NHIỆM VỤ:
// - Khởi tạo bản đồ
// - Load GeoJSON
// - Liên kết GeoJSON với Google Sheets qua ID
// - Hiển thị các lớp dữ liệu
// - Tô màu xã/phường
// - Nhãn tên xã/phường
// - Chấm đỏ xã đang có dịch
// - Popup
// - Tìm kiếm xã
// - Chú giải
// - Công cụ bản đồ
//
// LƯU Ý:
// map.js KHÔNG tự chạy DOMContentLoaded.
// app.js là nơi khởi tạo ứng dụng.
//======================================================


//======================================================
// BIẾN TOÀN CỤC
//======================================================

let map = null;

let geojsonLayer = null;

let geojsonData = null;

let currentLayer = "DTLCP";

let legendControl = null;

let printer = null;

let mapReady = false;


//======================================================
// CẤU HÌNH LỚP DỮ LIỆU
//======================================================

const LAYER_CONFIG = {

    //==================================================
    // DTLCP
    //==================================================

    DTLCP: {

        name: "Dịch tả lợn Châu Phi",

        color: "#E53935",

        status: "DTLCP_Trạng thái",

        outbreak: "DTLCP_Ổ dịch",

        value: "DTLCP_Chết",

        weight: "DTLCP_Trọng lượng",

        date: "DTLCP_Ngày cuối",

        days: "DTLCP_Số ngày"

    },


    //==================================================
    // CGC
    //==================================================

    CGC: {

        name: "Cúm gia cầm",

        color: "#FB8C00",

        status: "CGC_Trạng thái",

        outbreak: "CGC_Ổ dịch",

        value: "CGC_Chết",

        weight: "CGC_Trọng lượng",

        date: "CGC_Ngày cuối",

        days: "CGC_Số ngày"

    },


    //==================================================
    // VDNC
    //==================================================

    VDNC: {

        name: "Viêm da nổi cục",

        color: "#8E24AA",

        status: "VDNC_Trạng thái",

        outbreak: "VDNC_Ổ dịch",

        value: "VDNC_Mắc",

        death: "VDNC_Chết",

        weight: "VDNC_Trọng lượng",

        date: "VDNC_Ngày cuối",

        days: "VDNC_Số ngày"

    },


    //==================================================
    // DẠI
    //==================================================

    DAI: {

        name: "Bệnh Dại",

        color: "#43A047",

        status: "DAI_Trạng thái",

        outbreak: "DAI_Ổ dịch",

        value: "DAI_Chết",

        date: "DAI_Ngày cuối",

        days: "DAI_Số ngày"

    },


    //==================================================
    // PHUN KHỬ TRÙNG
    //==================================================

    PHUN: {

        name: "Phun khử trùng",

        color: "#00ACC1",

        status: "PHUN_Tiến độ",

        value: "PHUN_Số hộ",

        round: "PHUN_Vòng",

        area: "PHUN_Diện tích",

        date: "PHUN_Ngày"

    },


    //==================================================
    // KSGM
    //==================================================

    KSGM: {

        name: "Kiểm soát giết mổ",

        color: "#8D6E63",

        status: "KSGM_Trạng thái",

        value: "KSGM_Cơ sở"

    },


    //==================================================
    // CƠ SỞ THUỐC THÚ Y
    //==================================================

    CSBBTTY: {

        name: "Cơ sở buôn bán thuốc thú y",

        color: "#43A047",

        value: "CSBBTTY_Cơ sở"

    }

};


//======================================================
// KHỞI TẠO BẢN ĐỒ
//======================================================

async function initMap(){

    if(map){

        return map;

    }


    map = L.map("map", {

        zoomControl: true,

        attributionControl: true

    });


    //==================================================
    // NỀN BẢN ĐỒ
    //==================================================

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'

        }
    ).addTo(map);


    //==================================================
    // VỊ TRÍ BAN ĐẦU
    //==================================================

    map.setView(
        [21.3860, 103.0160],
        9
    );


    mapReady = true;


    return map;

}


//======================================================
// LOAD GEOJSON
//======================================================

async function loadGeoJSON(){

    try{

        if(!map){

            await initMap();

        }


        const response =
            await fetch(
                "data/dienbien_xa.geojson"
            );


        if(!response.ok){

            throw new Error(
                "Không tải được GeoJSON: " +
                response.status
            );

        }


        geojsonData =
            await response.json();


        if(
            !geojsonData ||
            geojsonData.type !== "FeatureCollection"
        ){

            throw new Error(
                "GeoJSON không hợp lệ."
            );

        }


        refreshMap();


        return geojsonData;

    }
    catch(err){

        console.error(
            "Lỗi load GeoJSON:",
            err
        );

        throw err;

    }

}


//======================================================
// LẤY DỮ LIỆU XÃ
//======================================================

function getFeatureRow(feature){

    if(!feature || !feature.properties){

        return null;

    }


    const id =
        Number(
            feature.properties.ID
        );


    if(
        typeof sheetData === "undefined"
    ){

        return null;

    }


    return sheetData[id] || null;

}


//======================================================
// LẤY TÊN XÃ
//======================================================

function getName(feature){

    if(
        !feature ||
        !feature.properties
    ){

        return "";

    }


    return (
        feature.properties["Tên xã"] ||
        feature.properties.TEN_XA ||
        feature.properties.TENXA ||
        feature.properties.NAME ||
        feature.properties.Name ||
        feature.properties.name ||
        ""
    );

}


//======================================================
// CHUẨN HÓA TRẠNG THÁI
//======================================================

function mapNormalizeStatus(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(value)
        .trim()
        .toLowerCase();

}


//======================================================
// CHUYỂN SỐ
//======================================================

function mapNumber(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){

        return 0;

    }


    if(
        typeof value === "number"
    ){

        return isNaN(value)
            ? 0
            : value;

    }


    let str =
        String(value)
            .trim();


    if(!str){

        return 0;

    }


    str =
        str.replace(
            /[^\d,.-]/g,
            ""
        );


    if(
        str.includes(".") &&
        str.includes(",")
    ){

        str =
            str.replace(
                /\./g,
                ""
            );

        str =
            str.replace(
                ",",
                "."
            );

    }
    else if(
        str.includes(".")
    ){

        str =
            str.replace(
                /\./g,
                ""
            );

    }
    else if(
        str.includes(",")
    ){

        const parts =
            str.split(",");


        if(
            parts.length === 2 &&
            parts[1].length <= 2
        ){

            str =
                parts[0] +
                "." +
                parts[1];

        }
        else{

            str =
                str.replace(
                    /,/g,
                    ""
                );

        }

    }


    const result =
        Number(str);


    return isNaN(result)
        ? 0
        : result;

}


//======================================================
// FORMAT SỐ
//======================================================

function mapFormatNumber(value){

    const number =
        Number(value);


    if(
        isNaN(number)
    ){

        return "0";

    }


    return number.toLocaleString(
        "vi-VN"
    );

}


//======================================================
// FORMAT NGÀY
//======================================================

function mapFormatDate(value){

    if(!value){

        return "--";

    }


    const date =
        new Date(value);


    if(
        isNaN(date.getTime())
    ){

        return value;

    }


    return date.toLocaleDateString(
        "vi-VN"
    );

}


//======================================================
// XÁC ĐỊNH XÃ ĐANG CÓ DỊCH
//======================================================

function isDiseaseActive(
    row,
    statusField
){

    if(!row || !statusField){

        return false;

    }


    return (
        mapNormalizeStatus(
            row[statusField]
        ) === "đang có dịch"
    );

}


//======================================================
// XÁC ĐỊNH XÃ CÓ DỊCH LŨY KẾ
//======================================================

function hasDiseaseHistory(
    row,
    config
){

    if(!row || !config){

        return false;

    }


    const status =
        mapNormalizeStatus(
            row[config.status]
        );


    const outbreak =
        mapNumber(
            row[config.outbreak]
        );


    const value =
        mapNumber(
            row[config.value]
        );


    const death =
        mapNumber(
            row[config.death]
        );


    /*
     * Không tính trạng thái
     * "Không có dịch".
     */

    if(
        status === "" ||
        status === "không có dịch"
    ){

        return (
            outbreak > 0 ||
            value > 0 ||
            death > 0
        );

    }


    return (
        outbreak > 0 ||
        value > 0 ||
        death > 0 ||
        status === "đang có dịch" ||
        status === "đã hết dịch"
    );

}


//======================================================
// STYLE XÃ
//======================================================

function getFeatureStyle(feature){

    const row =
        getFeatureRow(feature);


    const config =
        LAYER_CONFIG[currentLayer];


    // Không có dữ liệu

    if(!row){

        return {

            fillColor: "#ECEFF1",

            weight: 1,

            opacity: 1,

            color: "#90A4AE",

            fillOpacity: .55

        };

    }


    //==================================================
    // DTLCP
    //==================================================

    if(currentLayer === "DTLCP"){

        return styleDiseaseLayer(
            row,
            config
        );

    }


    //==================================================
    // CGC
    //==================================================

    if(currentLayer === "CGC"){

        return styleDiseaseLayer(
            row,
            config
        );

    }


    //==================================================
    // VDNC
    //==================================================

    if(currentLayer === "VDNC"){

        return styleVDNC(
            row,
            config
        );

    }


    //==================================================
    // DẠI
    //==================================================

    if(currentLayer === "DAI"){

        return styleDiseaseLayer(
            row,
            config
        );

    }


    //==================================================
    // PHUN
    //==================================================

    if(currentLayer === "PHUN"){

        return stylePhun(
            row
        );

    }


    //==================================================
    // KSGM
    //==================================================

    if(currentLayer === "KSGM"){

        return styleKSGM(
            row
        );

    }


    //==================================================
    // CSBBTTY
    //==================================================

    if(currentLayer === "CSBBTTY"){

        return styleDrugStore(
            row
        );

    }


    return {

        fillColor: "#ECEFF1",

        weight: 1,

        opacity: 1,

        color: "#90A4AE",

        fillOpacity: .55

    };

}


//======================================================
// STYLE BỆNH
//======================================================

function styleDiseaseLayer(
    row,
    config
){

    const status =
        mapNormalizeStatus(
            row[config.status]
        );


    const outbreak =
        mapNumber(
            row[config.outbreak]
        );


    const value =
        mapNumber(
            row[config.value]
        );


    const death =
        mapNumber(
            row[config.death]
        );


    // Đang có dịch

    if(
        status === "đang có dịch"
    ){

        return {

            fillColor: "#E53935",

            weight: 1.5,

            opacity: 1,

            color: "#8E0000",

            fillOpacity: .78

        };

    }


    // Đã hết dịch / có dữ liệu lũy kế

    if(
        hasDiseaseHistory(
            row,
            config
        )
    ){

        return {

            fillColor: "#FFCDD2",

            weight: 1,

            opacity: 1,

            color: "#B71C1C",

            fillOpacity: .60

        };

    }


    // Có số liệu chết nhưng không xác định trạng thái

    if(
        value > 0 ||
        death > 0 ||
        outbreak > 0
    ){

        return {

            fillColor: "#FFCDD2",

            weight: 1,

            opacity: 1,

            color: "#B71C1C",

            fillOpacity: .60

        };

    }


    // Không có dịch

    return {

        fillColor: "#ECEFF1",

        weight: 1,

        opacity: 1,

        color: "#90A4AE",

        fillOpacity: .45

    };

}


//======================================================
// STYLE VDNC
//======================================================

function styleVDNC(
    row,
    config
){

    const status =
        mapNormalizeStatus(
            row[config.status]
        );


    const outbreak =
        mapNumber(
            row[config.outbreak]
        );


    const mac =
        mapNumber(
            row[config.value]
        );


    const chet =
        mapNumber(
            row[config.death]
        );


    if(
        status === "đang có dịch"
    ){

        return {

            fillColor: "#8E24AA",

            weight: 1.5,

            opacity: 1,

            color: "#4A148C",

            fillOpacity: .78

        };

    }


    if(
        outbreak > 0 ||
        mac > 0 ||
        chet > 0 ||
        status === "đã hết dịch"
    ){

        return {

            fillColor: "#E1BEE7",

            weight: 1,

            opacity: 1,

            color: "#7B1FA2",

            fillOpacity: .60

        };

    }


    return {

        fillColor: "#ECEFF1",

        weight: 1,

        opacity: 1,

        color: "#90A4AE",

        fillOpacity: .45

    };

}


//======================================================
// STYLE PHUN KHỬ TRÙNG
//======================================================

function stylePhun(row){

    const round =
        mapNumber(
            row["PHUN_Vòng"]
        );


    const households =
        mapNumber(
            row["PHUN_Số hộ"]
        );


    const progress =
        String(
            row["PHUN_Tiến độ"] || ""
        )
        .trim()
        .toLowerCase();


    if(
        round >= 4
    ){

        return {

            fillColor: "#00695C",

            weight: 1,

            color: "#004D40",

            fillOpacity: .75

        };

    }


    if(
        round === 3
    ){

        return {

            fillColor: "#00897B",

            weight: 1,

            color: "#00695C",

            fillOpacity: .70

        };

    }


    if(
        round === 2
    ){

        return {

            fillColor: "#26A69A",

            weight: 1,

            color: "#00796B",

            fillOpacity: .65

        };

    }


    if(
        round === 1
    ){

        return {

            fillColor: "#80CBC4",

            weight: 1,

            color: "#00897B",

            fillOpacity: .65

        };

    }


    if(
        households > 0 ||
        progress !== ""
    ){

        return {

            fillColor: "#B2DFDB",

            weight: 1,

            color: "#00897B",

            fillOpacity: .60

        };

    }


    return {

        fillColor: "#ECEFF1",

        weight: 1,

        color: "#90A4AE",

        fillOpacity: .45

    };

}


//======================================================
// STYLE KSGM
//======================================================

function styleKSGM(row){

    const status =
        mapNormalizeStatus(
            row["KSGM_Trạng thái"]
        );


    const count =
        mapNumber(
            row["KSGM_Cơ sở"]
        );


    if(
        status === "đã triển khai"
    ){

        return {

            fillColor: "#8D6E63",

            weight: 1,

            color: "#5D4037",

            fillOpacity: .72

        };

    }


    if(
        count > 0
    ){

        return {

            fillColor: "#D7CCC8",

            weight: 1,

            color: "#795548",

            fillOpacity: .60

        };

    }


    return {

        fillColor: "#ECEFF1",

        weight: 1,

        color: "#90A4AE",

        fillOpacity: .45

    };

}


//======================================================
// STYLE CƠ SỞ THUỐC THÚ Y
//======================================================

function styleDrugStore(row){

    const count =
        mapNumber(
            row["CSBBTTY_Cơ sở"]
        );


    if(
        count > 0
    ){

        return {

            fillColor: "#43A047",

            weight: 1,

            color: "#1B5E20",

            fillOpacity: .70

        };

    }


    return {

        fillColor: "#ECEFF1",

        weight: 1,

        color: "#90A4AE",

        fillOpacity: .45

    };

}


//======================================================
// TẠO POPUP
//======================================================

function createPopup(
    feature,
    row
){

    if(!row){

        return `
            <div class="popup-card">
                <h3>${getName(feature)}</h3>
                <p>Không có dữ liệu.</p>
            </div>
        `;

    }


    const name =
        row["Tên xã"] ||
        getName(feature);


    //==================================================
    // DTLCP
    //==================================================

    if(currentLayer === "DTLCP"){

        return createDiseasePopup(
            name,
            row,
            "🐷",
            "DỊCH TẢ LỢN CHÂU PHI",
            "#E53935",
            "DTLCP"
        );

    }


    //==================================================
    // CGC
    //==================================================

    if(currentLayer === "CGC"){

        return createDiseasePopup(
            name,
            row,
            "🐔",
            "CÚM GIA CẦM",
            "#FB8C00",
            "CGC"
        );

    }


    //==================================================
    // VDNC
    //==================================================

    if(currentLayer === "VDNC"){

        return createVDNCPopup(
            name,
            row
        );

    }


    //==================================================
    // DẠI
    //==================================================

    if(currentLayer === "DAI"){

        return createDiseasePopup(
            name,
            row,
            "🐕",
            "BỆNH DẠI",
            "#43A047",
            "DAI"
        );

    }


    //==================================================
    // PHUN
    //==================================================

    if(currentLayer === "PHUN"){

        return `
            <div class="popup-card">

                <h3>
                    🧴 ${name}
                </h3>

                <hr>

                <p>
                    <b>Tiến độ:</b>
                    ${row["PHUN_Tiến độ"] || "--"}
                </p>

                <p>
                    <b>Vòng:</b>
                    ${row["PHUN_Vòng"] || "--"}
                </p>

                <p>
                    <b>Số hộ:</b>
                    ${mapFormatNumber(
                        row["PHUN_Số hộ"]
                    )}
                </p>

                <p>
                    <b>Diện tích:</b>
                    ${mapFormatNumber(
                        row["PHUN_Diện tích"]
                    )} m²
                </p>

                <p>
                    <b>Ngày:</b>
                    ${mapFormatDate(
                        row["PHUN_Ngày"]
                    )}
                </p>

            </div>
        `;

    }


    //==================================================
    // KSGM
    //==================================================

    if(currentLayer === "KSGM"){

        return `
            <div class="popup-card">

                <h3>
                    🏭 ${name}
                </h3>

                <hr>

                <p>
                    <b>Trạng thái:</b>
                    ${row["KSGM_Trạng thái"] || "--"}
                </p>

                <p>
                    <b>Số cơ sở:</b>
                    ${mapFormatNumber(
                        row["KSGM_Cơ sở"]
                    )}
                </p>

            </div>
        `;

    }


    //==================================================
    // THUỐC THÚ Y
    //==================================================

    if(currentLayer === "CSBBTTY"){

        return `
            <div class="popup-card">

                <h3>
                    💊 ${name}
                </h3>

                <hr>

                <p>
                    <b>Số cơ sở:</b>
                    ${mapFormatNumber(
                        row["CSBBTTY_Cơ sở"]
                    )}
                </p>

            </div>
        `;

    }


    return `
        <div class="popup-card">

            <h3>${name}</h3>

        </div>
    `;

}


//======================================================
// POPUP BỆNH
//======================================================

function createDiseasePopup(
    name,
    row,
    icon,
    title,
    color,
    prefix
){

    const status =
        row[`${prefix}_Trạng thái`] ||
        "--";


    const outbreak =
        mapNumber(
            row[`${prefix}_Ổ dịch`]
        );


    const value =
        mapNumber(
            row[`${prefix}_Chết`]
        );


    const weight =
        row[`${prefix}_Trọng lượng`] !==
        undefined
            ? mapNumber(
                row[`${prefix}_Trọng lượng`]
            )
            : null;


    const date =
        row[`${prefix}_Ngày cuối`] ||
        null;


    const days =
        row[`${prefix}_Số ngày`] ||
        null;


    let html = `

        <div class="popup-card">

            <h3 style="color:${color}">

                ${icon} ${name}

            </h3>

            <hr>

            <p>
                <b>Trạng thái:</b>
                ${status}
            </p>

            <p>
                <b>Ổ dịch:</b>
                ${outbreak}
            </p>

    `;


    if(prefix === "DAI"){

        html += `

            <p>
                <b>Số chết, tiêu hủy:</b>
                ${mapFormatNumber(value)} con
            </p>

        `;

    }
    else{

        html += `

            <p>
                <b>Tiêu hủy:</b>
                ${mapFormatNumber(value)} con
            </p>

        `;

    }


    if(weight !== null){

        html += `

            <p>
                <b>Khối lượng:</b>
                ${mapFormatNumber(weight)} kg
            </p>

        `;

    }


    if(date){

        html += `

            <p>
                <b>Ngày cuối:</b>
                ${mapFormatDate(date)}
            </p>

        `;

    }


    if(days !== null){

        html += `

            <p>
                <b>Số ngày:</b>
                ${days}
            </p>

        `;

    }


    html += `

        </div>

    `;


    return html;

}


//======================================================
// POPUP VDNC
//======================================================

function createVDNCPopup(
    name,
    row
){

    return `

        <div class="popup-card">

            <h3 style="color:#8E24AA">

                🐄 ${name}

            </h3>

            <hr>

            <p>
                <b>Trạng thái:</b>
                ${row["VDNC_Trạng thái"] || "--"}
            </p>

            <p>
                <b>Ổ dịch:</b>
                ${mapFormatNumber(
                    row["VDNC_Ổ dịch"]
                )}
            </p>

            <p>
                <b>Mắc:</b>
                ${mapFormatNumber(
                    row["VDNC_Mắc"]
                )} con
            </p>

            <p>
                <b>Chết:</b>
                ${mapFormatNumber(
                    row["VDNC_Chết"]
                )} con
            </p>

            <p>
                <b>Khối lượng:</b>
                ${mapFormatNumber(
                    row["VDNC_Trọng lượng"]
                )} kg
            </p>

            <p>
                <b>Ngày cuối:</b>
                ${mapFormatDate(
                    row["VDNC_Ngày cuối"]
                )}
            </p>

            <p>
                <b>Số ngày:</b>
                ${row["VDNC_Số ngày"] || "--"}
            </p>

        </div>

    `;

}


//======================================================
// HIỂN THỊ NHÃN XÃ
//======================================================

function createLabel(
    feature,
    layer
){

    const name =
        getName(feature);


    if(!name){

        return null;

    }


    //==================================================
    // KSGM
    //==================================================

    if(
        layer === "KSGM"
    ){

        const row =
            getFeatureRow(feature);


        const count =
            row
                ? mapNumber(
                    row["KSGM_Cơ sở"]
                )
                : 0;


        return L.divIcon({

            className:
                "map-label",

            html: `

                <div>

                    ${name}

                    ${
                        count > 0
                        ? `<br>
                           <span class="ksgm-count">
                               ${count}
                           </span>`
                        : ""
                    }

                </div>

            `,

            iconSize: null

        });

    }


    return L.divIcon({

        className:
            "map-label",

        html: `
            <div>
                ${name}
            </div>
        `,

        iconSize: null

    });

}


//======================================================
// CHẤM ĐỎ XÃ ĐANG CÓ DỊCH
//======================================================

function addDiseaseMarker(
    feature,
    layerGroup
){

    const row =
        getFeatureRow(feature);


    const config =
        LAYER_CONFIG[currentLayer];


    if(
        !row ||
        !config ||
        !config.status
    ){

        return;

    }


    if(
        !isDiseaseActive(
            row,
            config.status
        )
    ){

        return;

    }


    if(
        !feature.geometry
    ){

        return;

    }


    let center;


    try{

        const temp =
            L.geoJSON(
                feature
            );


        center =
            temp.getBounds()
                .getCenter();

    }
    catch(err){

        return;

    }


    L.circleMarker(
        center,
        {

            radius:5,

            color:"#ffffff",

            weight:1.5,

            fillColor:"#ff0000",

            fillOpacity:1,

            interactive:false

        }
    )
    .addTo(layerGroup);

}


//======================================================
// HIỂN THỊ GEOJSON
//======================================================

function renderGeoJSON(){

    if(!map){

        return;

    }


    if(!geojsonData){

        return;

    }


    if(geojsonLayer){

        map.removeLayer(
            geojsonLayer
        );

        geojsonLayer = null;

    }


    const diseaseMarkers =
        L.layerGroup();


    geojsonLayer =
        L.geoJSON(
            geojsonData,
            {

                style:
                    getFeatureStyle,


                onEachFeature:
                    function(
                        feature,
                        layer
                    ){

                        const row =
                            getFeatureRow(
                                feature
                            );


                        //================================================
                        // POPUP
                        //================================================

                        layer.bindPopup(
                            createPopup(
                                feature,
                                row
                            ),
                            {
                                maxWidth:320
                            }
                        );


                        //================================================
                        // CLICK
                        //================================================

                        layer.on(
                            "click",
                            function(){

                                if(
                                    typeof showPanel ===
                                    "function"
                                ){

                                    showPanel(
                                        feature
                                    );

                                }

                            }
                        );


                        //================================================
                        // HOVER
                        //================================================

                        layer.on(
                            "mouseover",
                            function(){

                                this.setStyle({

                                    weight:2,

                                    color:"#1976D2"

                                });

                            }
                        );


                        layer.on(
                            "mouseout",
                            function(){

                                geojsonLayer.resetStyle(
                                    this
                                );

                            }
                        );


                        //================================================
                        // NHÃN
                        //================================================

                        const label =
                            createLabel(
                                feature,
                                currentLayer
                            );


                        if(label){

                            label
                                .addTo(
                                    map
                                );

                        }


                        //================================================
                        // CHẤM ĐỎ
                        //================================================

                        if(
                            currentLayer === "DTLCP" ||
                            currentLayer === "CGC" ||
                            currentLayer === "VDNC" ||
                            currentLayer === "DAI"
                        ){

                            addDiseaseMarker(
                                feature,
                                diseaseMarkers
                            );

                        }

                    }

            }
        )
        .addTo(map);


    //==================================================
    // ĐƯA CHẤM ĐỎ LÊN BẢN ĐỒ
    //==================================================

    diseaseMarkers.addTo(
        map
    );


    //==================================================
    // FIT BOUND
    //==================================================

    if(
        geojsonLayer.getBounds().isValid()
    ){

        map.fitBounds(
            geojsonLayer.getBounds(),
            {

                padding:[
                    20,
                    20
                ]

            }
        );

    }

}


//======================================================
// XÓA NHÃN CŨ
//======================================================

function clearMapLabels(){

    document
        .querySelectorAll(
            ".map-label"
        )
        .forEach(
            el => {

                if(
                    el._leaflet_id
                ){

                    // Không dùng
                    // vì divIcon không lưu
                    // trực tiếp marker.
                }

            }
        );

}


//======================================================
// REFRESH MAP
//======================================================

function refreshMap(){

    if(!map){

        return;

    }


    if(!geojsonData){

        return;

    }


    //==================================================
    // Xóa layer cũ
    //==================================================

    if(geojsonLayer){

        map.removeLayer(
            geojsonLayer
        );

        geojsonLayer = null;

    }


    //==================================================
    // Render lại
    //==================================================

    renderGeoJSON();


    //==================================================
    // Legend
    //==================================================

    updateLegend();


    //==================================================
    // Dashboard
    //==================================================

    if(
        typeof dashboard !== "undefined" &&
        typeof dashboard.update === "function"
    ){

        dashboard.update();

    }

}


//======================================================
// ĐỔI LỚP
//======================================================

function setLayer(layer){

    if(
        !LAYER_CONFIG[layer]
    ){

        console.warn(
            "Lớp không tồn tại:",
            layer
        );

        return;

    }


    currentLayer =
        layer;


    refreshMap();

}


//======================================================
// TÌM XÃ
//======================================================

function searchFeature(
    keyword
){

    if(
        !geojsonData ||
        !map
    ){

        return;

    }


    const text =
        String(
            keyword || ""
        )
        .trim()
        .toLowerCase();


    if(!text){

        return;

    }


    let found =
        null;


    for(
        const feature
        of geojsonData.features
    ){

        const row =
            getFeatureRow(
                feature
            );


        const name =
            row
                ? row["Tên xã"]
                : getName(feature);


        if(
            String(
                name || ""
            )
            .toLowerCase()
            .includes(text)
        ){

            found =
                feature;

            break;

        }

    }


    if(!found){

        alert(
            "Không tìm thấy xã/phường: " +
            keyword
        );

        return;

    }


    const layer =
        findLayerForFeature(
            found
        );


    if(layer){

        map.fitBounds(
            layer.getBounds(),
            {

                padding:[
                    30,
                    30
                ],

                maxZoom:13

            }
        );


        layer.openPopup();


        if(
            typeof showPanel ===
            "function"
        ){

            showPanel(
                found
            );

        }

    }

}


//======================================================
// TÌM LAYER CỦA FEATURE
//======================================================

function findLayerForFeature(
    feature
){

    if(!geojsonLayer){

        return null;

    }


    let result =
        null;


    geojsonLayer.eachLayer(
        function(layer){

            if(
                layer.feature ===
                feature
            ){

                result =
                    layer;

            }

        }
    );


    return result;

}


//======================================================
// LEGEND
//======================================================

function updateLegend(){

    if(
        legendControl
    ){

        map.removeControl(
            legendControl
        );

        legendControl =
            null;

    }


    legendControl =
        L.control({
            position:"bottomright"
        });


    legendControl.onAdd =
        function(){

            const div =
                L.DomUtil.create(
                    "div",
                    "legend"
                );


            const title =
                LAYER_CONFIG[currentLayer]
                    ? LAYER_CONFIG[currentLayer].name
                    : "Chú giải";


            let html = `

                <h4>
                    ${title}
                </h4>

            `;


            //================================================
            // DỊCH BỆNH
            //================================================

            if(
                currentLayer === "DTLCP" ||
                currentLayer === "CGC" ||
                currentLayer === "DAI"
            ){

                html += `

                    <div>
                        <i style="
                            background:#E53935;
                        "></i>

                        Đang có dịch
                    </div>

                    <div>
                        <i style="
                            background:#FFCDD2;
                        "></i>

                        Có dịch lũy kế
                    </div>

                    <div>
                        <i style="
                            background:#ECEFF1;
                        "></i>

                        Không có dịch
                    </div>

                    <hr>

                    <div class="legend-dot-row">

                        <span class="legend-red-dot"></span>

                        <span>
                            Xã đang có dịch
                        </span>

                    </div>

                `;

            }


            //================================================
            // VDNC
            //================================================

            else if(
                currentLayer === "VDNC"
            ){

                html += `

                    <div>
                        <i style="
                            background:#8E24AA;
                        "></i>

                        Đang có dịch
                    </div>

                    <div>
                        <i style="
                            background:#E1BEE7;
                        "></i>

                        Có dịch lũy kế
                    </div>

                    <div>
                        <i style="
                            background:#ECEFF1;
                        "></i>

                        Không có dịch
                    </div>

                    <hr>

                    <div class="legend-dot-row">

                        <span class="legend-red-dot"></span>

                        <span>
                            Xã đang có dịch
                        </span>

                    </div>

                `;

            }


            //================================================
            // PHUN
            //================================================

            else if(
                currentLayer === "PHUN"
            ){

                html += `

                    <div>
                        <i style="
                            background:#80CBC4;
                        "></i>

                        Vòng 1
                    </div>

                    <div>
                        <i style="
                            background:#26A69A;
                        "></i>

                        Vòng 2
                    </div>

                    <div>
                        <i style="
                            background:#00897B;
                        "></i>

                        Vòng 3
                    </div>

                    <div>
                        <i style="
                            background:#00695C;
                        "></i>

                        Vòng 4 trở lên
                    </div>

                    <div>
                        <i style="
                            background:#ECEFF1;
                        "></i>

                        Chưa triển khai
                    </div>

                `;

            }


            //================================================
            // KSGM
            //================================================

            else if(
                currentLayer === "KSGM"
            ){

                html += `

                    <div>
                        <i style="
                            background:#8D6E63;
                        "></i>

                        Đã triển khai
                    </div>

                    <div>
                        <i style="
                            background:#D7CCC8;
                        "></i>

                        Có cơ sở
                    </div>

                    <div>
                        <i style="
                            background:#ECEFF1;
                        "></i>

                        Chưa triển khai
                    </div>

                `;

            }


            //================================================
            // THUỐC THÚ Y
            //================================================

            else if(
                currentLayer === "CSBBTTY"
            ){

                html += `

                    <div>
                        <i style="
                            background:#43A047;
                        "></i>

                        Có cơ sở
                    </div>

                    <div>
                        <i style="
                            background:#ECEFF1;
                        "></i>

                        Không có cơ sở
                    </div>

                `;

            }


            div.innerHTML =
                html;


            L.DomEvent.disableClickPropagation(
                div
            );


            return div;

        };


    legendControl.addTo(
        map
    );

}


//======================================================
// MAP TOOLS
//======================================================

function addMapTools(){

    if(
        !map
    ){

        return;

    }


    //==================================================
    // FULLSCREEN
    //==================================================

    if(
        L.Control &&
        L.Control.Fullscreen
    ){

        try{

            map.addControl(
                new L.Control.Fullscreen({
                    position:"topleft"
                })
            );

        }
        catch(err){

            console.warn(
                "Không thêm được Fullscreen:",
                err
            );

        }

    }


    //==================================================
    // EASYPRINT
    //==================================================

    if(
        typeof L.easyPrint ===
        "function"
    ){

        try{

            printer =
                L.easyPrint({

                    title:
                        "Tải bản đồ",

                    position:
                        "topleft",

                    sizeModes:[
                        "Current"
                    ],

                    filename:
                        "WEBGIS_DienBien",

                    exportOnly:true

                })
                .addTo(map);

        }
        catch(err){

            console.warn(
                "Không thêm được EasyPrint:",
                err
            );

        }

    }

}


//======================================================
// RELOAD DATA
//======================================================

async function reloadData(){

    try{

        console.log(
            "WEBGIS: Đang cập nhật dữ liệu..."
        );


        //================================================
        // LOAD GOOGLE SHEETS
        //================================================

        await loadSheet();


        //================================================
        // DASHBOARD
        //================================================

        if(
            typeof dashboard !== "undefined" &&
            typeof dashboard.update === "function"
        ){

            dashboard.update();

        }


        //================================================
        // BẢN ĐỒ
        //================================================

        refreshMap();


        //================================================
        // PANEL
        //================================================

        if(
            typeof clearPanel ===
            "function"
        ){

            clearPanel();

        }


        console.log(
            "WEBGIS: Cập nhật thành công."
        );

    }
    catch(err){

        console.error(
            "WEBGIS: Lỗi cập nhật:",
            err
        );

    }

}


//======================================================
// EXPORT MAP
//======================================================

function exportCurrentMap(){

    if(
        !printer
    ){

        console.warn(
            "Công cụ tải bản đồ chưa sẵn sàng."
        );

        return;

    }


    const today =
        new Date();


    const filename =
        `WEBGIS_${currentLayer}_` +
        `${today.getFullYear()}-` +
        `${String(
            today.getMonth() + 1
        ).padStart(2,"0")}-` +
        `${String(
            today.getDate()
        ).padStart(2,"0")}`;


    try{

        printer.print(
            "CurrentSize",
            filename
        );

    }
    catch(err){

        console.error(
            "Lỗi tải bản đồ:",
            err
        );

    }

}
