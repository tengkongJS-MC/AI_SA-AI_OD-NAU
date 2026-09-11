# 把前端与技能文件同步到 release/go/assets（供 go:embed 内嵌）
# 用法：cd release\go ; powershell -ExecutionPolicy Bypass -File .\sync-assets.ps1
$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path   # release\go
$root = Split-Path -Parent (Split-Path -Parent $here)     # 仓库根目录（release\go -> release -> 根）
$assets = Join-Path $here 'assets'
$skills = @('plan_skill', 'QQ_push_skill_v2', 'wechat_push_skill', 'push_pic_skill', 'time_skill')

Write-Host "同步前端 public/ ..."
$pubSrc = Join-Path $root 'ai-writer-app\public'
$pubDst = Join-Path $assets 'public'
if (Test-Path $pubDst) { Remove-Item -Recurse -Force $pubDst }
New-Item -ItemType Directory -Force -Path $pubDst | Out-Null
Copy-Item -Force (Join-Path $pubSrc '*') $pubDst

Write-Host "同步技能 md ..."
$skillDst = Join-Path $assets 'skills'
if (Test-Path $skillDst) { Remove-Item -Recurse -Force $skillDst }
New-Item -ItemType Directory -Force -Path $skillDst | Out-Null

foreach ($d in $skills) {
  $src = Join-Path $root $d
  if (-not (Test-Path $src)) { Write-Host "  跳过（不存在）：$d" -ForegroundColor Yellow; continue }
  Get-ChildItem $src -Recurse -File -Filter *.md | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1)
    $dest = Join-Path (Join-Path $skillDst $d) $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    Copy-Item -Force $_.FullName $dest
  }
  Write-Host "  ok $d"
}

$count = (Get-ChildItem $assets -Recurse -File | Measure-Object).Count
Write-Host "完成：assets/ 共 $count 个文件" -ForegroundColor Green
