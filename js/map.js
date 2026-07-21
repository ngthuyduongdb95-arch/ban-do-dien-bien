// ================= KHỞI TẠO BẢN ĐỒ =================

const map = L.map("map").setView([21.386, 103.023], 9);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

let geojson;
let currentLayer = "DTLCP";
let labelLayer = L.layerGroup().addTo(map);

// ================= LẤY GIÁ TRỊ THEO LỚP =================

function getValue(d) {
    if (!d) return 0;

    switch (currentLayer) {
        case "DTLCP": return Number(d["DTLCP_Chết"] || 0);
        case "CGC": return Number(d["CGC_Chết"] || 0);
        case "VDNC": return Number(d["VDNC_Mắc"] || 0);
        case "DAI": return Number(d["DAI_Chết"] || 0);
        case "PHUN": 
            let status = String(d["PHUN_Tiến độ"] || "").trim();
            return (status === "Đã triển khai") ? 1 : 0;
        case "KSGM": return Number(d["KSGM_Cơ sở"] || 0);
        case "CSBBTTY": return Number(d["CSBBTTY_Cơ sở"] || 0);
        default: return 0;
    }
}

// ================= MÀU SẮC =================

function getColor(value) {
    switch (currentLayer) {
        case "DTLCP":
            if (value == 0) return "#D9D9D9";
            if (value <= 50) return "#4CAF50";
            if (value <= 200) return "#FFD54F";
            if (value <= 2000) return "#FB8C00";
            return "#E53935";
        case "PHUN":
            return (value === 1) ? "#009688" : "#EEEEEE";
        // ... giữ nguyên các case khác như cũ
        default: return "#D9D9D9";
    }
}

// ================= STYLE & INTERACTION =================

function style(feature) {
    const id = feature.properties.ID;
    const d = gisData[id];
    const value = getValue(d);
    return {
        color: "#1976D2",
        weight: 1.5,
        opacity: 1,
        fillColor: getColor(value),
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    e.target.setStyle({ weight: 3, color: "#ff0000", fillOpacity: 0.9 });
    e.target.bringToFront();
}

function resetHighlight(e) { geojson.resetStyle(e.target); }

function onEachFeature(feature, layer) {
    layer.on({ mouseover: highlightFeature, mouseout: resetHighlight, click: zoomToFeature });
}

// ================= CHÚ GIẢI (LEGEND) =================

const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
    this._div = L.DomUtil.create("div", "legend");
    updateLegend();
    return this._div;
};
legend.addTo(map);

function updateLegend() {
    let title = "", grades = [], colors = [];

    switch (currentLayer) {
        case "PHUN":
            title = "🧴 Phun khử trùng";
            grades = ["Chưa triển khai", "Đã triển khai"];
            colors = ["#EEEEEE", "#009688"];
            break;
        default:
            title = "Dữ liệu bản đồ";
            grades = ["Mặc định"];
            colors = ["#D9D9D9"];
    }

    let html = `<div style="font-weight:bold; margin-bottom:8px; font-size:14px;">${title}</div>`;
    for (let i = 0; i < grades.length; i++) {
        html += `
        <div style="margin-bottom:6px; display: flex; align-items: center;">
            <span style="display:inline-block; width:18px; height:18px; background:${colors[i]}; border:1px solid #666; margin-right:8px;"></span>
            ${grades[i]}
        </div>`;
    }
    if (legend._div) legend._div.innerHTML = html;
}

// ================= KHỞI CHẠY =================

loadGISData().then(() => {
    fetch("data/dienbien_xa.geojson")
        .then(res => res.json())
        .then(data => {
            geojson = L.geoJSON(data, { style: style, onEachFeature: onEachFeature }).addTo(map);
            updateLegend();
        });
});

// Sự kiện đổi lớp
document.getElementById("layerSelect").addEventListener("change", function () {
    currentLayer = this.value;
    geojson.setStyle(style);
    updateLegend();
});
