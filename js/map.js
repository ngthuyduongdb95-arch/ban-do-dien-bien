//======================================================
// WEBGIS ĐIỆN BIÊN
// Version 2.0
//======================================================

console.log("WEBGIS DIEN BIEN v2.0");

//========================
// BẢN ĐỒ
//========================

const map = L.map("map", {
    zoomControl: true
}).setView([21.386, 103.023], 9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap"
    }
).addTo(map);

//========================
// BIẾN TOÀN CỤC
//========================

let geojsonLayer = null;
let labelLayer = L.layerGroup().addTo(map);
let legendControl = null;

let currentLayer = "DTLCP";

//========================
// CẤU HÌNH LỚP
//========================

const layerConfig = {

    DTLCP: {
        field: "DTLCP_Chết",
        title: "🐷 Dịch tả lợn Châu Phi",
        color: [
            "#D9D9D9",
            "#4CAF50",
            "#FFD54F",
            "#FB8C00",
            "#E53935"
        ],
        breaks: [0,50,200,2000],
        labels:[
            "0",
            "1 - 50",
            "51 - 200",
            "201 - 2.000",
            "> 2.000"
        ]
    },

    CGC:{
        field:"CGC_Chết",
        title:"🐔 Cúm gia cầm",
        color:[
            "#D9D9D9",
            "#4CAF50",
            "#FFD54F",
            "#FB8C00",
            "#E53935"
        ],
        breaks:[0,500,2000,5000],
        labels:[
            "0",
            "1 - 500",
            "501 - 2.000",
            "2.001 - 5.000",
            "> 5.000"
        ]
    },

    VDNC:{
        field:"VDNC_Mắc",
        title:"🐄 Viêm da nổi cục",
        color:[
            "#D9D9D9",
            "#4CAF50",
            "#FFD54F",
            "#FB8C00",
            "#E53935"
        ],
        breaks:[0,10,20,40],
        labels:[
            "0",
            "1 - 10",
            "11 - 20",
            "21 - 40",
            "> 40"
        ]
    },

    DAI:{
        field:"DAI_Chết",
        title:"🐕 Bệnh Dại",
        color:[
            "#D9D9D9",
            "#4CAF50",
            "#FFD54F",
            "#FB8C00",
            "#E53935"
        ],
        breaks:[0,1,3,5],
        labels:[
            "0",
            "1",
            "2 - 3",
            "4 - 5",
            "> 5"
        ]
    },

    PHUN:{
        field:"PHUN_Số hộ",
        title:"🧴 Phun khử trùng",
        color:[
            "#EEEEEE",
            "#B2DFDB",
            "#4DB6AC",
            "#009688",
            "#00695C"
        ],
        breaks:[0,20,50,100],
        labels:[
            "0",
            "1 - 20",
            "21 - 50",
            "51 - 100",
            ">100"
        ]
    },

    KSGM:{
        field:"KSGM_Cơ sở",
        title:"🏭 Kiểm soát giết mổ",
        color:[
            "#EEEEEE",
            "#5E35B1"
        ],
        breaks:[0],
        labels:[
            "0",
            "Có cơ sở"
        ]
    },

    CSBBTTY:{
        field:"CSBBTTY_Cơ sở",
        title:"💊 Cơ sở buôn bán thuốc thú y",
        color:[
            "#EEEEEE",
            "#81C784",
            "#43A047",
            "#1B5E20"
        ],
        breaks:[0,1,3],
        labels:[
            "0",
            "1",
            "2 - 3",
            ">3"
        ]
    }

};

//========================
// HÀM TIỆN ÍCH
//========================

function getRow(feature){

    return gisData[
        Number(feature.properties.ID)
    ];

}

function getName(feature){

    return (
        feature.properties.TenXa ||
        feature.properties["Tên xã"] ||
        feature.properties.NAME ||
        ""
    );

}

function getValue(row){

    if(!row) return 0;

    const cfg = layerConfig[currentLayer];

    return Number(
        row[cfg.field] || 0
    );

}

