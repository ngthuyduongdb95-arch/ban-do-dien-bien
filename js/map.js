//======================================================
// MAP.JS
// WEBGIS DỊCH BỆNH ĐỘNG VẬT ĐIỆN BIÊN
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
// BẢNG MÀU THEO TỪNG LỚP DỊCH
// MỨC 1 -> 5
//======================================================

const DISEASE_COLORS = {

    DTLCP: [
        "#FDE2E2",
        "#F8B4B4",
        "#EF7777",
        "#D93636",
        "#8B0000"
    ],

    CGC: [
        "#FFF1D6",
        "#FFD08A",
        "#FFAA45",
        "#F57C00",
        "#C65300"
    ],

    VDNC: [
        "#F0E1F5",
        "#D7A9E3",
        "#B86BC9",
        "#8E3AA6",
        "#5E176F"
    ],

    DAI: [
        "#E3F2FD",
        "#A9D5F5",
        "#64B5E3",
        "#1976B9",
        "#0D47A1"
    ]

};


//======================================================
// MÀU KSGM
//======================================================

const KSGM_COLORS = [

    "#EFEBE9",
    "#D7CCC8",
    "#A1887F",
    "#6D4C41",
    "#3E2723"

];


//======================================================
// MÀU CƠ SỞ THUỐC THÚ Y
//======================================================

const DRUG_COLORS = [

    "#E8F5E9",
    "#A5D6A7",
    "#66BB6A",
    "#2E7D32",
    "#145A20"

];


//======================================================
// VỊ TRÍ NHÃN
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
// KHỞI TẠO MAP
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
    // NHÃN NỀN
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

            buildDiseaseLabels();

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
                "GeoJSON không đúng định dạng."
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
//======================================================

