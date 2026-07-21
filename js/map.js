// ================= KHỞI TẠO BẢN ĐỒ =================

console.log("MAP VERSION 2026-07-20");

const map = L.map("map").setView([21.386, 103.023], 9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap"
    }
).addTo(map);

let geojson;
let currentLayer = "DTLCP";
let labelLayer = L.layerGroup().addTo(map);

// ================= LẤY GIÁ TRỊ THEO LỚP =================

function getValue(d) {
    if (!d) return 0;

    switch (currentLayer) {
        case "DTLCP":
            return Number(d["DTLCP_Chết"] || 0);
        case "CGC":
            return Number(d["CGC_Chết"] || 0);
        case "VDNC":
            return Number(d["VDNC_Mắc"] || 0);
        case "DAI":
            return Number(d["DAI_Chết"] || 0);
        case "PHUN":
            return Number(d["PHUN_Số hộ"] || 0);
        case "KSGM":
            return Number(d["KSGM_Cơ sở"] || 0);
        case "CSBBTTY":
            return Number(d["CSBBTTY_Cơ sở"] || 0);
        default:
            return 0;
    }
}

// ================= MÀU SẮC PHÂN LOẠI =================

function getColor(value) {
    switch (currentLayer) {
        case "DTLCP":
            if (value == 0) return "#D9D9D9";
            if (value <= 50) return "#4CAF50";
            if (value <= 200) return "#FFD54F";
            if (value <= 2000) return "#FB8C00";
            return "#E53935";

        case "CGC":
            if (value == 0) return "#D9D9D9";
            if (value <= 500) return "#4CAF50";
            if (value <= 2000) return "#FFD54F";
            if (value <= 5000) return "#FB8C00";
            return "#E53935";

        case "VDNC":
            if (value == 0) return "#D9D9D9";
            if (value <= 10) return "#4CAF50";
            if (value <= 20) return "#FFD54F";
            if (value <= 40) return "#FB8C00";
            return "#E53935";

        case "DAI":
            if (value == 0) return "#D9D9D9";
            if (value <= 1) return "#4CAF50";
            if (value <= 3) return "#FFD54F";
            if (value <= 5) return "#FB8C00";
            return "#E53935";

        case "PHUN":
            if (value == 0) return "#EEEEEE";
            if (value <= 20) return "#B2DFDB";
            if (value <= 50) return "#4DB6AC";
            if (value <= 100) return "#009688";
            return "#00695C";

        case "KSGM":
            if (value == 0) return "#EEEEEE";
            return "#5E35B1";

        case "CSBBTTY":
            if (value == 0) return "#EEEEEE";
            if (value == 1) return "#81C784";
            if (value <= 3) return "#43A047";
            return "#1B5E20";

        default:
            return "#D9D9D9";
    }
}

// ================= STYLE BẢN ĐỒ =================

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

// ================= HOVER & CLICK =================

