param(
  [Parameter(Mandatory = $true)]
  [string]$ScriptId
)

if ([string]::IsNullOrWhiteSpace($ScriptId)) {
  throw 'ScriptId is required.'
}

@{
  scriptId = $ScriptId
  rootDir = '.'
} | ConvertTo-Json | Set-Content .clasp.json

Write-Host '.clasp.json created successfully.'
