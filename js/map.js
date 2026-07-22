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
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
        attribution: "&copy; OpenStreetMap & CARTO",
        subdomains: "abcd",
        maxZoom: 20
    }
).addTo(map);

window.printer = L.easyPrint({
    hidden: true,
    exportOnly: true,
    sizeModes: ["Current"]
}).addTo(map);
//===============================
// BIẾN TOÀN CỤC
//===============================

let geojsonLayer = null;
let labelLayer = null;
let legendControl = null;
let selectedFeature = null;

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

        title:"Dịch tả lợn Châu Phi",

        unit:"con",

        color:[
            "#F5F5F5",
            "#FFE082",
            "#FFB74D",
            "#FB8C00",
            "#E53935"
        ],

        breaks:[
            0,
            10,
            100,
            500
        ]

    },

    CGC:{

        field:"CGC_Chết",

        title:"Cúm gia cầm",

        unit:"con",

        color:[
            "#F5F5F5",
            "#C8E6C9",
            "#81C784",
            "#43A047",
            "#1B5E20"
        ],

        breaks:[
            0,
            100,
            1000,
            5000
        ]

    },

    VDNC:{

        field:"VDNC_Mắc",

        title:"Viêm da nổi cục",

        unit:"con",

        color:[
            "#F5F5F5",
            "#BBDEFB",
            "#64B5F6",
            "#1E88E5",
            "#0D47A1"
        ],

        breaks:[
            0,
            5,
            20,
            50
        ]

    },

    DAI:{

        field:"DAI_Chết",

        title:"Bệnh Dại",

        unit:"con",

        color:[
            "#F5F5F5",
            "#F8BBD0",
            "#F06292",
            "#EC407A",
            "#C2185B"
        ],

        breaks:[
            0,
            1,
            3,
            5
        ]

    },

    PHUN:{

        field:"PHUN_Số hộ",

        title:"Phun khử trùng",

        unit:"hộ",

        color:[
            "#F5F5F5",
            "#FFF59D",
            "#FFD54F",
            "#FFCA28",
            "#F57F17"
        ],

        breaks:[
            0,
            100,
            500,
            1000
        ]

    },

    KSGM:{

        field:"KSGM_Cơ sở",

        title:"Kiểm soát giết mổ",

        unit:"cơ sở",

        color:[
            "#ECEFF1",
            "#607D8B"
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
            "#0288D1"
        ]

    }

};
function updateBreaks() {

    const cfg = layerConfig[currentLayer];

    // Chỉ áp dụng cho các lớp có breaks
    if (!cfg.breaks) return;

    const values = [];

    getRows().forEach(row => {

        const value = Number(row[cfg.field] || 0);

        if (value > 0) {
            values.push(value);
        }

    });

    if (values.length === 0) {

        cfg.breaks = [0, 1, 2, 3];
        return;

    }

    const max = Math.max(...values);

    let step = Math.ceil(max / 4);

    // Làm tròn khoảng
    if (step >= 1000) {
        step = Math.ceil(step / 100) * 100;
    } else if (step >= 100) {
        step = Math.ceil(step / 10) * 10;
    }

    cfg.breaks = [
        0,
        step,
        step * 2,
        step * 3
    ];

    console.log(cfg.title, cfg.breaks);

}
//===============================
// LẤY GIÁ TRỊ THEO LỚP
//===============================

function getValue(row){

    if(!row) return 0;

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

    if(currentLayer==="CSBBTTY"){

        if(value===0) return cfg.color[0];
        if(value===1) return cfg.color[1];
        if(value<=3) return cfg.color[2];

        return cfg.color[3];

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

    return{

        color:"#1976D2",

        weight:1.2,

        opacity:1,

        fillColor:getColor(
            getValue(row)
        ),

        fillOpacity:0.75

    };

}

//======================================================
// POPUP
//======================================================

function popupContent(feature){

    const row=getRow(feature);

    if(!row){

        return `
            <b>${row["Tên xã"] || getName(feature)}</b>
            <hr>
            Không có dữ liệu
        `;

    }

    let html=`
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

        weight:3,

        color:"#FF5722",

        fillOpacity:0.9

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

function drawLabels(){

    clearLabels();

    labelLayer=L.layerGroup();

    geojsonLayer.eachLayer(function(layer){

        const row = getRow(layer.feature);

// Chỉ hiển thị tên xã khi có giá trị ở lớp đang xem
if (getValue(row) > 0) {

    const center = layer.getBounds().getCenter();

    const name = row["Tên xã"] || getName(layer.feature);

    const label = L.marker(center, {
        interactive: false,
        icon: L.divIcon({
            className: "map-label",
            html: `<div>${name}</div>`,
            iconSize: [120, 20]
        })
    });

    labelLayer.addLayer(label);

}

    });

    labelLayer.addTo(map);

}//======================================================
// CẬP NHẬT CHÚ GIẢI
//======================================================

function updateLegend(){

    if(legendControl){

        map.removeControl(legendControl);

    }

    legendControl=L.control({
        position:"bottomright"
    });

    legendControl.onAdd=function(){

        const div=L.DomUtil.create("div","legend");

        const cfg=layerConfig[currentLayer];

        // KSGM
        if(currentLayer==="KSGM"){

            div.innerHTML=`
                <h4>${cfg.title}</h4>

                <div>
                    <i style="background:${cfg.color[0]}"></i>
                    Không có
                </div>

                <div>
                    <i style="background:${cfg.color[1]}"></i>
                    Có cơ sở
                </div>
            `;

            return div;

        }

        // CSBBTTY
        if(currentLayer==="CSBBTTY"){

            div.innerHTML=`
                <h4>${cfg.title}</h4>

                <div><i style="background:${cfg.color[0]}"></i>0</div>
                <div><i style="background:${cfg.color[1]}"></i>1</div>
                <div><i style="background:${cfg.color[2]}"></i>2 - 3</div>
                <div><i style="background:${cfg.color[3]}"></i>>3</div>
            `;

            return div;

        }

        const b=cfg.breaks;

        div.innerHTML=`
            <h4>${cfg.title}</h4>

            <div><i style="background:${cfg.color[0]}"></i>0</div>
            <div><i style="background:${cfg.color[1]}"></i>1 - ${b[1]}</div>
            <div><i style="background:${cfg.color[2]}"></i>${b[1]+1} - ${b[2]}</div>
            <div><i style="background:${cfg.color[3]}"></i>${b[2]+1} - ${b[3]}</div>
            <div><i style="background:${cfg.color[4]}"></i>>${b[3]}</div>
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

    drawLabels();

    updateLegend();

    updateDashboard();

    if(selectedFeature){

        showPanel(selectedFeature);

    }

}//======================================================
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

    function(){

        initMap();

    }

);