function highlightFeature(e) {
    e.target.setStyle({
        weight: 3,
        color: "#ff0000",
        fillOpacity: 0.9
    });
    e.target.bringToFront();
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());

    const idXa = e.target.feature.properties.ID;
    const tenXa = e.target.feature.properties.TenXa || e.target.feature.properties.NAME;
    const d = gisData[idXa];

    const panel = document.getElementById("info-panel");
    if (!panel) return;

    if (!d) {
        panel.innerHTML = `
            <h2>${tenXa}</h2>
            <hr>
            <p style="color:red;">Không có dữ liệu.</p>
        `;
        return;
    }

    panel.innerHTML = `
        <h2>${tenXa}</h2>
        <hr>
        <div class="info-section">
            <h4>🐷 DỊCH TẢ LỢN CHÂU PHI</h4>
            <p><b>Trạng thái:</b> ${d["DTLCP_Trạng thái"] || "--"}</p>
            <p><b>Số ổ dịch:</b> ${d["DTLCP_Ổ dịch"] || 0}</p>
            <p><b>Tiêu hủy:</b> ${d["DTLCP_Chết"] || 0} con</p>
            <p><b>Trọng lượng:</b> ${d["DTLCP_Trọng lượng"] || 0} kg</p>
            <p><b>Ngày cuối:</b> ${d["DTLCP_Ngày cuối"] || "--"}</p>
        </div>

        <div class="info-section">
            <h4>🐔 CÚM GIA CẦM</h4>
            <p><b>Trạng thái:</b> ${d["CGC_Trạng thái"] || "--"}</p>
            <p><b>Số ổ dịch:</b> ${d["CGC_Ổ dịch"] || 0}</p>
            <p><b>Tiêu hủy:</b> ${d["CGC_Chết"] || 0} con</p>
            <p><b>Trọng lượng:</b> ${d["CGC_Trọng lượng"] || 0} kg</p>
            <p><b>Ngày cuối:</b> ${d["CGC_Ngày cuối"] || "--"}</p>
        </div>

        <div class="info-section">
            <h4>🐄 VIÊM DA NỔI CỤC</h4>
            <p><b>Trạng thái:</b> ${d["VDNC_Trạng thái"] || "--"}</p>
            <p><b>Số ổ dịch:</b> ${d["VDNC_Ổ dịch"] || 0}</p>
            <p><b>Mắc:</b> ${d["VDNC_Mắc"] || 0} con</p>
            <p><b>Chết:</b> ${d["VDNC_Chết"] || 0} con</p>
            <p><b>Trọng lượng:</b> ${d["VDNC_Trọng lượng"] || 0} kg</p>
            <p><b>Ngày cuối:</b> ${d["VDNC_Ngày cuối"] || "--"}</p>
        </div>

        <div class="info-section">
            <h4>🐕 BỆNH DẠI</h4>
            <p><b>Trạng thái:</b> ${d["DAI_Trạng thái"] || "--"}</p>
            <p><b>Số ổ dịch:</b> ${d["DAI_Ổ dịch"] || 0}</p>
            <p><b>Chết:</b> ${d["DAI_Chết"] || 0} con</p>
            <p><b>Ngày cuối:</b> ${d["DAI_Ngày cuối"] || "--"}</p>
        </div>

        <div class="info-section">
            <h4>🧴 PHUN KHỬ TRÙNG</h4>
            <p><b>Tiến độ:</b> ${d["PHUN_Tiến độ"] || "--"}</p>
            <p><b>Vòng:</b> ${d["PHUN_Vòng"] || "--"}</p>
            <p><b>Số hộ:</b> ${d["PHUN_Số hộ"] || 0}</p>
            <p><b>Diện tích:</b> ${d["PHUN_Diện tích"] || 0}</p>
            <p><b>Ngày:</b> ${d["PHUN_Ngày"] || "--"}</p>
        </div>

        <div class="info-section">
            <h4>🏭 KIỂM SOÁT GIẾT MỔ</h4>
            <p><b>Trạng thái:</b> ${d["KSGM_Trạng thái"] || "--"}</p>
            <p><b>Số cơ sở:</b> ${d["KSGM_Cơ sở"] || 0}</p>
        </div>

        <div class="info-section">
            <h4>💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y</h4>
            <p><b>Số cơ sở:</b> ${d["CSBBTTY_Cơ sở"] || 0}</p>
        </div>
    `;
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// ================= GẮN NHÃN TÊN XÃ =================

function drawLabels() {
    labelLayer.clearLayers();

    geojson.eachLayer(function (layer) {
        const feature = layer.feature;
        const d = gisData[feature.properties.ID];

        if (!d) return;

        const value = getValue(d);
        if (map.getZoom() < 10 && value == 0) return;

        const center = layer.getBounds().getCenter();
        const name = feature.properties.TenXa || feature.properties["Tên xã"] || feature.properties.NAME;
        const color = value > 0 ? "#d32f2f" : "#666";

        const marker = L.marker(center, {
            interactive: false,
            icon: L.divIcon({
                className: "",
                html: `<div class="map-label" style="color:${color}">${name}</div>`
            })
        });

        marker.addTo(labelLayer);
    });
}

// ================= TẢI DỮ LIỆU GEOJSON & KHỞI CHẠY =================

