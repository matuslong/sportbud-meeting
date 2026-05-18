param(
  [string]$FfmpegPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe",
  [string]$OutputDir = "assets\timers"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $FfmpegPath)) {
  throw "ffmpeg.exe not found at $FfmpegPath"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function New-RiskTimerVideo {
  param(
    [int]$DurationSeconds,
    [string]$OutputName
  )

  $outputPath = Join-Path $OutputDir $OutputName
  $progressWidthExpr = "1200*(1-t/$DurationSeconds)"
  $tickSpacing = [math]::Floor(1200 / $DurationSeconds)
  $filterParts = @(
    "drawbox=x=0:y=0:w=iw:h=ih:color=0x14206f:t=fill",
    "drawbox=x=0:y=0:w=iw:h=36:color=0xc00000:t=fill",
    "drawbox=x=0:y=1044:w=iw:h=36:color=0xc00000:t=fill",
    "drawbox=x=360:y=830:w=1200:h=68:color=white@0.12:t=fill",
    "drawbox=x=360:y=830:w=${progressWidthExpr}:h=68:color=0xf7d41c:t=fill"
  )

  for ($i = 1; $i -lt $DurationSeconds; $i++) {
    $x = 360 + ($tickSpacing * $i)
    $filterParts += "drawbox=x=${x}:y=830:w=4:h=68:color=white@0.38:t=fill"
  }

  $filterParts += "drawbox=x=0:y=0:w=iw:h=ih:color=white@0.10:t=fill:enable='gte(t,$DurationSeconds-0.35)'"
  $filterGraph = $filterParts -join ","

  & $FfmpegPath `
    -y `
    -f lavfi `
    -i "color=c=0x14206f:s=1920x1080:r=30:d=$DurationSeconds" `
    -vf $filterGraph `
    -an `
    -c:v libx264 `
    -pix_fmt yuv420p `
    -movflags +faststart `
    $outputPath

  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while generating $OutputName"
  }
}

New-RiskTimerVideo -DurationSeconds 10 -OutputName "risk-menu-timer-10s.mp4"
New-RiskTimerVideo -DurationSeconds 20 -OutputName "risk-question-timer-20s.mp4"
