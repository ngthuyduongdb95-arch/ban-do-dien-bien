// ======================================================
// MAP.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT - ĐIỆN BIÊN
// ======================================================

"use strict";

let map = null;
let geojsonData = null;
let geojsonLayer = null;
let labelLayer = null;
let diseaseMarkerLayer = null;
let legendControl = null;
let currentLayer = "DTLCP";
let selectedFeature = null;
let currentBasemap = "street";
let damageRanges = [];

const STREET_URL =
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const SATELLITE_URL =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const layerConfig = {
    DTLCP: {
        name: "Dịch tả lợn Châu Phi",
        field: "DTLCP_Chết",
        status: "DTLCP_Trạng thái",
        outbreak: "DTLCP_Ổ dịch",
        unit: "con",
        colors: [
            "#FFE45E",
            "#FFC43D",
            "#FFA21A",
            "#FF6A1A",
            "#E6392E",
            "#B71C1C"
        ]
    },

    CGC: {
        name: "Cúm gia cầm",
        field: "CGC_Chết",
        status: "CGC_Trạng thái",
        outbreak: "CGC_Ổ dịch",
        unit: "con",
        colors: [
            "#C8E6C9",
            "#A5D6A7",
            "#66BB6A",
            "#388E3C",
            "#1B5E20",
            "#0D3D17"
        ]
    },

    VDNC: {
        name: "Viêm da nổi cục",
        field: "VDNC_Mắc",
        death: "VDNC_Chết",
        status: "VDNC_Trạng thái",
        outbreak: "VDNC_Ổ dịch",
        unit: "con",
        colors: [
            "#C6E2FF",
            "#8CC5FF",
            "#5AA6FF",
            "#2F7DF6",
            "#1558D6",
            "#0A2E7D"
        ]
    },

    DAI: {
        name: "Bệnh Dại",
        field: "DAI_Chết",
        death: "DAI_Tiêu hủy",
        status: "DAI_Trạng thái",
        outbreak: "DAI_Ổ dịch",
        unit: "con",
        colors: [
            "#E9D5FF",
            "#D4B5FF",
            "#9B5DE5",
            "#8E5CF6",
            "#6A35D1",
            "#4A148C"
        ]
    },

    PHUN: {
        name: "Phun khử trùng",
        field: "PHUN_Vòng",
        colors: [
            "#BFEDEE",
            "#80E1E6",
            "#3CC9D2",
            "#19A7B3",
            "#0D7F87",
            "#094D4F"
        ]
    },

    KSGM: {
        name: "Kiểm soát giết mổ",
        field: "KSGM_Cơ sở",
        status: "KSGM_Trạng thái",
        colors: [
            "#E8D8D2",
            "#D7CCC8",
            "#A1887F",
            "#795548",
            "#5D4037",
            "#3E2723"
        ]
    },

    CSBBTTY: {
        name: "Cơ sở buôn bán thuốc thú y",
        field: "CSBBTTY_Cơ sở",
        colors: [
            "#D7F3FF",
            "#A7E6F7",
            "#67D2E8",
            "#29B6D1",
            "#0288B8",
            "#01579B"
        ]
    }
};


// ======================================================
// KHỞI TẠO BẢN ĐỒ
// ======================================================

function initMap() {

    if (map) {
        return map;
    }

    map = L.map("map", {
        zoomControl: false,
        preferCanvas: true,
        minZoom: 7,
        maxZoom: 18
    }).setView(
        [21.386, 103.016],
        9
    );

    L.control.zoom({
        position: "topleft"
    }).addTo(map);

    L.control.scale({
        position: "bottomleft",
        imperial: false,
        maxWidth: 120
    }).addTo(map);

    addBaseLayers();

    bindControls();

    return map;
}


let streetLayer = null;
let satelliteLayer = null;


// ======================================================
// BẢN ĐỒ NỀN
// ======================================================

function addBaseLayers() {

    streetLayer =
        L.tileLayer(
            STREET_URL,
            {
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap &copy; CARTO",
                subdomains:
                    "abcd"
            }
        );


    satelliteLayer =
        L.tileLayer(
            SATELLITE_URL,
            {
                maxZoom: 19,
                attribution:
                    "Tiles &copy; Esri"
            }
        );


    streetLayer.addTo(map);

}


// ======================================================
// TIÊU ĐỀ
// ======================================================

function addMapTitle() {

    const title =
        L.control({
            position:
                "topleft"
        });


    title.onAdd =
        function () {

            const div =
                L.DomUtil.create(
                    "div",
                    "map-export-title"
                );


            div.innerHTML = `
                <div id="exportMapTitle">
                    ${layerConfig[currentLayer].name}
                </div>

                <span>
                    Phân cấp dữ liệu động bằng
                    Natural Breaks (Jenks)
                </span>
            `;


            return div;

        };


    title.addTo(map);

}


function refreshMapTitle() {

    const title =
        document.getElementById(
            "mapTitle"
        );


    if (title) {

        title.textContent =
            layerConfig[
                currentLayer
            ].name;

    }


    const exportTitle =
        document.getElementById(
            "exportMapTitle"
        );


    if (exportTitle) {

        exportTitle.textContent =
            layerConfig[
                currentLayer
            ].name;

    }

}


// ======================================================
// LẤY DỮ LIỆU GOOGLE SHEETS
// ======================================================

function getRows() {

    // sheets.js dùng let sheetData
    try {

        if (
            typeof sheetData !== "undefined" &&
            sheetData &&
            typeof sheetData === "object"
        ) {

            const rows =
                Object.values(
                    sheetData
                );


            if (rows.length) {

                return rows;

            }

        }

    }
    catch (error) {

        console.warn(
            "MAP: không đọc được sheetData:",
            error
        );

    }


    // Dự phòng
    if (
        typeof window.getRows ===
        "function"
    ) {

        try {

            const rows =
                window.getRows();


            if (
                Array.isArray(rows)
            ) {

                return rows;

            }

        }
        catch (error) {

            console.warn(
                "MAP: getRows() lỗi:",
                error
            );

        }

    }


    return [];

}


