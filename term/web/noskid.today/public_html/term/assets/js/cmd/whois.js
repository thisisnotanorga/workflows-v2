// whois.js

function whois(target) {
    var term = this;

    $.ajax({
        url: `http://ip-api.com/json/${target}`,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            term.echo(`WHOIS Information for ${target}:\n`);
            term.echo(`IP Address: ${data.query}`);
            term.echo(`Location: ${data.city}, ${data.regionName}, ${data.country}`);
            term.echo(`ISP: ${data.isp}`);
            term.echo(`AS: ${data.as}`);
            term.echo(`Organization: ${data.org}`);
            term.echo(`Latitude/Longitude: ${data.lat}/${data.lon}`);
            term.echo(`ZIP Code: ${data.zip}`);
            term.echo(`Timezone: ${data.timezone}`);
            term.echo(`Region: ${data.region}`);
            term.echo(`Proxy: ${data.proxy}`);
            term.echo(`Reverse DNS: ${data.reverse}`);
            term.echo(`Mobile: ${data.mobile}`);
            term.echo(`Hosting: ${data.hosting}`);
        },
        error: function () {
            term.error('Error retrieving WHOIS information.');
        }
    });
}
