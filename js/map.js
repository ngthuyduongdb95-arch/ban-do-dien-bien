//==================================================
// WEBGIS ĐIỆN BIÊN
// map.js
//==================================================

console.log("WEBGIS DIEN BIEN 2026");

//================= KHỞI TẠO =================

const map = L.map("map", {
    zoomControl: true
}).setView([21.386,103.023],9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:"© OpenStreetMap",
        maxZoom:19
    }
).addTo(map);

//================= BIẾN TOÀN CỤC =================

let geojson = null;
let labelLayer = L.layerGroup().addTo(map);

let currentLayer = "DTLCP";

// dữ liệu Google Sheets
let gisData = {};

//================= LẤY GIÁ TRỊ =================

function getValue(data){

    if(!data) return 0;

    switch(currentLayer){

        case "DTLCP":
            return Number(data["DTLCP_Chết"]||0);

        case "CGC":
            return Number(data["CGC_Chết"]||0);

        case "VDNC":
            return Number(data["VDNC_Mắc"]||0);

        case "DAI":
            return Number(data["DAI_Chết"]||0);

        case "PHUN":
            return Number(data["PHUN_Số hộ"]||0);

        case "KSGM":
            return Number(data["KSGM_Cơ sở"]||0);

        case "CSBBTTY":
            return Number(data["CSBBTTY_Cơ sở"]||0);

        default:
            return 0;

    }

}

//================= MÀU =================

function getColor(value){

    switch(currentLayer){

        case "DTLCP":

            if(value===0) return "#D9D9D9";
            if(value<=50) return "#4CAF50";
            if(value<=200) return "#FFD54F";
            if(value<=2000) return "#FB8C00";
            return "#E53935";


        case "CGC":

            if(value===0) return "#D9D9D9";
            if(value<=500) return "#4CAF50";
            if(value<=2000) return "#FFD54F";
            if(value<=5000) return "#FB8C00";
            return "#E53935";


        case "VDNC":

            if(value===0) return "#D9D9D9";
            if(value<=10) return "#4CAF50";
            if(value<=20) return "#FFD54F";
            if(value<=40) return "#FB8C00";
            return "#E53935";


        case "DAI":

            if(value===0) return "#D9D9D9";
            if(value<=1) return "#4CAF50";
            if(value<=3) return "#FFD54F";
            if(value<=5) return "#FB8C00";
            return "#E53935";


        case "PHUN":

            if(value===0) return "#EEEEEE";
            if(value<=20) return "#B2DFDB";
            if(value<=50) return "#4DB6AC";
            if(value<=100) return "#009688";
            return "#00695C";


        case "KSGM":

            if(value===0) return "#EEEEEE";
            return "#5E35B1";


        case "CSBBTTY":

            if(value===0) return "#EEEEEE";
            if(value===1) return "#81C784";
            if(value<=3) return "#43A047";
            return "#1B5E20";


        default:

            return "#D9D9D9";

    }

}

//================= STYLE =================

function style(feature){

    const id = feature.properties.ID;

    const d = gisData[id];

    const value = getValue(d);

    return{

        color:"#1976D2",
        weight:1.2,
        opacity:1,

        fillColor:getColor(value),

        fillOpacity:0.75

    };

}
//==================================================
// HOVER
//==================================================

function highlightFeature(e){

    const layer = e.target;

    layer.setStyle({

        weight:3,
        color:"#ff0000",
        fillOpacity:0.9

    });

    layer.bringToFront();

}

function resetHighlight(e){

    if(geojson){

        geojson.resetStyle(e.target);

    }

}

//==================================================
// PANEL THÔNG TIN
//==================================================