// ======================================================
// CHUẨN HÓA TÊN
// ======================================================

function normalizeMapName(value) {

    return String(
        value ?? ""
    )
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .toLowerCase()
    .replace(
        /đ/g,
        "d"
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();

}


// ======================================================
// GHÉP GEOJSON VỚI GOOGLE SHEETS
// Ưu tiên ID, sau đó tên xã
// ======================================================

function getRow(feature) {

    if (
        !feature ||
        !feature.properties
    ) {

        return null;

    }


    // ----------------------------------------------
    // 1. THEO ID
    // ----------------------------------------------

    const rawId =
        feature.properties.ID ??
        feature.properties.id ??
        feature.properties.Id;


    const id =
        Number(rawId);


    try {

        if (
            Number.isFinite(id) &&
            typeof sheetData !== "undefined" &&
            sheetData &&
            sheetData[id]
        ) {

            return sheetData[id];

        }

    }
    catch (_) {}


    // ----------------------------------------------
    // 2. THEO TÊN XÃ
    // ----------------------------------------------

    const geoName =
        feature.properties["Tên xã"] ||
        feature.properties["TEN_XA"] ||
        feature.properties["TENXA"] ||
        feature.properties["NAME"] ||
        feature.properties["Name"] ||
        feature.properties["name"] ||
        "";


    const normalizedGeoName =
        normalizeMapName(
            geoName
        );


    if (
        !normalizedGeoName
    ) {

        return null;

    }


    const rows =
        getRows();


    return rows.find(
        function (row) {

            const sheetName =
                row["Tên xã"] ||
                row["TEN_XA"] ||
                row["TENXA"] ||
                row["NAME"] ||
                row["Name"] ||
                row["name"] ||
                "";


            return (
                normalizeMapName(
                    sheetName
                ) ===
                normalizedGeoName
            );

        }
    ) || null;

}


// ======================================================
// CHUYỂN SỐ
// ======================================================

function num(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;

    }


    let s =
        String(value)
            .trim()
            .replace(
                /[^\d,.-]/g,
                ""
            );


    if (!s) {

        return 0;

    }


    if (
        s.includes(".") &&
        s.includes(",")
    ) {

        s =
            s.replace(
                /\./g,
                ""
            )
            .replace(
                ",",
                "."
            );

    }

    else if (
        s.includes(",")
    ) {

        const parts =
            s.split(",");


        s =
            parts.length === 2 &&
            parts[1].length <= 2

                ? parts[0] +
                  "." +
                  parts[1]

                : s.replace(
                    /,/g,
                    ""
                );

    }

    else if (
        (s.match(/\./g) || [])
            .length > 1
    ) {

        s =
            s.replace(
                /\./g,
                ""
            );

    }


    const number =
        Number(s);


    return Number.isFinite(number)
        ? number
        : 0;

}


function fmt(value) {

    return num(value)
        .toLocaleString(
            "vi-VN",
            {
                maximumFractionDigits: 2
            }
        );

}


function norm(value) {

    return String(
        value ?? ""
    )
    .trim()
    .toLowerCase();

}


// ======================================================
// TÊN XÃ
// ======================================================

function getName(feature) {

    const row =
        getRow(feature);


    if (
        row &&
        row["Tên xã"]
    ) {

        return String(
            row["Tên xã"]
        ).trim();

    }


    const p =
        feature?.properties || {};


    return String(

        p["Tên xã"] ||

        p["TEN_XA"] ||

        p["TENXA"] ||

        p["NAME"] ||

        p["Name"] ||

        p["name"] ||

        ""

    ).trim();

}


// ======================================================
// TRẠNG THÁI
// ======================================================

function isActive(
    row,
    config
) {

    return !!row &&
        !!config.status &&
        norm(
            row[
                config.status
            ]
        ) ===
        "đang có dịch";

}


// ======================================================
// CÓ DỮ LIỆU
// ======================================================

function hasData(feature) {

    const row =
        getRow(feature);


    if (!row) {

        return false;

    }


    const cfg =
        layerConfig[
            currentLayer
        ];


    if (
        currentLayer === "PHUN"
    ) {

        return (

            num(
                row["PHUN_Số hộ"]
            ) > 0 ||

            num(
                row["PHUN_Vòng"]
            ) > 0 ||

            norm(
                row["PHUN_Tiến độ"]
            ) !== ""

        );

    }


    if (
        currentLayer === "KSGM"
    ) {

        return (

            num(
                row["KSGM_Cơ sở"]
            ) > 0 ||

            norm(
                row["KSGM_Trạng thái"]
            ) !== ""

        );

    }


    if (
        currentLayer === "CSBBTTY"
    ) {

        return (
            num(
                row["CSBBTTY_Cơ sở"]
            ) > 0
        );

    }


    return (

        num(
            row[cfg.field]
        ) > 0 ||

        num(
            row[cfg.outbreak]
        ) > 0 ||

        num(
            row[cfg.death]
        ) > 0 ||

        norm(
            row[cfg.status]
        ) !== ""

    );

}


// ======================================================
// JENKS
// ======================================================

