$(document).ready(function() {
    if (!getCookie('cookieConsent')) {
        $('#cookie-popup').show();
    }

    $('#cookie-learn-more').click(function() {
      window.location.href = 'https://www.allaboutcookies.org/';
    });

    $('#cookie-close').click(function() {
        $('#cookie-popup').hide();
        setCookie('cookieConsent', 'true', 365);
    });

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + value + expires + '; path=/';
    }

    function getCookie(name) {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
});