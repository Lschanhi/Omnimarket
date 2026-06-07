#!/usr/bin/env sh
set -eu

exec dotnet OmniMarket.API.dll --urls "http://0.0.0.0:${PORT:-10000}"
