param(
  [int]$Width = 1920,
  [int]$Height = 1080,
  [string]$OutputDir = "drafts/presentation-backgrounds"
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path ".").Path
$htmlPath = Join-Path $root "drafts/presentation-backgrounds-core.html"
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

$slides = @(
  "intro",
  "general",
  "quiz-topic",
  "quiz-question",
  "quiz-question-bonus",
  "quiz-answer",
  "round-standings"
)

$htmlUri = [System.Uri]::new($htmlPath).AbsoluteUri

foreach ($slide in $slides) {
  $pngPath = Join-Path $outputPath "$slide.png"
  $url = "$htmlUri`?export=1#$slide"
  $args = @(
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--window-size=$Width,$Height",
    "--screenshot=$pngPath",
    $url
  )

  $process = Start-Process -FilePath $browser -ArgumentList $args -NoNewWindow -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Browser export failed for $slide with exit code $($process.ExitCode)."
  }

  if (-not (Test-Path -LiteralPath $pngPath)) {
    throw "Expected PNG was not created: $pngPath"
  }

  Write-Output "Wrote $pngPath"
}
