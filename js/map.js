//======================================================
// MAP.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT ĐIỆN BIÊN
//======================================================
//
// QUY ƯỚC:
//
// DTLCP -> DTLCP_Chết
// CGC   -> CGC_Chết
// VDNC  -> VDNC_Mắc
// DAI   -> DAI_Chết
//
// Màu bản đồ:
// - 0 dữ liệu -> Xã không có dịch
// - Số > 0 -> tự động chia tối đa 5 khoảng
//
// Xã đang có dịch:
// - Tên xã hiển thị
// - Chấm đỏ nhỏ
//
// Click xã:
// - Chỉ hiển thị thông tin ở PANEL bên phải
// - Không mở popup
//
//======================================================


//======================================================
// BIẾN TOÀN CỤC
//======================================================

let map = null;

let geojsonLayer = null;

let geojsonData = null;

let labelLayer = null;

let diseaseMarkerLayer = null;

let legendControl = null;

let printer = null;

let currentLayer = "DTLCP";

let mapReady = false;


//======================================================
// CẤU HÌNH LỚP
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
// CẤU HÌNH MÀU MỨC THIỆT HẠI
//======================================================
//
// Không quy định khoảng cố định.
// Chỉ quy định 5 màu.
//
// Khoảng số liệu được tính tự động từ Sheet.
//======================================================

const DAMAGE_COLORS = [

    "#FFCDD2",

    "#EF9A9A",

    "#E57373",

    "#E53935",

    "#8B0000"

];


//======================================================
// KHỞI TẠO BẢN ĐỒ
//======================================================

