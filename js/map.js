//======================================================
// MAP.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT ĐIỆN BIÊN
//======================================================
//
// DTLCP -> DTLCP_Chết
// CGC   -> CGC_Chết
// VDNC  -> VDNC_Mắc
// DAI   -> DAI_Chết
//
// Tên xã:
// - Có số liệu của lớp đang chọn -> hiện tên
//
// Chấm đỏ:
// - Chỉ xã đang có dịch
// - Tròn nhỏ
// - Viền trắng
// - Không nhấp nháy
//
// Màu:
// - Tự động chia theo số liệu thực tế
// - Bắt đầu từ 1
// - 0 = xã không có dịch
//
// Click:
// - Chỉ mở thông tin bên phải
// - Không popup
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
// CẤU HÌNH CÁC LỚP
//======================================================

const LAYER_CONFIG = {

    DTLCP: {
        name: "Dịch tả lợn Châu Phi",
        status: "DTLCP_Trạng thái",
        outbreak: "DTLCP_Ổ dịch",
        value: "DTLCP_Chết",
        weight: "DTLCP_Trọng lượng",
        date: "DTLCP_Ngày cuối",
        days: "DTLCP_Số ngày"
    },

    CGC: {
        name: "Cúm gia cầm",
        status: "CGC_Trạng thái",
        outbreak: "CGC_Ổ dịch",
        value: "CGC_Chết",
        weight: "CGC_Trọng lượng",
        date: "CGC_Ngày cuối",
        days: "CGC_Số ngày"
    },

    VDNC: {
        name: "Viêm da nổi cục",
        status: "VDNC_Trạng thái",
        outbreak: "VDNC_Ổ dịch",
        value: "VDNC_Mắc",
        death: "VDNC_Chết",
        weight: "VDNC_Trọng lượng",
        date: "VDNC_Ngày cuối",
        days: "VDNC_Số ngày"
    },

    DAI: {
        name: "Bệnh Dại",
        status: "DAI_Trạng thái",
        outbreak: "DAI_Ổ dịch",
        value: "DAI_Chết",
        date: "DAI_Ngày cuối",
        days: "DAI_Số ngày"
    },

    PHUN: {
        name: "Phun khử trùng",
        value: "PHUN_Số hộ",
        round: "PHUN_Vòng",
        area: "PHUN_Diện tích",
        progress: "PHUN_Tiến độ",
        date: "PHUN_Ngày"
    },

    KSGM: {
        name: "Kiểm soát giết mổ",
        status: "KSGM_Trạng thái",
        value: "KSGM_Cơ sở"
    },

    CSBBTTY: {
        name: "Cơ sở buôn bán thuốc thú y",
        value: "CSBBTTY_Cơ sở"
    }

};


//======================================================
// 5 MÀU THIỆT HẠI
//======================================================

const DAMAGE_COLORS = [
    "#FDE2E2",
    "#F8B4B4",
    "#EF6A6A",
    "#D93636",
    "#8B0000"
];


//======================================================
// VỊ TRÍ ỨNG VIÊN CHO NHÃN
//======================================================

const LABEL_OFFSETS = [

    [0, -16],
    [18, 0],
    [-18, 0],
    [0, 16],

    [20, -14],
    [-20, -14],
    [20, 14],
    [-20, 14],

    [32, 0],
    [-32, 0],

    [0, -30],
    [0, 30],

    [38, -20],
    [-38, -20],
    [38, 20],
    [-38, 20]

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
    // NỀN BẢN ĐỒ NHẠT
    //==================================================

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
            attribution:
                "&copy; OpenStreetMap & CARTO",
            subdomains:
                "abcd",
            maxZoom:
                20
        }
    ).addTo(map);


    //==================================================
    // NHÃN NỀN RẤT NHẸ
    //==================================================

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        {
            subdomains:
                "abcd",
            maxZoom:
                20,
            opacity:
                0.45
        }
    ).addTo(map);


    //==================================================
    // TÂM BAN ĐẦU
    //==================================================

    map.setView(
        [21.38, 103.02],
        9
    );


    //==================================================
    // ZOOM -> VẼ LẠI NHÃN
    //==================================================

    map.on(
        "zoomend",
        function(){

            if(
                typeof buildDiseaseLabels ===
                "function"
            ){

                buildDiseaseLabels();

            }

        }
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
                "Không tải được GeoJSON: HTTP " +
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
                "GeoJSON không đúng định dạng FeatureCollection."
            );

        }


        refreshMap();


        console.log(
            "GeoJSON: Đã tải"
        );


        return geojsonData;

    }
    catch(error){

        console.error(
            "Lỗi tải GeoJSON:",
            error
        );

        throw error;

    }

}


