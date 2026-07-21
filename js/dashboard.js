//======================================================
// DASHBOARD.JS
//======================================================

const dashboard = {

    update:function(){

        if(typeof sheetData==="undefined") return;

        const rows = Object.values(sheetData);

        const stat = {

            dtlcpXa:0,
            dtlcpCon:0,

            cgcXa:0,
            cgcCon:0,

            vdncXa:0,
            vdncMac:0,

            phunXa:0,
            phunHo:0,

            ksgm:0,

            csbbtty:0

        };

        rows.forEach(row=>{

            // DTLCP
            const dtlcp=Number(row["DTLCP_Chết"]||0);

            if(dtlcp>0){

                stat.dtlcpXa++;

                stat.dtlcpCon+=dtlcp;

            }

            // CGC
            const cgc=Number(row["CGC_Chết"]||0);

            if(cgc>0){

                stat.cgcXa++;

                stat.cgcCon+=cgc;

            }

            // VDNC
            const vdnc=Number(row["VDNC_Mắc"]||0);

            if(vdnc>0){

                stat.vdncXa++;

                stat.vdncMac+=vdnc;

            }

            // PHUN
            const phun=Number(row["PHUN_Số hộ"]||0);

            if(phun>0){

                stat.phunXa++;

                stat.phunHo+=phun;

            }

            // KSGM
            stat.ksgm+=Number(row["KSGM_Cơ sở"]||0);

            // CSBBTTY
            stat.csbbtty+=Number(row["CSBBTTY_Cơ sở"]||0);

        });

        setText("dbDTLCPXa",stat.dtlcpXa);

        setText("dbDTLCPCon",formatNumber(stat.dtlcpCon));

        setText("dbCGCXa",stat.cgcXa);

        setText("dbCGCCon",formatNumber(stat.cgcCon));

        setText("dbVDNCXa",stat.vdncXa);

        setText("dbVDNCMac",formatNumber(stat.vdncMac));

        setText("dbPhunXa",stat.phunXa);

        setText("dbPhunHo",formatNumber(stat.phunHo));

        setText("dbKSGM",formatNumber(stat.ksgm));

        setText("dbCSBBTTY",formatNumber(stat.csbbtty));

    }

};

//======================================================
// GÁN TEXT
//======================================================

function setText(id,value){

    const el=document.getElementById(id);

    if(el){

        el.textContent=value;

    }

}
