//======================================================
// DASHBOARD.JS
//======================================================

//==============================
// LẤY DANH SÁCH DỮ LIỆU
//==============================

function getRows(){

    if(!window.sheetData) return [];

    return sheetData;

}

//==============================
// ĐẾM SỐ XÃ
//==============================

function countCommunes(field){

    return getRows().filter(r=>{

        return Number(r[field])>0;

    }).length;

}

//==============================
// TÍNH TỔNG
//==============================

function sum(field){

    return getRows().reduce((t,row)=>{

        return t + Number(row[field]||0);

    },0);

}//==============================
// TẠO CARD
//==============================

function dashboardCard(icon,title,value,sub,color){

    return `

    <div class="dashboard-card">

        <div class="dashboard-icon"
            style="background:${color}">

            ${icon}

        </div>

        <div class="dashboard-body">

            <h4>${title}</h4>

            <div class="dashboard-value">

                ${value}

            </div>

            <small>${sub}</small>

        </div>

    </div>

    `;

}//==============================
// CẬP NHẬT DASHBOARD
//==============================

function updateDashboard(){

    const div=document.getElementById("dashboard");

    if(!div) return;

    let html="";

    html+=dashboardCard(

        "🐷",

        "DTLCP",

        countCommunes("DTLCP_Ổ dịch"),

        `${formatNumber(sum("DTLCP_Chết"))} con`,

        "#E53935"

    );

    html+=dashboardCard(

        "🐔",

        "CGC",

        countCommunes("CGC_Ổ dịch"),

        `${formatNumber(sum("CGC_Chết"))} con`,

        "#FB8C00"

    );

    html+=dashboardCard(

        "🐄",

        "VDNC",

        countCommunes("VDNC_Ổ dịch"),

        `${formatNumber(sum("VDNC_Mắc"))} con mắc`,

        "#8E24AA"

    );

    html+=dashboardCard(

        "🧴",

        "PHUN",

        countCommunes("PHUN_Số hộ"),

        `${formatNumber(sum("PHUN_Số hộ"))} hộ`,

        "#00ACC1"

    );

    html+=dashboardCard(

        "🏭",

        "KSGM",

        sum("KSGM_Cơ sở"),

        "cơ sở",

        "#8D6E63"

    );

    html+=dashboardCard(

        "💊",

        "CSBBTTY",

        sum("CSBBTTY_Cơ sở"),

        "cơ sở",

        "#43A047"

    );

    div.innerHTML=html;

}