function showInfo(feature){

    const id = feature.properties.ID;

    const tenXa =
        feature.properties.TenXa ||
        feature.properties["Tên xã"] ||
        feature.properties.NAME ||
        "Không xác định";

    const d = gisData[id];

    const panel = document.getElementById("info-panel");

    if(!panel) return;

    if(!d){

        panel.innerHTML=`
            <h2>${tenXa}</h2>
            <hr>
            <p style="color:red">
                Không có dữ liệu
            </p>
        `;

        return;

    }

    panel.innerHTML=`

<h2>${tenXa}</h2>

<hr>

<div class="info-section">

<h4>🐷 DỊCH TẢ LỢN CHÂU PHI</h4>

<p><b>Trạng thái:</b> ${d["DTLCP_Trạng thái"]||"--"}</p>

<p><b>Số ổ dịch:</b> ${d["DTLCP_Ổ dịch"]||0}</p>

<p><b>Tiêu hủy:</b> ${d["DTLCP_Chết"]||0} con</p>

<p><b>Trọng lượng:</b> ${d["DTLCP_Trọng lượng"]||0} kg</p>

<p><b>Ngày cuối:</b> ${d["DTLCP_Ngày cuối"]||"--"}</p>

</div>

<div class="info-section">

<h4>🐔 CÚM GIA CẦM</h4>

<p><b>Trạng thái:</b> ${d["CGC_Trạng thái"]||"--"}</p>

<p><b>Số ổ dịch:</b> ${d["CGC_Ổ dịch"]||0}</p>

<p><b>Tiêu hủy:</b> ${d["CGC_Chết"]||0} con</p>

<p><b>Trọng lượng:</b> ${d["CGC_Trọng lượng"]||0} kg</p>

<p><b>Ngày cuối:</b> ${d["CGC_Ngày cuối"]||"--"}</p>

</div>

<div class="info-section">

<h4>🐄 VIÊM DA NỔI CỤC</h4>

<p><b>Trạng thái:</b> ${d["VDNC_Trạng thái"]||"--"}</p>

<p><b>Số ổ dịch:</b> ${d["VDNC_Ổ dịch"]||0}</p>

<p><b>Mắc:</b> ${d["VDNC_Mắc"]||0} con</p>

<p><b>Chết:</b> ${d["VDNC_Chết"]||0} con</p>

<p><b>Ngày cuối:</b> ${d["VDNC_Ngày cuối"]||"--"}</p>

</div>

<div class="info-section">

<h4>🐕 BỆNH DẠI</h4>

<p><b>Trạng thái:</b> ${d["DAI_Trạng thái"]||"--"}</p>

<p><b>Số ổ dịch:</b> ${d["DAI_Ổ dịch"]||0}</p>

<p><b>Chết:</b> ${d["DAI_Chết"]||0} con</p>

<p><b>Ngày cuối:</b> ${d["DAI_Ngày cuối"]||"--"}</p>

</div>

<div class="info-section">

<h4>🧴 PHUN KHỬ TRÙNG</h4>

<p><b>Tiến độ:</b> ${d["PHUN_Tiến độ"]||"--"}</p>

<p><b>Số hộ:</b> ${d["PHUN_Số hộ"]||0}</p>

<p><b>Diện tích:</b> ${d["PHUN_Diện tích"]||0}</p>

</div>

<div class="info-section">

<h4>🏭 KIỂM SOÁT GIẾT MỔ</h4>

<p><b>Số cơ sở:</b> ${d["KSGM_Cơ sở"]||0}</p>

</div>

<div class="info-section">

<h4>💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y</h4>

<p><b>Số cơ sở:</b> ${d["CSBBTTY_Cơ sở"]||0}</p>

</div>

`;

}

//==================================================
// CLICK
//==================================================

function zoomToFeature(e){

    map.fitBounds(e.target.getBounds());

    showInfo(e.target.feature);

}

//==================================================
// GẮN SỰ KIỆN
//==================================================

function onEachFeature(feature,layer){

    layer.on({

        mouseover:highlightFeature,

        mouseout:resetHighlight,

        click:zoomToFeature

    });

}
//==================================================
// ĐỌC DỮ LIỆU GOOGLE SHEETS
//==================================================

async function loadMap(){

    // lấy dữ liệu từ Apps Script
    await loadGISData();

    // đọc GeoJSON
    const response = await fetch("data/dienbien_xa.geojson");

    const data = await response.json();

    // tạo layer
    geojson = L.geoJSON(data,{

        style:style,

        onEachFeature:onEachFeature

    }).addTo(map);

    // cập nhật chú giải
    updateLegend();

    // vẽ tên xã
    drawLabels();

}

//==================================================
// KHỞI ĐỘNG
//==================================================

loadMap();


//==================================================
// ĐỔI LỚP DỮ LIỆU
//==================================================

const layerSelect=document.getElementById("layerSelect");

if(layerSelect){

    layerSelect.addEventListener("change",function(){

        currentLayer=this.value;

        // đổi màu
        geojson.setStyle(style);

        // đổi chú giải
        updateLegend();

        // đổi tên xã
        drawLabels();

    });

}


//==================================================
// REFRESH DỮ LIỆU
//==================================================

async function refreshData(){

    await loadGISData();

    geojson.setStyle(style);

    updateLegend();

    drawLabels();

}


//==================================================
// TỰ REFRESH SAU 5 PHÚT
//==================================================

setInterval(function(){

    refreshData();

},300000);


//==================================================
// REDRAW LABEL KHI ZOOM
//==================================================

map.on("zoomend",function(){

    drawLabels();

});


//==================================================
// REDRAW LABEL KHI KÉO BẢN ĐỒ
//==================================================

map.on("moveend",function(){

    drawLabels();

});


//==================================================
// CLICK RA NGOÀI THÌ RESET PANEL
//==================================================

