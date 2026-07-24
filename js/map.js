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
            10,
            100,
            500
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
            100,
            1000,
            5000
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
            5,
            20,
            50
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

        // Chỉ hiển thị tên xã khi có giá trị ở lớp đang xem
        if(getValue(row) > 0){

            const center = layer.getBounds().getCenter();
            let lat = center.lat;
            let lng = center.lng;
            L.circleMarker([lat, lng],{


const name = row["Tên xã"] || getName(layer.feature);


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

                <div><i style="background:${cfg.color[0]}"></i>Chưa triển khai</div>
                <div><i style="background:${cfg.color[1]}"></i>Đã triển khai</div>

                <hr>

                <div><b>Số màu đỏ trên tên xã:</b> Số cơ sở giết mổ</div>
            `;

            return div;

        }
        // PHUN
if(currentLayer==="PHUN"){

    div.innerHTML=`
        <h4>${cfg.title}</h4>

        <div><i style="background:${cfg.color[0]}"></i>Chưa triển khai</div>
        <div><i style="background:${cfg.color[1]}"></i>Vòng 1</div>
        <div><i style="background:${cfg.color[2]}"></i>Vòng 2</div>
        <div><i style="background:${cfg.color[3]}"></i>Vòng 3</div>
        <div><i style="background:${cfg.color[4]}"></i>Vòng 4</div>
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

        const b = cfg.breaks;

div.innerHTML = `
    <h4>${cfg.title}</h4>

    <div><i style="background:${cfg.color[0]}"></i>0</div>
    <div><i style="background:${cfg.color[1]}"></i>1 - ${b[1]}</div>
    <div><i style="background:${cfg.color[2]}"></i>${b[1]+1} - ${b[2]}</div>
    <div><i style="background:${cfg.color[3]}"></i>${b[2]+1} - ${b[3]}</div>
    <div><i style="background:${cfg.color[4]}"></i>>${b[3]}</div>

    ${
        currentLayer === "DTLCP"
        ? `
        <hr>
        <div>
            <span style="
                display:inline-block;
                width:10px;
                height:10px;
                border-radius:50%;
                background:#ff0000;
                border:1.5px solid #fff;
                margin-right:6px;
                vertical-align:middle;
            "></span>
            Xã đang xảy ra dịch
        </div>
        `
        : ""
    }
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

    drawOutbreakPoints();

    updateLegend();

    updateDashboard();

    if(selectedFeature){
        showPanel(selectedFeature);
    }

}  

   function drawOutbreakPoints(){

    // Xóa lớp cũ
    if(outbreakLayer){
        map.removeLayer(outbreakLayer);
    }

    // Chỉ hiển thị ở lớp DTLCP
    if(currentLayer !== "DTLCP") return;

    outbreakLayer = L.layerGroup();

    geojsonLayer.eachLayer(function(layer){

        const row = getRow(layer.feature);

        if(!row) return;

        if(row["DTLCP_Trạng thái"] !== "Đang có dịch") return;

        const center = layer.getBounds().getCenter();

        L.circleMarker(center,{
            radius:4,
            color:"#ffffff",
            weight:1.2,
            fillColor:"#ff0000",
            fillOpacity:1
        })
        .bindTooltip(row["Tên xã"],{
            direction:"top",
            offset:[0,-8],
            sticky:true
        })
        .addTo(outbreakLayer);

    });

    outbreakLayer.addTo(map);

    // Luôn nổi trên bản đồ
    outbreakLayer.bringToFront();
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

        drawLabels();

drawOutbreakPoints();

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
