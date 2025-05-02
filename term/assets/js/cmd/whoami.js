// whoami.js

function whoami() {
    var term = this;
  
    term.echo('[+] Hostname: ' + window.location.hostname);
    term.echo('[+] User Agent: ' + navigator.userAgent);
    term.echo('[+] Platform: ' + navigator.platform);
    term.echo('[+] Language: ' + navigator.language);
    term.echo('[+] Screen Resolution: ' + window.screen.width + 'x' + window.screen.height);
    term.echo('[+] Color Depth: ' + window.screen.colorDepth + ' bits per pixel');
    term.echo('[+] Cookies Enabled: ' + navigator.cookieEnabled);
    term.echo('[+] Online Status: ' + (navigator.onLine ? 'Online' : 'Offline'));
    term.echo('[+] Java Enabled: ' + navigator.javaEnabled());
    term.echo('[+] Do Not Track: ' + (navigator.doNotTrack ? 'Enabled' : 'Disabled'));
    term.echo('[+] Browser Width: ' + window.innerWidth);
    term.echo('[+] Browser Height: ' + window.innerHeight);
    term.echo('[+] Location: ' + window.location.href);
    term.echo('[+] Referrer: ' + document.referrer);
    term.echo('[+] Timezone Offset: ' + new Date().getTimezoneOffset() + ' minutes');
    term.echo('[+] Platform Version: ' + navigator.platformVersion || '');
    term.echo('[+] Product: ' + navigator.product);
    term.echo('[+] Product Sub: ' + navigator.productSub);
    term.echo('[+] Vendor: ' + navigator.vendor);
    term.echo('[+] Vendor Sub: ' + navigator.vendorSub);
    term.echo('[+] Build ID: ' + navigator.buildID || '');
    term.echo('[+] App Code Name: ' + navigator.appCodeName);
    term.echo('[+] App Name: ' + navigator.appName);
    term.echo('[+] App Version: ' + navigator.appVersion);
    term.echo('[+] Language: ' + navigator.language);
    term.echo('[+] Languages: ' + navigator.languages);
    term.echo('[+] Max Touch Points: ' + navigator.maxTouchPoints || '');
    term.echo('[+] Connection Type: ' + navigator.connection.type);
    term.echo('[+] Effective Connection Type: ' + navigator.connection.effectiveType);
    term.echo('[+] Downlink: ' + navigator.connection.downlink + ' Mbps');
    term.echo('[+] RTT: ' + navigator.connection.rtt + ' milliseconds');
    term.echo('[+] Save Data Mode: ' + (navigator.connection.saveData ? 'Enabled' : 'Disabled'));
    $.getJSON('https://ipinfo.io/json', function (data) {
    term.echo('[+] IP Address: ' + data.ip);
    term.echo('[+] Hostname: ' + data.hostname);
    term.echo('[+] City: ' + data.city);
    term.echo('[+] Region: ' + data.region);
    term.echo('[+] Country: ' + data.country);
    term.echo('[+] Location: ' + data.loc);
    term.echo('[+] ISP: ' + data.org);
  });
  if (navigator.getBattery) {
    navigator.getBattery().then(function (battery) {
      term.echo('[+] Battery Level: ' + (battery.level * 100) + '%');
      term.echo('[+] Charging: ' + (battery.charging ? 'Yes' : 'No'));
      term.echo('[+] Charging Time: ' + battery.chargingTime + ' seconds');
      term.echo('[+] Discharging Time: ' + battery.dischargingTime + ' seconds');
    });
  } else {
    term.error('[-] Battery information not available.');
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var latitude = position.coords.latitude;
      var longitude = position.coords.longitude;

      term.echo('[+] Latitude: ' + latitude);
      term.echo('[+] Longitude: ' + longitude);

    }, function (error) {
      term.echo('Error getting location: ' + error.message);
    });
  } else {
    term.echo('Geolocation not supported by your browser.');
  }
}
  