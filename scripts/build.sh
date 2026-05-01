#!/bin/bash
set -e

PACKAGES="types policy dedupe logger approval core"

for pkg in $PACKAGES; do
  echo "Building @actonce/$pkg..."
  cd "packages/$pkg" && npx tsc && cd ../..
done

echo "All packages built successfully."
