// ======================================================
// DASHBOARD.JS
// Tổng quan theo đúng trường dữ liệu thực tế
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

    const dashboard = {
        update() {
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
                // ---------------- DTLCP ----------------
                if (hasHistory(
                    row,
                    "DTLCP_Trạng thái",
                    "DTLCP_Ổ dịch",
                    "DTLCP_Chết"
                )) stat.dtlcpXa++;

                if (isActive(row, "DTLCP_Trạng thái")) stat.dtlcpDang++;
                stat.dtlcpCon += numberValue(row["DTLCP_Chết"]);
                stat.dtlcpKg += numberValue(row["DTLCP_Trọng lượng"]);

                // ---------------- CGC ----------------
                if (hasHistory(
                    row,
                    "CGC_Trạng thái",
                    "CGC_Ổ dịch",
                    "CGC_Chết"
                )) stat.cgcXa++;

                if (isActive(row, "CGC_Trạng thái")) stat.cgcDang++;
                stat.cgcCon += numberValue(row["CGC_Chết"]);
                stat.cgcKg += numberValue(row["CGC_Trọng lượng"]);

                // ---------------- VDNC ----------------
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

                // ---------------- DẠI ----------------
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

                // ---------------- PHUN ----------------
                const phunHo = numberValue(row["PHUN_Số hộ"]);
                const phunVong = numberValue(row["PHUN_Vòng"]);
                if (phunHo > 0 || phunVong > 0 || norm(row["PHUN_Tiến độ"]) !== "") {
                    stat.phunXa++;
                }
                stat.phunHo += phunHo;
                stat.phunVong += phunVong;

                // ---------------- KSGM ----------------
                const ksgmCoSo = numberValue(row["KSGM_Cơ sở"]);
                if (norm(row["KSGM_Trạng thái"]) === "đã triển khai") {
                    stat.ksgmXa++;
                } else if (ksgmCoSo > 0) {
                    stat.ksgmXa++;
                }
                stat.ksgmCoSo += ksgmCoSo;

                // ---------------- Cơ sở buôn bán thuốc thú y ----------------
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
            setText(
                "sideOverviewKg",
                stat.dtlcpKg + stat.cgcKg
            );
        }
    };

    window.dashboard = dashboard;

    window.updateDashboard = function () {
        dashboard.update();
    };
})();
