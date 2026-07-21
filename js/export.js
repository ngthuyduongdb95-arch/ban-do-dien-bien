function exportMap() {

    const mapDiv = document.getElementById("map");

    html2canvas(mapDiv, {
        useCORS: true,
        scale: 2
    }).then(canvas => {

        const link = document.createElement("a");

        const today = new Date().toISOString().slice(0,10);

        link.download = `Ban_do_${currentLayer}_${today}.png`;

        link.href = canvas.toDataURL("image/png");

        link.click();

    });

}
