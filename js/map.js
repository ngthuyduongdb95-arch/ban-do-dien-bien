/* =========================================================
   WEBGIS ĐIỆN BIÊN
   MAP.JS
   ========================================================= */

/* =========================================================
   BIẾN TOÀN CỤC
   ========================================================= */

let map = null;
let geojsonLayer = null;

let geojsonData = null;
let sheetData = [];

let selectedFeature = null;
let selectedLayer = null;

let provinceBoundaryLayer = null;
let diseaseMarkerLayer = null;
let labelLayer = null;

let currentDiseaseLayer = "DTLCP";
let currentMapMode = "disease";

let mapReady = false;


/* =========================================================
   KHỞI TẠO BẢN ĐỒ
   ========================================================= */

function initMap() {

    if (map) {
        try {
            map.remove();
        } catch (_) {}
    }

    map = L.map("map", {

        zoomControl: false,

        preferCanvas: false,

        attributionControl: true,

        minZoom: 7,

        maxZoom: 16

    });


    /* =====================================================
       NỀN BẢN ĐỒ
    ===================================================== */

    const baseLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors',

            crossOrigin: true
        }
    );

    baseLayer.addTo(map);


    /* =====================================================
       ZOOM CONTROL
    ===================================================== */

    L.control.zoom({

        position: "topright"

    }).addTo(map);


    /* =====================================================
       SCALE
    ===================================================== */

    L.control.scale({

        position: "bottomleft",

        imperial: false,

        maxWidth: 120

    }).addTo(map);


    /* =====================================================
       MẶC ĐỊNH TÂM ĐIỆN BIÊN
    ===================================================== */

    map.setView(
        [21.39, 103.02],
        8
    );


    mapReady = true;


    console.log(
        "Bản đồ đã khởi tạo."
    );
}


/* =========================================================
   CHUẨN HÓA TÊN XÃ
   ========================================================= */

function normalizeName(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    let text = String(value)
        .trim()
        .toLowerCase();


    /* -----------------------------------------------------
       Chuẩn hóa Unicode
       ----------------------------------------------------- */

    text = text.normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );


    /* -----------------------------------------------------
       Chuẩn hóa đ
       ----------------------------------------------------- */

    text = text
        .replace(/đ/g, "d");


    /* -----------------------------------------------------
       Bỏ tiền tố xã / phường / thị trấn
       ----------------------------------------------------- */

    text = text.replace(
        /^(xã|phường|phuong|xa|thị trấn|thi tran)\s+/i,
        ""
    );


    /* -----------------------------------------------------
       Chuẩn hóa khoảng trắng
       ----------------------------------------------------- */

    text = text
        .replace(/\s+/g, " ")
        .trim();


    return text;
}


/* =========================================================
   LẤY TÊN XÃ TỪ GEOJSON
   ========================================================= */

function getName(feature) {

    if (
        !feature ||
        !feature.properties
    ) {
        return "";
    }

    const p = feature.properties;


    const fields = [

        "TEN_XA",

        "Ten_Xa",

        "TENXA",

        "TenXa",

        "ten_xa",

        "tenxa",

        "NAME_3",

        "NAME",

        "name",

        "Xã",

        "Xa",

        "xa",

        "Tên xã",

        "Tên_xã",

        "TEN"

    ];


    for (
        const field of fields
    ) {

        if (
            p[field] !== undefined &&
            p[field] !== null &&
            String(p[field]).trim() !== ""
        ) {

            return String(
                p[field]
            ).trim();

        }

    }


    return "";
}


/* =========================================================
   LẤY ID XÃ
   ========================================================= */

function getFeatureId(feature) {

    if (
        !feature ||
        !feature.properties
    ) {
        return "";
    }

    const p = feature.properties;


    const fields = [

        "ID",

        "Id",

        "id",

        "ID_XA",

        "Id_Xa",

        "IDXA",

        "MA_XA",

        "MA",

        "Mã xã",

        "MaXa",

        "ma_xa"

    ];


    for (
        const field of fields
    ) {

        if (
            p[field] !== undefined &&
            p[field] !== null &&
            String(p[field]).trim() !== ""
        ) {

            return String(
                p[field]
            ).trim();

        }

    }


    return "";
}


/* =========================================================
   TÌM DÒNG GOOGLE SHEETS
   ========================================================= */

function getRow(feature) {

    if (
        !feature ||
        !Array.isArray(window.sheetData)
    ) {
        return null;
    }


    const featureId =
        normalizeName(
            getFeatureId(feature)
        );

    const featureName =
        normalizeName(
            getName(feature)
        );


    /* =====================================================
       1. ƯU TIÊN GHÉP THEO ID
       ===================================================== */

    if (featureId) {

        const byId =
            window.sheetData.find(
                row => {

                    if (!row) {
                        return false;
                    }

                    const rowId =
                        normalizeName(
                            row["ID"] ??
                            row["Id"] ??
                            row["id"] ??
                            row["ID_XA"] ??
                            row["MA_XA"] ??
                            row["Mã xã"] ??
                            ""
                        );

                    return (
                        rowId &&
                        rowId === featureId
                    );
                }
            );


        if (byId) {

            return byId;

        }

    }


    /* =====================================================
       2. NẾU ID KHÔNG KHỚP → GHÉP THEO TÊN
       ===================================================== */

    if (featureName) {

        const byName =
            window.sheetData.find(
                row => {

                    if (!row) {
                        return false;
                    }


                    const possibleNames = [

                        row["Tên xã"],

                        row["Ten xa"],

                        row["Tên xã/phường"],

                        row["Tên xã, phường"],

                        row["Xã"],

                        row["Xa"],

                        row["xã"],

                        row["Phường"],

                        row["phường"],

                        row["NAME"],

                        row["name"]

                    ];


                    return possibleNames.some(
                        value =>
                            normalizeName(
                                value
                            ) === featureName
                    );

                }
            );


        if (byName) {

            return byName;

        }

    }


    return null;
}


/* =========================================================
   FORMAT SỐ
   ========================================================= */

