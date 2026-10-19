$files = @(
    "app\dashboard\page.tsx",
    "app\workspace\page.tsx",
    "app\workspace\[id]\page.tsx",
    "app\workspace\[id]\settings\page.tsx",
    "app\settings\page.tsx",
    "app\profiles\page.tsx",
    "app\tools\page.tsx",
    "app\quick\page.tsx",
    "app\login\page.tsx",
    "app\clipper\page.tsx",
    "app\terms\page.tsx",
    "app\privacy\page.tsx",
    "app\examples\page.tsx",
    "app\phrases\page.tsx",
    "app\phrases\[slug]\page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $lines = Get-Content $file
        $newLines = @()
        $hasLogoImport = $false
        $depth = ($file.Split('\').Length) - 1
        $relPath = ("../" * $depth) + "Logo"
        $correctImport = "import { Logo } from `"$relPath`";"

        foreach ($line in $lines) {
            # If the line is a Logo import, we skip it here to handle it manually
            if ($line -match "import \{ Logo \}") {
                if (-not $hasLogoImport) {
                    $newLines += $correctImport
                    $hasLogoImport = $true
                }
                # Skip duplicates
                continue
            }
            
            # Add the rest of the lines back
            $newLines += $line
        }

        # If no logo import was found, add it at the top (after "use client" if it exists)
        if (-not $hasLogoImport) {
            $insertIndex = 0
            if ($newLines.Count -gt 0 -and $newLines[0] -match '"use client"') {
                $insertIndex = 1
            }
            $newLines = $newLines[0..($insertIndex-1)] + $correctImport + $newLines[$insertIndex..($newLines.Count-1)]
        }

        Set-Content -Path $file -Value $newLines
        Write-Host "Fixed imports in: $file" -ForegroundColor Green
    }
}