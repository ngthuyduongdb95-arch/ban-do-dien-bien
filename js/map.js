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

// ================= MÀU CÚM GIA CẦM =================

function getColor(value) {

    switch (currentLayer) {

        // ================= DTLCP =================
        case "DTLCP":
            if (value == 0) return "#D9D9D9";
            if (value <= 50) return "#4CAF50";
            if (value <= 200) return "#FFD54F";
            if (value <= 2000) return "#FB8C00";
            return "#E53935";

        // ================= CÚM GIA CẦM =================
        case "CGC":
            if (value == 0) return "#D9D9D9";
            if (value <= 500) return "#4CAF50";
            if (value <= 2000) return "#FFD54F";
            if (value <= 5000) return "#FB8C00";
            return "#E53935";

        // ================= VIÊM DA NỔI CỤC =================
        case "VDNC":
            if (value == 0) return "#D9D9D9";
            if (value <= 10) return "#4CAF50";
            if (value <= 20) return "#FFD54F";
            if (value <= 40) return "#FB8C00";
            return "#E53935";

        // ================= BỆNH DẠI =================
        case "DAI":
            if (value == 0) return "#D9D9D9";
            if (value <= 1) return "#4CAF50";
            if (value <= 3) return "#FFD54F";
            if (value <= 5) return "#FB8C00";
            return "#E53935";

        default:
            return "#D9D9D9";
    }
}
// ================= STYLE =================

function style(feature) {

    const id = feature.properties.ID;
    const d = gisData[id];

    let value = 0;

    switch (currentLayer) {

        case "DTLCP":
            value = Number(d?.["DTLCP_Chết"] || 0);
            break;

        case "CGC":
            value = Number(d?.["CGC_Chết"] || 0);
            break;

        case "VDNC":
            value = Number(d?.["VDNC_Mắc"] || 0);
            break;

        case "DAI":
            value = Number(d?.["DAI_Chết"] || 0);
            break;
    }

    return {
        color: "#1976D2",
        weight: 1.5,
        fillColor: getColor(value),
        fillOpacity: 0.6
    };
}

// ================= HOVER =================

function highlightFeature(e) {

    e.target.setStyle({

        weight: 3,
        color: "#ff0000",
        fillOpacity: 0.8

    });

}

function resetHighlight(e) {

    geojson.resetStyle(e.target);

}

// ================= CLICK =================

function zoomToFeature(e) {

    map.fitBounds(e.target.getBounds());

    const idXa = e.target.feature.properties.ID;
    const tenXa = e.target.feature.properties.TenXa;

    const d = gisData[idXa];

    const panel = document.getElementById("info-panel");

    if (!panel) return;

    if (!d) {

        panel.innerHTML = `
            <h2>${tenXa}</h2>
            <hr>
            <p style="color:red">Không tìm thấy dữ liệu.</p>
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
<p><b>Số ngày:</b> ${d["DTLCP_Số ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>🐔 CÚM GIA CẦM</h4>

<p><b>Trạng thái:</b> ${d["CGC_Trạng thái"] || "--"}</p>
<p><b>Số ổ dịch:</b> ${d["CGC_Ổ dịch"] || 0}</p>
<p><b>Tiêu hủy:</b> ${d["CGC_Chết"] || 0} con</p>
<p><b>Trọng lượng:</b> ${d["CGC_Trọng lượng"] || 0} kg</p>
<p><b>Ngày cuối:</b> ${d["CGC_Ngày cuối"] || "--"}</p>
<p><b>Số ngày:</b> ${d["CGC_Số ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>🐄 VIÊM DA NỔI CỤC</h4>

<p><b>Trạng thái:</b> ${d["VDNC_Trạng thái"] || "--"}</p>
<p><b>Số ổ dịch:</b> ${d["VDNC_Ổ dịch"] || 0}</p>
<p><b>Mắc:</b> ${d["VDNC_Mắc"] || 0} con</p>
<p><b>Chết:</b> ${d["VDNC_Chết"] || 0} con</p>
<p><b>Trọng lượng:</b> ${d["VDNC_Trọng lượng"] || 0} kg</p>
<p><b>Ngày cuối:</b> ${d["VDNC_Ngày cuối"] || "--"}</p>
<p><b>Số ngày:</b> ${d["VDNC_Số ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>🧴 PHUN PHÒNG</h4>

<p><b>Tiến độ:</b> ${d["PHUN_Tiến độ"] || "--"}</p>
<p><b>Vòng:</b> ${d["PHUN_Vòng"] || "--"}</p>
<p><b>Số hộ:</b> ${d["PHUN_Số hộ"] || 0}</p>
<p><b>Diện tích:</b> ${d["PHUN_Diện tích"] || 0}</p>
<p><b>Hóa chất:</b> ${d["PHUN_Hóa chất"] || "--"}</p>
<p><b>Ngày:</b> ${d["PHUN_Ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y</h4>

<p><b>Số cơ sở:</b> ${d["CSBBTTY_Cơ sở"] || 0}</p>

</div>

<div class="info-section">

<h4>🏭 KIỂM SOÁT GIẾT MỔ</h4>

<p><b>Trạng thái:</b> ${d["KSGM_Trạng thái"] || "--"}</p>
<p><b>Số cơ sở:</b> ${d["KSGM_Cơ sở"] || 0}</p>

</div>

`;

}
// ================= GẮN SỰ KIỆN =================

function onEachFeature(feature, layer) {

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });

}

// ================= ĐỌC DỮ LIỆU =================

loadGISData().then(() => {

    fetch("data/dienbien_xa.geojson")
        .then(response => response.json())
        .then(data => {

            geojson = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);

        });

});

// ================= CHÚ GIẢI =================

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
    }

    const colors = [
        "#D9D9D9",
        "#4CAF50",
        "#FFD54F",
        "#FB8C00",
        "#E53935"
    ];

    let html = `<b>${title}</b><br><br>`;

    for (let i = 0; i < grades.length; i++) {
        html += `
            <i style="background:${colors[i]}"></i>
            ${grades[i]} con<br>
        `;
    }

    legend._div.innerHTML = html;
}
