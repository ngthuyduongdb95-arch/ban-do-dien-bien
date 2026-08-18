// ======================================================
// MAP.JS - WEBGIS ĐIỆN BIÊN
// ======================================================

// ======================================================
// BIẾN TOÀN CỤC
// ======================================================

let map = null;
let geojsonData = null;
let geojsonLayer = null;

let labelLayer = null;
let diseaseMarkerLayer = null;

let legendControl = null;
let printer = null;

let currentLayer = "DTLCP";


// ======================================================
// CẤU HÌNH CÁC LỚP
// ======================================================

const MAP_CONFIG = {

    DTLCP: {
        name: "Dịch tả lợn Châu Phi",
        valueField: "DTLCP_Chết",
        statusField: "DTLCP_Trạng thái",
        outbreakField: "DTLCP_Ổ dịch",
        unit: "con",
        colors: [
            "#FFE5E5",
            "#FFB3B3",
            "#FF8080",
            "#FF3333",
            "#C00000"
        ]
    },

    CGC: {
        name: "Cúm gia cầm",
        valueField: "CGC_Chết",
        statusField: "CGC_Trạng thái",
        outbreakField: "CGC_Ổ dịch",
        unit: "con",
        colors: [
            "#FFF0D5",
            "#FFD08A",
            "#FFAA45",
            "#F57C00",
            "#C65300"
        ]
    },

    VDNC: {
        name: "Viêm da nổi cục",
        valueField: "VDNC_Mắc",
        statusField: "VDNC_Trạng thái",
        outbreakField: "VDNC_Ổ dịch",
        unit: "con",
        colors: [
            "#F2E5F7",
            "#D9B3E6",
            "#BD80D0",
            "#963DB3",
            "#641078"
        ]
    },

    DAI: {
        name: "Bệnh Dại",
        valueField: "DAI_Chết",
        statusField: "DAI_Trạng thái",
        outbreakField: "DAI_Ổ dịch",
        unit: "con",
        colors: [
            "#E3F2FD",
            "#B3D9F2",
            "#73B9E5",
            "#268AC4",
            "#075A91"
        ]
    },

    PHUN: {
        name: "Phun khử trùng",
        valueField: "PHUN_Số hộ",
        roundField: "PHUN_Vòng"
    },

    KSGM: {
        name: "Kiểm soát giết mổ",
        valueField: "KSGM_Cơ sở",
        colors: [
            "#EFEBE9",
            "#D7CCC8",
            "#A1887F",
            "#6D4C41",
            "#3E2723"
        ]
    },

    CSBBTTY: {
        name: "Cơ sở thuốc thú y",
        valueField: "CSBBTTY_Cơ sở",
        colors: [
            "#E8F5E9",
            "#A5D6A7",
            "#66BB6A",
            "#2E7D32",
            "#145A20"
        ]
    }

};


// ======================================================
// CHUYỂN SỐ
// ======================================================

function mapNumber(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){

        return 0;

    }

    if(typeof value === "number"){

        return Number.isFinite(value)
            ? value
            : 0;

    }

    let str = String(value).trim();

    if(!str){

        return 0;

    }

    str = str.replace(/[^\d,.-]/g, "");

    if(
        str.includes(".") &&
        str.includes(",")
    ){

        str = str.replace(/\./g, "");
        str = str.replace(",", ".");

    }
    else if(str.includes(",")){

        const parts = str.split(",");

        if(
            parts.length === 2 &&
            parts[1].length <= 2
        ){

            str = parts[0] + "." + parts[1];

        }
        else{

            str = str.replace(/,/g, "");

        }

    }

    const number = Number(str);

    return Number.isFinite(number)
        ? number
        : 0;

}


// ======================================================
// FORMAT SỐ
// ======================================================

function mapFormatNumber(value){

    const number = Number(value);

    if(!Number.isFinite(number)){

        return "0";

    }

    return number.toLocaleString("vi-VN");

}


// ======================================================
// LẤY ROW THEO ID
// ======================================================

function getFeatureRow(feature){

    if(
        !feature ||
        !feature.properties
    ){

        return null;

    }

    const id = Number(feature.properties.ID);

    if(!Number.isFinite(id)){

        return null;

    }

    if(
        typeof sheetData === "undefined"
    ){

        return null;

    }

    return sheetData[id] || null;

}


// ======================================================
// LẤY TÊN XÃ
// ======================================================