//======================================================
// LẤY ROW THEO ID
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
        !Number.isFinite(id)
    ){

        return null;

    }


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
// ƯU TIÊN GOOGLE SHEETS
//======================================================

function getName(feature){

    if(!feature){
        return "";
    }


    const row =
        getFeatureRow(feature);


    if(row){

        const sheetName =
            String(
                row["Tên xã"] || ""
            ).trim();


        if(sheetName){
            return sheetName;
        }

    }


    if(feature.properties){

        const p =
            feature.properties;


        return (
            p["Tên xã"] ||
            p["TEN_XA"] ||
            p["TENXA"] ||
            p["NAME"] ||
            p["Name"] ||
            p["name"] ||
            ""
        );

    }


    return "";

}


//======================================================
// CHUẨN HÓA TRẠNG THÁI
//======================================================

function normalizeMapStatus(value){

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
// CHUYỂN SANG NUMBER
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

        return Number.isFinite(value)
            ? value
            : 0;

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


    // 1.234,56
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

    // 1.234 hoặc 12.5
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
        else if(
            parts[1] &&
            parts[1].length > 2
        ){

            str =
                str.replace(
                    /\./g,
                    ""
                );

        }

    }

    // 1,5 hoặc 1,234
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


    const n =
        Number(str);


    return Number.isFinite(n)
        ? n
        : 0;

}


//======================================================
// FORMAT NUMBER
//======================================================

function mapFormatNumber(value){

    const n =
        Number(value);


    if(
        !Number.isFinite(n)
    ){

        return "0";

    }


    return n.toLocaleString(
        "vi-VN"
    );

}


//======================================================
// FORMAT DATE
//======================================================

function mapFormatDate(value){

    if(!value){
        return "--";
    }


    const d =
        new Date(value);


    if(
        !Number.isFinite(
            d.getTime()
        )
    ){

        return String(value);

    }


    return d.toLocaleDateString(
        "vi-VN"
    );

}


//======================================================
// LẤY ROW
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
// XÃ ĐANG CÓ DỊCH
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


    return (
        normalizeMapStatus(
            row[statusField]
        ) ===
        "đang có dịch"
    );

}


//======================================================
// XÃ CÓ SỐ LIỆU
//======================================================

function featureHasData(feature){

    const row =
        getFeatureRow(feature);


    if(!row){
        return false;
    }


    //==================================================
    // DTLCP
    //==================================================

    if(
        currentLayer ===
        "DTLCP"
    ){

        return (

            mapNumber(
                row["DTLCP_Chết"]
            ) > 0 ||

            mapNumber(
                row["DTLCP_Ổ dịch"]
            ) > 0 ||

            String(
                row["DTLCP_Trạng thái"] || ""
            ).trim() !== "" ||

            String(
                row["DTLCP_Ngày cuối"] || ""
            ).trim() !== ""

        );

    }


    //==================================================
    // CGC
    //==================================================

    if(
        currentLayer ===
        "CGC"
    ){

        return (

            mapNumber(
                row["CGC_Chết"]
            ) > 0 ||

            mapNumber(
                row["CGC_Ổ dịch"]
            ) > 0 ||

            String(
                row["CGC_Trạng thái"] || ""
            ).trim() !== "" ||

            String(
                row["CGC_Ngày cuối"] || ""
            ).trim() !== ""

        );

    }


    //==================================================
    // VDNC
    //==================================================

    if(
        currentLayer ===
        "VDNC"
    ){

        return (

            mapNumber(
                row["VDNC_Mắc"]
            ) > 0 ||

            mapNumber(
                row["VDNC_Chết"]
            ) > 0 ||

            mapNumber(
                row["VDNC_Ổ dịch"]
            ) > 0 ||

            String(
                row["VDNC_Trạng thái"] || ""
            ).trim() !== "" ||

            String(
                row["VDNC_Ngày cuối"] || ""
            ).trim() !== ""

        );

    }


    //==================================================
    // DẠI
    //==================================================

    if(
        currentLayer ===
        "DAI"
    ){

        return (

            mapNumber(
                row["DAI_Chết"]
            ) > 0 ||

            mapNumber(
                row["DAI_Ổ dịch"]
            ) > 0 ||

            String(
                row["DAI_Trạng thái"] || ""
            ).trim() !== "" ||

            String(
                row["DAI_Ngày cuối"] || ""
            ).trim() !== ""

        );

    }


    return false;

}


