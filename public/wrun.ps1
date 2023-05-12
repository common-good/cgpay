# To test the CGPay distribution on Windows
# Copy the dist folder to a regular (non-WSL) folder.
# Right-click this file and select "Run with PowerShell"
# or run from a PowerShell command line with ./wrun.ps1
start chrome http://localhost:8000
php -S localhost:8000