function getName(feature){

    const row = getFeatureRow(feature);

    if(row){

        const sheetName =
            String(row["Tên xã"] || "").trim();

        if(sheetName){

            return sheetName;

        }

    }

    if(feature && feature.properties){

        const p = feature.properties;

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

    return "";

}


// ======================================================
// LẤY ROWS
// ======================================================

function getMapRows(){

    if(
        typeof getRows === "function"
    ){

        return getRows();

    }

    if(
        typeof sheetData !== "undefined"
    ){

        return Object.values(sheetData);

    }

    return [];

}


// ======================================================
// LẤY GIÁ TRỊ CỦA LỚP HIỆN TẠI
// ======================================================

function getLayerValue(row){

    if(!row){

        return 0;

    }

    const config =
        MAP_CONFIG[currentLayer];

    if(
        !config ||
        !config.valueField
    ){

        return 0;

    }

    return mapNumber(
        row[config.valueField]
    );

}


// ======================================================
// XÃ CÓ SỐ LIỆU
// ======================================================

function hasLayerData(row){

    if(!row){

        return false;

    }

    const config =
        MAP_CONFIG[currentLayer];

    if(!config){

        return false;

    }


    // --------------------------
    // DỊCH BỆNH
    // --------------------------

    if(
        ["DTLCP","CGC","VDNC","DAI"]
        .includes(currentLayer)
    ){

        return (
            getLayerValue(row) > 0 ||
            mapNumber(
                row[config.outbreakField]
            ) > 0 ||
            String(
                row[config.statusField] || ""
            ).trim() !== ""
        );

    }


    // --------------------------
    // PHUN
    // --------------------------

    if(currentLayer === "PHUN"){

        return (
            mapNumber(
                row["PHUN_Số hộ"]
            ) > 0 ||
            mapNumber(
                row["PHUN_Vòng"]
            ) > 0 ||
            String(
                row["PHUN_Tiến độ"] || ""
            ).trim() !== ""
        );

    }


    // --------------------------
    // KSGM
    // --------------------------

    if(currentLayer === "KSGM"){

        return (
            mapNumber(
                row["KSGM_Cơ sở"]
            ) > 0
        );

    }


    // --------------------------
    // THUỐC THÚ Y
    // --------------------------

    if(currentLayer === "CSBBTTY"){

        return (
            mapNumber(
                row["CSBBTTY_Cơ sở"]
            ) > 0
        );

    }

    return false;

}


// ======================================================
// XÃ ĐANG CÓ DỊCH
// ======================================================

function isDiseaseActive(row){

    const config =
        MAP_CONFIG[currentLayer];

    if(
        !row ||
        !config ||
        !config.statusField
    ){

        return false;

    }

    const status =
        String(
            row[config.statusField] || ""
        )
        .trim()
        .toLowerCase();

    return (
        status === "đang có dịch" ||
        status === "đang xảy ra dịch" ||
        status === "có dịch"
    );

}


// ======================================================
// TÍNH 5 KHOẢNG THIỆT HẠI
//
// - TỰ ĐỘNG THEO SHEET
// - KHÔNG ĐẶT CỨNG
// - MỨC ĐẦU LUÔN TỪ 1
// ======================================================

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

            return getLayerValue(row);

        })
        .filter(function(value){

            return value > 0;

        })
        .sort(function(a,b){

            return a - b;

        });


    if(values.length === 0){

        return [];

    }


    const unique =
        [...new Set(values)];


    // --------------------------------------
    // Chỉ có 1 giá trị
    // --------------------------------------

    if(unique.length === 1){

        return [{
            min: 1,
            max: unique[0]
        }];

    }


    // --------------------------------------
    // Tối đa 5 mức
    // --------------------------------------

    const levelCount =
        Math.min(
            5,
            unique.length
        );


    const ranges = [];


    /*
       Chia theo phân vị dữ liệu thực tế.

       Cách này tránh việc một vài xã có
       số lượng rất lớn làm các khoảng
       còn lại quá rộng.
    */

    for(
        let i = 0;
        i < levelCount;
        i++
    ){

        const startIndex =
            Math.floor(
                i *
                values.length /
                levelCount
            );

        const endIndex =
            Math.floor(
                (i + 1) *
                values.length /
                levelCount
            ) - 1;


        let min =
            values[
                Math.max(
                    0,
                    startIndex
                )
            ];


        let max =
            values[
                Math.max(
                    0,
                    endIndex
                )
            ];


        // Mức đầu tiên luôn bắt đầu từ 1

        if(i === 0){

            min = 1;

        }


        // Tránh trùng khoảng

        if(
            ranges.length > 0 &&
            min <= ranges[
                ranges.length - 1
            ].max
        ){

            min =
                ranges[
                    ranges.length - 1
                ].max + 1;

        }


        if(min <= max){

            ranges.push({

                min: min,
                max: max

            });

        }

    }


    // --------------------------------------
    // Nếu phân vị tạo khoảng chưa đủ
    // --------------------------------------

    if(
        ranges.length === 0
    ){

        return [{
            min: 1,
            max: values[values.length - 1]
        }];

    }


    // --------------------------------------
    // Bảo đảm giá trị lớn nhất nằm trong
    // khoảng cuối
    // --------------------------------------

    ranges[
        ranges.length - 1
    ].max =
        values[
            values.length - 1
        ];


    return ranges;

}