//======================================================
// GIÁ TRỊ THIỆT HẠI
//======================================================

function getDamageValue(row){

    if(!row){
        return 0;
    }


    if(
        currentLayer ===
        "DTLCP"
    ){

        return mapNumber(
            row["DTLCP_Chết"]
        );

    }


    if(
        currentLayer ===
        "CGC"
    ){

        return mapNumber(
            row["CGC_Chết"]
        );

    }


    if(
        currentLayer ===
        "VDNC"
    ){

        return mapNumber(
            row["VDNC_Mắc"]
        );

    }


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
// JENKS NATURAL BREAKS
// BẢN AN TOÀN
//======================================================

function calculateDamageRanges(){

    const diseaseLayers = [
        "DTLCP",
        "CGC",
        "VDNC",
        "DAI"
    ];


    if(
        !diseaseLayers.includes(
            currentLayer
        )
    ){

        return [];

    }


    const values =
        getMapRows()
            .map(function(row){

                return getDamageValue(row);

            })
            .filter(function(value){

                return (
                    Number.isFinite(value) &&
                    value > 0
                );

            })
            .sort(function(a,b){

                return a - b;

            });


    if(
        values.length === 0
    ){

        return [];

    }


    //==================================================
    // LẤY GIÁ TRỊ KHÁC NHAU
    //==================================================

    const uniqueValues =
        Array.from(
            new Set(values)
        );


    //==================================================
    // CHỈ 1 GIÁ TRỊ KHÁC NHAU
    //==================================================

    if(
        uniqueValues.length === 1
    ){

        return [{
            min: 1,
            max: values[values.length - 1]
        }];

    }


    //==================================================
    // SỐ NHÓM
    //==================================================

    const k =
        Math.min(
            5,
            uniqueValues.length
        );


    const n =
        values.length;


    //==================================================
    // MA TRẬN
    //==================================================

    const lower =
        Array.from(
            {
                length: n + 1
            },
            function(){

                return Array(
                    k + 1
                ).fill(0);

            }
        );


    const variance =
        Array.from(
            {
                length: n + 1
            },
            function(){

                return Array(
                    k + 1
                ).fill(Infinity);

            }
        );


    variance[0][0] = 0;


    //==================================================
    // JENKS
    //==================================================

    for(
        let i = 1;
        i <= n;
        i++
    ){

        let sum = 0;

        let sumSquares = 0;

        let weight = 0;


        for(
            let m = 1;
            m <= i;
            m++
        ){

            const index =
                i - m;


            const value =
                values[index];


            weight += 1;

            sum += value;

            sumSquares +=
                value * value;


            const classVariance =
                sumSquares -
                (
                    sum * sum /
                    weight
                );


            // Một lớp
            if(
                i === m
            ){

                variance[i][1] =
                    classVariance;

                lower[i][1] =
                    1;

            }
            else{

                const previousIndex =
                    i - m;


                for(
                    let j = 2;
                    j <= k;
                    j++
                ){

                    if(
                        previousIndex <
                        j - 1
                    ){

                        continue;

                    }


                    const previous =
                        variance[
                            previousIndex
                        ][j - 1];


                    if(
                        !Number.isFinite(
                            previous
                        )
                    ){

                        continue;

                    }


                    const candidate =
                        previous +
                        classVariance;


                    if(
                        candidate <
                        variance[i][j]
                    ){

                        variance[i][j] =
                            candidate;

                        lower[i][j] =
                            index + 1;

                    }

                }

            }

        }

    }


    //==================================================
    // FALLBACK
    //==================================================

    if(
        !Number.isFinite(
            variance[n][k]
        )
    ){

        return createEqualRanges(
            values
        );

    }


    //==================================================
    // TRUY NGƯỢC
    //==================================================

    const boundaries =
        Array(
            k + 1
        ).fill(0);


    boundaries[k] =
        n;


    let current =
        n;


    for(
        let j = k;
        j > 1;
        j--
    ){

        const start =
            lower[current][j];


        if(
            !start ||
            start < 1
        ){

            return createEqualRanges(
                values
            );

        }


        boundaries[j - 1] =
            start - 1;


        current =
            start - 1;

    }


    boundaries[0] =
        0;


    //==================================================
    // TẠO KHOẢNG
    //==================================================

    const ranges = [];


    for(
        let i = 0;
        i < k;
        i++
    ){

        const startIndex =
            boundaries[i];


        const endIndex =
            boundaries[i + 1] - 1;


        if(
            startIndex < 0 ||
            endIndex < startIndex ||
            endIndex >= values.length
        ){

            continue;

        }


        const min =
            i === 0
                ? 1
                : values[startIndex];


        const max =
            values[endIndex];


        if(
            min <= max
        ){

            ranges.push({

                min:
                    min,

                max:
                    max

            });

        }

    }


    //==================================================
    // KIỂM TRA
    //==================================================

    if(
        ranges.length === 0
    ){

        return createEqualRanges(
            values
        );

    }


    return ranges;

}


//======================================================
// FALLBACK: CHIA ĐỀU
//======================================================

function createEqualRanges(values){

    if(
        !values ||
        values.length === 0
    ){

        return [];

    }


    const maxValue =
        values[
            values.length - 1
        ];


    const uniqueCount =
        new Set(values).size;


    const classCount =
        Math.min(
            5,
            uniqueCount
        );


    if(
        classCount <= 1
    ){

        return [{
            min: 1,
            max: maxValue
        }];

    }


    const interval =
        Math.ceil(
            maxValue /
            classCount
        );


    const ranges = [];


    for(
        let i = 0;
        i < classCount;
        i++
    ){

        const min =
            i === 0
                ? 1
                : i * interval + 1;


        const max =
            Math.min(
                (i + 1) * interval,
                maxValue
            );


        if(
            min <= max
        ){

            ranges.push({

                min:
                    min,

                max:
                    max

            });

        }

    }


    return ranges;

}


//======================================================
// LẤY MÀU
//======================================================

function getDamageColor(
    value,
    ranges
){

    if(
        value <= 0
    ){

        return "#F3F4F6";

    }


    if(
        !ranges ||
        ranges.length === 0
    ){

        return DAMAGE_COLORS[0];

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

            return DAMAGE_COLORS[
                Math.min(
                    i,
                    DAMAGE_COLORS.length - 1
                )
            ];

        }

    }


    return DAMAGE_COLORS[
        DAMAGE_COLORS.length - 1
    ];

}


