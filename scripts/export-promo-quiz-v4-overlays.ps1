param(
  [string]$OutputDir = "drafts/promo-quiz-arena-split-v4"
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path ".").Path
$htmlPath = Join-Path $root "drafts/promo-quiz-arena-split-v4-overlays.html"
$outputPath = Join-Path $root $OutputDir

if (-not (Test-Path -LiteralPath $htmlPath)) {
  throw "Missing HTML preview: $htmlPath"
}

New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

function Get-BrowserPath {
  $commands = @("msedge", "chrome", "chromium")
  foreach ($command in $commands) {
    $found = Get-Command $command -ErrorAction SilentlyContinue
    if ($found) {
      return $found.Source
    }
  }

  $candidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  return $null
}

$browser = Get-BrowserPath
if (-not $browser) {
  throw "Could not find Microsoft Edge, Chrome, or Chromium for PNG export."
}

$artboards = @(
  @{ Id = "fb-rubin"; Width = 1920; Height = 1005 },
  @{ Id = "fb-arena"; Width = 1920; Height = 1005 },
  @{ Id = "ig-brno"; Width = 1080; Height = 1350 }
)

$htmlUri = [System.Uri]::new($htmlPath).AbsoluteUri

foreach ($artboard in $artboards) {
  $id = $artboard.Id
  $pngPath = Join-Path $outputPath "$id-overlay.png"
  $url = "$htmlUri`?export=1#$id"
  $args = @(
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--default-background-color=00000000",
    "--window-size=$($artboard.Width),$($artboard.Height)",
    "--screenshot=$pngPath",
    $url
  )

  $process = Start-Process -FilePath $browser -ArgumentList $args -NoNewWindow -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Browser export failed for $id with exit code $($process.ExitCode)."
  }

  if (-not (Test-Path -LiteralPath $pngPath)) {
    throw "Expected PNG was not created: $pngPath"
  }

  Write-Output "Wrote $pngPath"
}