function formatNumber(v){

    return Number(v || 0)
        .toLocaleString("vi-VN");

}//========================
// MÀU THEO GIÁ TRỊ
//========================

function getColor(value){

    const cfg = layerConfig[currentLayer];

    if(currentLayer==="KSGM"){

        return value>0 ? cfg.color[1] : cfg.color[0];

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

//========================
// STYLE
//========================

function style(feature){

    const row=getRow(feature);

    return{

        color:"#1565C0",

        weight:1.2,

        opacity:1,

        fillColor:getColor(
            getValue(row)
        ),

        fillOpacity:0.75

    };

}

//========================
// HOVER
//========================

function highlightFeature(e){

    e.target.setStyle({

        weight:3,

        color:"#ff0000",

        fillOpacity:0.9

    });

    if(!L.Browser.ie &&
       !L.Browser.opera &&
       !L.Browser.edge){

        e.target.bringToFront();

    }

}

function resetHighlight(e){

    if(geojsonLayer){

        geojsonLayer.resetStyle(
            e.target
        );

    }

}

//========================
// POPUP
//========================

function popupContent(feature){

    const row=getRow(feature);

    const value=getValue(row);

    return `

        <b>${getName(feature)}</b>

        <hr>

        ${layerConfig[currentLayer].title}

        <br><br>

        <b>Giá trị:</b>

        ${formatNumber(value)}

    `;

}

//========================
// PANEL THÔNG TIN
//========================

function showInfo(feature){

    const row=getRow(feature);

    const panel=document.getElementById(
        "info-panel"
    );

    if(!panel) return;

    if(!row){

        panel.innerHTML=`

        <h2>${getName(feature)}</h2>

        <hr>

        Không có dữ liệu.

        `;

        return;

    }

    panel.innerHTML=`

    <h2>${getName(feature)}</h2>

    <hr>

    <div class="info-section">

        <h4>${layerConfig[currentLayer].title}</h4>

        <p>

        <b>Giá trị:</b>

        ${formatNumber(
            getValue(row)
        )}

        </p>

    </div>

    <div class="info-section">

        <h4>Dữ liệu gốc</h4>

        ${Object.keys(row).map(key=>`

            <p>

            <b>${key}</b>

            : ${row[key]}

            </p>

        `).join("")}

    </div>

    `;

}

//========================
// CLICK
//========================

function zoomToFeature(e){

    map.fitBounds(

        e.target.getBounds()

    );

    showInfo(

        e.target.feature

    );

}

//========================
// GẮN SỰ KIỆN
//========================

function onEachFeature(feature,layer){

    layer.bindPopup(

        popupContent(feature)

    );

    layer.on({

        mouseover:highlightFeature,

        mouseout:resetHighlight,

        click:zoomToFeature

    });

}//========================
// NHÃN XÃ
//========================

function drawLabels(){

    labelLayer.clearLayers();

    if(!geojsonLayer) return;

    geojsonLayer.eachLayer(function(layer){

        const feature=layer.feature;

        const row=getRow(feature);

        const value=getValue(row);

        if(
            map.getZoom()<10 &&
            value===0
        ){
            return;
        }

        const center=
            layer.getBounds().getCenter();

        const color=
            value>0
            ? "#d32f2f"
            : "#555";

        const marker=L.marker(center,{

            interactive:false,

            icon:L.divIcon({

                className:"",

                html:`
                <div class="map-label"
                     style="
                        color:${color};
                        font-weight:bold;
                        text-align:center;
                     ">
                    ${getName(feature)}
                </div>
                `

            })

        });

        marker.addTo(labelLayer);

    });

}

//========================
// CHÚ GIẢI
//========================

function updateLegend(){

    if(legendControl){

        map.removeControl(
            legendControl
        );

    }

    legendControl=L.control({

        position:"bottomright"

    });

    legendControl.onAdd=function(){

        const div=L.DomUtil.create(
            "div",
            "legend"
        );

        const cfg=
            layerConfig[currentLayer];

        let html=`
            <div style="
                font-weight:bold;
                margin-bottom:8px;
                font-size:14px;
            ">
            ${cfg.title}
            </div>
        `;

        for(
            let i=0;
            i<cfg.labels.length;
            i++
        ){

            html+=`

            <div style="
                margin-bottom:6px;
            ">

                <span
                    style="
                        display:inline-block;
                        width:18px;
                        height:18px;
                        background:${cfg.color[i]};
                        border:1px solid #666;
                        margin-right:8px;
                    ">
                </span>

                ${cfg.labels[i]}

            </div>

            `;

        }

        div.innerHTML=html;

        return div;

    };

    legendControl.addTo(map);

}

//========================
// DASHBOARD
//========================

function updateDashboard(){

    const cards=
        document.querySelectorAll(
            ".card-number"
        );

    if(cards.length<6) return;

    cards[0].innerText=45;

    let total=0;

    Object.values(gisData)
    .forEach(r=>{

        if(
            Number(
                r[
                layerConfig[currentLayer].field
                ]||0
            )>0
        ){

            total++;

        }

    });

    cards[1].innerText=
        currentLayer==="DTLCP"
        ? total
        : cards[1].innerText;

    cards[2].innerText=
        currentLayer==="CGC"
        ? total
        : cards[2].innerText;

    cards[3].innerText=
        currentLayer==="VDNC"
        ? total
        : cards[3].innerText;

}

//========================
// LÀM MỚI BẢN ĐỒ
//========================

function refreshMap(){

    if(!geojsonLayer)
        return;

    geojsonLayer.setStyle(
        style
    );

    geojsonLayer.eachLayer(function(layer){

        layer.setPopupContent(

            popupContent(
                layer.feature
            )

        );

    });

    drawLabels();

    updateLegend();

    updateDashboard();

}

//========================
// REDRAW LABEL
//========================

map.on(

    "zoomend",

    drawLabels

);//========================
// LOAD GEOJSON
//========================

async function loadMap(){

    await loadGISData();

    const response=await fetch(
        "data/dienbien_xa.geojson"
    );

    const geojson=await response.json();

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

//========================
// ĐỔI LỚP
//========================

const layerSelect=
document.getElementById(
    "layerSelect"
);

if(layerSelect){

    layerSelect.addEventListener(

        "change",

        function(){

            currentLayer=this.value;

            refreshMap();

        }

    );

}

//========================
// TÌM KIẾM
//========================

function searchFeature(){

    const keyword=document
        .getElementById("txtSearch")
        .value
        .trim()
        .toLowerCase();

    if(!keyword){

        return;

    }

    let found=false;

    geojsonLayer.eachLayer(function(layer){

        const name=getName(
            layer.feature
        ).toLowerCase();

        if(name.includes(keyword)){

            found=true;

            map.fitBounds(
                layer.getBounds()
            );

            layer.openPopup();

            showInfo(
                layer.feature
            );

        }

    });

    if(!found){

        alert(
            "Không tìm thấy xã/phường."
        );

    }

}

//========================
// NÚT TÌM
//========================

const btnSearch=
document.getElementById(
    "btnSearch"
);

if(btnSearch){

    btnSearch.addEventListener(

        "click",

        searchFeature

    );

}

const txtSearch=
document.getElementById(
    "txtSearch"
);

if(txtSearch){

    txtSearch.addEventListener(

        "keypress",

        function(e){

            if(e.key==="Enter"){

                searchFeature();

            }

        }

    );

}

//========================
// CLICK CARD (tuỳ chọn)
//========================

document
.querySelectorAll(".card")
.forEach(function(card,index){

    card.addEventListener(

        "click",

        function(){

            switch(index){

                case 1:
                    currentLayer="DTLCP";
                    break;

                case 2:
                    currentLayer="CGC";
                    break;

                case 3:
                    currentLayer="VDNC";
                    break;

                default:
                    return;

            }

            layerSelect.value=currentLayer;

            refreshMap();

        }

    );

});

//========================
// KHỞI ĐỘNG
//========================

loadMap();