// ======================================================
// MÀU THIỆT HẠI
// ======================================================

function getDamageColor(value){

    if(value <= 0){

        return "#F1F3F5";

    }

    const config =
        MAP_CONFIG[currentLayer];

    const ranges =
        calculateDamageRanges();

    if(
        !ranges.length
    ){

        return config.colors[0];

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

            return config.colors[
                Math.min(
                    i,
                    config.colors.length - 1
                )
            ];

        }

    }


    return config.colors[
        config.colors.length - 1
    ];

}


// ======================================================
// KHOẢNG SỐ CƠ SỞ
// ======================================================

function calculateQuantityRanges(field){

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


    if(values.length === 0){

        return [];

    }


    const unique =
        [...new Set(values)];


    const levelCount =
        Math.min(
            5,
            unique.length
        );


    if(levelCount === 1){

        return [{
            min: 1,
            max: unique[0]
        }];

    }


    const ranges = [];


    for(
        let i = 0;
        i < levelCount;
        i++
    ){

        const start =
            Math.floor(
                i *
                values.length /
                levelCount
            );


        const end =
            Math.floor(
                (i + 1) *
                values.length /
                levelCount
            ) - 1;


        let min =
            values[
                Math.max(
                    0,
                    start
                )
            ];


        let max =
            values[
                Math.max(
                    0,
                    end
                )
            ];


        if(i === 0){

            min = 1;

        }


        if(
            ranges.length > 0 &&
            min <= ranges[
                ranges.length - 1
            ].max
        ){

            min =
                ranges[
                    ranges.length - 1
                ].max + 1;

        }


        if(min <= max){

            ranges.push({

                min: min,
                max: max

            });

        }

    }


    if(ranges.length){

        ranges[
            ranges.length - 1
        ].max =
            values[
                values.length - 1
            ];

    }


    return ranges;

}


// ======================================================
// MÀU SỐ CƠ SỞ
// ======================================================