function jenks(
    values,
    classCount
) {

    const data =
        values
            .filter(
                v =>
                    Number.isFinite(v) &&
                    v > 0
            )
            .map(
                v =>
                    Math.max(
                        1,
                        Math.round(v)
                    )
            )
            .sort(
                (a,b) =>
                    a-b
            );


    const unique =
        [...new Set(data)];


    if (
        !unique.length
    ) {

        return [];

    }


    if (
        unique.length === 1
    ) {

        return [
            {
                min:1,
                max:unique[0]
            }
        ];

    }


    const k =
        Math.min(
            classCount,
            unique.length
        );


    const n =
        data.length;


    const lower =
        Array.from(
            {
                length:n+1
            },
            () =>
                Array(
                    k+1
                ).fill(0)
        );


    const variance =
        Array.from(
            {
                length:n+1
            },
            () =>
                Array(
                    k+1
                ).fill(
                    Infinity
                )
        );


    variance[0][0] =
        0;


    for (
        let i=1;
        i<=n;
        i++
    ) {

        variance[i][1] =
            0;

        lower[i][1] =
            1;

    }


    for (
        let l=2;
        l<=n;
        l++
    ) {

        let sum=0;
        let sumSq=0;
        let weight=0;


        for (
            let m=1;
            m<=l;
            m++
        ) {

            const idx =
                l-m+1;


            const val =
                data[idx-1];


            weight += 1;
            sum += val;
            sumSq +=
                val*val;


            const varianceClass =
                sumSq -
                (
                    sum*sum
                ) / weight;


            if (
                idx===1
            ) {

                variance[l][1] =
                    varianceClass;

                lower[l][1] =
                    1;

                continue;

            }


            for (
                let j=2;
                j<=k;
                j++
            ) {

                if (
                    idx-1 <
                    j-1
                ) {

                    continue;

                }


                const previous =
                    variance[
                        idx-1
                    ][
                        j-1
                    ];


                if (
                    !Number.isFinite(
                        previous
                    )
                ) {

                    continue;

                }


                const candidate =
                    previous +
                    varianceClass;


                if (
                    candidate <
                    variance[l][j]
                ) {

                    variance[l][j] =
                        candidate;

                    lower[l][j] =
                        idx;

                }

            }

        }

    }


    if (
        !Number.isFinite(
            variance[n][k]
        )
    ) {

        return equalIntegerRanges(
            data,
            k
        );

    }


    const classStarts =
        Array(
            k+1
        ).fill(0);


    classStarts[k] =
        1;


    let count =
        n;


    for (
        let j=k;
        j>=2;
        j--
    ) {

        const start =
            lower[count][j];


        if (!start) {

            return equalIntegerRanges(
                data,
                k
            );

        }


        classStarts[j-1] =
            start;


        count =
            start-1;

    }


    const ranges = [];


    for (
        let i=1;
        i<=k;
        i++
    ) {

        const startIndex =
            i===1
                ? 0
                : classStarts[i]-1;


        const endIndex =
            i===k
                ? n-1
                : classStarts[i+1]-2;


        if (
            startIndex<0 ||
            endIndex<startIndex ||
            endIndex>=n
        ) {

            continue;

        }


        const min =
            i===1
                ? 1
                : data[startIndex];


        const max =
            data[endIndex];


        if (
            min<=max
        ) {

            ranges.push({
                min,
                max
            });

        }

    }


    if (
        !ranges.length
    ) {

        return equalIntegerRanges(
            data,
            k
        );

    }


    ranges[0].min =
        1;


    for (
        let i=1;
        i<ranges.length;
        i++
    ) {

        ranges[i].min =
            ranges[i-1].max+1;

    }


    ranges[
        ranges.length-1
    ].max =
        data[n-1];


    return ranges;

}


function equalIntegerRanges(
    data,
    k
) {

    if (
        !data.length
    ) {

        return [];

    }


    if (
        k<=1
    ) {

        return [
            {
                min:1,
                max:data[data.length-1]
            }
        ];

    }


    const ranges=[];


    for (
        let i=0;
        i<k;
        i++
    ) {

        const start =
            Math.floor(
                i*data.length/k
            );


        const end =
            Math.max(
                start,
                Math.floor(
                    (
                        i+1
                    )*
                    data.length/k
                )-1
            );


        const min =
            i===0
                ? 1
                : data[start];


        const max =
            data[
                Math.min(
                    end,
                    data.length-1
                )
            ];


        if (
            min<=max
        ) {

            ranges.push({
                min,
                max
            });

        }

    }


    for (
        let i=1;
        i<ranges.length;
        i++
    ) {

        ranges[i].min =
            ranges[i-1].max+1;

    }


    ranges[
        ranges.length-1
    ].max =
        data[
            data.length-1
        ];


    return ranges;

}


// ======================================================
// TÍNH KHOẢNG
// ======================================================

function calculateDamageRanges() {

    const cfg =
        layerConfig[
            currentLayer
        ];


    if (
        ![
            "DTLCP",
            "CGC",
            "VDNC",
            "DAI"
        ].includes(
            currentLayer
        )
    ) {

        damageRanges = [];

        return damageRanges;

    }


    const values =
        getRows()
            .map(
                row =>
                    num(
                        row[
                            cfg.field
                        ]
                    )
            )
            .filter(
                v =>
                    v>0
            );


    damageRanges =
        jenks(
            values,
            6
        );


    return damageRanges;

}


function getDamageClass(
    value,
    ranges
) {

    if (
        value<=0 ||
        !ranges.length
    ) {

        return -1;

    }


    for (
        let i=0;
        i<ranges.length;
        i++
    ) {

        if (
            value>=ranges[i].min &&
            value<=ranges[i].max
        ) {

            return i;

        }

    }


    return ranges.length-1;

}


// ======================================================
// STYLE BỆNH
// ======================================================

function getDiseaseStyle(row) {

    const cfg =
        layerConfig[
            currentLayer
        ];


    const value =
        num(
            row?.[
                cfg.field
            ]
        );


    if (
        value<=0
    ) {

        return {

            fillColor:
                "#D7E0E5",

            fillOpacity:
                0.58,

            color:
                "#667782",

            weight:
                1.0

        };

    }


    const ranges =
        damageRanges;


    const idx =
        getDamageClass(
            value,
            ranges
        );


    return {

        fillColor:
            cfg.colors[
                Math.min(
                    Math.max(
                        idx,
                        0
                    ),
                    cfg.colors.length-1
                )
            ],

        fillOpacity:
            0.90,

        color:
            "#FFFFFF",

        weight:
            1.0

    };

}


// ======================================================
// STYLE PHUN
// ======================================================

function getPhunStyle(row) {

    const v =
        num(
            row?.[
                "PHUN_Vòng"
            ]
        );


    if (
        v<=0
    ) {

        return {

            fillColor:
                "#D7E0E5",

            fillOpacity:
                0.58,

            color:
                "#667782",

            weight:
                1.0

        };

    }


    const idx =
        Math.min(
            Math.max(
                Math.ceil(v)-1,
                0
            ),
            5
        );


    return {

        fillColor:
            layerConfig
                .PHUN
                .colors[idx],

        fillOpacity:
            0.90,

        color:
            "#FFFFFF",

        weight:
            1.0

    };

}


