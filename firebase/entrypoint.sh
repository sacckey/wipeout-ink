#!/bin/sh

set -eu

pnpm --filter ./functions i
pnpm --filter ./functions build

exec "$@"