function getName(feature){

    if(!feature){

        return "";

    }


    const row =
        getFeatureRow(feature);


    if(row){

        const name =
            String(
                row["Tên xã"] || ""
            ).trim();


        if(name){

            return name;

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
// CHUYỂN NUMBER
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


    const number =
        Number(str);


    return Number.isFinite(number)
        ? number
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
// LẤY TẤT CẢ ROW
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
// GIÁ TRỊ THIỆT HẠI
//
// DTLCP -> chết
// CGC   -> chết
// VDNC  -> mắc
// DẠI   -> chết
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
// XÃ CÓ DỮ LIỆU
//======================================================

function featureHasData(feature){

    const row =
        getFeatureRow(feature);


    if(!row){

        return false;

    }


    if(
        currentLayer ===
        "DTLCP"
    ){

        return (
            mapNumber(row["DTLCP_Chết"]) > 0 ||
            mapNumber(row["DTLCP_Ổ dịch"]) > 0 ||
            String(row["DTLCP_Trạng thái"] || "").trim() !== ""
        );

    }


    if(
        currentLayer ===
        "CGC"
    ){

        return (
            mapNumber(row["CGC_Chết"]) > 0 ||
            mapNumber(row["CGC_Ổ dịch"]) > 0 ||
            String(row["CGC_Trạng thái"] || "").trim() !== ""
        );

    }


    if(
        currentLayer ===
        "VDNC"
    ){

        return (
            mapNumber(row["VDNC_Mắc"]) > 0 ||
            mapNumber(row["VDNC_Chết"]) > 0 ||
            mapNumber(row["VDNC_Ổ dịch"]) > 0 ||
            String(row["VDNC_Trạng thái"] || "").trim() !== ""
        );

    }


    if(
        currentLayer ===
        "DAI"
    ){

        return (
            mapNumber(row["DAI_Chết"]) > 0 ||
            mapNumber(row["DAI_Ổ dịch"]) > 0 ||
            String(row["DAI_Trạng thái"] || "").trim() !== ""
        );

    }


    if(
        currentLayer ===
        "PHUN"
    ){

        return (
            mapNumber(row["PHUN_Số hộ"]) > 0 ||
            mapNumber(row["PHUN_Vòng"]) > 0 ||
            String(row["PHUN_Tiến độ"] || "").trim() !== ""
        );

    }


    if(
        currentLayer ===
        "KSGM"
    ){

        return (
            mapNumber(row["KSGM_Cơ sở"]) > 0
        );

    }


    if(
        currentLayer ===
        "CSBBTTY"
    ){

        return (
            mapNumber(row["CSBBTTY_Cơ sở"]) > 0
        );

    }


    return false;

}


//======================================================
// TÍNH KHOẢNG THIỆT HẠI
// JENKS
// LUÔN BẮT ĐẦU TỪ 1
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

                return getDamageValue(
                    row
                );

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


    const unique =
        [...new Set(values)];


    if(
        unique.length === 1
    ){

        return [{

            min: 1,

            max:
                values[
                    values.length - 1
                ]

        }];

    }


    const k =
        Math.min(
            5,
            unique.length
        );


    const n =
        values.length;


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


            weight++;

            sum += value;

            sumSquares +=
                value * value;


            const classVariance =
                sumSquares -
                (
                    sum * sum /
                    weight
                );


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


    if(
        !Number.isFinite(
            variance[n][k]
        )
    ){

        return createEqualRanges(
            values
        );

    }


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
// CHIA ĐỀU DỰ PHÒNG
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


    const count =
        Math.min(
            5,
            uniqueCount
        );


    if(
        count <= 1
    ){

        return [{

            min: 1,

            max: maxValue

        }];

    }


    const interval =
        Math.ceil(
            maxValue /
            count
        );


    const ranges = [];


    for(
        let i = 0;
        i < count;
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
// MÀU THIỆT HẠI
//======================================================

function getDamageColor(
    value,
    ranges
){

    if(
        value <= 0
    ){

        return "#F1F3F5";

    }


    const colors =
        DISEASE_COLORS[
            currentLayer
        ] ||
        DISEASE_COLORS.DTLCP;


    if(
        !ranges ||
        ranges.length === 0
    ){

        return colors[0];

    }


    for(
        let i = 0;
        i < ranges.length;
        i++
    ){

        if(
            value >= ranges[i].min &&
            value <= ranges[i].max
        ){

            return colors[
                Math.min(
                    i,
                    colors.length - 1
                )
            ];

        }

    }


    return colors[
        colors.length - 1
    ];

}


//======================================================
// STYLE DỊCH BỆNH
//======================================================

function styleDisease(row){

    const value =
        getDamageValue(
            row
        );


    const ranges =
        calculateDamageRanges();


    if(
        value <= 0
    ){

        return {

            fillColor:
                "#F1F3F5",

            color:
                "#AEB7BF",

            weight:
                0.8,

            opacity:
                0.9,

            fillOpacity:
                0.28

        };

    }


    return {

        fillColor:
            getDamageColor(
                value,
                ranges
            ),

        color:
            "#7A0000",

        weight:
            1.5,

        opacity:
            1,

        fillOpacity:
            0.92

    };

}


//======================================================
// KHOẢNG SỐ LƯỢNG CƠ SỞ
//======================================================

function calculateQuantityRanges(
    field
){

    const values =
        getMapRows()
            .map(function(row){

                return mapNumber(
                    row[field]
                );

            })
            .filter(function(value){

                return value > 0;

            })
            .sort(function(a,b){

                return a - b;

            });


    if(
        values.length === 0
    ){

        return [];

    }


    const unique =
        [...new Set(values)];


    const count =
        Math.min(
            5,
            unique.length
        );


    if(
        count === 1
    ){

        return [{

            min: 1,

            max:
                values[
                    values.length - 1
                ]

        }];

    }


    const maxValue =
        values[
            values.length - 1
        ];


    const interval =
        Math.ceil(
            maxValue /
            count
        );


    const ranges = [];


    for(
        let i = 0;
        i < count;
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
// MÀU SỐ LƯỢNG
//======================================================

function getQuantityColor(
    value,
    ranges,
    colors
){

    if(
        value <= 0
    ){

        return "#F1F3F5";

    }


    if(
        !ranges ||
        ranges.length === 0
    ){

        return colors[0];

    }


    for(
        let i = 0;
        i < ranges.length;
        i++
    ){

        if(
            value >= ranges[i].min &&
            value <= ranges[i].max
        ){

            return colors[
                Math.min(
                    i,
                    colors.length - 1
                )
            ];

        }

    }


    return colors[
        colors.length - 1
    ];

}


//======================================================
// STYLE KSGM
//======================================================

function styleKSGM(row){

    const value =
        mapNumber(
            row["KSGM_Cơ sở"]
        );


    const ranges =
        calculateQuantityRanges(
            "KSGM_Cơ sở"
        );


    if(
        value <= 0
    ){

        return {

            fillColor:
                "#F1F3F5",

            color:
                "#B8C0C7",

            weight:
                0.8,

            fillOpacity:
                0.30

        };

    }


    return {

        fillColor:
            getQuantityColor(
                value,
                ranges,
                KSGM_COLORS
            ),

        color:
            "#4E342E",

        weight:
            1.4,

        fillOpacity:
            0.88

    };

}


//======================================================
// STYLE THUỐC THÚ Y
//======================================================

function styleDrugStore(row){

    const value =
        mapNumber(
            row["CSBBTTY_Cơ sở"]
        );


    const ranges =
        calculateQuantityRanges(
            "CSBBTTY_Cơ sở"
        );


    if(
        value <= 0
    ){

        return {

            fillColor:
                "#F1F3F5",

            color:
                "#B8C0C7",

            weight:
                0.8,

            fillOpacity:
                0.30

        };

    }


    return {

        fillColor:
            getQuantityColor(
                value,
                ranges,
                DRUG_COLORS
            ),

        color:
            "#1B5E20",

        weight:
            1.4,

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

            fillColor:
                "#00695C",

            color:
                "#004D40",

            weight:
                1.2,

            fillOpacity:
                0.80

        };

    }


    if(
        round === 3
    ){

        return {

            fillColor:
                "#00897B",

            color:
                "#00695C",

            weight:
                1.2,

            fillOpacity:
                0.75

        };

    }


    if(
        round === 2
    ){

        return {

            fillColor:
                "#26A69A",

            color:
                "#00796B",

            weight:
                1.1,

            fillOpacity:
                0.70

        };

    }


    if(
        round === 1
    ){

        return {

            fillColor:
                "#80CBC4",

            color:
                "#00897B",

            weight:
                1,

            fillOpacity:
                0.65

        };

    }


    if(
        households > 0
    ){

        return {

            fillColor:
                "#B2DFDB",

            color:
                "#00897B",

            weight:
                1,

            fillOpacity:
                0.60

        };

    }


    return {

        fillColor:
            "#F1F3F5",

        color:
            "#B8C0C7",

        weight:
            0.8,

        fillOpacity:
            0.30

    };

}


//======================================================
// STYLE TỔNG
//======================================================

function getFeatureStyle(
    feature
){

    const row =
        getFeatureRow(
            feature
        );


    if(!row){

        return {

            fillColor:
                "#F1F3F5",

            color:
                "#B8C0C7",

            weight:
                0.8,

            fillOpacity:
                0.30

        };

    }


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

        return styleDisease(
            row
        );

    }


    if(
        currentLayer ===
        "PHUN"
    ){

        return stylePhun(
            row
        );

    }


    if(
        currentLayer ===
        "KSGM"
    ){

        return styleKSGM(
            row
        );

    }


    if(
        currentLayer ===
        "CSBBTTY"
    ){

        return styleDrugStore(
            row
        );

    }


    return {

        fillColor:
            "#F1F3F5",

        color:
            "#B8C0C7",

        weight:
            0.8,

        fillOpacity:
            0.30

    };

}


//======================================================
// LẤY TÂM XÃ
//======================================================

function getFeatureCenter(
    feature
){

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
// LẤY DANH SÁCH NHÃN
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


            const name =
                getName(
                    feature
                );


            const center =
                getFeatureCenter(
                    feature
                );


            if(
                !name ||
                !center
            ){

                return;

            }


            const row =
                getFeatureRow(
                    feature
                );


            const config =
                LAYER_CONFIG[
                    currentLayer
                ];


            const active =
                config &&
                config.status
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
// TÍNH KHUNG NHÃN
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
// KIỂM TRA CHỒNG NHÃN
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
// VẼ TÊN XÃ
//======================================================

function buildDiseaseLabels(){

    if(
        !map ||
        !geojsonData
    ){

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
                4.5,

            color:
                "#FFFFFF",

            weight:
                2,

            fillColor:
                "#E60000",

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

    buildDiseaseLabels();

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
        !LAYER_CONFIG[
            layerName
        ]
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

        const name =
            getName(
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
// CHÚ GIẢI
//======================================================

function updateLegend(){

    if(
        !map
    ){

        return;

    }


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
            // DỊCH BỆNH
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

                const ranges =
                    calculateDamageRanges();


                const config =
                    LAYER_CONFIG[
                        currentLayer
                    ];


                const colors =
                    DISEASE_COLORS[
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
                                width:8px;
                                height:8px;
                                margin-top:3px;
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
                                width:8px;
                                height:8px;
                                background:#F1F3F5;
                                border:1px solid #777;
                                border-radius:50%;
                                margin-right:10px;
                                margin-top:3px;
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
                                colors[
                                    Math.min(
                                        index,
                                        colors.length - 1
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

                const ranges =
                    calculateQuantityRanges(
                        "KSGM_Cơ sở"
                    );


                let html = `

                    <h4>
                        Kiểm soát giết mổ
                    </h4>

                    <div
                        style="
                            font-weight:700;
                            margin-bottom:7px;
                        "
                    >
                        Số cơ sở
                    </div>

                `;


                ranges.forEach(
                    function(
                        range,
                        index
                    ){

                        const color =
                            KSGM_COLORS[
                                Math.min(
                                    index,
                                    KSGM_COLORS.length - 1
                                )
                            ];


                        const label =
                            range.min ===
                            range.max

                                ? `${mapFormatNumber(
                                    range.min
                                  )} cơ sở`

                                : `${mapFormatNumber(
                                    range.min
                                  )}–${mapFormatNumber(
                                    range.max
                                  )} cơ sở`;


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


                div.innerHTML =
                    html;

            }


            //==========================================
            // THUỐC THÚ Y
            //==========================================

            else if(
                currentLayer ===
                "CSBBTTY"
            ){

                const ranges =
                    calculateQuantityRanges(
                        "CSBBTTY_Cơ sở"
                    );


                let html = `

                    <h4>
                        Cơ sở thuốc thú y
                    </h4>

                    <div
                        style="
                            font-weight:700;
                            margin-bottom:7px;
                        "
                    >
                        Số cơ sở
                    </div>

                `;


                ranges.forEach(
                    function(
                        range,
                        index
                    ){

                        const color =
                            DRUG_COLORS[
                                Math.min(
                                    index,
                                    DRUG_COLORS.length - 1
                                )
                            ];


                        const label =
                            range.min ===
                            range.max

                                ? `${mapFormatNumber(
                                    range.min
                                  )} cơ sở`

                                : `${mapFormatNumber(
                                    range.min
                                  )}–${mapFormatNumber(
                                    range.max
                                  )} cơ sở`;


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


                div.innerHTML =
                    html;

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
// CÔNG CỤ MAP
//======================================================

function addMapTools(){

    if(!map){

        return;

    }


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
                "Không thêm Fullscreen:",
                error
            );

        }

    }


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
                "Không thêm EasyPrint:",
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
            "WEBGIS: Lỗi cập nhật:",
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
        "WEBGIS_" +
        currentLayer +
        "_" +
        now.getFullYear() +
        "-" +
        String(
            now.getMonth() + 1
        ).padStart(2,"0") +
        "-" +
        String(
            now.getDate()
        ).padStart(2,"0");


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