function fmt(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }


    if (
        typeof value === "number"
    ) {

        return value.toLocaleString(
            "vi-VN"
        );

    }


    const text =
        String(value).trim();


    if (
        text === "" ||
        text === "--" ||
        text === "—"
    ) {
        return "";
    }


    const number =
        Number(
            text
                .replace(/\./g, "")
                .replace(/,/g, ".")
        );


    if (
        !Number.isNaN(number)
    ) {

        return number.toLocaleString(
            "vi-VN"
        );

    }


    return text;
}


/* =========================================================
   FORMAT NGÀY
   ========================================================= */

function formatDate(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "";
    }


    if (
        value instanceof Date &&
        !Number.isNaN(value.getTime())
    ) {

        return value.toLocaleDateString(
            "vi-VN"
        );

    }


    const text =
        String(value).trim();


    /* yyyy-mm-dd */

    let match =
        text.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})/
        );


    if (match) {

        return `${match[3].padStart(2,"0")}/${match[2].padStart(2,"0")}/${match[1]}`;

    }


    /* dd/mm/yyyy */

    match =
        text.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
        );


    if (match) {

        return `${match[1].padStart(2,"0")}/${match[2].padStart(2,"0")}/${match[3]}`;

    }


    return text;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   KIỂM TRA CÓ DỮ LIỆU
   ========================================================= */

function hasValue(value) {

    return !(
        value === null ||
        value === undefined ||
        value === "" ||
        value === "--" ||
        value === "—" ||
        value === "N/A" ||
        value === "null" ||
        value === "undefined"
    );

}


/* =========================================================
   TẠO DÒNG PANEL
   ========================================================= */

function infoRows(items) {

    if (
        !Array.isArray(items)
    ) {
        return "";
    }


    const validItems =
        items.filter(
            item =>
                Array.isArray(item) &&
                item.length >= 2 &&
                hasValue(item[1])
        );


    if (
        validItems.length === 0
    ) {
        return "";
    }


    return validItems.map(
        item => `

            <div class="info-row">

                <span>
                    ${escapeHtml(item[0])}
                </span>

                <b>
                    ${escapeHtml(item[1])}
                </b>

            </div>

        `
    ).join("");
}


/* =========================================================
   XÁC ĐỊNH TÂM FEATURE
   ========================================================= */

function featureCenter(feature) {

    if (
        !feature ||
        !feature.geometry
    ) {
        return null;
    }


    try {

        const layer =
            L.geoJSON(feature);


        const bounds =
            layer.getBounds();


        if (
            bounds &&
            bounds.isValid()
        ) {

            return bounds.getCenter();

        }

    } catch (_) {}


    return null;
}


/* =========================================================
   MÀU KHÔNG CÓ DỊCH
   ========================================================= */

function noDiseaseColor() {

    return "#E8EEF2";

}


/* =========================================================
   CHUYỂN GIÁ TRỊ SANG NUMBER
   ========================================================= */

function numericValue(value) {

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
        return value;
    }


    const number =
        Number(
            String(value)
                .replace(/\./g, "")
                .replace(/,/g, ".")
                .replace(/[^\d.-]/g, "")
        );


    return Number.isFinite(number)
        ? number
        : 0;
}


/* =========================================================
   TẠO THANG MÀU
   ========================================================= */

function getColorScale() {

    return [

        "#F8CACA",

        "#F28F8F",

        "#E85D5D",

        "#D93636",

        "#B91C1C",

        "#7F1111",

        "#4A0808"

    ];

}


/* =========================================================
   LẤY GIÁ TRỊ THEO LỚP
   ========================================================= */

function getDiseaseValue(
    row,
    disease
) {

    if (!row) {
        return 0;
    }


    switch (disease) {

        case "DTLCP":

            return numericValue(
                row["DTLCP_Ổ dịch"] ??
                row["DTLCP_Chết"] ??
                0
            );


        case "CGC":

            return numericValue(
                row["CGC_Ổ dịch"] ??
                row["CGC_Chết"] ??
                0
            );


        case "VDNC":

            return numericValue(
                row["VDNC_Mắc"] ??
                row["VDNC_Chết"] ??
                0
            );


        case "DAI":

            return numericValue(
                row["DAI_Ổ dịch"] ??
                row["DAI_Chết"] ??
                0
            );


        case "PHUN":

            return numericValue(
                row["PHUN_Số hộ"] ??
                0
            );


        case "KSGM":

            return numericValue(
                row["KSGM_Cơ sở"] ??
                0
            );


        case "CSBBTTY":

            return numericValue(
                row["CSBBTTY_Cơ sở"] ??
                0
            );


        default:

            return 0;

    }

}


/* =========================================================
   TÍNH JENKS
   ========================================================= */

function jenksBreaks(
    data,
    numberClasses
) {

    const values =
        data
            .map(Number)
            .filter(
                Number.isFinite
            )
            .sort(
                (a,b) => a-b
            );


    if (
        values.length === 0
    ) {
        return [];
    }


    const unique =
        [...new Set(values)];


    if (
        unique.length <= numberClasses
    ) {
        return unique;
    }


    const n =
        values.length;


    const lower =
        Array.from(
            {length:n + 1},
            () =>
                Array(
                    numberClasses + 1
                ).fill(0)
        );


    const variance =
        Array.from(
            {length:n + 1},
            () =>
                Array(
                    numberClasses + 1
                ).fill(Infinity)
        );


    for (
        let i=1;
        i<=numberClasses;
        i++
    ) {

        lower[0][i] = 1;

        variance[0][i] = 0;

    }


    for (
        let l=1;
        l<=n;
        l++
    ) {

        let sum = 0;
        let sumSquares = 0;
        let w = 0;


        for (
            let m=1;
            m<=l;
            m++
        ) {

            const i =
                l - m + 1;


            const value =
                values[i-1];


            w++;

            sum += value;

            sumSquares +=
                value * value;


            const varianceValue =
                sumSquares -
                (sum * sum) / w;


            if (
                i !== 1
            ) {

                for (
                    let j=2;
                    j<=numberClasses;
                    j++
                ) {

                    if (
                        variance[l][j] >=
                        varianceValue +
                        variance[i-1][j-1]
                    ) {

                        lower[l][j] =
                            i;

                        variance[l][j] =
                            varianceValue +
                            variance[i-1][j-1];

                    }

                }

            }

        }


        lower[l][1] = 1;

        variance[l][1] =
            sumSquares -
            (sum * sum) / w;

    }


    const breaks =
        Array(
            numberClasses
        ).fill(0);


    breaks[
        numberClasses - 1
    ] = values[n - 1];


    let k =
        n;


    for (
        let j=numberClasses;
        j>=2;
        j--
    ) {

        const id =
            lower[k][j] - 1;


        breaks[j - 2] =
            values[id];


        k =
            lower[k][j] - 1;

    }


    return breaks;
}


