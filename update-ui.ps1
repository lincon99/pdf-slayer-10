# -----------------------------
# update-ui.ps1
# -----------------------------
# Navigate to your project folder (if not already there)
Set-Location "C:\Users\DELL\pdf-slayer-main"

# Ensure public folder exists
if (-not (Test-Path .\public)) { New-Item -ItemType Directory -Path .\public | Out-Null }

# Backup existing files
$ts = (Get-Date).ToString("yyyyMMdd-HHmmss")
$filesToBackup = @("public\index.html","public\script.js","public\about.html","public\privacy.html","public\terms.html","public\style.css")
foreach ($f in $filesToBackup) {
    if (Test-Path $f) {
        Copy-Item $f "$f.bak_$ts" -Force
    }
}

# Overwrite style.css with enhanced dark glassy UI
@"
:root{
  --bg:#0a0a0a;
  --glass: rgba(255,255,255,0.04);
  --glass-2: rgba(255,255,255,0.03);
  --accent1: #ff3b3b;
  --accent2: #ff8a00;
  --muted: #bdbdbd;
  --card-bg: rgba(255,255,255,0.03);
  --glass-blur: 12px;
  --radius: 14px;
  --max-width: 980px;
  --mobile-padding: 18px;
}
*{box-sizing:border-box;}
html,body{height:100%;margin:0;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;}
body{
  background: radial-gradient(1200px 600px at 10% 10%, rgba(255,40,40,0.06), transparent 6%),
              radial-gradient(900px 500px at 90% 90%, rgba(255,100,50,0.03), transparent 6%),
              var(--bg);
  color:#eee;
  display:flex;
  justify-content:center;
  align-items:flex-start;
  min-height:100vh;
  padding:40px 20px;
}
.container{
  max-width:var(--max-width);
  width:100%;
  background: var(--glass);
  backdrop-filter: blur(var(--glass-blur));
  border-radius:var(--radius);
  padding:30px;
  margin:auto;
  box-shadow:0 0 30px rgba(255,0,0,0.4);
}
h1,h2,h3{color:var(--accent1);}
input[type="file"]{
  display:block;margin:20px auto;padding:12px;border-radius:10px;border:2px solid var(--accent1);background:var(--glass-2);color:#fff;width:80%;
}
button{
  display:block;margin:20px auto;padding:12px 25px;
  background: linear-gradient(45deg,var(--accent1),var(--accent2));
  border:none;border-radius:12px;color:#fff;font-weight:bold;
  cursor:pointer;
  box-shadow:0 0 15px var(--accent1);
  transition: all 0.3s ease;
}
button:hover{
  box-shadow:0 0 25px var(--accent2);
}
#progressContainer{
  width:100%;height:8px;background:#333;border-radius:5px;margin-top:10px;
}
#progressBar{
  width:0%;height:100%;background:linear-gradient(to right,var(--accent1),var(--accent2));
  border-radius:5px;transition:width 0.3s ease;
}
textarea{
  width:100%;min-height:150px;margin:15px 0;padding:15px;border-radius:12px;background:var(--glass-2);border:none;color:#fff;font-family:monospace;
}
footer{
  text-align:center;color:var(--muted);margin-top:40px;font-size:14px;
}
footer a{
  color:var(--accent1);margin:0 10px;text-decoration:none;
}
footer a:hover{text-decoration:underline;}
@media(max-width:768px){
  body{padding:20px;}
  .container{padding:20px;}
  input[type="file"],button{width:100%;}
}
"@ | Set-Content .\public\style.css -Encoding UTF8 -Force

Write-Host "✅ Updated style.css with enhanced dark glassy UI."