//======================================================
// STYLE BỆNH
//======================================================

function styleDisease(row){

    const value =
        getDamageValue(row);


    const ranges =
        calculateDamageRanges();


    if(
        value <= 0
    ){

        return {

            fillColor:
                "#EEF1F3",

            weight:
                0.8,

            color:
                "#B8C0C7",

            fillOpacity:
                0.30

        };

    }


    return {

        fillColor:
            getDamageColor(
                value,
                ranges
            ),

        weight:
            1.4,

        color:
            "#8E0000",

        opacity:
            1,

        fillOpacity:
            0.88

    };

}


//======================================================
// STYLE PHUN
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

            fillColor: "#00695C",
            color: "#004D40",
            weight: 1,
            fillOpacity: .75

        };

    }


    if(
        round === 3
    ){

        return {

            fillColor: "#00897B",
            color: "#00695C",
            weight: 1,
            fillOpacity: .70

        };

    }


    if(
        round === 2
    ){

        return {

            fillColor: "#26A69A",
            color: "#00796B",
            weight: 1,
            fillOpacity: .65

        };

    }


    if(
        round === 1
    ){

        return {

            fillColor: "#80CBC4",
            color: "#00897B",
            weight: 1,
            fillOpacity: .65

        };

    }


    if(
        households > 0
    ){

        return {

            fillColor: "#B2DFDB",
            color: "#00897B",
            weight: 1,
            fillOpacity: .60

        };

    }


    return {

        fillColor: "#EEF1F3",
        color: "#B8C0C7",
        weight: .8,
        fillOpacity: .30

    };

}


//======================================================
// STYLE KSGM
//======================================================