/* =========================================================
   MÀU THEO GIÁ TRỊ
   ========================================================= */

function colorForValue(
    value,
    breaks
) {

    const number =
        numericValue(value);


    if (
        number <= 0
    ) {

        return noDiseaseColor();

    }


    const colors =
        getColorScale();


    if (
        !breaks ||
        breaks.length === 0
    ) {

        return colors[0];

    }


    let index = 0;


    for (
        let i=0;
        i<breaks.length;
        i++
    ) {

        if (
            number >= breaks[i]
        ) {

            index = i;

        }

    }


    index =
        Math.min(
            index,
            colors.length - 1
        );


    return colors[index];

}
/* =========================================================
   LẤY GIÁ TRỊ HIỂN THỊ TRÊN BẢN ĐỒ
   ========================================================= */

function getMapValue(
    row,
    disease
) {

    if (!row) {
        return 0;
    }


    switch (disease) {

        case "DTLCP":

            return numericValue(
                row["DTLCP_Ổ dịch"] ??
                row["DTLCP_Chết"] ??
                0
            );


        case "CGC":

            return numericValue(
                row["CGC_Ổ dịch"] ??
                row["CGC_Chết"] ??
                0
            );


        case "VDNC":

            return numericValue(
                row["VDNC_Mắc"] ??
                row["VDNC_Chết"] ??
                0
            );


        case "DAI":

            return numericValue(
                row["DAI_Ổ dịch"] ??
                row["DAI_Chết"] ??
                0
            );


        case "PHUN":

            return numericValue(
                row["PHUN_Số hộ"] ??
                0
            );


        case "KSGM":

            return numericValue(
                row["KSGM_Cơ sở"] ??
                0
            );


        case "CSBBTTY":

            return numericValue(
                row["CSBBTTY_Cơ sở"] ??
                0
            );


        default:

            return 0;

    }

}


/* =========================================================
   THU THẬP GIÁ TRỊ CỦA 45 XÃ
   ========================================================= */

function collectMapValues(
    disease
) {

    if (
        !Array.isArray(
            geojsonData?.features
        )
    ) {

        return [];

    }


    return geojsonData.features
        .map(
            feature => {

                const row =
                    getRow(feature);


                if (!row) {
                    return 0;
                }


                return getMapValue(
                    row,
                    disease
                );

            }
        )
        .filter(
            value =>
                Number.isFinite(value)
        );

}


/* =========================================================
   TÍNH BREAKS CHO LỚP BẢN ĐỒ
   ========================================================= */

function getCurrentBreaks(
    disease
) {

    const values =
        collectMapValues(
            disease
        );


    const positiveValues =
        values.filter(
            value =>
                value > 0
        );


    if (
        positiveValues.length === 0
    ) {

        return [];

    }


    return jenksBreaks(
        positiveValues,
        7
    );

}


/* =========================================================
   STYLE CHO TỪNG XÃ
   ========================================================= */

function styleFeature(
    feature
) {

    const row =
        getRow(feature);


    const value =
        getMapValue(
            row,
            currentDiseaseLayer
        );


    const breaks =
        getCurrentBreaks(
            currentDiseaseLayer
        );


    let fillColor =
        noDiseaseColor();


    if (
        value > 0
    ) {

        fillColor =
            colorForValue(
                value,
                breaks
            );

    }


    return {

        color:"#FFFFFF",

        weight:1,

        opacity:1,

        fillColor:

            fillColor,

        fillOpacity:.82

    };

}


/* =========================================================
   HIỂN THỊ GEOJSON
   ========================================================= */

function renderGeoJSON() {

    if (
        !map ||
        !geojsonData
    ) {

        console.error(
            "Chưa có GeoJSON để vẽ bản đồ."
        );

        return;

    }


    /* -----------------------------------------------------
       Xóa lớp cũ
       ----------------------------------------------------- */

    if (geojsonLayer) {

        try {

            map.removeLayer(
                geojsonLayer
            );

        } catch (_) {}

    }


    /* -----------------------------------------------------
       Tạo lớp mới
       ----------------------------------------------------- */

    geojsonLayer =
        L.geoJSON(
            geojsonData,
            {

                style:
                    styleFeature,


                onEachFeature(
                    feature,
                    layer
                ) {

                    layer.on({

                        /* =================================
                           HOVER
                           ================================= */

                        mouseover() {

                            if (
                                selectedLayer !==
                                this
                            ) {

                                this.setStyle({

                                    weight:2.2,

                                    color:
                                        "#243B53",

                                    fillOpacity:
                                        .95

                                });

                            }

                            this.bringToFront();

                        },


                        /* =================================
                           MOUSE OUT
                           ================================= */

                        mouseout() {

                            if (
                                selectedLayer !==
                                this
                            ) {

                                geojsonLayer
                                    .resetStyle(
                                        this
                                    );

                            }

                        },


                        /* =================================
                           CLICK XÃ
                           ================================= */

                        click(e) {

                            /* -----------------------------
                               Bỏ highlight xã cũ
                               ----------------------------- */

                            if (
                                selectedLayer &&
                                selectedLayer !==
                                this
                            ) {

                                try {

                                    geojsonLayer
                                        .resetStyle(
                                            selectedLayer
                                        );

                                } catch (_) {}

                            }


                            /* -----------------------------
                               Ghi nhận xã đang chọn
                               ----------------------------- */

                            selectedLayer =
                                this;


                            selectedFeature =
                                feature;


                            /* -----------------------------
                               Highlight xanh
                               ----------------------------- */

                            this.setStyle({

                                weight:2.8,

                                color:
                                    "#0B57D0",

                                opacity:1,

                                fillOpacity:.95

                            });


                            this.bringToFront();


                            /* -----------------------------
                               Mở panel
                               ----------------------------- */

                            showPanel(
                                feature,
                                this
                            );


                            /* -----------------------------
                               Không cho click xuyên
                               ----------------------------- */

                            if (
                                e &&
                                e.originalEvent
                            ) {

                                L.DomEvent
                                    .stopPropagation(
                                        e.originalEvent
                                    );

                            }

                        }

                    });

                }

            }
        );


    geojsonLayer.addTo(
        map
    );


    /* -----------------------------------------------------
       Đưa lớp viền tỉnh lên trên
       ----------------------------------------------------- */

    if (
        provinceBoundaryLayer
    ) {

        provinceBoundaryLayer
            .bringToFront();

    }


    console.log(
        "Đã vẽ GeoJSON:",
        geojsonData.features.length,
        "features"
    );

}