function getQuantityColor(
    value,
    field,
    colors
){

    if(value <= 0){

        return "#F1F3F5";

    }

    const ranges =
        calculateQuantityRanges(
            field
        );


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


// ======================================================
// STYLE XÃ
// ======================================================

function getFeatureStyle(feature){

    const row =
        getFeatureRow(feature);


    // Không có dữ liệu
    if(
        !hasLayerData(row)
    ){

        return {

            fillColor: "#F4F6F8",

            color: "#B9C1C8",

            weight: 0.7,

            fillOpacity: 0.20

        };

    }


    // --------------------------------------
    // DỊCH BỆNH
    // --------------------------------------

    if(
        ["DTLCP","CGC","VDNC","DAI"]
        .includes(currentLayer)
    ){

        const value =
            getLayerValue(row);


        return {

            fillColor:
                getDamageColor(
                    value
                ),

            color:
                currentLayer === "DTLCP"
                    ? "#A00000"
                    : currentLayer === "CGC"
                        ? "#B85A00"
                        : currentLayer === "VDNC"
                            ? "#651078"
                            : "#075A91",

            weight: 1.4,

            fillOpacity: 0.88

        };

    }


    // --------------------------------------
    // PHUN
    // --------------------------------------

    if(
        currentLayer === "PHUN"
    ){

        const round =
            mapNumber(
                row["PHUN_Vòng"]
            );


        const colors = [
            "#D5F5F1",
            "#9FE0D7",
            "#5CC8BA",
            "#169C8D",
            "#00695C"
        ];


        const index =
            Math.min(
                Math.max(
                    round - 1,
                    0
                ),
                4
            );


        return {

            fillColor:
                colors[index],

            color:
                "#00695C",

            weight: 1.2,

            fillOpacity: 0.82

        };

    }


    // --------------------------------------
    // KSGM
    // --------------------------------------

    if(
        currentLayer === "KSGM"
    ){

        const value =
            mapNumber(
                row["KSGM_Cơ sở"]
            );


        return {

            fillColor:
                getQuantityColor(
                    value,
                    "KSGM_Cơ sở",
                    MAP_CONFIG.KSGM.colors
                ),

            color:
                "#4E342E",

            weight: 1.3,

            fillOpacity: 0.85

        };

    }


    // --------------------------------------
    // THUỐC THÚ Y
    // --------------------------------------

    if(
        currentLayer === "CSBBTTY"
    ){

        const value =
            mapNumber(
                row["CSBBTTY_Cơ sở"]
            );


        return {

            fillColor:
                getQuantityColor(
                    value,
                    "CSBBTTY_Cơ sở",
                    MAP_CONFIG.CSBBTTY.colors
                ),

            color:
                "#1B5E20",

            weight: 1.3,

            fillOpacity: 0.85

        };

    }


    return {

        fillColor: "#F4F6F8",

        color: "#B9C1C8",

        weight: 0.7,

        fillOpacity: 0.20

    };

}


// ======================================================
// LẤY TÂM XÃ
// ======================================================

function getFeatureCenter(feature){

    try{

        const layer =
            L.geoJSON(feature);

        const bounds =
            layer.getBounds();

        if(
            bounds.isValid()
        ){

            return bounds.getCenter();

        }

    }
    catch(error){

        console.warn(
            "Không lấy được tâm xã",
            error
        );

    }

    return null;

}


// ======================================================
// CHẤM ĐỎ XÃ ĐANG CÓ DỊCH
// ======================================================

function addDiseaseMarker(feature){

    if(
        !["DTLCP","CGC","VDNC","DAI"]
        .includes(currentLayer)
    ){

        return;

    }


    const row =
        getFeatureRow(feature);


    if(
        !row ||
        !isDiseaseActive(row)
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

            radius: 4,

            color: "#FFFFFF",

            weight: 2,

            fillColor: "#E00000",

            fillOpacity: 1,

            opacity: 1,

            interactive: false

        }
    ).addTo(
        diseaseMarkerLayer
    );

}


// ======================================================
// TÊN XÃ
// ======================================================

function buildLabels(){

    if(
        !map ||
        !geojsonData
    ){

        return;

    }


    if(!labelLayer){

        labelLayer =
            L.layerGroup().addTo(map);

    }


    labelLayer.clearLayers();


    const items = [];


    geojsonData.features.forEach(
        function(feature){

            const row =
                getFeatureRow(feature);


            // CHỈ HIỆN TÊN XÃ CÓ SỐ LIỆU

            if(
                !hasLayerData(row)
            ){

                return;

            }


            const name =
                getName(feature);


            const center =
                getFeatureCenter(feature);


            if(
                !name ||
                !center
            ){

                return;

            }


            items.push({

                name: name,

                center: center,

                value:
                    getLayerValue(row),

                active:
                    isDiseaseActive(row)

            });

        }
    );


    // Xã có thiệt hại lớn ưu tiên trước

    items.sort(
        function(a,b){

            return b.value - a.value;

        }
    );


    const occupied = [];


    const offsets = [

        [0,-18],

        [18,0],

        [-18,0],

        [0,18],

        [22,-15],

        [-22,-15],

        [22,15],

        [-22,15],

        [32,0],

        [-32,0],

        [0,-32],

        [0,32],

        [40,-20],

        [-40,-20],

        [40,20],

        [-40,20]

    ];


    items.forEach(
        function(item){

            const base =
                map.latLngToLayerPoint(
                    item.center
                );


            let selected = null;


            for(
                let i = 0;
                i < offsets.length;
                i++
            ){

                const point = {

                    x:
                        base.x +
                        offsets[i][0],

                    y:
                        base.y +
                        offsets[i][1]

                };


                const width =
                    Math.max(
                        32,
                        item.name.length * 5.1
                    );


                const box = {

                    left:
                        point.x -
                        width / 2,

                    right:
                        point.x +
                        width / 2,

                    top:
                        point.y - 7,

                    bottom:
                        point.y + 7

                };


                let overlap = false;


                for(
                    let j = 0;
                    j < occupied.length;
                    j++
                ){

                    const other =
                        occupied[j];


                    if(
                        !(
                            box.right + 4 <
                                other.left ||

                            box.left - 4 >
                                other.right ||

                            box.bottom + 4 <
                                other.top ||

                            box.top - 4 >
                                other.bottom
                        )
                    ){

                        overlap = true;

                        break;

                    }

                }


                if(!overlap){

                    selected = {

                        point: point,

                        box: box

                    };

                    break;

                }

            }


            if(!selected){

                return;

            }


            occupied.push(
                selected.box
            );


            const latlng =
                map.layerPointToLatLng(
                    selected.point
                );


            const className =
                item.active
                    ? "map-label map-label-active"
                    : "map-label";


            L.marker(
                latlng,
                {

                    icon:
                        L.divIcon({

                            className:
                                className,

                            html:
                                `<div>${item.name}</div>`,

                            iconSize:
                                [0,0],

                            iconAnchor:
                                [0,0]

                        }),

                    interactive:
                        false

                }
            ).addTo(
                labelLayer
            );

        }
    );

}


