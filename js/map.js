// ======================================================
// MAP.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT ĐIỆN BIÊN
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
// CẤU HÌNH
// ======================================================

const MAP_CONFIG = {

    DTLCP: {
        name: "Dịch tả lợn Châu Phi",
        valueField: "DTLCP_Chết",
        statusField: "DTLCP_Trạng thái",
        outbreakField: "DTLCP_Ổ dịch",
        unit: "con",

        colors: [
            "#FEE2E2",
            "#FCA5A5",
            "#F87171",
            "#DC2626",
            "#991B1B"
        ],

        border: "#991B1B"
    },

    CGC: {
        name: "Cúm gia cầm",
        valueField: "CGC_Chết",
        statusField: "CGC_Trạng thái",
        outbreakField: "CGC_Ổ dịch",
        unit: "con",

        colors: [
            "#FFF3E0",
            "#FFD180",
            "#FFB74D",
            "#F57C00",
            "#B45309"
        ],

        border: "#B45309"
    },

    VDNC: {
        name: "Viêm da nổi cục",
        valueField: "VDNC_Mắc",
        statusField: "VDNC_Trạng thái",
        outbreakField: "VDNC_Ổ dịch",
        unit: "con",

        colors: [
            "#F3E8FF",
            "#D8B4FE",
            "#C084FC",
            "#9333EA",
            "#6B21A8"
        ],

        border: "#6B21A8"
    },

    DAI: {
        name: "Bệnh Dại",
        valueField: "DAI_Chết",
        statusField: "DAI_Trạng thái",
        outbreakField: "DAI_Ổ dịch",
        unit: "con",

        colors: [
            "#E0F2FE",
            "#BAE6FD",
            "#7DD3FC",
            "#0284C7",
            "#075985"
        ],

        border: "#075985"
    },

    PHUN: {
        name: "Phun khử trùng",
        valueField: "PHUN_Số hộ",
        roundField: "PHUN_Vòng",

        colors: [
            "#E0F2F1",
            "#B2DFDB",
            "#4DB6AC",
            "#00897B",
            "#00695C"
        ],

        border: "#00695C"
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
        ],

        border: "#4E342E"
    },

    CSBBTTY: {
        name: "Cơ sở buôn bán thuốc thú y",
        valueField: "CSBBTTY_Cơ sở",

        colors: [
            "#E8F5E9",
            "#A5D6A7",
            "#66BB6A",
            "#2E7D32",
            "#14532D"
        ],

        border: "#166534"
    }

};


// ======================================================
// MÀU XÃ KHÔNG CÓ DỮ LIỆU
// ======================================================

const NO_DATA_STYLE = {

    fillColor: "#DDE5EA",
    color: "#8A99A5",
    weight: 0.9,
    opacity: 1,
    fillOpacity: 0.55

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
            str =
                parts[0] +
                "." +
                parts[1];
        }
        else{
            str =
                str.replace(/,/g, "");
        }
    }

    const result = Number(str);

    return Number.isFinite(result)
        ? result
        : 0;
}


// ======================================================
// FORMAT SỐ
// ======================================================

function mapFormatNumber(value){

    const n = Number(value);

    if(!Number.isFinite(n)){
        return "0";
    }

    return n.toLocaleString("vi-VN");
}


// ======================================================
// LẤY DỮ LIỆU SHEET
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
// LẤY ROW THEO ID
// ======================================================

