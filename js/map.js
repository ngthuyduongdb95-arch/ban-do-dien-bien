// ======================================================
// MAP.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT - ĐIỆN BIÊN
// ======================================================
// Quy ước:
// 1. Dữ liệu bệnh: Natural Breaks (Jenks) động.
// 2. 0 = xã không có dịch / không có số liệu, tách riêng.
// 3. Mức thiệt hại bắt đầu từ 1.
// 4. Mỗi lớp có 01 thang màu riêng, 6 mức sáng -> đậm.
// 5. Xã đang có dịch = 01 chấm đỏ, viền trắng, không pulse.
// 6. Click xã chỉ cập nhật panel bên phải.
// ======================================================

"use strict";

let map = null;
let geojsonData = null;
let geojsonLayer = null;
let labelLayer = null;
let diseaseMarkerLayer = null;
let legendControl = null;
let currentLayer = "DTLCP";
let selectedFeature = null;
let currentBasemap = "street";
let damageRanges = [];

const STREET_URL =
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const SATELLITE_URL =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const layerConfig = {
    DTLCP: {
        name: "Dịch tả lợn Châu Phi",
        field: "DTLCP_Chết",
        status: "DTLCP_Trạng thái",
        outbreak: "DTLCP_Ổ dịch",
        unit: "con",
        colors: ["#FFE45E","#FFC43D","#FFA21A","#FF6A1A","#E6392E","#B71C1C"]
    },
    CGC: {
        name: "Cúm gia cầm",
        field: "CGC_Chết",
        status: "CGC_Trạng thái",
        outbreak: "CGC_Ổ dịch",
        unit: "con",
        colors: ["#C8E6C9","#A5D6A7","#66BB6A","#388E3C","#1B5E20","#0D3D17"]
    },
    VDNC: {
        name: "Viêm da nổi cục",
        field: "VDNC_Mắc",
        death: "VDNC_Chết",
        status: "VDNC_Trạng thái",
        outbreak: "VDNC_Ổ dịch",
        unit: "con",
        colors: ["#C6E2FF","#8CC5FF","#5AA6FF","#2F7DF6","#1558D6","#0A2E7D"]
    },
    DAI: {
        name: "Bệnh Dại",
        field: "DAI_Chết",
        death: "DAI_Tiêu hủy",
        status: "DAI_Trạng thái",
        outbreak: "DAI_Ổ dịch",
        unit: "con",
        colors: ["#E9D5FF","#D4B5FF","#9B5DE5","#8E5CF6","#6A35D1","#4A148C"]
    },
    PHUN: {
        name: "Phun khử trùng",
        field: "PHUN_Vòng",
        colors: ["#BFEDEE","#80E1E6","#3CC9D2","#19A7B3","#0D7F87","#094D4F"]
    },
    KSGM: {
        name: "Kiểm soát giết mổ",
        field: "KSGM_Cơ sở",
        status: "KSGM_Trạng thái",
        colors: ["#E8D8D2","#D7CCC8","#A1887F","#795548","#5D4037","#3E2723"]
    },
    CSBBTTY: {
        name: "Cơ sở buôn bán thuốc thú y",
        field: "CSBBTTY_Cơ sở",
        colors: ["#D7F3FF","#A7E6F7","#67D2E8","#29B6D1","#0288B8","#01579B"]
    }
};

// ------------------------------------------------------
// Khởi tạo
// ------------------------------------------------------

function initMap() {
    if (map) return map;

    map = L.map("map", {
        zoomControl: false,
        preferCanvas: true,
        minZoom: 7,
        maxZoom: 18
    }).setView([21.386, 103.016], 9);

    L.control.zoom({ position: "topleft" }).addTo(map);
    L.control.scale({
        position: "bottomleft",
        imperial: false,
        maxWidth: 120
    }).addTo(map);

    addBaseLayers();
    addProvinceEmphasis();
    bindControls();

    return map;
}

let streetLayer = null;
let satelliteLayer = null;

function addBaseLayers() {
    streetLayer = L.tileLayer(STREET_URL, {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd"
    });

    satelliteLayer = L.tileLayer(SATELLITE_URL, {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri"
    });

    streetLayer.addTo(map);
}

function addProvinceEmphasis() {
    // Dùng lớp viền ngoài dựa trên GeoJSON tỉnh khi dữ liệu cung cấp.
    // Nếu GeoJSON chỉ có 45 xã/phường, ranh giới xã vẫn được làm nổi bật
    // và toàn bộ khu vực Điện Biên được đặt ở trung tâm bản đồ.
}

