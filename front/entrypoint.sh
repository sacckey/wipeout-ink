#!/bin/sh

set -eu

pnpm i

exec "$@"