function styleKSGM(row){

    const status =
        normalizeMapStatus(
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

            fillColor: "#8D6E63",
            color: "#5D4037",
            weight: 1,
            fillOpacity: .72

        };

    }


    if(
        count > 0
    ){

        return {

            fillColor: "#D7CCC8",
            color: "#795548",
            weight: 1,
            fillOpacity: .60

        };

    }


    return {

        fillColor: "#EEF1F3",
        color: "#B8C0C7",
        weight: .8,
        fillOpacity: .30

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

            fillColor: "#43A047",
            color: "#1B5E20",
            weight: 1,
            fillOpacity: .70

        };

    }


    return {

        fillColor: "#EEF1F3",
        color: "#B8C0C7",
        weight: .8,
        fillOpacity: .30

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

            fillColor:
                "#EEF1F3",

            color:
                "#B8C0C7",

            weight:
                .8,

            fillOpacity:
                .30

        };

    }


    if(

        currentLayer === "DTLCP" ||
        currentLayer === "CGC" ||
        currentLayer === "VDNC" ||
        currentLayer === "DAI"

    ){

        return styleDisease(row);

    }


    if(
        currentLayer ===
        "PHUN"
    ){

        return stylePhun(row);

    }


    if(
        currentLayer ===
        "KSGM"
    ){

        return styleKSGM(row);

    }


    if(
        currentLayer ===
        "CSBBTTY"
    ){

        return styleDrugStore(row);

    }


    return {

        fillColor:
            "#EEF1F3",

        color:
            "#B8C0C7",

        weight:
            .8,

        fillOpacity:
            .30

    };

}


//======================================================
// TÂM XÃ
//======================================================

function getFeatureCenter(feature){

    try{

        const temp =
            L.geoJSON(
                feature
            );


        const bounds =
            temp.getBounds();


        if(
            bounds.isValid()
        ){

            return bounds.getCenter();

        }

    }
    catch(error){

        console.warn(
            "Không lấy được tâm xã:",
            error
        );

    }


    return null;

}


//======================================================
// DANH SÁCH NHÃN
//======================================================

function getDiseaseLabelFeatures(){

    if(!geojsonData){

        return [];

    }


    const result = [];


    geojsonData.features.forEach(
        function(feature){

            if(
                !featureHasData(
                    feature
                )
            ){

                return;

            }


            const row =
                getFeatureRow(
                    feature
                );


            const name =
                getName(
                    feature
                );


            const center =
                getFeatureCenter(
                    feature
                );


            if(
                !row ||
                !name ||
                !center
            ){

                return;

            }


            const config =
                LAYER_CONFIG[
                    currentLayer
                ];


            const active =
                config
                    ? isDiseaseActive(
                        row,
                        config.status
                    )
                    : false;


            const value =
                getDamageValue(
                    row
                );


            result.push({

                name:
                    name,

                center:
                    center,

                active:
                    active,

                value:
                    value

            });

        }
    );


    // Xã đang có dịch lên trước
    // Xã thiệt hại lớn tiếp theo

    result.sort(
        function(a,b){

            if(
                a.active !==
                b.active
            ){

                return a.active
                    ? -1
                    : 1;

            }


            return (
                b.value -
                a.value
            );

        }
    );


    return result;

}


//======================================================
// KHUNG NHÃN
//======================================================

function getLabelBox(
    point,
    name
){

    const width =
        Math.max(
            30,
            name.length * 5.2
        );


    const height =
        14;


    return {

        left:
            point.x -
            width / 2,

        right:
            point.x +
            width / 2,

        top:
            point.y -
            height / 2,

        bottom:
            point.y +
            height / 2

    };

}


//======================================================
// KIỂM TRA CHỒNG
//======================================================

function isLabelOverlap(
    a,
    b
){

    const padding =
        4;


    return !(
        a.right + padding <
            b.left ||

        a.left - padding >
            b.right ||

        a.bottom + padding <
            b.top ||

        a.top - padding >
            b.bottom
    );

}


//======================================================
// VẼ NHÃN
//======================================================