// ======================================================
// STYLE KSGM
// ======================================================

function getKsgmStyle(row) {

    const count =
        num(
            row?.[
                "KSGM_Cơ sở"
            ]
        );


    const active =
        norm(
            row?.[
                "KSGM_Trạng thái"
            ]
        ) ===
        "đã triển khai";


    if (
        !active &&
        count<=0
    ) {

        return {

            fillColor:
                "#D7E0E5",

            fillOpacity:
                0.58,

            color:
                "#667782",

            weight:
                1.0

        };

    }


    const idx =
        Math.min(
            Math.max(
                Math.ceil(count)-1,
                0
            ),
            5
        );


    return {

        fillColor:
            layerConfig
                .KSGM
                .colors[idx],

        fillOpacity:
            0.90,

        color:
            "#FFFFFF",

        weight:
            1.0

    };

}


// ======================================================
// STYLE THUỐC THÚ Y
// ======================================================

function getDrugStyle(row) {

    const count =
        num(
            row?.[
                "CSBBTTY_Cơ sở"
            ]
        );


    if (
        count<=0
    ) {

        return {

            fillColor:
                "#D7E0E5",

            fillOpacity:
                0.58,

            color:
                "#667782",

            weight:
                1.0

        };

    }


    const idx =
        Math.min(
            Math.max(
                Math.ceil(count)-1,
                0
            ),
            5
        );


    return {

        fillColor:
            layerConfig
                .CSBBTTY
                .colors[idx],

        fillOpacity:
            0.90,

        color:
            "#FFFFFF",

        weight:
            1.0

    };

}


// ======================================================
// STYLE FEATURE
// ======================================================

function getFeatureStyle(
    feature
) {

    const row =
        getRow(feature);


    if (!row) {

        return {

            fillColor:
                "#D7E0E5",

            fillOpacity:
                0.40,

            color:
                "#71808A",

            weight:
                0.9

        };

    }


    if (
        [
            "DTLCP",
            "CGC",
            "VDNC",
            "DAI"
        ].includes(
            currentLayer
        )
    ) {

        return getDiseaseStyle(
            row
        );

    }


    if (
        currentLayer === "PHUN"
    ) {

        return getPhunStyle(
            row
        );

    }


    if (
        currentLayer === "KSGM"
    ) {

        return getKsgmStyle(
            row
        );

    }


    if (
        currentLayer ===
        "CSBBTTY"
    ) {

        return getDrugStyle(
            row
        );

    }


    return {

        fillColor:
            "#D7E0E5",

        fillOpacity:
            0.40,

        color:
            "#71808A",

        weight:
            0.9

    };

}


// ======================================================
// TÂM XÃ
// ======================================================

function featureCenter(
    feature
) {

    const temp =
        L.geoJSON(
            feature
        );


    const bounds =
        temp.getBounds();


    return bounds.isValid()
        ? bounds.getCenter()
        : null;

}


// ======================================================
// NHÃN
// ======================================================

function renderLabels() {

    if (
        !map ||
        !geojsonData
    ) {

        return;

    }


    if (!labelLayer) {

        labelLayer =
            L.layerGroup()
                .addTo(map);

    }


    labelLayer.clearLayers();


    if (
        map.getZoom()<9
    ) {

        return;

    }


    const candidates=[];


    geojsonData.features.forEach(
        function(feature) {

            const row =
                getRow(feature);


            if (!row) {

                return;

            }


            const name =
                getName(feature);


            if (!name) {

                return;

            }


            const center =
                featureCenter(
                    feature
                );


            if (!center) {

                return;

            }


            candidates.push({

                name,
                center

            });

        }
    );


    const occupied=[];


    const offsets=[

        [0,0],

        [18,0],

        [-18,0],

        [0,-18],

        [0,18],

        [22,-15],

        [-22,-15],

        [22,15],

        [-22,15]

    ];


    candidates
        .sort(
            (a,b) =>
                a.name.length -
                b.name.length
        )
        .forEach(
            function(item) {

                const base =
                    map.latLngToLayerPoint(
                        item.center
                    );


                const width =
                    Math.max(
                        48,
                        item.name.length*
                        5.3
                    );


                const height=17;


                let selected=null;


                for (
                    const offset
                    of offsets
                ) {

                    const point={

                        x:
                            base.x+
                            offset[0],

                        y:
                            base.y+
                            offset[1]

                    };


                    const box={

                        left:
                            point.x-
                            width/2,

                        right:
                            point.x+
                            width/2,

                        top:
                            point.y-
                            height/2,

                        bottom:
                            point.y+
                            height/2

                    };


                    const collision =
                        occupied.some(
                            function(other) {

                                return !(
                                    box.right+3 <
                                        other.left ||

                                    box.left-3 >
                                        other.right ||

                                    box.bottom+3 <
                                        other.top ||

                                    box.top-3 >
                                        other.bottom
                                );

                            }
                        );


                    if (
                        !collision
                    ) {

                        selected={
                            point,
                            box
                        };

                        break;

                    }

                }


                if (!selected) {

                    return;

                }


                occupied.push(
                    selected.box
                );


                const latlng =
                    map.layerPointToLatLng(
                        selected.point
                    );


                L.marker(
                    latlng,
                    {

                        interactive:
                            false,

                        icon:
                            L.divIcon({

                                className:
                                    "map-label-wrap",

                                html:
                                    `<span class="map-label">${
                                        escapeHtml(
                                            item.name
                                        )
                                    }</span>`,

                                iconSize:
                                    [0,0],

                                iconAnchor:
                                    [0,0]

                            })

                    }
                ).addTo(
                    labelLayer
                );

            }
        );

}


// ======================================================
// ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// ======================================================
// CHẤM ĐỎ
// ======================================================