/* =========================================================
   TẠO VIỀN NGOÀI TOÀN TỈNH
   ========================================================= */

function addProvinceEmphasis() {

    if (
        !map ||
        !geojsonData ||
        !geojsonData.features
    ) {

        return;

    }


    /* -----------------------------------------------------
       Xóa viền cũ
       ----------------------------------------------------- */

    if (
        provinceBoundaryLayer
    ) {

        try {

            map.removeLayer(
                provinceBoundaryLayer
            );

        } catch (_) {}

    }


    const edgeMap =
        new Map();


    /* -----------------------------------------------------
       Tạo key cho cạnh
       ----------------------------------------------------- */

    function edgeKey(
        a,
        b
    ) {

        const p1 =
            `${Number(a[0]).toFixed(6)},${Number(a[1]).toFixed(6)}`;

        const p2 =
            `${Number(b[0]).toFixed(6)},${Number(b[1]).toFixed(6)}`;


        return p1 < p2

            ? `${p1}|${p2}`

            : `${p2}|${p1}`;

    }


    /* -----------------------------------------------------
       Lưu cạnh polygon
       ----------------------------------------------------- */

    function addRing(
        ring
    ) {

        if (
            !Array.isArray(ring) ||
            ring.length < 2
        ) {

            return;

        }


        for (
            let i=0;
            i<ring.length-1;
            i++
        ) {

            const a =
                ring[i];

            const b =
                ring[i+1];


            const key =
                edgeKey(
                    a,
                    b
                );


            if (
                edgeMap.has(key)
            ) {

                /* Cạnh chung của 2 xã
                   → bỏ */

                edgeMap.delete(
                    key
                );

            } else {

                edgeMap.set(
                    key,
                    [a,b]
                );

            }

        }

    }


    /* -----------------------------------------------------
       Quét toàn bộ 45 xã
       ----------------------------------------------------- */

    geojsonData.features.forEach(
        feature => {

            const geometry =
                feature.geometry;


            if (!geometry) {
                return;
            }


            if (
                geometry.type ===
                "Polygon"
            ) {

                geometry.coordinates
                    .forEach(
                        addRing
                    );

            }


            if (
                geometry.type ===
                "MultiPolygon"
            ) {

                geometry.coordinates
                    .forEach(
                        polygon => {

                            polygon.forEach(
                                addRing
                            );

                        }
                    );

            }

        }
    );


    /* -----------------------------------------------------
       Tạo layergroup
       ----------------------------------------------------- */

    provinceBoundaryLayer =
        L.layerGroup();


    /* -----------------------------------------------------
       Vẽ các cạnh ngoài
       ----------------------------------------------------- */

    edgeMap.forEach(
        segment => {

            const latLngs = [

                [
                    segment[0][1],
                    segment[0][0]
                ],

                [
                    segment[1][1],
                    segment[1][0]
                ]

            ];


            L.polyline(
                latLngs,
                {

                    className:
                        "province-emphasis",

                    color:
                        "#145A86",

                    weight:
                        2.8,

                    opacity:
                        .95,

                    interactive:
                        false

                }
            ).addTo(
                provinceBoundaryLayer
            );

        }
    );


    provinceBoundaryLayer
        .addTo(map);


    provinceBoundaryLayer
        .bringToFront();


    console.log(
        "Đã tạo viền ngoài tỉnh Điện Biên."
    );

}


/* =========================================================
   TẠO LỚP NHÃN XÃ
   ========================================================= */

function renderLabels() {

    /* -----------------------------------------------------
       Xóa nhãn cũ
       ----------------------------------------------------- */

    if (
        labelLayer
    ) {

        try {

            map.removeLayer(
                labelLayer
            );

        } catch (_) {}

    }


    labelLayer =
        L.layerGroup();


    /* -----------------------------------------------------
       Chống tên xã bị lặp
       ----------------------------------------------------- */

    const renderedNames =
        new Set();


    if (
        !geojsonData ||
        !geojsonData.features
    ) {

        return;

    }


    geojsonData.features.forEach(
        feature => {

            const name =
                getName(
                    feature
                );


            if (!name) {
                return;
            }


            /* =============================================
               CHỈ HIỆN TÊN XÃ CÓ DỮ LIỆU
               ============================================= */

            const row =
                getRow(
                    feature
                );


            if (!row) {
                return;
            }


            /* =============================================
               CHUẨN HÓA TÊN ĐỂ CHỐNG TRÙNG
               ============================================= */

            const normalizedName =
                normalizeName(
                    name
                );


            if (
                renderedNames.has(
                    normalizedName
                )
            ) {

                return;

            }


            renderedNames.add(
                normalizedName
            );


            /* =============================================
               LẤY TÂM XÃ
               ============================================= */

            const center =
                featureCenter(
                    feature
                );


            if (!center) {
                return;
            }


            /* =============================================
               TÊN XÃ
               ============================================= */

            const label =
                L.marker(
                    center,
                    {

                        interactive:
                            false,

                        keyboard:
                            false,

                        zIndexOffset:
                            1000,

                        icon:
                            L.divIcon({

                                className:
                                    "map-label-wrap",

                                html:
                                    `<span class="map-label">${escapeHtml(name)}</span>`,

                                iconSize:
                                    null

                            })

                    }
                );


            labelLayer
                .addLayer(
                    label
                );

        }
    );


    labelLayer.addTo(
        map
    );


    /* -----------------------------------------------
       Nhãn không được che click polygon
       ----------------------------------------------- */

    if (
        labelLayer._layers
    ) {

        Object.values(
            labelLayer._layers
        ).forEach(
            marker => {

                if (
                    marker._icon
                ) {

                    marker._icon.style
                        .pointerEvents =
                        "none";

                }

            }
        );

    }


    console.log(
        "Đã tạo nhãn xã:",
        renderedNames.size
    );

}