async function initMap(){

    if(map){

        return map;

    }


    map = L.map(
        "map",
        {

            zoomControl: true,

            attributionControl: true

        }
    );


    //==================================================
    // NỀN BẢN ĐỒ
    //==================================================

    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"

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


        const response = await fetch(

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

            geojsonData.type !==
            "FeatureCollection"

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
// LẤY DÒNG DỮ LIỆU TỪ SHEET
//======================================================

function getFeatureRow(feature){

    if(

        !feature ||

        !feature.properties

    ){

        return null;

    }


    const id =
        Number(
            feature.properties.ID
        );


    if(

        typeof sheetData ===
        "undefined"

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
// CHUYỂN GIÁ TRỊ THÀNH SỐ
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
        String(value).trim();


    if(!str){

        return 0;

    }


    // Giữ số, dấu âm, dấu chấm, dấu phẩy

    str =
        str.replace(
            /[^\d,.-]/g,
            ""
        );


    // Ví dụ: 1.234,56

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

    // Ví dụ: 1.234

    else if(

        str.includes(".")

    ){

        const parts =
            str.split(".");


        if(

            parts.length > 2

        ){

            str =
                str.replace(
                    /\./g,
                    ""
                );

        }

    }

    // Ví dụ: 1,234

    else if(

        str.includes(",")

    ){

        const parts =
            str.split(",");


        if(

            parts.length > 2

        ){

            str =
                str.replace(
                    /,/g,
                    ""
                );

        }
        else if(

            parts[1] &&
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

        isNaN(
            date.getTime()
        )

    ){

        return value;

    }


    return date.toLocaleDateString(
        "vi-VN"
    );

}


//======================================================
// LẤY TẤT CẢ DÒNG SHEET
//======================================================

function getMapRows(){

    if(

        typeof getRows ===
        "function"

    ){

        return getRows();

    }


    if(

        typeof sheetData !==
        "undefined"

    ){

        return Object.values(
            sheetData
        );

    }


    return [];

}


//======================================================
// XÁC ĐỊNH XÃ ĐANG CÓ DỊCH
//======================================================

function isDiseaseActive(
    row,
    statusField
){

    if(

        !row ||

        !statusField

    ){

        return false;

    }


    const status =
        mapNormalizeStatus(
            row[statusField]
        );


    return (

        status === "đang có dịch"

    );

}


//======================================================
// XÁC ĐỊNH XÃ CÓ DỊCH LŨY KẾ
//======================================================

function hasDiseaseHistory(
    row,
    config
){

    if(

        !row ||

        !config

    ){

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


    if(

        status === "đang có dịch" ||

        status === "đã hết dịch"

    ){

        return true;

    }


    return (

        outbreak > 0 ||

        value > 0 ||

        death > 0

    );

}


//======================================================
// LẤY GIÁ TRỊ THIỆT HẠI
//======================================================

function getDamageValue(row){

    if(!row){

        return 0;

    }


    // DTLCP

    if(

        currentLayer ===
        "DTLCP"

    ){

        return mapNumber(
            row["DTLCP_Chết"]
        );

    }


    // CGC

    if(

        currentLayer ===
        "CGC"

    ){

        return mapNumber(
            row["CGC_Chết"]
        );

    }


    // VDNC

    if(

        currentLayer ===
        "VDNC"

    ){

        return mapNumber(
            row["VDNC_Mắc"]
        );

    }


    // Dại

    if(

        currentLayer ===
        "DAI"

    ){

        return mapNumber(
            row["DAI_Chết"]
        );

    }


    return 0;

}


//======================================================
// TỰ ĐỘNG TÍNH CÁC KHOẢNG THIỆT HẠI
//======================================================
//
// Dùng dữ liệu thực tế trong Sheet.
// Không có ngưỡng cố định.
//
// Các giá trị 0 được loại khỏi phép chia khoảng.
// 0 được thể hiện riêng là "Xã không có dịch".
//
//======================================================

function calculateDamageRanges(){

    if(

        currentLayer !==
        "DTLCP" &&

        currentLayer !==
        "CGC" &&

        currentLayer !==
        "VDNC" &&

        currentLayer !==
        "DAI"

    ){

        return [];

    }


    const rows =
        getMapRows();


    const values =
        rows

            .map(
                row =>
                    getDamageValue(row)
            )

            .filter(
                value =>
                    value > 0
            )

            .sort(
                (a,b) =>
                    a - b
            );


    if(

        values.length === 0

    ){

        return [];

    }


    //==================================================
    // Chỉ có một giá trị khác 0
    //==================================================

    if(

        values.length === 1

    ){

        return [

            {

                min: values[0],

                max: values[0]

            }

        ];

    }


    //==================================================
    // Lấy phân vị
    //==================================================

    function percentile(
        array,
        p
    ){

        const index =
            (array.length - 1) *
            p;


        const lower =
            Math.floor(index);


        const upper =
            Math.ceil(index);


        if(

            lower === upper

        ){

            return array[lower];

        }


        return (

            array[lower] +

            (

                array[upper] -
                array[lower]

            ) *

            (

                index -
                lower

            )

        );

    }


    //==================================================
    // 4 mốc để tạo tối đa 5 khoảng
    //==================================================

    const q1 =
        Math.round(
            percentile(
                values,
                0.20
            )
        );


    const q2 =
        Math.round(
            percentile(
                values,
                0.40
            )
        );


    const q3 =
        Math.round(
            percentile(
                values,
                0.60
            )
        );


    const q4 =
        Math.round(
            percentile(
                values,
                0.80
            )
        );


    const rawRanges = [

        {
            min: values[0],
            max: q1
        },

        {
            min: q1 + 1,
            max: q2
        },

        {
            min: q2 + 1,
            max: q3
        },

        {
            min: q3 + 1,
            max: q4
        },

        {
            min: q4 + 1,
            max:
                values[
                    values.length - 1
                ]
        }

    ];


    //==================================================
    // Loại các khoảng không hợp lệ
    //==================================================

    const ranges = [];


    rawRanges.forEach(
        range => {

            if(

                range.min <=
                range.max

            ){

                ranges.push(
                    range
                );

            }

        }
    );


    return ranges;

}


//======================================================
// TÌM MỨC MÀU CỦA GIÁ TRỊ
//======================================================

function getDamageClass(
    value,
    ranges
){

    if(

        value <= 0 ||

        ranges.length === 0

    ){

        return -1;

    }


    for(

        let i = 0;

        i < ranges.length;

        i++

    ){

        const range =
            ranges[i];


        if(

            value >= range.min &&

            value <= range.max

        ){

            return i;

        }

    }


    // Trường hợp do làm tròn
    // giá trị lớn nhất nằm ngoài mốc

    return ranges.length - 1;

}


//======================================================
// STYLE MỨC ĐỘ THIỆT HẠI
//======================================================

function getDamageStyle(row){

    const value =
        getDamageValue(row);


    const ranges =
        calculateDamageRanges();


    //==================================================
    // KHÔNG CÓ THIỆT HẠI
    //==================================================

    if(

        value <= 0

    ){

        return {

            fillColor: "#F3F4F6",

            weight: 1,

            color: "#9CA3AF",

            fillOpacity: .55

        };

    }


    const index =
        getDamageClass(
            value,
            ranges
        );


    const color =
        DAMAGE_COLORS[
            Math.min(
                index,
                DAMAGE_COLORS.length - 1
            )
        ];


    return {

        fillColor:
            color,

        weight:
            1,

        color:
            "#8B1A1A",

        fillOpacity:
            .75

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


    if(

        round >= 4

    ){

        return {

            fillColor:"#00695C",

            weight:1,

            color:"#004D40",

            fillOpacity:.75

        };

    }


    if(

        round === 3

    ){

        return {

            fillColor:"#00897B",

            weight:1,

            color:"#00695C",

            fillOpacity:.70

        };

    }


    if(

        round === 2

    ){

        return {

            fillColor:"#26A69A",

            weight:1,

            color:"#00796B",

            fillOpacity:.65

        };

    }


    if(

        round === 1

    ){

        return {

            fillColor:"#80CBC4",

            weight:1,

            color:"#00897B",

            fillOpacity:.65

        };

    }


    if(

        households > 0

    ){

        return {

            fillColor:"#B2DFDB",

            weight:1,

            color:"#00897B",

            fillOpacity:.60

        };

    }


    return {

        fillColor:"#F3F4F6",

        weight:1,

        color:"#9CA3AF",

        fillOpacity:.45

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

        status ===
        "đã triển khai"

    ){

        return {

            fillColor:"#8D6E63",

            weight:1,

            color:"#5D4037",

            fillOpacity:.72

        };

    }


    if(

        count > 0

    ){

        return {

            fillColor:"#D7CCC8",

            weight:1,

            color:"#795548",

            fillOpacity:.60

        };

    }


    return {

        fillColor:"#F3F4F6",

        weight:1,

        color:"#9CA3AF",

        fillOpacity:.45

    };

}


//======================================================
// STYLE THUỐC THÚ Y
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

            fillColor:"#43A047",

            weight:1,

            color:"#1B5E20",

            fillOpacity:.70

        };

    }


    return {

        fillColor:"#F3F4F6",

        weight:1,

        color:"#9CA3AF",

        fillOpacity:.45

    };

}


//======================================================
// STYLE XÃ
//======================================================

function getFeatureStyle(feature){

    const row =
        getFeatureRow(feature);


    if(!row){

        return {

            fillColor:"#F3F4F6",

            weight:1,

            color:"#9CA3AF",

            fillOpacity:.45

        };

    }


    //==================================================
    // BỆNH
    //==================================================

    if(

        currentLayer ===
        "DTLCP" ||

        currentLayer ===
        "CGC" ||

        currentLayer ===
        "VDNC" ||

        currentLayer ===
        "DAI"

    ){

        return getDamageStyle(
            row
        );

    }


    //==================================================
    // PHUN
    //==================================================

    if(

        currentLayer ===
        "PHUN"

    ){

        return stylePhun(
            row
        );

    }


    //==================================================
    // KSGM
    //==================================================

    if(

        currentLayer ===
        "KSGM"

    ){

        return styleKSGM(
            row
        );

    }


    //==================================================
    // THUỐC THÚ Y
    //==================================================

    if(

        currentLayer ===
        "CSBBTTY"

    ){

        return styleDrugStore(
            row
        );

    }


    return {

        fillColor:"#F3F4F6",

        weight:1,

        color:"#9CA3AF",

        fillOpacity:.45

    };

}


//======================================================
// LẤY TÂM XÃ
//======================================================

function getFeatureCenter(
    feature
){

    try{

        const layer =
            L.geoJSON(
                feature
            );


        const bounds =
            layer.getBounds();


        if(

            bounds.isValid()

        ){

            return bounds.getCenter();

        }

    }
    catch(err){

        console.warn(
            "Không xác định được tâm xã:",
            err
        );

    }


    return null;

}


//======================================================
// XÃ CÓ SỐ LIỆU DỊCH BỆNH
//======================================================

function featureHasDisease(feature){

    const row =
        getFeatureRow(feature);

    if(!row){

        return false;

    }

    const config =
        LAYER_CONFIG[currentLayer];

    if(!config){

        return false;

    }

    // Trạng thái có dữ liệu
    const status =
        String(
            row[config.status] || ""
        ).trim();

    // Số ổ dịch
    const outbreak =
        mapNumber(
            row[config.outbreak]
        );

    // Số con thiệt hại/mắc
    const value =
        mapNumber(
            row[config.value]
        );

    // VDNC có thêm số chết
    const death =
        mapNumber(
            row[config.death]
        );

    return (

        status !== "" ||

        outbreak > 0 ||

        value > 0 ||

        death > 0

    );

}
//======================================================
// TẠO TÊN XÃ/PHƯỜNG
// Chỉ hiện nơi có số liệu của lớp đang chọn
//======================================================

function createDiseaseLabel(feature){

    if(!featureHasDisease(feature)){

        return null;

    }

    const name =
        getName(feature);

    if(!name){

        return null;

    }

    const center =
        getFeatureCenter(feature);

    if(!center){

        return null;

    }

    return L.marker(

        center,

        {

            icon: L.divIcon({

                className: "map-label",

                html: `
                    <div>${name}</div>
                `,

                iconSize: null,

                iconAnchor: [0,0]

            }),

            interactive: false

        }

    );

}
//======================================================
// CHẤM TRÒN ĐỎ - XÃ ĐANG CÓ DỊCH
//======================================================

function addDiseaseMarker(feature){

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

    // Chỉ xã đang có dịch
    if(
        !isDiseaseActive(
            row,
            config.status
        )
    ){

        return;

    }

    const center =
        getFeatureCenter(feature);

    if(!center){

        return;

    }

    L.circleMarker(
        center,
        {

            // Chấm nhỏ
            radius: 4,

            // Viền sáng
            color: "#FFFFFF",

            weight: 1.5,

            // Lõi đỏ
            fillColor: "#FF0000",

            fillOpacity: 1,

            opacity: 1,

            interactive: false

        }
    ).addTo(
        diseaseMarkerLayer
    );

}
//======================================================
// XÓA CÁC LAYER PHỤ
//======================================================

function clearMapOverlays(){

    if(labelLayer){

        map.removeLayer(
            labelLayer
        );

        labelLayer = null;

    }


    if(diseaseMarkerLayer){

        map.removeLayer(
            diseaseMarkerLayer
        );

        diseaseMarkerLayer = null;

    }

}


//======================================================
// RENDER GEOJSON
//======================================================

function renderGeoJSON(){

    if(!map || !geojsonData){

        console.warn(
            "Chưa có map hoặc GeoJSON"
        );

        return;

    }


    //==================================================
    // XÓA LAYER CŨ
    //==================================================

    if(geojsonLayer){

        map.removeLayer(
            geojsonLayer
        );

        geojsonLayer = null;

    }


    //==================================================
    // XÓA NHÃN CŨ
    //==================================================

    if(labelLayer){

        map.removeLayer(
            labelLayer
        );

    }


    labelLayer =
        L.layerGroup()
            .addTo(map);


    //==================================================
    // XÓA CHẤM ĐỎ CŨ
    //==================================================

    if(diseaseMarkerLayer){

        map.removeLayer(
            diseaseMarkerLayer
        );

    }


    diseaseMarkerLayer =
        L.layerGroup()
            .addTo(map);


    //==================================================
    // TẠO GEOJSON
    //==================================================

    geojsonLayer = L.geoJSON(

        geojsonData,

        {

            //==========================================
            // MÀU XÃ
            //==========================================

            style: function(feature){

                return getFeatureStyle(
                    feature
                );

            },


            //==========================================
            // XỬ LÝ TỪNG XÃ
            //==========================================

            onEachFeature:
                function(feature, layer){

                    //==================================
                    // CLICK XÃ
                    //==================================

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


                    //==================================
                    // HOVER
                    //==================================

                    layer.on(
                        "mouseover",
                        function(){

                            this.setStyle({

                                weight: 2,

                                color: "#1976D2",

                                fillOpacity: .85

                            });

                        }
                    );


                    layer.on(
                        "mouseout",
                        function(){

                            if(
                                geojsonLayer
                            ){

                                geojsonLayer.resetStyle(
                                    this
                                );

                            }

                        }
                    );


                    //==================================
                    // CHỈ CÁC LỚP BỆNH
                    //==================================

                    if(

                        currentLayer ===
                        "DTLCP" ||

                        currentLayer ===
                        "CGC" ||

                        currentLayer ===
                        "VDNC" ||

                        currentLayer ===
                        "DAI"

                    ){

                        //================================
                        // TÊN XÃ CÓ SỐ LIỆU
                        //================================

                        const label =
                            createDiseaseLabel(
                                feature
                            );


                        if(label){

                            label.addTo(
                                labelLayer
                            );

                        }


                        //================================
                        // CHẤM ĐỎ XÃ ĐANG CÓ DỊCH
                        //================================

                        addDiseaseMarker(
                            feature
                        );

                    }

                }

        }

    ).addTo(map);


    //==================================================
    // CĂN BẢN ĐỒ
    //==================================================

    const bounds =
        geojsonLayer.getBounds();


    if(
        bounds &&
        bounds.isValid()
    ){

        map.fitBounds(

            bounds,

            {

                padding: [
                    20,
                    20
                ]

            }

        );

    }

}
    //==================================================
    // XÓA BẢN ĐỒ CŨ
    //==================================================

    if(geojsonLayer){

        map.removeLayer(
            geojsonLayer
        );

        geojsonLayer = null;

    }


    clearMapOverlays();


    //==================================================
    // TẠO LAYER NHÃN
    //==================================================

    labelLayer =
        L.layerGroup()
            .addTo(map);


    //==================================================
    // TẠO LAYER CHẤM ĐỎ
    //==================================================

    diseaseMarkerLayer =
        L.layerGroup()
            .addTo(map);


    //==================================================
    // TẠO GEOJSON
    //==================================================

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

                        //==========================================
                        // CLICK XÃ
                        //==========================================

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


                        //==========================================
                        // HOVER
                        //==========================================

                        layer.on(
                            "mouseover",
                            function(){

                                this.setStyle({

                                    weight: 2,

                                    color: "#1976D2",

                                    fillOpacity:
                                        .85

                                });

                            }
                        );


                        layer.on(
                            "mouseout",
                            function(){

                                if(
                                    geojsonLayer
                                ){

                                    geojsonLayer.resetStyle(
                                        this
                                    );

                                }

                            }
                        );


                        //==========================================
                        // TÊN XÃ
                        //==========================================

                        if(

                            currentLayer ===
                            "DTLCP" ||

                            currentLayer ===
                            "CGC" ||

                            currentLayer ===
                            "VDNC" ||

                            currentLayer ===
                            "DAI"

                        ){

                            const label =
                                createDiseaseLabel(
                                    feature
                                );


                            if(label){

                                label.addTo(
                                    labelLayer
                                );

                            }


                            //======================================
                            // CHẤM ĐỎ
                            //======================================

                            addDiseaseMarker(
                                feature
                            );

                        }

                    }

            }

        ).addTo(map);


    //==================================================
    // FIT BOUND
    //==================================================

    if(

        geojsonLayer
            .getBounds()
            .isValid()

    ){

        map.fitBounds(

            geojsonLayer.getBounds(),

            {

                padding:
                    [20,20]

            }

        );

    }

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


    renderGeoJSON();


    updateLegend();

}