function renderDiseaseMarkers() {

    if (!diseaseMarkerLayer) {

        diseaseMarkerLayer =
            L.layerGroup()
                .addTo(map);

    }


    diseaseMarkerLayer.clearLayers();


    const cfg =
        layerConfig[
            currentLayer
        ];


    if (
        !cfg.status ||
        !geojsonData
    ) {

        return;

    }


    geojsonData.features.forEach(
        function(feature) {

            const row =
                getRow(feature);


            if (
                !row ||
                !isActive(
                    row,
                    cfg
                )
            ) {

                return;

            }


            const center =
                featureCenter(
                    feature
                );


            if (!center) {

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
                        2.5,

                    fillColor:
                        "#E00000",

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
    );

}


// ======================================================
// PANEL
// ======================================================

function showPanel(feature) {

    selectedFeature =
        feature;


    const row =
        getRow(feature);


    const name =
        getName(feature);


    const title =
        document.getElementById(
            "panel-title"
        );


    const panel =
        document.getElementById(
            "info-panel"
        );


    if (title) {

        title.textContent =
            name ||
            "Xã/phường";

    }


    if (!panel) {

        return;

    }


    if (!row) {

        panel.innerHTML = `
            <div class="empty-panel">
                <p>
                    Không có dữ liệu.
                </p>
            </div>
        `;

        return;

    }


    let html = `

        <div class="info-block">

            <div class="info-district">

                ${escapeHtml(name)}

            </div>

            <div class="info-layer">

                ${escapeHtml(
                    layerConfig[
                        currentLayer
                    ].name
                )}

            </div>

        </div>

    `;


    if (
        currentLayer ===
        "DTLCP"
    ) {

        html +=
            infoRows([
                [
                    "Trạng thái",
                    row[
                        "DTLCP_Trạng thái"
                    ] ||
                    "--"
                ],

                [
                    "Ổ dịch",
                    fmt(
                        row[
                            "DTLCP_Ổ dịch"
                        ]
                    )
                ],

                [
                    "Tiêu hủy",
                    `${fmt(
                        row[
                            "DTLCP_Chết"
                        ]
                    )} con`
                ],

                [
                    "Khối lượng",
                    `${fmt(
                        row[
                            "DTLCP_Trọng lượng"
                        ]
                    )} kg`
                ],

                [
                    "Ngày cuối",
                    formatDate(
                        row[
                            "DTLCP_Ngày cuối"
                        ]
                    )
                ]

            ]);

    }


    if (
        currentLayer ===
        "CGC"
    ) {

        html +=
            infoRows([
                [
                    "Trạng thái",
                    row[
                        "CGC_Trạng thái"
                    ] ||
                    "--"
                ],

                [
                    "Ổ dịch",
                    fmt(
                        row[
                            "CGC_Ổ dịch"
                        ]
                    )
                ],

                [
                    "Tiêu hủy",
                    `${fmt(
                        row[
                            "CGC_Chết"
                        ]
                    )} con`
                ],

                [
                    "Khối lượng",
                    `${fmt(
                        row[
                            "CGC_Trọng lượng"
                        ]
                    )} kg`
                ],

                [
                    "Ngày cuối",
                    formatDate(
                        row[
                            "CGC_Ngày cuối"
                        ]
                    )
                ]

            ]);

    }


    if (
        currentLayer ===
        "VDNC"
    ) {

        html +=
            infoRows([
                [
                    "Trạng thái",
                    row[
                        "VDNC_Trạng thái"
                    ] ||
                    "--"
                ],

                [
                    "Ổ dịch",
                    fmt(
                        row[
                            "VDNC_Ổ dịch"
                        ]
                    )
                ],

                [
                    "Mắc",
                    `${fmt(
                        row[
                            "VDNC_Mắc"
                        ]
                    )} con`
                ],

                [
                    "Chết",
                    `${fmt(
                        row[
                            "VDNC_Chết"
                        ]
                    )} con`
                ],

                [
                    "Ngày cuối",
                    formatDate(
                        row[
                            "VDNC_Ngày cuối"
                        ]
                    )
                ]

            ]);

    }


    if (
        currentLayer ===
        "DAI"
    ) {

        html +=
            infoRows([
                [
                    "Trạng thái",
                    row[
                        "DAI_Trạng thái"
                    ] ||
                    "--"
                ],

                [
                    "Ổ dịch",
                    fmt(
                        row[
                            "DAI_Ổ dịch"
                        ]
                    )
                ],

                [
                    "Số chết",
                    `${fmt(
                        row[
                            "DAI_Chết"
                        ]
                    )} con`
                ],

                [
                    "Tiêu hủy",
                    `${fmt(
                        row[
                            "DAI_Tiêu hủy"
                        ]
                    )} con`
                ],

                [
                    "Ngày cuối",
                    formatDate(
                        row[
                            "DAI_Ngày cuối"
                        ]
                    )
                ]

            ]);

    }


    if (
        currentLayer ===
        "PHUN"
    ) {

        html +=
            infoRows([
                [
                    "Tiến độ",
                    row[
                        "PHUN_Tiến độ"
                    ] ||
                    "--"
                ],

                [
                    "Số hộ",
                    fmt(
                        row[
                            "PHUN_Số hộ"
                        ]
                    )
                ],

                [
                    "Vòng",
                    fmt(
                        row[
                            "PHUN_Vòng"
                        ]
                    )
                ],

                [
                    "Ngày",
                    formatDate(
                        row[
                            "PHUN_Ngày"
                        ]
                    )
                ]

            ]);

    }


    if (
        currentLayer ===
        "KSGM"
    ) {

        html +=
            infoRows([
                [
                    "Trạng thái",
                    row[
                        "KSGM_Trạng thái"
                    ] ||
                    "--"
                ],

                [
                    "Số cơ sở",
                    fmt(
                        row[
                            "KSGM_Cơ sở"
                        ]
                    )
                ]

            ]);

    }


    if (
        currentLayer ===
        "CSBBTTY"
    ) {

        html +=
            infoRows([
                [
                    "Số cơ sở",
                    fmt(
                        row[
                            "CSBBTTY_Cơ sở"
                        ]
                    )
                ]
            ]);

    }


    panel.innerHTML =
        html;

}


function infoRows(items) {

    return `
        <div class="info-table">

            ${items
                .map(
                    ([label,value]) =>
                        `
                            <div class="info-row">

                                <span>
                                    ${escapeHtml(
                                        label
                                    )}
                                </span>

                                <b>
                                    ${escapeHtml(
                                        value
                                    )}
                                </b>

                            </div>
                        `
                )
                .join("")
            }

        </div>
    `;

}


function clearPanel() {

    selectedFeature =
        null;


    const title =
        document.getElementById(
            "panel-title"
        );


    const panel =
        document.getElementById(
            "info-panel"
        );


    if (title) {

        title.textContent =
            "Chưa chọn xã/phường";

    }


    if (panel) {

        panel.innerHTML = `
            <div class="empty-panel">

                <i class="fa-solid fa-arrow-pointer"></i>

                <p>
                    Nhấn vào một xã/phường
                    trên bản đồ để xem
                    thông tin chi tiết.
                </p>

            </div>
        `;

    }

}


function formatDate(value) {

    if (!value) {

        return "--";

    }


    const d =
        new Date(value);


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {

        return String(value);

    }


    return d.toLocaleDateString(
        "vi-VN"
    );

}


// ======================================================
// LEGEND
// ======================================================

function updateLegend() {

    if (legendControl) {

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
        function () {

            const div =
                L.DomUtil.create(
                    "div",
                    "legend"
                );


            const cfg =
                layerConfig[
                    currentLayer
                ];


            // ------------------------------------------
            // BỆNH
            // ------------------------------------------

            if (
                [
                    "DTLCP",
                    "CGC",
                    "VDNC",
                    "DAI"
                ].includes(
                    currentLayer
                )
            ) {

                let html = `

                    <div style="
                        font-size:12px;
                        font-weight:800;
                        color:#17212b;
                        margin-bottom:6px;
                    ">
                        ${escapeHtml(
                            cfg.name
                        )}
                    </div>

                    <div style="
                        font-size:9px;
                        color:#6b7785;
                        margin-bottom:8px;
                        line-height:1.35;
                    ">
                        Phân cấp dữ liệu động bằng
                        Natural Breaks (Jenks)
                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:7px;
                        margin:5px 0;
                        font-size:10px;
                    ">

                        <span style="
                            width:9px;
                            height:9px;
                            flex:0 0 9px;
                            border-radius:50%;
                            background:#D50000;
                            border:2px solid #fff;
                            box-shadow:
                                0 0 0 1px #D50000;
                        "></span>

                        <span>
                            Xã đang có dịch
                        </span>

                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:7px;
                        margin:5px 0 7px;
                        font-size:10px;
                    ">

                        <span style="
                            width:18px;
                            height:13px;
                            flex:0 0 18px;
                            border-radius:3px;
                            background:#D7E0E5;
                            border:1px solid #71808A;
                        "></span>

                        <span>
                            0 xã không có dịch
                        </span>

                    </div>

                `;


                if (
                    damageRanges.length
                ) {

                    html += `

                        <div style="
                            height:1px;
                            background:#DDE3E7;
                            margin:7px 0;
                        "></div>

                        <div style="
                            font-size:10px;
                            font-weight:800;
                            color:#34424d;
                            margin-bottom:5px;
                        ">
                            Mức độ thiệt hại
                        </div>

                    `;


                    damageRanges.forEach(
                        function(
                            range,
                            index
                        ) {

                            const color =
                                cfg.colors[
                                    Math.min(
                                        index,
                                        cfg.colors.length-1
                                    )
                                ];


                            const label =
                                range.min ===
                                range.max

                                    ? `${fmt(
                                        range.min
                                      )}
                                      ${cfg.unit}`

                                    : `${fmt(
                                        range.min
                                      )}–${fmt(
                                        range.max
                                      )}
                                      ${cfg.unit}`;


                            html += `

                                <div style="
                                    display:flex;
                                    align-items:center;
                                    gap:7px;
                                    min-height:20px;
                                    font-size:10px;
                                ">

                                    <span style="
                                        width:18px;
                                        height:13px;
                                        flex:0 0 18px;
                                        border-radius:3px;
                                        background:${color};
                                        border:
                                            1px solid
                                            rgba(0,0,0,.14);
                                    "></span>

                                    <span>
                                        ${label}
                                    </span>

                                </div>

                            `;

                        }
                    );

                }

                else {

                    html += `

                        <div style="
                            height:1px;
                            background:#DDE3E7;
                            margin:7px 0;
                        "></div>

                        <div style="
                            font-size:10px;
                            color:#7b8791;
                        ">
                            Chưa có số liệu thiệt hại
                        </div>

                    `;

                }


                div.innerHTML =
                    html;


                L.DomEvent
                    .disableClickPropagation(
                        div
                    );


                return div;

            }


            // ------------------------------------------
            // PHUN
            // ------------------------------------------

            if (
                currentLayer ===
                "PHUN"
            ) {

                div.innerHTML = `

                    <div style="
                        font-weight:800;
                        margin-bottom:6px;
                    ">
                        Phun khử trùng
                    </div>

                    ${cfg.colors
                        .map(
                            (
                                color,
                                i
                            ) =>
                                `
                                    <div class="legend-row">

                                        <i style="
                                            background:${color};
                                        "></i>

                                        <span>
                                            ${
                                                i < 5
                                                ? `Vòng ${i+1}`
                                                : "Vòng 6 trở lên"
                                            }
                                        </span>

                                    </div>
                                `
                        )
                        .join("")
                    }

                    <div class="legend-divider"></div>

                    <div class="legend-row">

                        <span class="legend-no-data"></span>

                        <span>
                            Chưa triển khai
                        </span>

                    </div>

                `;


                L.DomEvent
                    .disableClickPropagation(
                        div
                    );


                return div;

            }


            // ------------------------------------------
            // KSGM
            // ------------------------------------------

            if (
                currentLayer ===
                "KSGM"
            ) {

                div.innerHTML = `

                    <div style="
                        font-weight:800;
                        margin-bottom:6px;
                    ">
                        Kiểm soát giết mổ
                    </div>

                    ${cfg.colors
                        .map(
                            (
                                color,
                                i
                            ) =>
                                `
                                    <div class="legend-row">

                                        <i style="
                                            background:${color};
                                        "></i>

                                        <span>

                                            ${
                                                i < 5
                                                ? `${i+1} cơ sở`
                                                : "6 cơ sở trở lên"
                                            }

                                        </span>

                                    </div>
                                `
                        )
                        .join("")
                    }

                    <div class="legend-divider"></div>

                    <div class="legend-row">

                        <span class="legend-no-data"></span>

                        <span>
                            0 cơ sở / chưa triển khai
                        </span>

                    </div>

                `;


                L.DomEvent
                    .disableClickPropagation(
                        div
                    );


                return div;

            }


            // ------------------------------------------
            // THUỐC THÚ Y
            // ------------------------------------------

            div.innerHTML = `

                <div style="
                    font-weight:800;
                    margin-bottom:6px;
                ">
                    Cơ sở buôn bán thuốc thú y
                </div>

                ${cfg.colors
                    .map(
                        (
                            color,
                            i
                        ) =>
                            `
                                <div class="legend-row">

                                    <i style="
                                        background:${color};
                                    "></i>

                                    <span>

                                        ${
                                            i < 5
                                            ? `${i+1} cơ sở`
                                            : "6 cơ sở trở lên"
                                        }

                                    </span>

                                </div>
                            `
                    )
                    .join("")
                }

                <div class="legend-divider"></div>

                <div class="legend-row">

                    <span class="legend-no-data"></span>

                    <span>
                        0 cơ sở
                    </span>

                </div>

            `;


            L.DomEvent
                .disableClickPropagation(
                    div
                );


            return div;

        };


    legendControl.addTo(
        map
    );

}


// ======================================================
// RENDER GEOJSON
// ======================================================

function renderGeoJSON() {

    if (
        !map ||
        !geojsonData
    ) {

        return;

    }


    calculateDamageRanges();


    if (geojsonLayer) {

        map.removeLayer(
            geojsonLayer
        );

    }


    if (labelLayer) {

        map.removeLayer(
            labelLayer
        );

    }


    labelLayer =
        L.layerGroup()
            .addTo(map);


    if (
        diseaseMarkerLayer
    ) {

        map.removeLayer(
            diseaseMarkerLayer
        );

    }


    diseaseMarkerLayer =
        L.layerGroup()
            .addTo(map);


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
                    ) {

                        layer.on({

                            mouseover:
                                function() {

                                    this.setStyle({

                                        weight:
                                            2.2,

                                        color:
                                            "#243B53",

                                        fillOpacity:
                                            0.95

                                    });


                                    this.bringToFront();

                                },

                            mouseout:
                                function() {

                                    geojsonLayer
                                        .resetStyle(
                                            this
                                        );

                                },

                            click:
                                function() {

                                    showPanel(
                                        feature
                                    );

                                }

                        });

                    }

            }
        )
        .addTo(map);


    renderLabels();

    renderDiseaseMarkers();

    updateLegend();

    refreshMapTitle();


    // Kiểm tra ghép
    try {

        const matched =
            geojsonData.features.filter(
                function(feature) {

                    return !!getRow(
                        feature
                    );

                }
            ).length;


        console.log(
            "MAP: ghép được",
            matched,
            "/",
            geojsonData.features.length,
            "xã/phường với Google Sheets."
        );

    }
    catch (error) {

        console.warn(
            "MAP: không kiểm tra được số xã ghép.",
            error
        );

    }


    if (
        selectedFeature
    ) {

        const row =
            getRow(
                selectedFeature
            );


        if (row) {

            showPanel(
                selectedFeature
            );

        }

    }

}