/* =========================================================
   CHẤM ĐỎ XÃ ĐANG CÓ DỊCH
   ========================================================= */

function renderDiseaseMarkers() {

    /* -----------------------------------------------------
       Xóa marker cũ
       ----------------------------------------------------- */

    if (
        diseaseMarkerLayer
    ) {

        try {

            map.removeLayer(
                diseaseMarkerLayer
            );

        } catch (_) {}

    }


    diseaseMarkerLayer =
        L.layerGroup();


    if (
        !geojsonData ||
        !geojsonData.features
    ) {

        return;

    }


    geojsonData.features.forEach(
        feature => {

            const row =
                getRow(
                    feature
                );


            if (!row) {
                return;
            }


            /* ---------------------------------------------
               Chỉ tạo 01 chấm cho xã đang có dịch
               --------------------------------------------- */

            let hasDisease =
                false;


            switch (
                currentDiseaseLayer
            ) {

                case "DTLCP":

                    hasDisease =
                        numericValue(
                            row["DTLCP_Ổ dịch"]
                        ) > 0;

                    break;


                case "CGC":

                    hasDisease =
                        numericValue(
                            row["CGC_Ổ dịch"]
                        ) > 0;

                    break;


                case "VDNC":

                    hasDisease =
                        numericValue(
                            row["VDNC_Ổ dịch"]
                        ) > 0 ||
                        numericValue(
                            row["VDNC_Mắc"]
                        ) > 0;

                    break;


                case "DAI":

                    hasDisease =
                        numericValue(
                            row["DAI_Ổ dịch"]
                        ) > 0;

                    break;

            }


            if (!hasDisease) {
                return;
            }


            const center =
                featureCenter(
                    feature
                );


            if (!center) {
                return;
            }


            /* ---------------------------------------------
               CHẤM ĐỎ NHỎ - KHÔNG PULSE
               --------------------------------------------- */

            const marker =
                L.circleMarker(
                    center,
                    {

                        radius:
                            5,

                        color:
                            "#FFFFFF",

                        weight:
                            1.5,

                        fillColor:
                            "#E00000",

                        fillOpacity:
                            1,

                        opacity:
                            1,

                        interactive:
                            false

                    }
                );


            diseaseMarkerLayer
                .addLayer(
                    marker
                );

        }
    );


    diseaseMarkerLayer
        .addTo(map);


    /* -----------------------------------------------------
       Thứ tự lớp:
       chấm đỏ nằm trên polygon nhưng dưới nhãn
       ----------------------------------------------------- */

    if (
        provinceBoundaryLayer
    ) {

        provinceBoundaryLayer
            .bringToFront();

    }


    if (
        diseaseMarkerLayer
    ) {

        diseaseMarkerLayer
            .bringToFront();

    }


    if (
        labelLayer
    ) {

        labelLayer
            .bringToFront();

    }


    if (
        selectedLayer
    ) {

        selectedLayer
            .bringToFront();

    }


    console.log(
        "Đã cập nhật chấm đỏ dịch."
    );

}


/* =========================================================
   HIỂN THỊ PANEL
   ========================================================= */

