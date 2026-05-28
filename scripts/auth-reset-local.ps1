# =============================================================================
# auth-reset-local.ps1 — Reset + seed des comptes DalleUp en local
# =============================================================================
# Exécution :
#   powershell -ExecutionPolicy Bypass -File scripts/auth-reset-local.ps1
#
# Ce script demande les mots de passe de manière sécurisée (pas d'écho).
# Les variables sont supprimées automatiquement après exécution.
# =============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESET AUTH DALLEUP — LOCAL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Ce script va supprimer TOUS les comptes et relancer le seed." -ForegroundColor Yellow
Write-Host "    Les PlatformSettings et fichiers Supabase Storage seront conservés." -ForegroundColor Yellow
Write-Host ""

# Demander confirmation
$confirmation = Read-Host "Tapez YES pour continuer"
if ($confirmation -ne "YES") {
    Write-Host "Annulé." -ForegroundColor Red
    exit 0
}

# Définir la confirmation reset
$env:RESET_ACCOUNTS_CONFIRM = "YES_DELETE_TEST_ACCOUNTS"

# Demander les mots de passe (sans écho)
$adminSecure = Read-Host "Mot de passe ADMIN (min 8 caractères)" -AsSecureString
$testSecure  = Read-Host "Mot de passe TEST (client/restaurant/livreur, min 8 caractères)" -AsSecureString

# Convertir SecureString en plain text pour les passer aux scripts Node
$adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecure)
)
$testPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($testSecure)
)

if ($adminPassword.Length -lt 8) {
    Write-Host "❌ Le mot de passe admin est trop court (min 8 caractères)." -ForegroundColor Red
    exit 1
}
if ($testPassword.Length -lt 8) {
    Write-Host "❌ Le mot de passe test est trop court (min 8 caractères)." -ForegroundColor Red
    exit 1
}

$env:ADMIN_SEED_PASSWORD = $adminPassword
$env:TEST_SEED_PASSWORD  = $testPassword

Write-Host ""
Write-Host "▶  Lancement de npm run auth:reset-and-seed ..." -ForegroundColor Cyan
Write-Host ""

npm run auth:reset-and-seed
$exitCode = $LASTEXITCODE

# Nettoyer les variables sensibles immédiatement après exécution
Remove-Item Env:\RESET_ACCOUNTS_CONFIRM  -ErrorAction SilentlyContinue
Remove-Item Env:\ADMIN_SEED_PASSWORD     -ErrorAction SilentlyContinue
Remove-Item Env:\TEST_SEED_PASSWORD      -ErrorAction SilentlyContinue
$adminPassword = $null
$testPassword  = $null

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅  Reset et seed terminés avec succès." -ForegroundColor Green
} else {
    Write-Host "❌  Le script a échoué (code $exitCode). Vérifiez les logs ci-dessus." -ForegroundColor Red
}
Write-Host ""

exit $exitCode
