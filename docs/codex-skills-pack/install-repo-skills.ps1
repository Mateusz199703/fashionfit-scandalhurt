param(
    [string]$TargetDir = (Get-Location).Path
)

$skillsSource = Join-Path $PSScriptRoot ".agents\skills"
$skillsTarget = Join-Path $TargetDir ".agents\skills"

New-Item -ItemType Directory -Force -Path $skillsTarget | Out-Null
Copy-Item -Path (Join-Path $skillsSource "*") -Destination $skillsTarget -Recurse -Force

Write-Host "Installed Codex skills into: $skillsTarget"
Write-Host "Restart Codex or run /skills inside Codex to check available skills."