function showPanel(
    feature,
    layer
) {

    selectedFeature =
        feature;


    /* -----------------------------------------------------
       Xác định xã
       ----------------------------------------------------- */

    const name =
        getName(
            feature
        );


    const row =
        getRow(
            feature
        );


    console.log(
        "=============================="
    );

    console.log(
        "CLICK XÃ"
    );

    console.log(
        "Tên xã từ GeoJSON:",
        name
    );

    console.log(
        "Feature:",
        feature
    );

    console.log(
        "Dòng dữ liệu tìm được:",
        row
    );

    console.log(
        "Số dòng dữ liệu Google Sheets:",
        Array.isArray(
            window.sheetData
        )
            ? window.sheetData.length
            : "không tìm thấy sheetData"
    );


    /* -----------------------------------------------------
       Highlight xã được chọn
       ----------------------------------------------------- */

    if (
        selectedLayer &&
        selectedLayer !== layer &&
        geojsonLayer
    ) {

        try {

            geojsonLayer
                .resetStyle(
                    selectedLayer
                );

        } catch (_) {}

    }


    if (layer) {

        selectedLayer =
            layer;


        layer.setStyle({

            weight:
                2.8,

            color:
                "#0B57D0",

            opacity:
                1,

            fillOpacity:
                .95

        });


        layer.bringToFront();

    }


    /* -----------------------------------------------------
       Panel
       ----------------------------------------------------- */

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

        console.error(
            "Không tìm thấy #info-panel"
        );

        return;

    }


    /* -----------------------------------------------------
       Không có dòng dữ liệu
       ----------------------------------------------------- */

    if (!row) {

        panel.innerHTML = `

            <div class="empty-panel">

                <div class="empty-title">

                    ${escapeHtml(
                        name ||
                        "Xã/phường"
                    )}

                </div>

                <p>
                    Chưa có dữ liệu cho xã/phường này.
                </p>

            </div>

        `;


        return;

    }


    /* -----------------------------------------------------
       Hàm lọc dữ liệu
       ----------------------------------------------------- */

    function makeRows(
        items
    ) {

        return items.filter(
            item =>
                Array.isArray(item) &&
                item.length >= 2 &&
                hasValue(item[1])
        );

    }


    /* -----------------------------------------------------
       Tiêu đề chung
       ----------------------------------------------------- */

    let html = `

        <div class="info-block">

            <div class="info-district">
                ${escapeHtml(name)}
            </div>

            <div class="info-layer">
                Thông tin tổng hợp
            </div>

        </div>

    `;


    /* =====================================================
       1. DTLCP
       ===================================================== */

    const dtlcpRows =
        makeRows([

            [
                "Trạng thái",
                row["DTLCP_Trạng thái"]
            ],

            [
                "Ổ dịch",
                row["DTLCP_Ổ dịch"]
            ],

            [
                "Tiêu hủy",
                hasValue(
                    row["DTLCP_Chết"]
                )
                    ? `${fmt(row["DTLCP_Chết"])} con`
                    : ""
            ],

            [
                "Khối lượng",
                hasValue(
                    row["DTLCP_Trọng lượng"]
                )
                    ? `${fmt(row["DTLCP_Trọng lượng"])} kg`
                    : ""
            ],

            [
                "Ngày cuối",
                formatDate(
                    row["DTLCP_Ngày cuối"]
                )
            ]

        ]);


    if (
        dtlcpRows.length > 0
    ) {

        html += `

            <div class="info-section">

                <div class="info-section-title">
                    Dịch tả lợn Châu Phi
                </div>

                ${infoRows(
                    dtlcpRows
                )}

            </div>

        `;

    }


    /* =====================================================
       2. CÚM GIA CẦM
       ===================================================== */

    const cgcRows =
        makeRows([

            [
                "Trạng thái",
                row["CGC_Trạng thái"]
            ],

            [
                "Ổ dịch",
                row["CGC_Ổ dịch"]
            ],

            [
                "Tiêu hủy",
                hasValue(
                    row["CGC_Chết"]
                )
                    ? `${fmt(row["CGC_Chết"])} con`
                    : ""
            ],

            [
                "Khối lượng",
                hasValue(
                    row["CGC_Trọng lượng"]
                )
                    ? `${fmt(row["CGC_Trọng lượng"])} kg`
                    : ""
            ],

            [
                "Ngày cuối",
                formatDate(
                    row["CGC_Ngày cuối"]
                )
            ]

        ]);


    if (
        cgcRows.length > 0
    ) {

        html += `

            <div class="info-section">

                <div class="info-section-title">
                    Cúm gia cầm
                </div>

                ${infoRows(
                    cgcRows
                )}

            </div>

        `;

    }


    /* =====================================================
       3. VIÊM DA NỔI CỤC
       ===================================================== */

    const vdncRows =
        makeRows([

            [
                "Trạng thái",
                row["VDNC_Trạng thái"]
            ],

            [
                "Ổ dịch",
                row["VDNC_Ổ dịch"]
            ],

            [
                "Mắc",
                hasValue(
                    row["VDNC_Mắc"]
                )
                    ? `${fmt(row["VDNC_Mắc"])} con`
                    : ""
            ],

            [
                "Chết",
                hasValue(
                    row["VDNC_Chết"]
                )
                    ? `${fmt(row["VDNC_Chết"])} con`
                    : ""
            ],

            [
                "Ngày cuối",
                formatDate(
                    row["VDNC_Ngày cuối"]
                )
            ]

        ]);


    if (
        vdncRows.length > 0
    ) {

        html += `

            <div class="info-section">

                <div class="info-section-title">
                    Viêm da nổi cục
                </div>

                ${infoRows(
                    vdncRows
                )}

            </div>

        `;

    }


    /* =====================================================
       4. BỆNH DẠI
       ===================================================== */

    const daiRows =
        makeRows([

            [
                "Trạng thái",
                row["DAI_Trạng thái"]
            ],

            [
                "Ổ dịch",
                row["DAI_Ổ dịch"]
            ],

            [
                "Chết",
                hasValue(
                    row["DAI_Chết"]
                )
                    ? `${fmt(row["DAI_Chết"])} con`
                    : ""
            ],

            [
                "Tiêu hủy",
                hasValue(
                    row["DAI_Tiêu hủy"]
                )
                    ? `${fmt(row["DAI_Tiêu hủy"])} con`
                    : ""
            ],

            [
                "Ngày cuối",
                formatDate(
                    row["DAI_Ngày cuối"]
                )
            ]

        ]);


    if (
        daiRows.length > 0
    ) {

        html += `

            <div class="info-section">

                <div class="info-section-title">
                    Bệnh Dại
                </div>

                ${infoRows(
                    daiRows
                )}

            </div>

        `;

    }


    /* =====================================================
       5. THỰC HIỆN THÁNG TVSKTTĐ
       ===================================================== */

    const phunRows =
        makeRows([

            [
                "Tiến độ",
                row["PHUN_Tiến độ"]
            ],

            [
                "Số hộ",
                row["PHUN_Số hộ"]
            ],

            [
                "Vòng",
                row["PHUN_Vòng"]
            ],

            [
                "Diện tích",
                row["PHUN_Diện tích"]
            ],

            [
                "Ngày",
                formatDate(
                    row["PHUN_Ngày"]
                )
            ]

        ]);


    if (
        phunRows.length > 0
    ) {

        html += `

            <div class="info-section">

                <div class="info-section-title">
                    Thực hiện tháng TVSKTTĐ
                </div>

                ${infoRows(
                    phunRows
                )}

            </div>

        `;

    }


    /* =====================================================
       6. KIỂM SOÁT GIẾT MỔ
       ===================================================== */

    const ksgmRows =
        makeRows([

            [
                "Trạng thái",
                row["KSGM_Trạng thái"]
            ],

            [
                "Số cơ sở",
                row["KSGM_Cơ sở"]
            ]

        ]);


    if (
        ksgmRows.length > 0
    ) {

        html += `

            <div class="info-section">

                <div class="info-section-title">
                    Kiểm soát giết mổ
                </div>

                ${infoRows(
                    ksgmRows
                )}

            </div>

        `;

    }


    /* =====================================================
       7. CƠ SỞ THUỐC THÚ Y
       ===================================================== */

    const csbbttyRows =
        makeRows([

            [
                "Số cơ sở",
                row["CSBBTTY_Cơ sở"]
            ]

        ]);


    if (
        csbbttyRows.length > 0
    ) {

        html += `

            <div class="info-section">

                <div class="info-section-title">
                    Cơ sở buôn bán thuốc thú y
                </div>

                ${infoRows(
                    csbbttyRows
                )}

            </div>

        `;

    }


    /* -----------------------------------------------------
       Đưa dữ liệu vào panel
       ----------------------------------------------------- */

    panel.innerHTML =
        html;


    console.log(
        "Đã chọn xã:",
        name,

        "Dữ liệu:",
        row
    );

}
/* =========================================================
   XÓA PANEL
   ========================================================= */

