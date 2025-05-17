# NoSkid Badge Documentation

## Overview

NoSkid Badges are dynamic SVG images that display verification credentials for users, repository owners, or website owners. These badges can be embedded in GitHub READMEs, websites, or other platforms to demonstrate authenticity and ownership verification.

## Badge Formats

NoSkid offers three badge formats with different dimensions:

1. **Small Badge**: 100x30 pixels - Compact badge for tight spaces
2. **Medium Badge**: 470x200 pixels - Standard badge for most uses
3. **Large Badge**: 1200x420 pixels - Full-size badge for prominent displays

## Implementation

### GitHub Repositories

To add a NoSkid badge to your GitHub repository:

1. Place the certificate file at `noskid/certificate.png` in your account (username/username) repository root
2. Add the badge to your README.md using one of these formats:

```md
<!-- Small Badge -->
[![NoSkid Verification](https://noskid.today/badge/100x30/?repo=username/repository)](https://noskid.today)

<!-- Medium Badge -->
[![NoSkid Verification](https://noskid.today/badge/470x200/?repo=username/repository)](https://noskid.today)

<!-- Large Badge -->
[![NoSkid Verification](https://noskid.today/badge/1200x420/?repo=username/repository)](https://noskid.today)
```

Replace `username` with your GitHub username and `repository` with your repository name.

### Websites

To add a NoSkid badge to your website:

1. Place the certificate file at `noskid/certificate.png` in your website's root directory
2. Add the badge to your HTML using one of these formats:

```html
<!-- Small Badge -->
<a href="https://noskid.today">
  <img src="https://noskid.today/badge/100x30/?website=https://example.com" alt="NoSkid Verification">
</a>

<!-- Medium Badge -->
<a href="https://noskid.today">
  <img src="https://noskid.today/badge/470x200/?website=https://example.com" alt="NoSkid Verification">
</a>

<!-- Large Badge -->
<a href="https://noskid.today">
  <img src="https://noskid.today/badge/1200x420/?website=https://example.com" alt="NoSkid Verification">
</a>
```

Replace `example.com` with your actual domain name.

## Certificate Requirements

The certificate file must:
- Be a valid PNG file
- Be a valid certificate downloaded from noskid.today
- The certificate username MUST be the same as your github username

### Original Name Display

By default, badges will display the repository owner name or domain name (except if it is an account repository). If you want to display the original certificate name instead, add the `oname=true` parameter:

```
https://noskid.today/badge/470x200?repo=username/repository&oname=true
https://noskid.today/badge/470x200?website=https://example.com&oname=true
```

### Disabling caching

By defualt, the server will serve the ressource with a cache header so we don't get flooded. If you need to disable the cache, add the `cache=false` parameter:

```
https://noskid.today/badge/470x200?repo=username/repository&cache=false
https://noskid.today/badge/470x200?website=https://example.com&cache=false
```

## Error Codes

If your badge fails to display properly, you may see one of these error SVGs:

- **404**: Certificate file not found
- **403**: Invalid certificate
- **422**: Malformed request or template error

## Examples

`100x30`
[![NoSkid Verification](https://noskid.today/badge/100x30/?repo=douxxtech/noskid.today)](https://noskid.today)

`470x200`
[![NoSkid Verification](https://noskid.today/badge/470x200/?repo=douxxtech/noskid.today)](https://noskid.today)

`1200x420`
[![NoSkid Verification](https://noskid.today/badge/1200x420/?repo=douxxtech/noskid.today)](https://noskid.today)

## FAQ

**Q: How do I obtain a NoSkid certificate?**
A: On desktop, you can obtain a certificate by completing the quiz at the bottom of [noskid.today](https://noskid.today)

**Q: Can I customize my badge appearance?**
A: Currently, NoSkid offers three fixed badge formats. Custom styling is not supported.

**Q: My badge shows an error, what should I do?**
A: Ensure your certificate file is properly placed and is an official one. Check the error code for specific issues.

**Q: Can I use NoSkid badges on platforms other than GitHub or websites?**
A: Yes, as long as the platform can display SVG images loaded from external URLs.

## Support

For further assistance just [do an issue](https://github.com/douxxtech/noskid.today/issues/new) :)
