<#
.SYNOPSIS
Downloads the official Arduino AVR-GCC7.3.0 archive into this repository only.
.DESCRIPTION
Verifies the package-index SHA-256 before extraction. Does not modify PATH or install system packages.
#>
$ErrorActionPreference='Stop'
$toolRoot=Join-Path $PSScriptRoot '.toolchain'
$archive=Join-Path $toolRoot 'avr-gcc.zip'
$url='https://downloads.arduino.cc/tools/avr-gcc-7.3.0-atmel3.6.1-arduino7-i686-w64-mingw32.zip'
$expected='a54f64755fff4cb792a1495e5defdd789902a2a3503982e81b898299cf39800e'
New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null
if (-not (Test-Path -LiteralPath $archive)) {
  $ProgressPreference='SilentlyContinue'
  Invoke-WebRequest -Uri $url -OutFile $archive
}
$actual=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) {throw "AVR toolchain checksum mismatch; archive will not be extracted: $actual"}
Expand-Archive -LiteralPath $archive -DestinationPath $toolRoot -Force
& (Join-Path $toolRoot 'avr/bin/avr-gcc.exe') --version
Write-Output 'Local AVR toolchain ready. Run: node scripts/build-firmware.mjs'
