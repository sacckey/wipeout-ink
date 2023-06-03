#!/bin/sh

set -eu

pnpm i --prefix functions
pnpm build --prefix functions

exec "$@"