// ======================================================
// REFRESH
// ======================================================

function refreshMap() {

    if (
        !map ||
        !geojsonData
    ) {

        return;

    }


    renderGeoJSON();

}


// ======================================================
// TẢI GEOJSON
// ======================================================

async function loadGeoJSON() {

    const response =
        await fetch(
            "data/dienbien_xa.geojson",
            {
                cache:
                    "no-store"
            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            "Không đọc được GeoJSON: HTTP " +
            response.status
        );

    }


    const data =
        await response.json();


    if (
        !data ||
        data.type !==
        "FeatureCollection"
    ) {

        throw new Error(
            "GeoJSON phải là FeatureCollection."
        );

    }


    geojsonData =
        data;


    renderGeoJSON();


    // Luôn ưu tiên trung tâm Điện Biên
    // thay vì fit toàn bộ extent bất thường.

    setTimeout(
        function() {

            map.invalidateSize();


            map.setView(
                [21.386,103.016],
                9
            );


            renderLabels();

        },
        100
    );

}


// ======================================================
// BẢN ĐỒ NỀN
// ======================================================

function setBasemap(
    mode
) {

    if (!map) {

        return;

    }


    if (
        mode ===
        "satellite"
    ) {

        if (
            map.hasLayer(
                streetLayer
            )
        ) {

            map.removeLayer(
                streetLayer
            );

        }


        if (
            !map.hasLayer(
                satelliteLayer
            )
        ) {

            map.addLayer(
                satelliteLayer
            );

        }


        currentBasemap =
            "satellite";

    }

    else {

        if (
            map.hasLayer(
                satelliteLayer
            )
        ) {

            map.removeLayer(
                satelliteLayer
            );

        }


        if (
            !map.hasLayer(
                streetLayer
            )
        ) {

            map.addLayer(
                streetLayer
            );

        }


        currentBasemap =
            "street";

    }


    document
        .getElementById(
            "btnStreet"
        )
        ?.classList
        .toggle(
            "active",
            mode ===
            "street"
        );


    document
        .getElementById(
            "btnSatellite"
        )
        ?.classList
        .toggle(
            "active",
            mode ===
            "satellite"
        );

}