function addMapTitle() {
    const title = L.control({ position: "topleft" });

    title.onAdd = function () {
        const div = L.DomUtil.create("div", "map-export-title");
        div.innerHTML = `
            <div id="exportMapTitle">${layerConfig[currentLayer].name}</div>
            <span>Phân cấp dữ liệu động bằng Natural Breaks (Jenks)</span>
        `;
        return div;
    };

    title.addTo(map);
}

function refreshMapTitle() {
    const el = document.getElementById("exportMapTitle");
    if (el) el.textContent = layerConfig[currentLayer].name;

    const title = document.getElementById("mapTitle");
    if (title) title.textContent = layerConfig[currentLayer].name;
}

// ------------------------------------------------------
// Dữ liệu
// ------------------------------------------------------

function getRows() {
    if (typeof window.getRows === "function") {
        try {
            const rows = window.getRows();
            if (Array.isArray(rows)) return rows;
        } catch (_) {}
    }

    if (typeof window.sheetData !== "undefined" && window.sheetData) {
        return Object.values(window.sheetData);
    }

    return [];
}

function getRow(feature) {
    if (!feature || !feature.properties) return null;

    const id = Number(feature.properties.ID);
    if (!Number.isFinite(id)) return null;

    if (typeof window.sheetData !== "undefined" && window.sheetData) {
        return window.sheetData[id] || null;
    }

    const rows = getRows();
    return rows.find(r => Number(r["ID"]) === id) || null;
}