loadGISData().then(() => {
    fetch("data/dienbien_xa.geojson")
        .then(response => response.json())
        .then(data => {
            geojson = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);

            updateLegend();
            drawLabels();
        })
        .catch(err => console.error("Lỗi tải file GeoJSON:", err));
});

// ================= SỰ KIỆN ĐỔI LỚP DỮ LIỆU =================

const layerSelect = document.getElementById("layerSelect");
if (layerSelect) {
    layerSelect.addEventListener("change", function () {
        currentLayer = this.value;
        geojson.setStyle(style);
        updateLegend();
        drawLabels();
    });
}

// ================= XỬ LÝ TÌM KIẾM XÃ =================

const btnSearch = document.getElementById("btnSearch");
const txtSearch = document.getElementById("txtSearch");

function searchLocation() {
    const keyword = txtSearch.value.toLowerCase().trim();
    if (!keyword) return;

    let found = false;
    geojson.eachLayer(function (layer) {
        const props = layer.feature.properties;
        const name = (props.TenXa || props["Tên xã"] || props.NAME || "").toLowerCase();

        if (name.includes(keyword)) {
            map.fitBounds(layer.getBounds());
            layer.fire("click"); // Tự động kích hoạt sự kiện click để hiện thông tin
            found = true;
        }
    });

    if (!found) {
        alert("Không tìm thấy xã/phường phù hợp!");
    }
}

if (btnSearch && txtSearch) {
    btnSearch.addEventListener("click", searchLocation);
    txtSearch.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            searchLocation();
        }
    });
}

// ================= CHÚ GIẢI (LEGEND) =================

const legend = L.control({
    position: "bottomright"
});

legend.onAdd = function () {
    this._div = L.DomUtil.create("div", "legend");
    updateLegend();
    return this._div;
};

legend.addTo(map);

function updateLegend() {
    let title = "";
    let grades = [];
    let colors = [];

    switch (currentLayer) {
        case "DTLCP":
            title = "🐷 Dịch tả lợn Châu Phi";
            grades = ["0", "1 - 50", "51 - 200", "201 - 2.000", "> 2.000"];
            break;
        case "CGC":
            title = "🐔 Cúm gia cầm";
            grades = ["0", "1 - 500", "501 - 2.000", "2.001 - 5.000", "> 5.000"];
            break;
        case "VDNC":
            title = "🐄 Viêm da nổi cục";
            grades = ["0", "1 - 10", "11 - 20", "21 - 40", "> 40"];
            break;
        case "DAI":
            title = "🐕 Bệnh Dại";
            grades = ["0", "1", "2 - 3", "4 - 5", "> 5"];
            break;
        case "PHUN":
            title = "🧴 Phun khử trùng";
            grades = [đã triển khai, chưa triển khai];
            break;
        case "KSGM":
            title = "🏭 Kiểm soát giết mổ";
            grades = ["0", "Có cơ sở"];
            break;
        case "CSBBTTY":
            title = "💊 Cơ sở buôn bán thuốc thú y";
            grades = ["0", "1", "2 - 3", ">3"];
            break;
    }

    switch (currentLayer) {
        case "KSGM":
            colors = ["#EEEEEE", "#5E35B1"];
            break;
        case "CSBBTTY":
            colors = ["#EEEEEE", "#81C784", "#43A047", "#1B5E20"];
            break;
        default:
            colors = ["#D9D9D9", "#4CAF50", "#FFD54F", "#FB8C00", "#E53935"];
    }

    let html = `<div style="font-weight:bold; margin-bottom:8px; font-size:14px;">${title}</div>`;

    for (let i = 0; i < grades.length; i++) {
        html += `
        <div style="margin-bottom:6px; display: flex; align-items: center;">
            <span style="
                display:inline-block;
                width:18px;
                height:18px;
                background:${colors[i] || '#ccc'};
                border:1px solid #666;
                margin-right:8px;">
            </span>
            ${grades[i]}
        </div>
        `;
    }

    if (legend._div) {
        legend._div.innerHTML = html;
    }
}

// Cập nhật lại nhãn tên xã khi zoom bản đồ
map.on("zoomend", function () {
    drawLabels();
});