// ======================================================
// VẼ GEOJSON
// ======================================================

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

    }


    if(labelLayer){

        map.removeLayer(
            labelLayer
        );

    }


    if(diseaseMarkerLayer){

        map.removeLayer(
            diseaseMarkerLayer
        );

    }


    labelLayer =
        L.layerGroup().addTo(map);


    diseaseMarkerLayer =
        L.layerGroup().addTo(map);


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

                        // --------------------------------
                        // CLICK
                        // --------------------------------

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


                        // --------------------------------
                        // HOVER
                        // --------------------------------

                        layer.on(
                            "mouseover",
                            function(){

                                this.setStyle({

                                    weight: 2.2,

                                    color: "#1565C0",

                                    fillOpacity: 0.96

                                });

                                this.bringToFront();

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


                        // --------------------------------
                        // CHẤM ĐỎ
                        // --------------------------------

                        addDiseaseMarker(
                            feature
                        );

                    }

            }
        )
        .addTo(map);


    // --------------------------------
    // HIỆN TÊN
    // --------------------------------

    buildLabels();


    // --------------------------------
    // CHÚ GIẢI
    // --------------------------------

    updateLegend();

}


// ======================================================
// KHỞI TẠO BẢN ĐỒ
// ======================================================

async function initMap(){

    if(map){

        return map;

    }


    map =
        L.map(
            "map",
            {

                zoomControl: true,

                attributionControl: true

            }
        );


    // Nền bản đồ sáng, nhạt

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {

            attribution:
                "&copy; OpenStreetMap & CARTO",

            subdomains:
                "abcd",

            maxZoom: 20

        }
    ).addTo(map);


    // Nhãn địa danh nền ở độ trong suốt thấp

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        {

            subdomains:
                "abcd",

            maxZoom: 20,

            opacity: 0.35

        }
    ).addTo(map);


    map.setView(
        [21.38,103.02],
        9
    );


    map.on(
        "zoomend",
        function(){

            buildLabels();

        }
    );


    return map;

}


// ======================================================
// LOAD GEOJSON
// ======================================================

async function loadGeoJSON(){

    if(!map){

        await initMap();

    }


    try{

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
            !geojsonData.features
        ){

            throw new Error(
                "GeoJSON không có Feature."
            );

        }


        renderGeoJSON();


        // Fit bản đồ

        if(geojsonLayer){

            const bounds =
                geojsonLayer.getBounds();


            if(
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

        }


    }
    catch(error){

        console.error(
            "LOAD GEOJSON:",
            error
        );

    }

}


// ======================================================
// ĐỔI LỚP
// ======================================================