function num(value) {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;

    let s = String(value).trim().replace(/[^\d,.-]/g, "");
    if (!s) return 0;

    if (s.includes(".") && s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
    } else if (s.includes(",")) {
        const p = s.split(",");
        s = p.length === 2 && p[1].length <= 2
            ? p[0] + "." + p[1]
            : s.replace(/,/g, "");
    } else if ((s.match(/\./g) || []).length > 1) {
        s = s.replace(/\./g, "");
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function fmt(value) {
    return num(value).toLocaleString("vi-VN", {
        maximumFractionDigits: 2
    });
}

function norm(value) {
    return String(value ?? "").trim().toLowerCase();
}

function getName(feature) {
    const row = getRow(feature);

    if (row && row["Tên xã"]) {
        return String(row["Tên xã"]).trim();
    }

    const p = feature?.properties || {};
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

function isActive(row, config) {
    return !!row && !!config.status &&
        norm(row[config.status]) === "đang có dịch";
}

function hasData(feature) {
    const row = getRow(feature);
    if (!row) return false;

    const cfg = layerConfig[currentLayer];

    if (currentLayer === "PHUN") {
        return num(row["PHUN_Số hộ"]) > 0 ||
               num(row["PHUN_Vòng"]) > 0 ||
               norm(row["PHUN_Tiến độ"]) !== "";
    }

    if (currentLayer === "KSGM") {
        return num(row["KSGM_Cơ sở"]) > 0 ||
               norm(row["KSGM_Trạng thái"]) !== "";
    }

    if (currentLayer === "CSBBTTY") {
        return num(row["CSBBTTY_Cơ sở"]) > 0;
    }

    return num(row[cfg.field]) > 0 ||
           num(row[cfg.outbreak]) > 0 ||
           num(row[cfg.death]) > 0 ||
           norm(row[cfg.status]) !== "";
}

// ------------------------------------------------------
// Natural Breaks (Jenks)
// ------------------------------------------------------

function jenks(values, classCount) {
    const data = values
        .filter(v => Number.isFinite(v) && v > 0)
        .map(v => Math.max(1, Math.round(v)))
        .sort((a, b) => a - b);

    const unique = [...new Set(data)];
    if (!unique.length) return [];
    if (unique.length === 1) {
        return [{ min: 1, max: unique[0] }];
    }

    const k = Math.min(classCount, unique.length);
    const n = data.length;

    const lower = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
    const variance = Array.from({ length: n + 1 }, () => Array(k + 1).fill(Infinity));

    variance[0][0] = 0;

    for (let i = 1; i <= n; i++) {
        variance[i][1] = 0;
        lower[i][1] = 1;
    }

    for (let l = 2; l <= n; l++) {
        let sum = 0;
        let sumSq = 0;
        let weight = 0;

        for (let m = 1; m <= l; m++) {
            const idx = l - m + 1;
            const val = data[idx - 1];

            weight += 1;
            sum += val;
            sumSq += val * val;

            const varianceClass = sumSq - (sum * sum) / weight;

            if (idx === 1) {
                variance[l][1] = varianceClass;
                lower[l][1] = 1;
                continue;
            }

            for (let j = 2; j <= k; j++) {
                if (idx - 1 < j - 1) continue;

                const previous = variance[idx - 1][j - 1];
                if (!Number.isFinite(previous)) continue;

                const candidate = previous + varianceClass;

                if (candidate < variance[l][j]) {
                    variance[l][j] = candidate;
                    lower[l][j] = idx;
                }
            }
        }
    }

    if (!Number.isFinite(variance[n][k])) {
        return equalIntegerRanges(data, k);
    }

    const classStarts = Array(k + 1).fill(0);
    classStarts[k] = 1;

    let count = n;

    for (let j = k; j >= 2; j--) {
        const start = lower[count][j];
        if (!start) return equalIntegerRanges(data, k);
        classStarts[j - 1] = start;
        count = start - 1;
    }

    const ranges = [];

    for (let i = 1; i <= k; i++) {
        const startIndex = i === 1 ? 0 : classStarts[i] - 1;
        const endIndex = i === k ? n - 1 : classStarts[i + 1] - 2;

        if (startIndex < 0 || endIndex < startIndex || endIndex >= n) continue;

        const min = i === 1 ? 1 : data[startIndex];
        const max = data[endIndex];

        if (min <= max) ranges.push({ min, max });
    }

    if (!ranges.length) return equalIntegerRanges(data, k);

    ranges[0].min = 1;

    for (let i = 1; i < ranges.length; i++) {
        ranges[i].min = ranges[i - 1].max + 1;
    }

    ranges[ranges.length - 1].max = data[n - 1];

    return ranges;
}

function equalIntegerRanges(data, k) {
    if (!data.length) return [];
    if (k <= 1) return [{ min: 1, max: data[data.length - 1] }];

    const ranges = [];
    for (let i = 0; i < k; i++) {
        const start = Math.floor(i * data.length / k);
        const end = Math.max(start, Math.floor((i + 1) * data.length / k) - 1);

        const min = i === 0 ? 1 : data[start];
        const max = data[Math.min(end, data.length - 1)];

        if (min <= max) ranges.push({ min, max });
    }

    for (let i = 1; i < ranges.length; i++) {
        ranges[i].min = ranges[i - 1].max + 1;
    }

    ranges[ranges.length - 1].max = data[data.length - 1];
    return ranges;
}

function calculateDamageRanges() {
    const cfg = layerConfig[currentLayer];

    if (!['DTLCP', 'CGC', 'VDNC', 'DAI'].includes(currentLayer)) {
        damageRanges = [];
        return damageRanges;
    }

    const values = getRows()
        .map(row => num(row[cfg.field]))
        .filter(v => v > 0);

    damageRanges = jenks(values, 6);
    return damageRanges;
}

function getDamageClass(value, ranges) {
    if (value <= 0 || !ranges.length) return -1;

    for (let i = 0; i < ranges.length; i++) {
        if (value >= ranges[i].min && value <= ranges[i].max) return i;
    }

    return ranges.length - 1;
}

// ------------------------------------------------------
// Màu
// ------------------------------------------------------

function getDiseaseStyle(row) {
    const cfg = layerConfig[currentLayer];
    const value = num(row?.[cfg.field]);

    if (value <= 0) {
        return {
            fillColor: "#DCE3E8",
            fillOpacity: 0.48,
            color: "#AAB5BD",
            weight: 0.8
        };
    }

    const ranges = damageRanges;
    const idx = getDamageClass(value, ranges);

    return {
        fillColor: cfg.colors[Math.min(Math.max(idx, 0), cfg.colors.length - 1)],
        fillOpacity: 0.86,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getPhunStyle(row) {
    const v = num(row?.["PHUN_Vòng"]);

    if (v <= 0) {
        return {
            fillColor: "#DCE3E8",
            fillOpacity: 0.48,
            color: "#AAB5BD",
            weight: 0.8
        };
    }

    const idx = Math.min(Math.max(Math.ceil(v) - 1, 0), 5);
    return {
        fillColor: layerConfig.PHUN.colors[idx],
        fillOpacity: 0.82,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getKsgmStyle(row) {
    const count = num(row?.["KSGM_Cơ sở"]);
    const active = norm(row?.["KSGM_Trạng thái"]) === "đã triển khai";

    if (!active && count <= 0) {
        return {
            fillColor: "#DCE3E8",
            fillOpacity: 0.48,
            color: "#AAB5BD",
            weight: 0.8
        };
    }

    const idx = Math.min(Math.max(Math.ceil(count) - 1, 0), 5);

    return {
        fillColor: layerConfig.KSGM.colors[idx],
        fillOpacity: 0.82,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getDrugStyle(row) {
    const count = num(row?.["CSBBTTY_Cơ sở"]);

    if (count <= 0) {
        return {
            fillColor: "#DCE3E8",
            fillOpacity: 0.48,
            color: "#AAB5BD",
            weight: 0.8
        };
    }

    const idx = Math.min(Math.max(Math.ceil(count) - 1, 0), 5);

    return {
        fillColor: layerConfig.CSBBTTY.colors[idx],
        fillOpacity: 0.82,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getFeatureStyle(feature) {
    const row = getRow(feature);

    if (!row) {
        return {
            fillColor: "#DCE3E8",
            fillOpacity: 0.38,
            color: "#B7C0C7",
            weight: 0.75
        };
    }

    if (["DTLCP", "CGC", "VDNC", "DAI"].includes(currentLayer)) {
        return getDiseaseStyle(row);
    }

    if (currentLayer === "PHUN") return getPhunStyle(row);
    if (currentLayer === "KSGM") return getKsgmStyle(row);
    if (currentLayer === "CSBBTTY") return getDrugStyle(row);

    return {
        fillColor: "#DCE3E8",
        fillOpacity: 0.4,
        color: "#B7C0C7",
        weight: 0.75
    };
}

// ------------------------------------------------------
// Nhãn xã - chỉ hiện khi có số liệu, tự động theo zoom
// ------------------------------------------------------

const labelOffsets = {
    "Điện Biên Phủ": [0.004, 0],
    "Thanh Yên": [0.002, 0.004],
    "Thanh Nưa": [0.004, -0.004],
    "Thanh An": [0.002, 0],
    "Mường Phăng": [0.002, 0],
    "Na Sang": [0.002, 0],
    "Nà Tấu": [0.002, 0],
    "Mường Ảng": [0.002, 0],
    "Mường Lay": [0.002, 0],
    "Mường Chà": [0.002, 0],
    "Mường Nhé": [0.002, 0],
    "Sín Thầu": [0.002, 0]
};

function featureCenter(feature) {
    const temp = L.geoJSON(feature);
    const bounds = temp.getBounds();
    return bounds.isValid() ? bounds.getCenter() : null;
}

function labelVisibleAtZoom() {
    if (map.getZoom() >= 10) return true;
    if (map.getZoom() >= 9 && ["DTLCP", "CGC", "VDNC", "DAI"].includes(currentLayer)) {
        return true;
    }
    return false;
}

function renderLabels() {

    if (!map || !geojsonData) return;

    if (!labelLayer) {
        labelLayer = L.layerGroup().addTo(map);
    }

    labelLayer.clearLayers();

    // Hiển thị tên xã từ zoom 8.
    if (map.getZoom() < 8) return;

    const candidates = [];

    geojsonData.features.forEach(function(feature) {

        const row = getRow(feature);

        if (!row) return;

        const name = getName(feature);

        if (!name) return;

        const center = featureCenter(feature);

        if (!center) return;

        candidates.push({
            name,
            center
        });
    });

    const occupied = [];

    const offsets = [
        [0, 0],
        [18, 0],
        [-18, 0],
        [0, -18],
        [0, 18],
        [22, -15],
        [-22, -15],
        [22, 15],
        [-22, 15]
    ];

    candidates
        .sort((a, b) => a.name.length - b.name.length)
        .forEach(function(item) {

            const base = map.latLngToLayerPoint(item.center);

            const width =
                Math.max(48, item.name.length * 5.3);

            const height = 17;

            let selected = null;

            for (const offset of offsets) {

                const point = {
                    x: base.x + offset[0],
                    y: base.y + offset[1]
                };

                const box = {
                    left: point.x - width / 2,
                    right: point.x + width / 2,
                    top: point.y - height / 2,
                    bottom: point.y + height / 2
                };

                const collision = occupied.some(function(other) {
                    return !(
                        box.right + 3 < other.left ||
                        box.left - 3 > other.right ||
                        box.bottom + 3 < other.top ||
                        box.top - 3 > other.bottom
                    );
                });

                if (!collision) {
                    selected = { point, box };
                    break;
                }
            }

            if (!selected) return;

            occupied.push(selected.box);

            const latlng =
                map.layerPointToLatLng(selected.point);

            L.marker(latlng, {
                interactive: false,
                icon: L.divIcon({
                    className: "map-label-wrap",
                    html:
                        `<span class="map-label">${escapeHtml(item.name)}</span>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                })
            }).addTo(labelLayer);
        });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ------------------------------------------------------
// Chấm đỏ: xã đang có dịch
// ------------------------------------------------------

function renderDiseaseMarkers() {
    if (!diseaseMarkerLayer) {
        diseaseMarkerLayer = L.layerGroup().addTo(map);
    }

    diseaseMarkerLayer.clearLayers();

    const cfg = layerConfig[currentLayer];

    if (!cfg.status || !geojsonData) return;

    geojsonData.features.forEach(feature => {
        const row = getRow(feature);
        if (!row || !isActive(row, cfg)) return;

        const center = featureCenter(feature);
        if (!center) return;

        L.circleMarker(center, {
            radius: 4.5,
            color: "#FFFFFF",
            weight: 2.5,
            fillColor: "#E00000",
            fillOpacity: 1,
            opacity: 1,
            interactive: false
        }).addTo(diseaseMarkerLayer);
    });
}

// ------------------------------------------------------
// Panel bên phải
// ------------------------------------------------------

function showPanel(feature) {
    selectedFeature = feature;

    const row = getRow(feature);
    const name = getName(feature);

    const title = document.getElementById("panel-title");
    const panel = document.getElementById("info-panel");

    if (title) title.textContent = name || "Xã/phường";

    if (!panel) return;

    if (!row) {
        panel.innerHTML = `<div class="empty-panel"><p>Không có dữ liệu.</p></div>`;
        return;
    }

    let html = `<div class="info-block">
        <div class="info-district">${escapeHtml(name)}</div>
        <div class="info-layer">${escapeHtml(layerConfig[currentLayer].name)}</div>
    </div>`;

    if (currentLayer === "DTLCP") {
        html += infoRows([
            ["Trạng thái", row["DTLCP_Trạng thái"] || "--"],
            ["Ổ dịch", fmt(row["DTLCP_Ổ dịch"])],
            ["Tiêu hủy", `${fmt(row["DTLCP_Chết"])} con`],
            ["Khối lượng", `${fmt(row["DTLCP_Trọng lượng"])} kg`],
            ["Ngày cuối", formatDate(row["DTLCP_Ngày cuối"])]
        ]);
    }

    if (currentLayer === "CGC") {
        html += infoRows([
            ["Trạng thái", row["CGC_Trạng thái"] || "--"],
            ["Ổ dịch", fmt(row["CGC_Ổ dịch"])],
            ["Tiêu hủy", `${fmt(row["CGC_Chết"])} con`],
            ["Khối lượng", `${fmt(row["CGC_Trọng lượng"])} kg`],
            ["Ngày cuối", formatDate(row["CGC_Ngày cuối"])]
        ]);
    }

    if (currentLayer === "VDNC") {
        html += infoRows([
            ["Trạng thái", row["VDNC_Trạng thái"] || "--"],
            ["Ổ dịch", fmt(row["VDNC_Ổ dịch"])],
            ["Mắc", `${fmt(row["VDNC_Mắc"])} con`],
            ["Chết", `${fmt(row["VDNC_Chết"])} con`],
            ["Ngày cuối", formatDate(row["VDNC_Ngày cuối"])]
        ]);
    }

    if (currentLayer === "DAI") {
        html += infoRows([
            ["Trạng thái", row["DAI_Trạng thái"] || "--"],
            ["Ổ dịch", fmt(row["DAI_Ổ dịch"])],
            ["Chết", `${fmt(row["DAI_Chết"])} con`],
            ["Tiêu hủy", `${fmt(row["DAI_Tiêu hủy"])} con`],
            ["Ngày cuối", formatDate(row["DAI_Ngày cuối"])]
        ]);
    }

    if (currentLayer === "PHUN") {
        html += infoRows([
            ["Tiến độ", row["PHUN_Tiến độ"] || "--"],
            ["Số hộ", fmt(row["PHUN_Số hộ"])],
            ["Vòng", fmt(row["PHUN_Vòng"])],
            ["Diện tích", row["PHUN_Diện tích"] || "--"],
            ["Ngày", formatDate(row["PHUN_Ngày"])]
        ]);
    }

    if (currentLayer === "KSGM") {
        html += infoRows([
            ["Trạng thái", row["KSGM_Trạng thái"] || "--"],
            ["Số cơ sở", fmt(row["KSGM_Cơ sở"])]
        ]);
    }

    if (currentLayer === "CSBBTTY") {
        html += infoRows([
            ["Số cơ sở", fmt(row["CSBBTTY_Cơ sở"])]
        ]);
    }

    panel.innerHTML = html;
}

function infoRows(items) {
    return `<div class="info-table">
        ${items.map(([label, value]) => `
            <div class="info-row">
                <span>${escapeHtml(label)}</span>
                <b>${escapeHtml(value)}</b>
            </div>
        `).join("")}
    </div>`;
}

function clearPanel() {
    selectedFeature = null;

    const title = document.getElementById("panel-title");
    const panel = document.getElementById("info-panel");

    if (title) title.textContent = "Chưa chọn xã/phường";
    if (panel) {
        panel.innerHTML = `
            <div class="empty-panel">
                <i class="fa-solid fa-arrow-pointer"></i>
                <p>Nhấn vào một xã/phường trên bản đồ để xem thông tin chi tiết.</p>
            </div>
        `;
    }
}

function formatDate(value) {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("vi-VN");
}

// ------------------------------------------------------
// Legend
// ------------------------------------------------------

function updateLegend() {
    if (legendControl) {
        map.removeControl(legendControl);
        legendControl = null;
    }

    legendControl = L.control({ position: 'bottomright' });

    legendControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        const cfg = layerConfig[currentLayer];

        // Bệnh: giữ cách chú giải cũ, chỉ thay khoảng màu bằng Jenks động.
        if (['DTLCP', 'CGC', 'VDNC', 'DAI'].includes(currentLayer)) {
            const ranges = damageRanges;

            let html = `
                <h4>${escapeHtml(cfg.name)}</h4>

                <div class="legend-dot-row">
                    <span class="legend-red-dot"></span>
                    <span>Xã đang có dịch</span>
                </div>

                <div class="legend-dot-row">
                    <span class="legend-no-data"></span>
                    <span>0 xã không có dịch</span>
                </div>
            `;

            if (ranges.length) {
                html += `<hr><div class="legend-section-title">Mức độ thiệt hại</div>`;

                ranges.forEach((range, index) => {
                    const color = cfg.colors[Math.min(index, cfg.colors.length - 1)];
                    const label = range.min === range.max
                        ? `${fmt(range.min)} con`
                        : `${fmt(range.min)}–${fmt(range.max)} con`;

                    html += `
                        <div class="legend-row">
                            <i style="background:${color}"></i>
                            <span>${label}</span>
                        </div>
                    `;
                });
            } else {
                html += `<hr><div class="legend-empty">Chưa có số liệu thiệt hại</div>`;
            }

            div.innerHTML = html;
            L.DomEvent.disableClickPropagation(div);
            return div;
        }

        // Phun: giữ cách chú giải cũ, theo vòng.
        if (currentLayer === 'PHUN') {
            div.innerHTML = `
                <h4>Phun khử trùng</h4>
                <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>Vòng 1</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[1]}"></i><span>Vòng 2</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[2]}"></i><span>Vòng 3</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[3]}"></i><span>Vòng 4</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[4]}"></i><span>Vòng 5 trở lên</span></div>
                <hr>
                <div class="legend-row"><span class="legend-no-data"></span><span>Chưa triển khai</span></div>
            `;
            L.DomEvent.disableClickPropagation(div);
            return div;
        }

        // KSGM và CSBBTTY: giữ cách chú giải cũ theo số cơ sở.
        if (currentLayer === 'KSGM') {
            div.innerHTML = `
                <h4>Kiểm soát giết mổ</h4>
                <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>1 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[1]}"></i><span>2 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[2]}"></i><span>3 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[3]}"></i><span>4 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[4]}"></i><span>5 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[5]}"></i><span>6 cơ sở trở lên</span></div>
                <hr>
                <div class="legend-row"><span class="legend-no-data"></span><span>0 cơ sở / chưa triển khai</span></div>
            `;
            L.DomEvent.disableClickPropagation(div);
            return div;
        }

        div.innerHTML = `
            <h4>Cơ sở thuốc thú y</h4>
            <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>1 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[1]}"></i><span>2 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[2]}"></i><span>3 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[3]}"></i><span>4 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[4]}"></i><span>5 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[5]}"></i><span>6 cơ sở trở lên</span></div>
            <hr>
            <div class="legend-row"><span class="legend-no-data"></span><span>0 cơ sở</span></div>
        `;

        L.DomEvent.disableClickPropagation(div);
        return div;
    };

    legendControl.addTo(map);
}

// ------------------------------------------------------
// Render
// ------------------------------------------------------

function renderGeoJSON() {
    if (!map || !geojsonData) return;

    calculateDamageRanges();

    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
        geojsonLayer = null;
    }

    if (labelLayer) {
        map.removeLayer(labelLayer);
    }
    labelLayer = L.layerGroup().addTo(map);

    if (diseaseMarkerLayer) {
        map.removeLayer(diseaseMarkerLayer);
    }
    diseaseMarkerLayer = L.layerGroup().addTo(map);

    geojsonLayer = L.geoJSON(geojsonData, {
        style: getFeatureStyle,

        onEachFeature(feature, layer) {
            layer.on({
                mouseover() {
                    this.setStyle({
                        weight: 2.2,
                        color: "#243B53",
                        fillOpacity: 0.95
                    });
                    this.bringToFront();
                },

                mouseout() {
                    geojsonLayer.resetStyle(this);
                },

                click() {
                    showPanel(feature);
                }
            });
        }
    }).addTo(map);

    renderLabels();
    renderDiseaseMarkers();
    updateLegend();
    refreshMapTitle();

    if (selectedFeature) {
        const row = getRow(selectedFeature);
        if (row) showPanel(selectedFeature);
    }
}

function refreshMap() {
    if (!map || !geojsonData) return;
    renderGeoJSON();
}

// ------------------------------------------------------
// Load GeoJSON
// ------------------------------------------------------

async function loadGeoJSON() {
    const response = await fetch("data/dienbien_xa.geojson", {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error("Không đọc được GeoJSON: HTTP " + response.status);
    }

    const data = await response.json();

    if (!data || data.type !== "FeatureCollection") {
        throw new Error("GeoJSON phải là FeatureCollection.");
    }

    geojsonData = data;
    renderGeoJSON();

    const bounds =
        L.geoJSON(data).getBounds();

    if (bounds.isValid()) {

        setTimeout(function() {

            map.invalidateSize();

            map.fitBounds(
                bounds,
                {
                    padding: [30, 30],
                    maxZoom: 11
                }
            );

            renderLabels();

        }, 100);
    }
}

// ------------------------------------------------------
// Lớp nền
// ------------------------------------------------------

function setBasemap(mode) {
    if (!map) return;

    if (mode === "satellite") {
        if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
        if (!map.hasLayer(satelliteLayer)) map.addLayer(satelliteLayer);
        currentBasemap = "satellite";
    } else {
        if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
        if (!map.hasLayer(streetLayer)) map.addLayer(streetLayer);
        currentBasemap = "street";
    }

    document.getElementById("btnStreet")?.classList.toggle("active", mode === "street");
    document.getElementById("btnSatellite")?.classList.toggle("active", mode === "satellite");
}

// ------------------------------------------------------
// Điều khiển
// ------------------------------------------------------

function bindControls() {
    document.getElementById("layerSelect")?.addEventListener("change", e => {
        setLayer(e.target.value);
    });

    document.getElementById("btnStreet")?.addEventListener("click", () => {
        setBasemap("street");
    });

    document.getElementById("btnSatellite")?.addEventListener("click", () => {
        setBasemap("satellite");
    });

    document.getElementById("btnFullscreen")?.addEventListener("click", toggleFullscreen);

    document.getElementById("btnExport")?.addEventListener("click", exportMapImage);

    document.getElementById("btnRefresh")?.addEventListener("click", reloadData);

    document.getElementById("btnLocate")?.addEventListener("click", locateUser);

    document.getElementById("btnSearch")?.addEventListener("click", () => {
        searchFeature(document.getElementById("txtSearch")?.value || "");
    });

    document.getElementById("txtSearch")?.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            searchFeature(e.target.value);
        }
    });

    map.on("zoomend moveend", () => {
        renderLabels();
    });
}

function setLayer(layerName) {
    if (!layerConfig[layerName]) return;

    currentLayer = layerName;

    const select = document.getElementById("layerSelect");
    if (select) select.value = layerName;

    clearPanel();
    refreshMap();
}

function searchFeature(keyword) {
    const text = norm(keyword);
    if (!text || !geojsonData) return;

    const feature = geojsonData.features.find(f =>
        norm(getName(f)).includes(text)
    );

    if (!feature) {
        alert("Không tìm thấy xã/phường: " + keyword);
        return;
    }

    const layer = findLayer(feature);

    if (layer) {
        map.fitBounds(layer.getBounds(), {
            padding: [40, 40],
            maxZoom: 13
        });
    }

    showPanel(feature);
}

function findLayer(feature) {
    let found = null;

    if (geojsonLayer) {
        geojsonLayer.eachLayer(layer => {
            if (layer.feature === feature) found = layer;
        });
    }

    return found;
}

function locateUser() {
    if (!navigator.geolocation) {
        alert("Trình duyệt không hỗ trợ định vị.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            map.setView([lat, lng], 13);

            L.circleMarker([lat, lng], {
                radius: 6,
                color: "#FFFFFF",
                weight: 2,
                fillColor: "#1976D2",
                fillOpacity: 1
            }).addTo(map).bindPopup("Vị trí hiện tại").openPopup();
        },
        () => alert("Không thể lấy vị trí hiện tại.")
    );
}

function toggleFullscreen() {
    const container = document.querySelector(".main-map");

    if (!document.fullscreenElement) {
        container?.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }

    setTimeout(() => map.invalidateSize(), 300);
}

// ------------------------------------------------------
// Xuất ảnh: chụp nguyên khung bản đồ, gồm Legend + tiêu đề + tỷ lệ
// ------------------------------------------------------

async function exportMapImage() {
    const mapElement = document.getElementById("map");
    if (!mapElement || typeof html2canvas !== "function") {
        alert("Chưa sẵn sàng công cụ xuất ảnh.");
        return;
    }

    const button = document.getElementById("btnExport");
    if (button) button.classList.add("loading");

    try {
        // Chỉ ẩn cụm zoom khi xuất; giữ nguyên Legend + tiêu đề + tỷ lệ.
        const controls = mapElement.querySelectorAll(".leaflet-control-zoom");
        controls.forEach(el => el.classList.add("export-hide"));

        const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#F7F9FB",
            scale: 2,
            logging: false,
            imageTimeout: 15000
        });

        controls.forEach(el => el.classList.remove("export-hide"));

        const link = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);

        link.download =
            `WEBGIS_DienBien_${currentLayer}_${date}.png`;

        link.href = canvas.toDataURL("image/png");
        link.click();

    } catch (err) {
        console.error("Lỗi xuất ảnh:", err);
        alert(
            "Không xuất được ảnh. Nếu bản đồ vệ tinh bị chặn CORS, hãy chuyển sang Bản đồ đường phố rồi xuất lại."
        );
    } finally {
        mapElement
            .querySelectorAll(".export-hide")
            .forEach(el => el.classList.remove("export-hide"));

        if (button) button.classList.remove("loading");
    }
}

// ------------------------------------------------------
// Làm mới dữ liệu
// ------------------------------------------------------

async function reloadData() {
    try {
        if (typeof window.loadSheet === "function") {
            await window.loadSheet();
        }

        if (!geojsonData) {
            await loadGeoJSON();
        } else {
            refreshMap();
        }

        if (typeof window.updateDashboard === "function") {
            window.updateDashboard();
        }

    } catch (err) {
        console.error("Lỗi cập nhật dữ liệu:", err);
    }
}

// ------------------------------------------------------
// API khởi tạo - app.js gọi các hàm này theo đúng thứ tự:
// loadSheet -> loadGeoJSON -> dashboard.update
// ------------------------------------------------------

window.initMap = initMap;
window.loadGeoJSON = loadGeoJSON;
window.setLayer = setLayer;
window.reloadData = reloadData;
window.searchFeature = searchFeature;
window.exportCurrentMap = exportMapImage;