function clearPanel() {

    if (
        selectedLayer &&
        geojsonLayer
    ) {

        try {

            geojsonLayer.resetStyle(
                selectedLayer
            );

        } catch (_) {}

    }


    selectedLayer = null;

    selectedFeature = null;


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

                <div class="empty-icon">
                    ◎
                </div>

                <div class="empty-title">
                    Chưa chọn xã/phường
                </div>

                <p>
                    Nhấn trực tiếp vào một xã/phường
                    trên bản đồ để xem thông tin.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   CẬP NHẬT BẢN ĐỒ KHI ĐỔI LỚP
   ========================================================= */

function updateMapLayer(
    disease
) {

    currentDiseaseLayer =
        disease;


    /* -----------------------------------------------------
       Vẽ lại màu xã
       ----------------------------------------------------- */

    if (
        geojsonLayer
    ) {

        geojsonLayer.setStyle(
            styleFeature
        );

    }


    /* -----------------------------------------------------
       Cập nhật chấm đỏ
       ----------------------------------------------------- */

    renderDiseaseMarkers();


    /* -----------------------------------------------------
       Nhãn xã giữ nguyên
       ----------------------------------------------------- */

    if (
        labelLayer
    ) {

        labelLayer.bringToFront();

    }


    /* -----------------------------------------------------
       Xã đang chọn vẫn nổi bật
       ----------------------------------------------------- */

    if (
        selectedLayer
    ) {

        selectedLayer.setStyle({

            weight:
                2.8,

            color:
                "#0B57D0",

            opacity:
                1,

            fillOpacity:
                .95

        });


        selectedLayer.bringToFront();

    }


    console.log(
        "Đã chuyển lớp:",
        disease
    );

}


/* =========================================================
   FIT TOÀN TỈNH
   ========================================================= */

function fitProvince() {

    if (
        !geojsonLayer ||
        !map
    ) {

        return;

    }


    const bounds =
        geojsonLayer.getBounds();


    if (
        bounds &&
        bounds.isValid()
    ) {

        map.fitBounds(
            bounds,
            {

                padding:[
                    20,
                    20
                ],

                maxZoom:
                    10

            }
        );

    }

}


/* =========================================================
   LOAD GEOJSON
   ========================================================= */

async function loadGeoJSON() {

    const urls = [

        "./data/dienbien_xa.geojson",

        "./data/dienbien.geojson",

        "./geojson/dienbien_xa.geojson",

        "./geojson/dienbien.geojson",

        "./dienbien_xa.geojson",

        "./dienbien.geojson"

    ];


    let lastError =
        null;


    for (
        const url of urls
    ) {

        try {

            console.log(
                "Đang tải GeoJSON:",
                url
            );


            const response =
                await fetch(
                    url,
                    {
                        cache:
                            "no-store"
                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const data =
                await response.json();


            if (
                !data ||
                data.type !==
                    "FeatureCollection" ||
                !Array.isArray(
                    data.features
                )
            ) {

                throw new Error(
                    "GeoJSON không hợp lệ"
                );

            }


            geojsonData =
                data;


            console.log(
                "GeoJSON tải thành công:",
                url
            );


            console.log(
                "Số xã/phường:",
                data.features.length
            );


            return data;

        } catch (error) {

            lastError =
                error;


            console.warn(
                "Không tải được:",
                url,
                error
            );

        }

    }


    throw new Error(
        "Không thể tải GeoJSON. " +
        (lastError?.message || "")
    );

}


/* =========================================================
   LOAD GOOGLE SHEETS
   ========================================================= */

async function loadSheetData() {

    /*
       Đặt URL Google Sheets CSV của bạn
       vào biến SHEET_URL trong HTML.
    */

    const url =
        window.SHEET_URL;


    if (
        !url
    ) {

        console.warn(
            "Chưa khai báo SHEET_URL."
        );


        window.sheetData =
            [];


        return [];

    }


    try {

        console.log(
            "Đang tải Google Sheets..."
        );


        const response =
            await fetch(
                url,
                {
                    cache:
                        "no-store"
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const text =
            await response.text();


        const rows =
            parseCSV(
                text
            );


        window.sheetData =
            rows;


        console.log(
            "Google Sheets tải thành công:",
            rows.length,
            "dòng"
        );


        return rows;

    } catch (error) {

        console.error(
            "Lỗi tải Google Sheets:",
            error
        );


        window.sheetData =
            [];


        return [];

    }

}


/* =========================================================
   PARSE CSV
   ========================================================= */

function parseCSV(
    text
) {

    if (
        !text
    ) {

        return [];

    }


    const lines =
        text
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            )
            .split("\n");


    if (
        lines.length < 2
    ) {

        return [];

    }


    function parseLine(
        line
    ) {

        const result =
            [];

        let current =
            "";

        let insideQuotes =
            false;


        for (
            let i=0;
            i<line.length;
            i++
        ) {

            const char =
                line[i];


            if (
                char === '"'
            ) {

                if (
                    insideQuotes &&
                    line[i+1] === '"'
                ) {

                    current +=
                        '"';

                    i++;

                } else {

                    insideQuotes =
                        !insideQuotes;

                }

            }

            else if (
                char === "," &&
                !insideQuotes
            ) {

                result.push(
                    current
                );

                current =
                    "";

            }

            else {

                current +=
                    char;

            }

        }


        result.push(
            current
        );


        return result.map(
            value =>
                value.trim()
        );

    }


    const headers =
        parseLine(
            lines[0]
        );


    return lines
        .slice(1)
        .filter(
            line =>
                line.trim() !== ""
        )
        .map(
            line => {

                const values =
                    parseLine(
                        line
                    );


                const row =
                    {};


                headers.forEach(
                    (
                        header,
                        index
                    ) => {

                        row[
                            header
                        ] =
                            values[index] ??
                            "";

                    }
                );


                return row;

            }
        );

}


/* =========================================================
   KIỂM TRA GHÉP DỮ LIỆU
   ========================================================= */

function logJoinResult() {

    if (
        !geojsonData ||
        !Array.isArray(
            geojsonData.features
        )
    ) {

        return;

    }


    let matched =
        0;


    const unmatched =
        [];


    geojsonData.features.forEach(
        feature => {

            const row =
                getRow(
                    feature
                );


            if (row) {

                matched++;

            } else {

                unmatched.push(
                    getName(
                        feature
                    )
                );

            }

        }
    );


    console.log(
        `Ghép dữ liệu ${matched}/${geojsonData.features.length} xã/phường`
    );


    if (
        unmatched.length
    ) {

        console.warn(
            "Các xã/phường chưa ghép được:",
            unmatched
        );

    }

}


/* =========================================================
   KHỞI ĐỘNG WEBGIS
   ========================================================= */

async function startWebGIS() {

    try {

        console.log(
            "=============================="
        );

        console.log(
            "KHỞI ĐỘNG WEBGIS"
        );

        console.log(
            "=============================="
        );


        /* -------------------------------------------------
           1. KHỞI TẠO MAP
           ------------------------------------------------- */

        initMap();


        /* -------------------------------------------------
           2. TẢI GOOGLE SHEETS TRƯỚC
           ------------------------------------------------- */

        await loadSheetData();


        /* -------------------------------------------------
           3. SAU ĐÓ MỚI TẢI GEOJSON
           ------------------------------------------------- */

        await loadGeoJSON();


        /* -------------------------------------------------
           4. KIỂM TRA GHÉP DỮ LIỆU
           ------------------------------------------------- */

        logJoinResult();


        /* -------------------------------------------------
           5. VẼ BẢN ĐỒ
           ------------------------------------------------- */

        renderGeoJSON();


        /* -------------------------------------------------
           6. VIỀN NGOÀI TỈNH
           ------------------------------------------------- */

        addProvinceEmphasis();


        /* -------------------------------------------------
           7. NHÃN XÃ
           ------------------------------------------------- */

        renderLabels();


        /* -------------------------------------------------
           8. CHẤM ĐỎ
           ------------------------------------------------- */

        renderDiseaseMarkers();


        /* -------------------------------------------------
           9. FIT BẢN ĐỒ
           ------------------------------------------------- */

        fitProvince();


        /* -------------------------------------------------
           10. PANEL BAN ĐẦU
           ------------------------------------------------- */

        clearPanel();


        console.log(
            "WEBGIS KHỞI ĐỘNG THÀNH CÔNG."
        );


    } catch (error) {

        console.error(
            "WEBGIS KHỞI ĐỘNG THẤT BẠI:",
            error
        );


        const panel =
            document.getElementById(
                "info-panel"
            );


        if (panel) {

            panel.innerHTML = `

                <div class="empty-panel">

                    <div class="empty-title">
                        Không thể tải dữ liệu bản đồ
                    </div>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Lỗi không xác định"
                        )}
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================================
   XỬ LÝ NÚT CHUYỂN LỚP
   ========================================================= */

function bindLayerButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-disease]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    const disease =
                        this.dataset.disease;


                    if (
                        !disease
                    ) {

                        return;

                    }


                    buttons.forEach(
                        btn =>
                            btn.classList
                                .remove(
                                    "active"
                                )
                    );


                    this.classList
                        .add(
                            "active"
                        );


                    updateMapLayer(
                        disease
                    );

                }
            );

        }
    );

}


/* =========================================================
   NÚT RESET BẢN ĐỒ
   ========================================================= */

function bindResetButton() {

    const button =
        document.getElementById(
            "btn-reset-map"
        );


    if (
        !button
    ) {

        return;

    }


    button.addEventListener(
        "click",
        function() {

            clearPanel();

            fitProvince();

        }
    );

}


/* =========================================================
   RESIZE MAP
   ========================================================= */

function resizeMap() {

    if (!map) {
        return;
    }


    setTimeout(
        () => {

            map.invalidateSize(
                true
            );

        },
        100
    );

}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        bindLayerButtons();

        bindResetButton();

        startWebGIS();


        /* -----------------------------------------------
           Đảm bảo map tự cập nhật khi panel thay đổi
           ----------------------------------------------- */

        window.addEventListener(
            "resize",
            resizeMap
        );


        setTimeout(
            resizeMap,
            300
        );

    }
);


/* =========================================================
   HÀM GLOBAL CHO HTML INLINE
   ========================================================= */

window.showPanel =
    showPanel;


window.clearPanel =
    clearPanel;


window.updateMapLayer =
    updateMapLayer;


window.fitProvince =
    fitProvince;


window.renderGeoJSON =
    renderGeoJSON;


window.renderLabels =
    renderLabels;


window.renderDiseaseMarkers =
    renderDiseaseMarkers;


window.startWebGIS =
    startWebGIS;