function setLayer(layerName){

    if(
        !MAP_CONFIG[layerName]
    ){

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


    renderGeoJSON();

}


// ======================================================
// TÌM XÃ
// ======================================================

function searchFeature(keyword){

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


    let found = null;


    for(
        const feature
        of geojsonData.features
    ){

        const name =
            getName(feature)
            .toLowerCase();


        if(
            name.includes(text)
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


    let targetLayer = null;


    geojsonLayer.eachLayer(
        function(layer){

            if(
                layer.feature ===
                found
            ){

                targetLayer =
                    layer;

            }

        }
    );


    if(targetLayer){

        map.fitBounds(
            targetLayer.getBounds(),
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


// ======================================================
// CHÚ GIẢI
// ======================================================

function updateLegend(){

    if(!map){

        return;

    }


    if(legendControl){

        map.removeControl(
            legendControl
        );

    }


    legendControl =
        L.control({
            position: "bottomright"
        });


    legendControl.onAdd =
        function(){

            const div =
                L.DomUtil.create(
                    "div",
                    "legend"
                );


            // =================================================
            // DỊCH BỆNH
            // =================================================

            if(
                [
                    "DTLCP",
                    "CGC",
                    "VDNC",
                    "DAI"
                ].includes(
                    currentLayer
                )
            ){

                const config =
                    MAP_CONFIG[
                        currentLayer
                    ];


                const ranges =
                    calculateDamageRanges();


                let html = `

                    <h4>
                        ${config.name}
                    </h4>

                    <div>
                        <i
                            style="
                                background:#E00000;
                                border:2px solid #fff;
                                border-radius:50%;
                            "
                        ></i>

                        Xã đang có dịch
                    </div>

                    <div>
                        <i
                            style="
                                background:#F4F6F8;
                                border:1px solid #AEB7BF;
                            "
                        ></i>

                        Xã không có dịch
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
                            Mức thiệt hại
                        </div>

                    `;


                    ranges.forEach(
                        function(
                            range,
                            index
                        ){

                            const color =
                                config.colors[
                                    Math.min(
                                        index,
                                        config.colors.length - 1
                                    )
                                ];


                            const label =
                                range.min === range.max

                                    ? `${mapFormatNumber(
                                        range.min
                                      )} con`

                                    : `${mapFormatNumber(
                                        range.min
                                      )} – ${mapFormatNumber(
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


            // =================================================
            // PHUN
            // =================================================

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
                            background:#D5F5F1;
                        "></i>
                        Vòng 1
                    </div>

                    <div>
                        <i style="
                            background:#9FE0D7;
                        "></i>
                        Vòng 2
                    </div>

                    <div>
                        <i style="
                            background:#5CC8BA;
                        "></i>
                        Vòng 3
                    </div>

                    <div>
                        <i style="
                            background:#169C8D;
                        "></i>
                        Vòng 4
                    </div>

                `;

            }


            // =================================================
            // KSGM
            // =================================================

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
                            margin-bottom:8px;
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
                            MAP_CONFIG.KSGM.colors[
                                Math.min(
                                    index,
                                    4
                                )
                            ];


                        const label =
                            range.min === range.max

                                ? `${mapFormatNumber(
                                    range.min
                                  )} cơ sở`

                                : `${mapFormatNumber(
                                    range.min
                                  )} – ${mapFormatNumber(
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


            // =================================================
            // THUỐC THÚ Y
            // =================================================

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
                            margin-bottom:8px;
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
                            MAP_CONFIG.CSBBTTY.colors[
                                Math.min(
                                    index,
                                    4
                                )
                            ];


                        const label =
                            range.min === range.max

                                ? `${mapFormatNumber(
                                    range.min
                                  )} cơ sở`

                                : `${mapFormatNumber(
                                    range.min
                                  )} – ${mapFormatNumber(
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


// ======================================================
// CÔNG CỤ TẢI BẢN ĐỒ
// ======================================================

function addMapTools(){

    if(!map){

        return;

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

                }).addTo(map);

        }
        catch(error){

            console.warn(
                "Không khởi tạo được công cụ tải bản đồ",
                error
            );

        }

    }

}


// ======================================================
// TẢI LẠI DỮ LIỆU
// ======================================================

async function reloadData(){

    try{

        await loadSheet();


        if(
            typeof dashboard !==
            "undefined" &&
            typeof dashboard.update ===
            "function"
        ){

            dashboard.update();

        }


        renderGeoJSON();


        if(
            typeof clearPanel ===
            "function"
        ){

            clearPanel();

        }

    }
    catch(error){

        console.error(
            "RELOAD DATA:",
            error
        );

    }

}


// ======================================================
// XUẤT BẢN ĐỒ
// ======================================================

function exportCurrentMap(){

    if(
        !printer ||
        typeof printer.printMap !==
        "function"
    ){

        return;

    }


    const today =
        new Date();


    const filename =
        "WEBGIS_" +
        currentLayer +
        "_" +
        today.getFullYear() +
        "-" +
        String(
            today.getMonth() + 1
        ).padStart(2,"0") +
        "-" +
        String(
            today.getDate()
        ).padStart(2,"0");


    printer.printMap(
        "CurrentSize",
        filename
    );

}


// ======================================================
// KẾT THÚC MAP.JS
// ======================================================
