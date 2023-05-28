#!/bin/sh

set -eu

yarn install

exec "$@"
