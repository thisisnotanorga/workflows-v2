### FTP Deployment Secrets

| Secret Name | Description | Example Format | Required |
|-------------|-------------|----------------|----------|
| `FTP_SERVER` | FTP server hostname or IP address | `ftp.example.com` or `192.168.1.100` | ✅ |
| `FTP_USERNAME` | FTP username for authentication | `myusername` | ✅ |
| `FTP_PASSWORD` | FTP password for authentication | `mypassword123` | ✅ |
| `FTP_SERVER_DIR` | Target directory path on the FTP server | `/public_html/` or `/www/noskid/` | ✅ |

### API Update Secrets

| Secret Name | Description | Example Format | Required |
|-------------|-------------|----------------|----------|
| `API_PASSWORD` | Password for API version update authentication | `secure_api_password_123` | ✅ |