// ======================================================
// ĐIỀU KHIỂN
// ======================================================

function bindControls() {

    document
        .getElementById(
            "layerSelect"
        )
        ?.addEventListener(
            "change",
            e => {

                setLayer(
                    e.target.value
                );

            }
        );


    document
        .getElementById(
            "btnStreet"
        )
        ?.addEventListener(
            "click",
            function() {

                setBasemap(
                    "street"
                );

            }
        );


    document
        .getElementById(
            "btnSatellite"
        )
        ?.addEventListener(
            "click",
            function() {

                setBasemap(
                    "satellite"
                );

            }
        );


    document
        .getElementById(
            "btnFullscreen"
        )
        ?.addEventListener(
            "click",
            toggleFullscreen
        );


    document
        .getElementById(
            "btnExport"
        )
        ?.addEventListener(
            "click",
            exportMapImage
        );


    document
        .getElementById(
            "btnRefresh"
        )
        ?.addEventListener(
            "click",
            reloadData
        );


    document
        .getElementById(
            "btnLocate"
        )
        ?.addEventListener(
            "click",
            locateUser
        );


    map.on(
        "zoomend moveend",
        function() {

            renderLabels();

        }
    );

}


// ======================================================
// CHỌN LỚP
// ======================================================

function setLayer(
    layerName
) {

    if (
        !layerConfig[
            layerName
        ]
    ) {

        return;

    }


    currentLayer =
        layerName;


    const select =
        document.getElementById(
            "layerSelect"
        );


    if (select) {

        select.value =
            layerName;

    }


    clearPanel();

    refreshMap();

}


