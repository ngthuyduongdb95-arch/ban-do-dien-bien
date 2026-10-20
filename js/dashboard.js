
// ======================================================
// DASHBOARD.JS
// Tổng quan và xem trước, tải bảng số liệu theo từng KPI
// ======================================================

(function () {
    "use strict";

    function numberValue(value) {
        if (value === null || value === undefined || value === "") return 0;
        if (typeof value === "number") return Number.isFinite(value) ? value : 0;

        let s = String(value).trim().replace(/[^\d,.-]/g, "");
        if (!s) return 0;

        if (s.includes(".") && s.includes(",")) {
            s = s.replace(/\./g, "").replace(",", ".");
        } else if (s.includes(",")) {
            const parts = s.split(",");
            s = parts.length === 2 && parts[1].length <= 2
                ? parts[0] + "." + parts[1]
                : s.replace(/,/g, "");
        } else if ((s.match(/\./g) || []).length > 1) {
            s = s.replace(/\./g, "");
        }

        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
    }

    function fmt(value) {
        return numberValue(value).toLocaleString("vi-VN", {
            maximumFractionDigits: 2
        });
    }

    function norm(value) {
        return String(value ?? "").trim().toLowerCase();
    }

    function isActive(row, field) {
        return norm(row[field]) === "đang có dịch";
    }

    function hasHistory(row, statusField, outbreakField, valueField, deathField) {
        if (!row) return false;

        const status = norm(row[statusField]);
        const outbreak = numberValue(row[outbreakField]);
        const value = numberValue(row[valueField]);
        const death = numberValue(row[deathField]);

        return (
            status === "đang có dịch" ||
            status === "đã hết dịch" ||
            outbreak > 0 ||
            value > 0 ||
            death > 0
        );
    }

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

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ======================================================
    // BIỂU ĐỒ DASHBOARD
    // ======================================================

    const dashboardCharts = {};

    function renderDashboardCharts(rows) {
        if (typeof window.Chart === "undefined") return;

        const canvasXa = document.getElementById("chartDamageXa");
        const canvasBenh = document.getElementById("chartSpecies");

        if (!canvasXa || !canvasBenh || !Array.isArray(rows)) return;

        const diseases = [
            { label: "DTLCP", field: "DTLCP_Chết" },
            { label: "Cúm gia cầm", field: "CGC_Chết" },
            { label: "VDNC", field: "VDNC_Chết" },
            { label: "Dại", field: "DAI_Chết" }
        ];

        const getCommuneName = row =>
            row["Tên xã/phường"] ||
            row["Tên xã"] ||
            row["Xã"] ||
            row["Xa"] ||
            row["TEN_XA"] ||
            row["TENXA"] ||
            "Chưa xác định";

        const labels = rows.map(getCommuneName);

        const communeDatasets = diseases.map(disease => ({
            label: disease.label,
            data: rows.map(row => numberValue(row[disease.field])),
            borderWidth: 1
        }));

        if (dashboardCharts.xa) dashboardCharts.xa.destroy();

        if (typeof window.Chart.getChart === "function") {
            const oldChartXa = window.Chart.getChart(canvasXa);
            if (oldChartXa) oldChartXa.destroy();
        }

        dashboardCharts.xa = new window.Chart(canvasXa, {
            type: "bar",
            data: {
                labels,
                datasets: communeDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            autoSkip: true,
                            maxRotation: 60,
                            minRotation: 0
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Số con chết ghi nhận"
                        }
                    }
                }
            }
        });

        const totals = diseases.map(disease =>
            rows.reduce(
                (sum, row) => sum + numberValue(row[disease.field]),
                0
            )
        );

        if (dashboardCharts.benh) dashboardCharts.benh.destroy();

        if (typeof window.Chart.getChart === "function") {
            const oldChartBenh = window.Chart.getChart(canvasBenh);
            if (oldChartBenh) oldChartBenh.destroy();
        }

        dashboardCharts.benh = new window.Chart(canvasBenh, {
            type: "bar",
            data: {
                labels: diseases.map(disease => disease.label),
                datasets: [{
                    label: "Số con chết ghi nhận",
                    data: totals,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Số con chết ghi nhận"
                        }
                    }
                }
            }
        });
    }

    // ======================================================
    // CẤU HÌNH BẢNG DỮ LIỆU CHO CÁC KPI
    // ======================================================

    const KPI_EXPORTS = {
        "card-dtlcp": {
            name: "Du_lieu_DTLCP",
            title: "Dịch tả lợn châu Phi",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "DTLCP_Trạng thái"],
                ["Số ổ dịch", "DTLCP_Ổ dịch"],
                ["Số con tiêu hủy", "DTLCP_Chết"],
                ["Khối lượng (kg)", "DTLCP_Trọng lượng"],
                ["Ngày cuối ghi nhận", "DTLCP_Ngày cuối"],
                ["Số ngày", "DTLCP_Số ngày"]
            ],
            include: row =>
                hasHistory(row, "DTLCP_Trạng thái", "DTLCP_Ổ dịch", "DTLCP_Chết")
        },

        "card-cgc": {
            name: "Du_lieu_CGC",
            title: "Cúm gia cầm",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "CGC_Trạng thái"],
                ["Số ổ dịch", "CGC_Ổ dịch"],
                ["Số con tiêu hủy", "CGC_Chết"],
                ["Khối lượng (kg)", "CGC_Trọng lượng"],
                ["Ngày cuối ghi nhận", "CGC_Ngày cuối"],
                ["Số ngày", "CGC_Số ngày"]
            ],
            include: row =>
                hasHistory(row, "CGC_Trạng thái", "CGC_Ổ dịch", "CGC_Chết")
        },

        "card-vdnc": {
            name: "Du_lieu_VDNC",
            title: "Viêm da nổi cục",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "VDNC_Trạng thái"],
                ["Số ổ dịch", "VDNC_Ổ dịch"],
                ["Số con mắc", "VDNC_Mắc"],
                ["Số con chết", "VDNC_Chết"],
                ["Khối lượng (kg)", "VDNC_Trọng lượng"],
                ["Ngày cuối ghi nhận", "VDNC_Ngày cuối"],
                ["Số ngày", "VDNC_Số ngày"]
            ],
            include: row =>
                hasHistory(
                    row,
                    "VDNC_Trạng thái",
                    "VDNC_Ổ dịch",
                    "VDNC_Mắc",
                    "VDNC_Chết"
                )
        },

        "card-dai": {
            name: "Du_lieu_Benh_Dai",
            title: "Bệnh dại",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "DAI_Trạng thái"],
                ["Số ổ dịch", "DAI_Ổ dịch"],
                ["Số con mắc", "DAI_Mắc"],
                ["Số con chết", "DAI_Chết"],
                ["Số con tiêu hủy", "DAI_Tiêu hủy"],
                ["Ngày cuối ghi nhận", "DAI_Ngày cuối"],
                ["Số ngày", "DAI_Số ngày"]
            ],
            include: row =>
                hasHistory(
                    row,
                    "DAI_Trạng thái",
                    "DAI_Ổ dịch",
                    "DAI_Chết",
                    "DAI_Tiêu hủy"
                ) || numberValue(row["DAI_Mắc"]) > 0
        },

        "card-phun": {
            name: "Du_lieu_Phun_phong",
            title: "Thực hiện tháng tiêu độc, khử trùng",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Tiến độ", "PHUN_Tiến độ"],
                ["Số vòng", "PHUN_Vòng"],
                ["Số hộ", "PHUN_Số hộ"],
                ["Diện tích", "PHUN_Diện tích"],
                ["Hóa chất", "PHUN_Hóa chất"],
                ["Ngày thực hiện", "PHUN_Ngày"]
            ],
            include: row =>
                numberValue(row["PHUN_Số hộ"]) > 0 ||
                numberValue(row["PHUN_Vòng"]) > 0 ||
                norm(row["PHUN_Tiến độ"]) !== ""
        },

        "card-ksgm": {
            name: "Du_lieu_KSGM",
            title: "Kiểm soát giết mổ",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái triển khai", "KSGM_Trạng thái"],
                ["Số cơ sở", "KSGM_Cơ sở"]
            ],
            include: row =>
                norm(row["KSGM_Trạng thái"]) !== "" ||
                numberValue(row["KSGM_Cơ sở"]) > 0
        },

        "card-drug": {
            name: "Du_lieu_Co_so_Thuoc_Thu_Y",
            title: "Cơ sở thuốc thú y",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Số cơ sở", "CSBBTTY_Cơ sở"]
            ],
            include: row => numberValue(row["CSBBTTY_Cơ sở"]) > 0
        }
    };

    // ======================================================
    // THÊM NÚT XEM TRƯỚC VÀO CÁC THẺ KPI
    // ======================================================

    function installKpiDownloadButtons() {
        installKpiPreviewStyles();

        Object.keys(KPI_EXPORTS).forEach(className => {
            const card = document.querySelector(".summary-card." + className);
            if (!card || card.querySelector(".kpi-download-btn")) return;

            const cfg = KPI_EXPORTS[className];
            const btn = document.createElement("button");

            btn.type = "button";
            btn.className = "kpi-download-btn";
            btn.innerHTML =
                '<i class="fa-solid fa-table-list" aria-hidden="true"></i>' +
                '<span>Xem trước bảng số liệu</span>';

            btn.title = "Xem trước bảng số liệu của " + cfg.title;
            btn.addEventListener("click", () => openKpiPreview(cfg));
            card.appendChild(btn);
        });
    }

    // ======================================================
    // GIAO DIỆN XEM TRƯỚC
    // ======================================================

    function installKpiPreviewStyles() {
        if (document.getElementById("kpi-preview-style")) return;

        const style = document.createElement("style");
        style.id = "kpi-preview-style";

        style.textContent = `
            .kpi-download-btn {
                display:flex;
                align-items:center;
                justify-content:center;
                gap:6px;
                width:100%;
                margin-top:8px;
                padding:7px 8px;
                border:1px solid #d7e0e7;
                border-radius:7px;
                background:#f8fafc;
                color:#334b5d;
                font-size:11px;
                line-height:15px;
                font-weight:700;
                cursor:pointer;
            }
            .kpi-download-btn:hover {
                background:#eaf3f8;
                border-color:#9db8c8;
            }
            .kpi-preview-overlay {
                position:fixed;
                inset:0;
                z-index:99999;
                background:rgba(15,23,42,.62);
                display:flex;
                align-items:center;
                justify-content:center;
                padding:16px;
            }
            .kpi-preview-modal {
                width:min(1180px,100%);
                max-height:92vh;
                background:#fff;
                color:#1f2937;
                border-radius:12px;
                box-shadow:0 18px 60px rgba(0,0,0,.28);
                display:flex;
                flex-direction:column;
                overflow:hidden;
                font-family:Arial,sans-serif;
            }
            .kpi-preview-head {
                display:flex;
                align-items:flex-start;
                justify-content:space-between;
                gap:16px;
                padding:18px 20px;
                border-bottom:1px solid #e5e7eb;
            }
            .kpi-preview-title {
                font-size:19px;
                font-weight:700;
                margin:0 0 5px;
                color:#17384e;
            }
            .kpi-preview-subtitle {
                font-size:12px;
                color:#64748b;
                margin:0;
            }
            .kpi-preview-close {
                border:0;
                background:transparent;
                color:#64748b;
                font-size:25px;
                cursor:pointer;
                line-height:1;
                padding:0 3px;
            }
            .kpi-preview-toolbar {
                display:flex;
                gap:10px;
                align-items:center;
                justify-content:space-between;
                padding:12px 20px;
                flex-wrap:wrap;
            }
            .kpi-preview-search {
                box-sizing:border-box;
                min-width:220px;
                max-width:420px;
                flex:1;
                padding:9px 11px;
                border:1px solid #cbd5e1;
                border-radius:7px;
                font-size:13px;
                color:#1f2937;
                background:#fff;
            }
            .kpi-preview-count {
                font-size:12px;
                color:#475569;
            }
            .kpi-preview-table-wrap {
                overflow:auto;
                min-height:120px;
                max-height:calc(92vh - 245px);
                padding:0 20px;
            }
            .kpi-preview-table {
                border-collapse:collapse;
                width:100%;
                font-size:12px;
                white-space:nowrap;
            }
            .kpi-preview-table th {
                position:sticky;
                top:0;
                background:#eef4f8;
                color:#24465a;
                font-weight:700;
                text-align:left;
                z-index:1;
            }
            .kpi-preview-table th,
            .kpi-preview-table td {
                border:1px solid #e2e8f0;
                padding:9px 10px;
            }
            .kpi-preview-table tbody tr:nth-child(even) {
                background:#f8fafc;
            }
            .kpi-preview-empty {
                text-align:center;
                color:#64748b;
                padding:28px!important;
            }
            .kpi-preview-footer {
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                flex-wrap:wrap;
                padding:14px 20px;
                border-top:1px solid #e5e7eb;
                margin-top:12px;
            }
            .kpi-preview-pages {
                display:flex;
                align-items:center;
                gap:8px;
                font-size:12px;
                color:#475569;
            }
            .kpi-preview-action {
                border:1px solid #cbd5e1;
                border-radius:7px;
                background:#fff;
                color:#334155;
                padding:8px 12px;
                font-size:12px;
                font-weight:700;
                cursor:pointer;
            }
            .kpi-preview-action:disabled {
                opacity:.4;
                cursor:not-allowed;
            }
            .kpi-preview-download {
                border-color:#176b48;
                background:#176b48;
                color:#fff;
            }
            .kpi-preview-download:hover {
                background:#10573a;
            }
            @media(max-width:600px) {
                .kpi-preview-overlay { padding:6px; }
                .kpi-preview-modal { max-height:96vh; }
                .kpi-preview-head { padding:14px; }
                .kpi-preview-title { font-size:16px; }
                .kpi-preview-toolbar,
                .kpi-preview-footer { padding:10px 14px; }
                .kpi-preview-table-wrap {
                    padding:0 10px;
                    max-height:calc(96vh - 270px);
                }
                .kpi-preview-search {
                    min-width:100%;
                    max-width:none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function getFieldValue(row, fieldKey) {
        if (fieldKey === "Tên xã") {
            return row["Tên xã"] ||
                row["Tên xã/phường"] ||
                row["Xã"] ||
                row["Xa"] ||
                row["TEN_XA"] ||
                row["TENXA"] ||
                "";
        }

        return row[fieldKey] === null || row[fieldKey] === undefined
            ? ""
            : row[fieldKey];
    }

    // ======================================================
    // TẢI CSV
    // ======================================================

    function csvCell(value) {
        let s = value === null || value === undefined ? "" : String(value);

        // Tránh nội dung được hiểu là công thức khi mở bằng bảng tính.
        if (/^[=+@]/.test(s) || /^-[^0-9]/.test(s)) s = "'" + s;

        return '"' + s.replace(/"/g, '""') + '"';
    }

    function downloadKpiCsv(cfg, filteredRows) {
        const rows = Array.isArray(filteredRows) ? filteredRows : [];

        if (!rows.length) {
            alert("Không có dữ liệu để tải xuống.");
            return;
        }

        const lines = [
            cfg.fields.map(field => csvCell(field[0])).join(";")
        ];

        rows.forEach(row => {
            lines.push(
                cfg.fields
                    .map(field => csvCell(getFieldValue(row, field[1])))
                    .join(";")
            );
        });

        // BOM UTF-8 để Excel hiển thị tiếng Việt đúng.
        const blob = new Blob(
            ["\uFEFF" + lines.join("\r\n")],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date();
        const stamp =
            date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, "0") +
            String(date.getDate()).padStart(2, "0");

        link.href = url;
        link.download = cfg.name + "_" + stamp + ".csv";
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // ======================================================
    // MỞ BẢNG XEM TRƯỚC
    // ======================================================

    function openKpiPreview(cfg) {
        const sourceRows = getRows();

        if (!sourceRows.length) {
            alert("Chưa nhận được dữ liệu từ Google Sheets. Vui lòng tải lại trang rồi thử lại.");
            return;
        }

        const rows = sourceRows.filter(row => cfg.include(row));

        if (!rows.length) {
            alert("Chưa có dữ liệu để xem trước cho KPI " + cfg.title + ".");
            return;
        }

        const overlay = document.createElement("div");
        overlay.className = "kpi-preview-overlay";

        const modal = document.createElement("section");
        modal.className = "kpi-preview-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", "Xem trước " + cfg.title);

        const head = document.createElement("div");
        head.className = "kpi-preview-head";

        const titleWrap = document.createElement("div");
        const title = document.createElement("h2");
        title.className = "kpi-preview-title";
        title.textContent = "Bảng số liệu — " + cfg.title;

        const subtitle = document.createElement("p");
        subtitle.className = "kpi-preview-subtitle";
        subtitle.textContent =
            "Dữ liệu lấy từ nguồn WebGIS hiện đang sử dụng. Kiểm tra trước khi tải.";

        titleWrap.append(title, subtitle);

        const closeTop = document.createElement("button");
        closeTop.type = "button";
        closeTop.className = "kpi-preview-close";
        closeTop.setAttribute("aria-label", "Đóng cửa sổ xem trước");
        closeTop.textContent = "×";

        head.append(titleWrap, closeTop);

        const toolbar = document.createElement("div");
        toolbar.className = "kpi-preview-toolbar";

        const search = document.createElement("input");
        search.type = "search";
        search.className = "kpi-preview-search";
        search.placeholder = "Tìm trong bảng số liệu...";
        search.setAttribute("aria-label", "Tìm trong bảng số liệu");

        const count = document.createElement("div");
        count.className = "kpi-preview-count";

        toolbar.append(search, count);

        const tableWrap = document.createElement("div");
        tableWrap.className = "kpi-preview-table-wrap";

        const table = document.createElement("table");
        table.className = "kpi-preview-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");

        cfg.fields.forEach(field => {
            const th = document.createElement("th");
            th.textContent = field[0];
            headRow.appendChild(th);
        });

        thead.appendChild(headRow);

        const tbody = document.createElement("tbody");
        table.append(thead, tbody);
        tableWrap.appendChild(table);

        const footer = document.createElement("div");
        footer.className = "kpi-preview-footer";

        const pages = document.createElement("div");
        pages.className = "kpi-preview-pages";

        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "kpi-preview-action";
        prev.textContent = "‹ Trước";

        const pageLabel = document.createElement("span");

        const next = document.createElement("button");
        next.type = "button";
        next.className = "kpi-preview-action";
        next.textContent = "Sau ›";

        pages.append(prev, pageLabel, next);

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";

        const closeBottom = document.createElement("button");
        closeBottom.type = "button";
        closeBottom.className = "kpi-preview-action";
        closeBottom.textContent = "Đóng";

        const download = document.createElement("button");
        download.type = "button";
        download.className = "kpi-preview-action kpi-preview-download";
        download.textContent = "Tải toàn bộ bảng CSV";

        actions.append(closeBottom, download);
        footer.append(pages, actions);
        modal.append(head, toolbar, tableWrap, footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const pageSize = 10;
        let currentPage = 1;
        let visibleRows = rows.slice();

        function closeModal() {
            document.removeEventListener("keydown", onKeyDown);
            overlay.remove();
        }

        function onKeyDown(event) {
            if (event.key === "Escape") closeModal();
        }

        function renderTable() {
            const query = norm(search.value);

            visibleRows = rows.filter(row => {
                if (!query) return true;

                return cfg.fields.some(field =>
                    norm(getFieldValue(row, field[1])).includes(query)
                );
            });

            const pageCount = Math.max(
                1,
                Math.ceil(visibleRows.length / pageSize)
            );

            currentPage = Math.min(currentPage, pageCount);

            const start = (currentPage - 1) * pageSize;
            const pageRows = visibleRows.slice(start, start + pageSize);

            tbody.replaceChildren();

            if (!pageRows.length) {
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.colSpan = cfg.fields.length;
                td.className = "kpi-preview-empty";
                td.textContent = "Không tìm thấy dòng dữ liệu phù hợp.";
                tr.appendChild(td);
                tbody.appendChild(tr);
            } else {
                pageRows.forEach(row => {
                    const tr = document.createElement("tr");

                    cfg.fields.forEach(field => {
                        const td = document.createElement("td");
                        td.textContent = String(getFieldValue(row, field[1]));
                        tr.appendChild(td);
                    });

                    tbody.appendChild(tr);
                });
            }

            count.textContent =
                "Tổng " + rows.length.toLocaleString("vi-VN") +
                " dòng; đang hiển thị " +
                visibleRows.length.toLocaleString("vi-VN") + " dòng sau lọc.";

            pageLabel.textContent =
                "Trang " + currentPage + "/" + pageCount;

            prev.disabled = currentPage <= 1;
            next.disabled = currentPage >= pageCount;
        }

        closeTop.addEventListener("click", closeModal);
        closeBottom.addEventListener("click", closeModal);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeModal();
        });

        search.addEventListener("input", () => {
            currentPage = 1;
            renderTable();
        });

        prev.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        next.addEventListener("click", () => {
            currentPage++;
            renderTable();
        });

        // Tải toàn bộ dữ liệu của KPI, không chỉ trang đang xem.
        download.addEventListener("click", () => downloadKpiCsv(cfg, rows));

        document.addEventListener("keydown", onKeyDown);
        renderTable();
        closeTop.focus();
    }

    // ======================================================
    // CẬP NHẬT DASHBOARD
    // ======================================================

    const dashboard = {
        update() {
            installKpiDownloadButtons();

            const rows = getRows();
            if (!rows.length) return;

            const stat = {
                dtlcpXa: 0, dtlcpDang: 0, dtlcpCon: 0, dtlcpKg: 0,
                cgcXa: 0, cgcDang: 0, cgcCon: 0, cgcKg: 0,
                vdncXa: 0, vdncDang: 0, vdncMac: 0, vdncChet: 0,
                daiXa: 0, daiDang: 0, daiChet: 0, daiTieuHuy: 0,
                phunXa: 0, phunHo: 0, phunVong: 0,
                ksgmXa: 0, ksgmCoSo: 0,
                csbbtty: 0
            };

            rows.forEach(row => {
                // DỊCH TẢ LỢN CHÂU PHI
                if (hasHistory(
                    row,
                    "DTLCP_Trạng thái",
                    "DTLCP_Ổ dịch",
                    "DTLCP_Chết"
                )) stat.dtlcpXa++;

                if (isActive(row, "DTLCP_Trạng thái")) stat.dtlcpDang++;
                stat.dtlcpCon += numberValue(row["DTLCP_Chết"]);
                stat.dtlcpKg += numberValue(row["DTLCP_Trọng lượng"]);

                // CÚM GIA CẦM
                if (hasHistory(
                    row,
                    "CGC_Trạng thái",
                    "CGC_Ổ dịch",
                    "CGC_Chết"
                )) stat.cgcXa++;

                if (isActive(row, "CGC_Trạng thái")) stat.cgcDang++;
                stat.cgcCon += numberValue(row["CGC_Chết"]);
                stat.cgcKg += numberValue(row["CGC_Trọng lượng"]);

                // VIÊM DA NỔI CỤC
                if (hasHistory(
                    row,
                    "VDNC_Trạng thái",
                    "VDNC_Ổ dịch",
                    "VDNC_Mắc",
                    "VDNC_Chết"
                )) stat.vdncXa++;

                if (isActive(row, "VDNC_Trạng thái")) stat.vdncDang++;
                stat.vdncMac += numberValue(row["VDNC_Mắc"]);
                stat.vdncChet += numberValue(row["VDNC_Chết"]);

                // BỆNH DẠI
                if (hasHistory(
                    row,
                    "DAI_Trạng thái",
                    "DAI_Ổ dịch",
                    "DAI_Chết",
                    "DAI_Tiêu hủy"
                )) stat.daiXa++;

                if (isActive(row, "DAI_Trạng thái")) stat.daiDang++;
                stat.daiChet += numberValue(row["DAI_Chết"]);
                stat.daiTieuHuy += numberValue(row["DAI_Tiêu hủy"]);

                // PHUN PHÒNG
                const phunHo = numberValue(row["PHUN_Số hộ"]);
                const phunVong = numberValue(row["PHUN_Vòng"]);

                if (
                    phunHo > 0 ||
                    phunVong > 0 ||
                    norm(row["PHUN_Tiến độ"]) !== ""
                ) stat.phunXa++;

                stat.phunHo += phunHo;
                stat.phunVong += phunVong;

                // KIỂM SOÁT GIẾT MỔ
                const ksgmCoSo = numberValue(row["KSGM_Cơ sở"]);

                if (norm(row["KSGM_Trạng thái"]) === "đã triển khai") {
                    stat.ksgmXa++;
                } else if (ksgmCoSo > 0) {
                    stat.ksgmXa++;
                }

                stat.ksgmCoSo += ksgmCoSo;

                // CƠ SỞ THUỐC THÚ Y
                stat.csbbtty += numberValue(row["CSBBTTY_Cơ sở"]);
            });

            setText("dbDTLCPXa", fmt(stat.dtlcpXa));
            setText("dbDTLCPDang", fmt(stat.dtlcpDang));
            setText("dbDTLCPCon", fmt(stat.dtlcpCon));
            setText("dbDTLCPKg", fmt(stat.dtlcpKg));

            setText("dbCGCXa", fmt(stat.cgcXa));
            setText("dbCGCDang", fmt(stat.cgcDang));
            setText("dbCGCCon", fmt(stat.cgcCon));
            setText("dbCGCKg", fmt(stat.cgcKg));

            setText("dbVDNCXa", fmt(stat.vdncXa));
            setText("dbVDNCDang", fmt(stat.vdncDang));
            setText("dbVDNCMac", fmt(stat.vdncMac));
            setText("dbVDNChet", fmt(stat.vdncChet));

            setText("dbDAIXa", fmt(stat.daiXa));
            setText("dbDAIDang", fmt(stat.daiDang));
            setText("dbDAIChet", fmt(stat.daiChet));
            setText("dbDAITieuHuy", fmt(stat.daiTieuHuy));

            setText("dbPhunXa", fmt(stat.phunXa));
            setText("dbPhunHo", fmt(stat.phunHo));
            setText("dbPhunVong", fmt(stat.phunVong));

            setText("dbKSGMXa", fmt(stat.ksgmXa));
            setText("dbKSGMCoSo", fmt(stat.ksgmCoSo));

            setText("dbCSBBTTY", fmt(stat.csbbtty));

            // Tổng quan nhỏ ở sidebar
            setText("sideOverviewXa", rows.length);
            setText(
                "sideOverviewDang",
                stat.dtlcpDang + stat.cgcDang + stat.vdncDang + stat.daiDang
            );
            setText(
                "sideOverviewCon",
                stat.dtlcpCon + stat.cgcCon + stat.vdncMac + stat.daiChet
            );
            setText("sideOverviewKg", stat.dtlcpKg + stat.cgcKg);

            // Chỉ cập nhật biểu đồ khi các canvas tồn tại.
            renderDashboardCharts(rows);
        }
    };

    window.dashboard = dashboard;

    window.updateDashboard = function () {
        dashboard.update();
    };
})();
