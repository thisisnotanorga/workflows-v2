// curl.js

function curl(url) {
    var term = this;

    $.ajax({
        url: `https://proxy.douxx.tech?url=${url}`,
        method: 'GET',
        success: function (data) {
            term.echo(data);
        },
        error: function (xhr, status, error) {
            term.error(`Error: ${error}`);
        }
    });
}