// ======================================================
// TÌM XÃ
// ======================================================

function searchFeature(
    keyword
) {

    const text =
        norm(keyword);


    if (
        !text ||
        !geojsonData
    ) {

        return;

    }


    const feature =
        geojsonData.features.find(
            function(f) {

                return norm(
                    getName(f)
                ).includes(
                    text
                );

            }
        );


    if (!feature) {

        alert(
            "Không tìm thấy xã/phường: " +
            keyword
        );

        return;

    }


    const layer =
        findLayer(
            feature
        );


    if (layer) {

        map.fitBounds(
            layer.getBounds(),
            {
                padding:
                    [40,40],
                maxZoom:
                    13
            }
        );

    }


    showPanel(
        feature
    );

}


// ======================================================
// TÌM LAYER
// ======================================================

function findLayer(
    feature
) {

    let found =
        null;


    if (geojsonLayer) {

        geojsonLayer.eachLayer(
            function(layer) {

                if (
                    layer.feature ===
                    feature
                ) {

                    found =
                        layer;

                }

            }
        );

    }


    return found;

}


// ======================================================
// VỊ TRÍ
// ======================================================

function locateUser() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "Trình duyệt không hỗ trợ định vị."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const lat =
                position.coords.latitude;


            const lng =
                position.coords.longitude;


            map.setView(
                [
                    lat,
                    lng
                ],
                13
            );


            L.circleMarker(
                [
                    lat,
                    lng
                ],
                {

                    radius:
                        6,

                    color:
                        "#FFFFFF",

                    weight:
                        2,

                    fillColor:
                        "#1976D2",

                    fillOpacity:
                        1

                }
            )
            .addTo(map)
            .bindPopup(
                "Vị trí hiện tại"
            )
            .openPopup();

        },

        function() {

            alert(
                "Không thể lấy vị trí hiện tại."
            );

        }

    );

}


// ======================================================
// FULLSCREEN
// ======================================================

function toggleFullscreen() {

    const container =
        document.querySelector(
            ".main-map"
        );


    if (
        !document.fullscreenElement
    ) {

        container
            ?.requestFullscreen?.();

    }

    else {

        document
            .exitFullscreen?.();

    }


    setTimeout(
        function() {

            map.invalidateSize();

        },
        300
    );

}


// ======================================================
// XUẤT ẢNH
// ======================================================

async function exportMapImage() {

    const mapElement =
        document.getElementById(
            "map"
        );


    if (
        !mapElement ||
        typeof html2canvas !==
        "function"
    ) {

        alert(
            "Chưa sẵn sàng công cụ xuất ảnh."
        );

        return;

    }


    const button =
        document.getElementById(
            "btnExport"
        );


    if (button) {

        button.classList.add(
            "loading"
        );

    }


    try {

        const controls =
            mapElement.querySelectorAll(
                ".leaflet-control-zoom"
            );


        controls.forEach(
            el =>
                el.classList.add(
                    "export-hide"
                )
        );


        const canvas =
            await html2canvas(
                mapElement,
                {

                    useCORS:
                        true,

                    allowTaint:
                        false,

                    backgroundColor:
                        "#F7F9FB",

                    scale:
                        2,

                    logging:
                        false,

                    imageTimeout:
                        15000

                }
            );


        controls.forEach(
            el =>
                el.classList.remove(
                    "export-hide"
                )
        );


        const link =
            document.createElement(
                "a"
            );


        const date =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );


        link.download =
            `WEBGIS_DienBien_${currentLayer}_${date}.png`;


        link.href =
            canvas.toDataURL(
                "image/png"
            );


        link.click();

    }

    catch (err) {

        console.error(
            "Lỗi xuất ảnh:",
            err
        );


        alert(
            "Không xuất được ảnh."
        );

    }

    finally {

        mapElement
            .querySelectorAll(
                ".export-hide"
            )
            .forEach(
                el =>
                    el.classList.remove(
                        "export-hide"
                    )
            );


        if (button) {

            button.classList.remove(
                "loading"
            );

        }

    }

}


// ======================================================
// LÀM MỚI
// ======================================================

async function reloadData() {

    try {

        if (
            typeof window.loadSheet ===
            "function"
        ) {

            await window.loadSheet();

        }


        if (!geojsonData) {

            await loadGeoJSON();

        }

        else {

            refreshMap();

        }


        if (
            typeof window.updateDashboard ===
            "function"
        ) {

            window.updateDashboard();

        }

    }

    catch (err) {

        console.error(
            "Lỗi cập nhật dữ liệu:",
            err
        );

    }

}


// ======================================================
// API GLOBAL
// ======================================================

window.initMap =
    initMap;

window.loadGeoJSON =
    loadGeoJSON;

window.setLayer =
    setLayer;

window.reloadData =
    reloadData;

window.searchFeature =
    searchFeature;

window.exportCurrentMap =
    exportMapImage;
