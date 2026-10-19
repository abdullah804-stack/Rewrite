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

$oldLogo1 = @"
<Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              R
            </div>
            Rewrite
          </Link>
"@

$oldLogo2 = @"
<Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
            R
          </div>
          Rewrite
        </Link>
"@

$oldLogo3 = @"
<div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center text-xs font-black">
                R
              </div>
              <span className="text-base font-bold text-text-primary dark:text-white">Rewrite</span>
            </div>
"@

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $modified = $false

        # Determine relative path for import
        $depth = ($file.Split('\').Length) - 1
        $relPath = "../" * $depth + "Logo"
        $importStatement = "import { Logo } from `"$relPath`";`n"

        if ($content -match [regex]::Escape($oldLogo1)) {
            $content = $content.Replace($oldLogo1, "<Logo />")
            $modified = $true
        } elseif ($content -match [regex]::Escape($oldLogo2)) {
            $content = $content.Replace($oldLogo2, "<Logo />")
            $modified = $true
        } elseif ($content -match [regex]::Escape($oldLogo3)) {
            $content = $content.Replace($oldLogo3, "<Logo />")
            $modified = $true
        }

        if ($modified) {
            # Add import if missing
            if ($content -notmatch "import \{ Logo \}") {
                # Insert after the first import or at the top
                if ($content -match "import ") {
                    $content = $content -replace "(import .*?;)", "`$1`n$importStatement"
                } else {
                    $content = $importStatement + $content
                }
            }
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "Updated: $file" -ForegroundColor Green
        } else {
            Write-Host "No logo found in: $file" -ForegroundColor Yellow
        }
    }
}