//======================================================
// ĐỔI LỚP
//======================================================

function setLayer(
    layer
){

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


    // Xóa panel cũ

    if(

        typeof clearPanel ===
        "function"

    ){

        clearPanel();

    }


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
                : getName(
                    feature
                );


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

                padding:
                    [30,30],

                maxZoom:
                    13

            }

        );

    }


    // Chỉ hiện panel bên phải

    if(

        typeof showPanel ===
        "function"

    ){

        showPanel(
            found
        );

    }

}


//======================================================
// TÌM LAYER THEO FEATURE
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
// TẠO CHÚ GIẢI
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

            position:
                "bottomright"

        });


    legendControl.onAdd =
        function(){

            const div =
                L.DomUtil.create(

                    "div",

                    "legend"

                );


            //==================================================
            // CÁC LỚP BỆNH
            //==================================================

            if(

                currentLayer ===
                "DTLCP" ||

                currentLayer ===
                "CGC" ||

                currentLayer ===
                "VDNC" ||

                currentLayer ===
                "DAI"

            ){

                const ranges =
                    calculateDamageRanges();


                const config =
                    LAYER_CONFIG[
                        currentLayer
                    ];


                let html = `

                    <h4>
                        ${config.name}
                    </h4>

                    <div class="legend-dot-row">

                        <span
                            class="legend-red-dot"
                            style="
                                width:7px;
                                height:7px;
                                margin-top:4px;
                            "
                        ></span>

                        <span>
                            Xã đang có dịch
                        </span>

                    </div>

                    <div class="legend-dot-row">

                        <span
                            style="
                                width:7px;
                                height:7px;
                                border:1px solid #777;
                                border-radius:50%;
                                background:#F3F4F6;
                                margin-right:10px;
                                margin-top:4px;
                            "
                        ></span>

                        <span>
                            Xã không có dịch
                        </span>

                    </div>

                `;


                //==================================================
                // MỨC THIỆT HẠI
                //==================================================

                if(
                    ranges.length > 0
                ){

                    html += `

                        <hr>

                        <div style="
                            font-weight:700;
                            margin-bottom:7px;
                        ">
                            Mức độ thiệt hại
                        </div>

                    `;


                    ranges.forEach(

                        function(
                            range,
                            index
                        ){

                            const color =
                                DAMAGE_COLORS[
                                    Math.min(
                                        index,
                                        DAMAGE_COLORS.length - 1
                                    )
                                ];


                            let label;


                            if(

                                range.min ===
                                range.max

                            ){

                                label =
                                    `${mapFormatNumber(
                                        range.min
                                    )} con`;

                            }
                            else{

                                label =
                                    `${mapFormatNumber(
                                        range.min
                                    )}–${mapFormatNumber(
                                        range.max
                                    )} con`;

                            }


                            html += `

                                <div>

                                    <i style="
                                        background:${color};
                                    "></i>

                                    ${label}

                                </div>

                            `;

                        }

                    );

                }
                else{

                    html += `

                        <hr>

                        <div>
                            Chưa có số liệu thiệt hại
                        </div>

                    `;

                }


                div.innerHTML =
                    html;

            }


            //==================================================
            // PHUN
            //==================================================

            else if(

                currentLayer ===
                "PHUN"

            ){

                div.innerHTML = `

                    <h4>
                        Phun khử trùng
                    </h4>

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

                `;

            }


            //==================================================
            // KSGM
            //==================================================

            else if(

                currentLayer ===
                "KSGM"

            ){

                div.innerHTML = `

                    <h4>
                        Kiểm soát giết mổ
                    </h4>

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
                            background:#F3F4F6;
                        "></i>
                        Chưa triển khai
                    </div>

                `;

            }


            //==================================================
            // THUỐC THÚ Y
            //==================================================

            else if(

                currentLayer ===
                "CSBBTTY"

            ){

                div.innerHTML = `

                    <h4>
                        Cơ sở thuốc thú y
                    </h4>

                    <div>
                        <i style="
                            background:#43A047;
                        "></i>
                        Có cơ sở
                    </div>

                    <div>
                        <i style="
                            background:#F3F4F6;
                        "></i>
                        Không có cơ sở
                    </div>

                `;

            }


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
// THÊM CÔNG CỤ BẢN ĐỒ
//======================================================

function addMapTools(){

    if(!map){

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

                    position:
                        "topleft"

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

                    sizeModes:
                        ["Current"],

                    filename:
                        "WEBGIS_DienBien",

                    exportOnly:
                        true

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
// LÀM MỚI DỮ LIỆU
//======================================================

async function reloadData(){

    try{

        console.log(
            "WEBGIS: Đang cập nhật dữ liệu..."
        );


        //==================================================
        // LOAD GOOGLE SHEETS
        //==================================================

        await loadSheet();


        //==================================================
        // CẬP NHẬT DASHBOARD
        //==================================================

        if(

            typeof dashboard !==
            "undefined" &&

            typeof dashboard.update ===
            "function"

        ){

            dashboard.update();

        }


        //==================================================
        // CẬP NHẬT BẢN ĐỒ
        //==================================================

        refreshMap();


        //==================================================
        // XÓA PANEL
        //==================================================

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
            "WEBGIS: Lỗi cập nhật dữ liệu:",
            err
        );

    }

}


//======================================================
// EXPORT MAP
//======================================================

function exportCurrentMap(){

    if(!printer){

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

        printer.printMap(

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