function getFeatureRow(feature){

    if(
        !feature ||
        !feature.properties
    ){
        return null;
    }

    const id =
        Number(feature.properties.ID);

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

    if(
        feature &&
        feature.properties
    ){

        const p =
            feature.properties;

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
// LẤY GIÁ TRỊ THEO LỚP
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
// KIỂM TRA XÃ CÓ DỮ LIỆU
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


    // ----------------------------------------------
    // DỊCH BỆNH
    // ----------------------------------------------

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


    // ----------------------------------------------
    // PHUN
    // ----------------------------------------------

    if(
        currentLayer === "PHUN"
    ){

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


    // ----------------------------------------------
    // KSGM
    // ----------------------------------------------

    if(
        currentLayer === "KSGM"
    ){

        return (
            mapNumber(
                row["KSGM_Cơ sở"]
            ) > 0
        );
    }


    // ----------------------------------------------
    // THUỐC THÚ Y
    // ----------------------------------------------

    if(
        currentLayer === "CSBBTTY"
    ){

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
// TẠO KHOẢNG TỰ ĐỘNG
//
// 5 mức tối đa
// Không đặt cứng
// Mức đầu từ 1
// ======================================================

function calculateRanges(field){

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


    if(
        unique.length === 1
    ){

        return [{
            min: 1,
            max: unique[0]
        }];
    }


    const levelCount =
        Math.min(
            5,
            unique.length
        );


    /*
       Chia theo quantile.
       Mục đích là phân bố màu tương đối
       đều theo số lượng xã có dữ liệu.
    */

    const ranges = [];


    for(
        let i = 0;
        i < levelCount;
        i++
    ){

        let startIndex =
            Math.floor(
                i *
                values.length /
                levelCount
            );

        let endIndex =
            Math.floor(
                (i + 1) *
                values.length /
                levelCount
            ) - 1;


        startIndex =
            Math.max(
                0,
                Math.min(
                    startIndex,
                    values.length - 1
                )
            );


        endIndex =
            Math.max(
                startIndex,
                Math.min(
                    endIndex,
                    values.length - 1
                )
            );


        let min =
            values[startIndex];

        let max =
            values[endIndex];


        if(i === 0){
            min = 1;
        }


        if(
            ranges.length &&
            min <=
            ranges[
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


    if(
        ranges.length
    ){

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
// LẤY MÀU THEO GIÁ TRỊ
// ======================================================

function getRangeColor(
    value,
    ranges,
    colors
){

    if(value <= 0){
        return NO_DATA_STYLE.fillColor;
    }


    if(
        !ranges ||
        !ranges.length
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


// ======================================================
// STYLE DỊCH BỆNH
// ======================================================

function getDiseaseStyle(row){

    const config =
        MAP_CONFIG[currentLayer];

    const value =
        getLayerValue(row);

    const ranges =
        calculateRanges(
            config.valueField
        );


    if(value <= 0){

        return {
            fillColor:
                NO_DATA_STYLE.fillColor,

            color:
                "#8A99A5",

            weight:
                0.9,

            opacity:
                1,

            fillOpacity:
                0.55
        };
    }


    return {

        fillColor:
            getRangeColor(
                value,
                ranges,
                config.colors
            ),

        color:
            config.border,

        weight:
            1.5,

        opacity:
            1,

        fillOpacity:
            0.90
    };
}


// ======================================================
// STYLE KSGM / THUỐC
// ======================================================

function getQuantityStyle(
    row,
    field,
    config
){

    const value =
        mapNumber(
            row[field]
        );


    if(value <= 0){

        return {
            fillColor:
                NO_DATA_STYLE.fillColor,

            color:
                "#8A99A5",

            weight:
                0.9,

            opacity:
                1,

            fillOpacity:
                0.55
        };
    }


    const ranges =
        calculateRanges(field);


    return {

        fillColor:
            getRangeColor(
                value,
                ranges,
                config.colors
            ),

        color:
            config.border,

        weight:
            1.4,

        opacity:
            1,

        fillOpacity:
            0.88
    };
}


// ======================================================
// STYLE PHUN
// ======================================================

function getPhunStyle(row){

    const round =
        mapNumber(
            row["PHUN_Vòng"]
        );


    if(round <= 0){

        return {
            fillColor:
                NO_DATA_STYLE.fillColor,

            color:
                "#8A99A5",

            weight:
                0.9,

            fillOpacity:
                0.55
        };
    }


    const colors = [
        "#D9F2EE",
        "#A7DED5",
        "#5FC2B4",
        "#169C8D",
        "#00695C"
    ];


    const index =
        Math.min(
            round - 1,
            colors.length - 1
        );


    return {

        fillColor:
            colors[index],

        color:
            "#00695C",

        weight:
            1.3,

        fillOpacity:
            0.85
    };
}


// ======================================================
// STYLE CHUNG
// ======================================================

function getFeatureStyle(feature){

    const row =
        getFeatureRow(feature);


    if(
        !hasLayerData(row)
    ){

        return NO_DATA_STYLE;
    }


    if(
        ["DTLCP","CGC","VDNC","DAI"]
        .includes(currentLayer)
    ){

        return getDiseaseStyle(row);
    }


    if(
        currentLayer === "PHUN"
    ){

        return getPhunStyle(row);
    }


    if(
        currentLayer === "KSGM"
    ){

        return getQuantityStyle(
            row,
            "KSGM_Cơ sở",
            MAP_CONFIG.KSGM
        );
    }


    if(
        currentLayer === "CSBBTTY"
    ){

        return getQuantityStyle(
            row,
            "CSBBTTY_Cơ sở",
            MAP_CONFIG.CSBBTTY
        );
    }


    return NO_DATA_STYLE;
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
            "Không xác định được tâm xã",
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
        ![
            "DTLCP",
            "CGC",
            "VDNC",
            "DAI"
        ].includes(currentLayer)
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

            radius: 4.5,

            color: "#FFFFFF",

            weight: 2,

            fillColor: "#D60000",

            fillOpacity: 1,

            opacity: 1,

            interactive: false
        }
    ).addTo(
        diseaseMarkerLayer
    );
}


// ======================================================
// NHÃN XÃ
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


            // CHỈ HIỆN XÃ CÓ SỐ LIỆU

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


    // Ưu tiên xã có số liệu lớn

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

        [20,-14],

        [-20,-14],

        [20,14],

        [-20,14],

        [32,0],

        [-32,0],

        [0,-30],

        [0,30],

        [38,-20],

        [-38,-20],

        [38,20],

        [-38,20],

        [50,0],

        [-50,0]
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
                        item.name.length * 5
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


                let collision = false;


                for(
                    let j = 0;
                    j < occupied.length;
                    j++
                ){

                    const other =
                        occupied[j];


                    if(
                        !(
                            box.right + 5 <
                                other.left ||

                            box.left - 5 >
                                other.right ||

                            box.bottom + 5 <
                                other.top ||

                            box.top - 5 >
                                other.bottom
                        )
                    ){

                        collision = true;

                        break;
                    }
                }


                if(!collision){

                    selected = {
                        point: point,
                        box: box
                    };

                    break;
                }
            }


            // Nếu không còn vị trí:
            // bỏ nhãn thay vì để dính vào nhãn khác

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
// RENDER BẢN ĐỒ
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

                        // ------------------------------
                        // CLICK
                        // ------------------------------

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


                        // ------------------------------
                        // HOVER
                        // ------------------------------

                        layer.on(
                            "mouseover",
                            function(){

                                this.setStyle({

                                    weight:
                                        2.4,

                                    color:
                                        "#1565C0",

                                    fillOpacity:
                                        0.96
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


                        // ------------------------------
                        // CHẤM ĐỎ
                        // ------------------------------

                        addDiseaseMarker(
                            feature
                        );
                    }
            }
        )
        .addTo(map);


    buildLabels();

    updateLegend();
}


// ======================================================
// KHỞI TẠO MAP
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


    // ==================================================
    // NỀN BẢN ĐỒ
    // ==================================================

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


    // ==================================================
    // NHÃN ĐỊA DANH NỀN
    // ==================================================

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        {

            subdomains:
                "abcd",

            maxZoom: 20,

            opacity: 0.30
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
            !geojsonData ||
            !geojsonData.features
        ){

            throw new Error(
                "GeoJSON không hợp lệ."
            );
        }


        renderGeoJSON();


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


    if(geojsonLayer){

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
    }


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
                    calculateRanges(
                        config.valueField
                    );


                let html = `

                    <h4>
                        ${config.name}
                    </h4>

                    <div>
                        <i
                            class="legend-active-dot"
                        ></i>
                        Xã đang có dịch
                    </div>

                    <div>
                        <i
                            class="legend-no-data"
                        ></i>
                        Xã không có dịch
                    </div>

                `;


                if(
                    ranges.length
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
                                        4
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
                            background:#D9F2EE;
                        "></i>
                        Vòng 1
                    </div>

                    <div>
                        <i style="
                            background:#A7DED5;
                        "></i>
                        Vòng 2
                    </div>

                    <div>
                        <i style="
                            background:#5FC2B4;
                        "></i>
                        Vòng 3
                    </div>

                    <div>
                        <i style="
                            background:#169C8D;
                        "></i>
                        Vòng 4
                    </div>

                    <div>
                        <i style="
                            background:#00695C;
                        "></i>
                        Vòng 5 trở lên
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
                    calculateRanges(
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
                            MAP_CONFIG.KSGM.colors[
                                Math.min(
                                    index,
                                    4
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
                    calculateRanges(
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
                            MAP_CONFIG.CSBBTTY.colors[
                                Math.min(
                                    index,
                                    4
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
// CÔNG CỤ BẢN ĐỒ
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
                "EasyPrint:",
                error
            );
        }
    }
}


// ======================================================
// TẢI LẠI
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


    const d =
        new Date();


    const filename =
        "WEBGIS_" +
        currentLayer +
        "_" +
        d.getFullYear() +
        "-" +
        String(
            d.getMonth() + 1
        ).padStart(2,"0") +
        "-" +
        String(
            d.getDate()
        ).padStart(2,"0");


    printer.printMap(
        "CurrentSize",
        filename
    );
}


// ======================================================
// KẾT THÚC MAP.JS
// ======================================================
