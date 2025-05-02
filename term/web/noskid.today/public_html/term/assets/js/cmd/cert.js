function cert(name) {

    $.ajax({
        url: `https://noskid.today/api/downcert?name=${encodeURIComponent(name)}&percentage=100.00`,
        method: 'GET',
        success: function (data) {
            var link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([data], { type: 'image/png' }));
            link.download = `cert_${name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        error: function (xhr, status, error) {
            term.error(`Error: ${error}`);
        }
    });
}