map.on("click",function(e){

    if(e.originalEvent.target.id==="map"){

        // có thể bổ sung reset panel nếu muốn

    }

});
//==================================================
// HIỂN THỊ TÊN XÃ
//==================================================

function drawLabels(){

    if(!geojson) return;

    labelLayer.clearLayers();

    const zoom = map.getZoom();

    geojson.eachLayer(function(layer){

        const feature = layer.feature;

        if(!feature) return;

        const id = feature.properties.ID;

        const d = gisData[id];

        const value = getValue(d);

        // Zoom nhỏ chỉ hiện xã có dữ liệu
        if(zoom < 10 && value === 0){

            return;

        }

        const center = layer.getBounds().getCenter();

        const name =
            feature.properties.TenXa ||
            feature.properties["Tên xã"] ||
            feature.properties.NAME ||
            "";

        let color = "#666";
        let fontSize = 11;
        let fontWeight = "normal";

        if(value > 0){

            color = "#d32f2f";
            fontWeight = "bold";

        }

        if(zoom >= 11){

            fontSize = 12;

        }

        if(zoom >= 12){

            fontSize = 13;

        }

        if(zoom >= 13){

            fontSize = 14;

        }

        const icon = L.divIcon({

            className:"",

            iconSize:null,

            html:`

<div class="map-label"

style="

color:${color};

font-size:${fontSize}px;

font-weight:${fontWeight};

text-shadow:
1px 1px 2px white,
-1px -1px 2px white,
1px -1px 2px white,
-1px 1px 2px white;

white-space:nowrap;

pointer-events:none;

">

${name}

</div>

`

        });

        L.marker(center,{

            icon:icon,

            interactive:false,

            keyboard:false

        }).addTo(labelLayer);

    });

}//==================================================
// LEGEND
//==================================================

const legend = L.control({
    position:"bottomright"
});

legend.onAdd = function(){

    this._div = L.DomUtil.create("div","legend");

    updateLegend();

    return this._div;

};

legend.addTo(map);


//==================================================
// CẬP NHẬT CHÚ GIẢI
//==================================================

function updateLegend(){

    if(!legend._div) return;

    let title="";
    let grades=[];
    let colors=[];

    switch(currentLayer){

        case "DTLCP":

            title="🐷 DỊCH TẢ LỢN CHÂU PHI";

            grades=[
                "0",
                "1 - 50",
                "51 - 200",
                "201 - 2.000",
                "> 2.000"
            ];

            colors=[
                "#D9D9D9",
                "#4CAF50",
                "#FFD54F",
                "#FB8C00",
                "#E53935"
            ];

            break;


        case "CGC":

            title="🐔 CÚM GIA CẦM";

            grades=[
                "0",
                "1 - 500",
                "501 - 2.000",
                "2.001 - 5.000",
                "> 5.000"
            ];

            colors=[
                "#D9D9D9",
                "#4CAF50",
                "#FFD54F",
                "#FB8C00",
                "#E53935"
            ];

            break;


        case "VDNC":

            title="🐄 VIÊM DA NỔI CỤC";

            grades=[
                "0",
                "1 - 10",
                "11 - 20",
                "21 - 40",
                "> 40"
            ];

            colors=[
                "#D9D9D9",
                "#4CAF50",
                "#FFD54F",
                "#FB8C00",
                "#E53935"
            ];

            break;


        case "DAI":

            title="🐕 BỆNH DẠI";

            grades=[
                "0",
                "1",
                "2 - 3",
                "4 - 5",
                "> 5"
            ];

            colors=[
                "#D9D9D9",
                "#4CAF50",
                "#FFD54F",
                "#FB8C00",
                "#E53935"
            ];

            break;


        case "PHUN":

            title="🧴 PHUN KHỬ TRÙNG";

            grades=[
                "0",
                "1 - 20",
                "21 - 50",
                "51 - 100",
                ">100"
            ];

            colors=[
                "#EEEEEE",
                "#B2DFDB",
                "#4DB6AC",
                "#009688",
                "#00695C"
            ];

            break;


        case "KSGM":

            title="🏭 KIỂM SOÁT GIẾT MỔ";

            grades=[
                "0",
                "Có cơ sở"
            ];

            colors=[
                "#EEEEEE",
                "#5E35B1"
            ];

            break;


        case "CSBBTTY":

            title="💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y";

            grades=[
                "0",
                "1",
                "2 - 3",
                ">3"
            ];

            colors=[
                "#EEEEEE",
                "#81C784",
                "#43A047",
                "#1B5E20"
            ];

            break;

    }

    let html=`
        <div class="legend-title">
            ${title}
        </div>
    `;

    grades.forEach((g,i)=>{

        html+=`

        <div class="legend-item">

            <span class="legend-color"

            style="background:${colors[i]}">

            </span>

            <span>${g}</span>

        </div>

        `;

    });

    