function buildDiseaseLabels(){

    if(!map){

        return;

    }


    if(!labelLayer){

        labelLayer =
            L.layerGroup()
                .addTo(map);

    }


    labelLayer.clearLayers();


    const items =
        getDiseaseLabelFeatures();


    const occupied = [];


    items.forEach(
        function(item){

            const basePoint =
                map.latLngToLayerPoint(
                    item.center
                );


            let chosenPoint =
                null;


            let chosenBox =
                null;


            for(
                let i = 0;
                i < LABEL_OFFSETS.length;
                i++
            ){

                const offset =
                    LABEL_OFFSETS[i];


                const point = {

                    x:
                        basePoint.x +
                        offset[0],

                    y:
                        basePoint.y +
                        offset[1]

                };


                const box =
                    getLabelBox(
                        point,
                        item.name
                    );


                let collision =
                    false;


                for(
                    let j = 0;
                    j < occupied.length;
                    j++
                ){

                    if(
                        isLabelOverlap(
                            box,
                            occupied[j]
                        )
                    ){

                        collision =
                            true;

                        break;

                    }

                }


                if(!collision){

                    chosenPoint =
                        point;

                    chosenBox =
                        box;

                    break;

                }

            }


            if(!chosenPoint){

                chosenPoint = {

                    x:
                        basePoint.x,

                    y:
                        basePoint.y +
                        20

                };


                chosenBox =
                    getLabelBox(
                        chosenPoint,
                        item.name
                    );

            }


            occupied.push(
                chosenBox
            );


            const latlng =
                map.layerPointToLatLng(
                    chosenPoint
                );


            const marker =
                L.marker(
                    latlng,
                    {

                        icon:
                            L.divIcon({

                                className:
                                    "map-label",

                                html:
                                    `<div class="${
                                        item.active
                                            ? "map-label-active"
                                            : ""
                                    }">${
                                        item.name
                                    }</div>`,

                                iconSize:
                                    [0,0],

                                iconAnchor:
                                    [0,0]

                            }),

                        interactive:
                            false

                    }
                );


            marker.addTo(
                labelLayer
            );

        }
    );

}


//======================================================
// CHẤM ĐỎ XÃ ĐANG CÓ DỊCH
//======================================================

function addDiseaseMarker(
    feature
){

    const row =
        getFeatureRow(
            feature
        );


    const config =
        LAYER_CONFIG[
            currentLayer
        ];


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


    const center =
        getFeatureCenter(
            feature
        );


    if(!center){
        return;
    }


    L.circleMarker(

        center,

        {

            radius:
                3.5,

            color:
                "#FFFFFF",

            weight:
                1.5,

            fillColor:
                "#FF0000",

            fillOpacity:
                1,

            opacity:
                1,

            interactive:
                false

        }

    ).addTo(
        diseaseMarkerLayer
    );

}


//======================================================
// XÓA LAYER PHỤ
//======================================================

function clearMapOverlays(){

    if(labelLayer){

        map.removeLayer(
            labelLayer
        );

        labelLayer =
            null;

    }


    if(diseaseMarkerLayer){

        map.removeLayer(
            diseaseMarkerLayer
        );

        diseaseMarkerLayer =
            null;

    }

}


//======================================================
// RENDER GEOJSON
//======================================================

function renderGeoJSON(){

    if(
        !map ||
        !geojsonData
    ){

        return;

    }


    if(geojsonLayer){

        map.removeLayer(
            geojsonLayer
        );

        geojsonLayer =
            null;

    }


    clearMapOverlays();


    labelLayer =
        L.layerGroup()
            .addTo(map);


    diseaseMarkerLayer =
        L.layerGroup()
            .addTo(map);


    geojsonLayer =
        L.geoJSON(
            geojsonData,
            {

                style:
                    function(feature){

                        return getFeatureStyle(
                            feature
                        );

                    },


                onEachFeature:
                    function(
                        feature,
                        layer
                    ){

                        //==================================
                        // CLICK
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

                                    weight:
                                        2.3,

                                    color:
                                        "#1565C0",

                                    fillOpacity:
                                        1

                                });


                                this.bringToFront();

                            }
                        );


                        layer.on(
                            "mouseout",
                            function(){

                                if(
                                    geojsonLayer
                                ){

                                    geojsonLayer
                                        .resetStyle(
                                            this
                                        );

                                }

                            }
                        );


                        //==================================
                        // CHẤM ĐỎ
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

                            addDiseaseMarker(
                                feature
                            );

                        }

                    }

            }
        )
        .addTo(map);


    //==============================================
    // FIT BOUNDS
    //==============================================

    const bounds =
        geojsonLayer.getBounds();


    if(
        bounds &&
        bounds.isValid()
    ){

        map.fitBounds(
            bounds,
            {
                padding:
                    [20,20]
            }
        );

    }


    //==============================================
    // NHÃN
    //==============================================

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

        buildDiseaseLabels();

    }

}


//======================================================
// REFRESH MAP
//======================================================

function refreshMap(){

    if(
        !map ||
        !geojsonData
    ){

        return;

    }


    renderGeoJSON();

    updateLegend();

}


//======================================================
// ĐỔI LỚP
//======================================================

function setLayer(
    layerName
){

    if(
        !LAYER_CONFIG[layerName]
    ){

        console.warn(
            "Lớp không tồn tại:",
            layerName
        );

        return;

    }


    currentLayer =
        layerName;


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
            row &&
            row["Tên xã"]
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
// CHÚ GIẢI
//======================================================

function updateLegend(){

    if(legendControl){

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


            //==========================================
            // CÁC LỚP BỆNH
            //==========================================

            if(

                currentLayer === "DTLCP" ||
                currentLayer === "CGC" ||
                currentLayer === "VDNC" ||
                currentLayer === "DAI"

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

                    <div
                        class="legend-dot-row"
                    >

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

                    <div
                        class="legend-dot-row"
                    >

                        <span
                            style="
                                width:7px;
                                height:7px;
                                background:#F3F4F6;
                                border:1px solid #777;
                                border-radius:50%;
                                margin-right:10px;
                                margin-top:4px;
                            "
                        ></span>

                        <span>
                            Xã không có dịch
                        </span>

                    </div>

                `;


                if(
                    ranges.length > 0
                ){

                    html += `

                        <hr>

                        <div
                            style="
                                font-weight:700;
                                margin-bottom:7px;
                            "
                        >
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


                            const label =
                                range.min ===
                                range.max

                                    ? `${mapFormatNumber(
                                        range.min
                                      )} con`

                                    : `${mapFormatNumber(
                                        range.min
                                      )}–${mapFormatNumber(
                                        range.max
                                      )} con`;


                            html += `

                                <div>

                                    <i
                                        style="
                                            background:${color};
                                        "
                                    ></i>

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
                            Chưa có số liệu
                        </div>

                    `;

                }


                div.innerHTML =
                    html;

            }


            //==========================================
            // PHUN
            //==========================================

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


            //==========================================
            // KSGM
            //==========================================

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
                            background:#EEF1F3;
                        "></i>
                        Chưa triển khai
                    </div>

                `;

            }


            //==========================================
            // THUỐC THÚ Y
            //==========================================

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
                            background:#EEF1F3;
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
// CÔNG CỤ BẢN ĐỒ
//======================================================

function addMapTools(){

    if(!map){
        return;
    }


    //==============================================
    // FULLSCREEN
    //==============================================

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
        catch(error){

            console.warn(
                "Không thêm được Fullscreen:",
                error
            );

        }

    }


    //==============================================
    // EASYPRINT
    //==============================================

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
        catch(error){

            console.warn(
                "Không thêm được EasyPrint:",
                error
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


        if(
            typeof loadSheet ===
            "function"
        ){

            await loadSheet();

        }


        if(
            typeof dashboard !==
            "undefined" &&
            typeof dashboard.update ===
            "function"
        ){

            dashboard.update();

        }


        refreshMap();


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
    catch(error){

        console.error(
            "WEBGIS: Lỗi cập nhật dữ liệu:",
            error
        );

    }

}


//======================================================
// XUẤT BẢN ĐỒ
//======================================================

function exportCurrentMap(){

    if(!printer){

        console.warn(
            "Công cụ tải bản đồ chưa sẵn sàng."
        );

        return;

    }


    const now =
        new Date();


    const filename =
        `WEBGIS_${currentLayer}_` +
        `${now.getFullYear()}-` +
        `${String(
            now.getMonth() + 1
        ).padStart(2,"0")}-` +
        `${String(
            now.getDate()
        ).padStart(2,"0")}`;


    try{

        if(
            typeof printer.printMap ===
            "function"
        ){

            printer.printMap(
                "CurrentSize",
                filename
            );

        }
        else if(
            typeof printer.print ===
            "function"
        ){

            printer.print(
                "CurrentSize",
                filename
            );

        }

    }
    catch(error){

        console.error(
            "Lỗi tải bản đồ:",
            error
        );

    }

}


//======================================================
// HẾT MAP.JS
//======================================================
