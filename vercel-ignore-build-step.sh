#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

echo "🛑 - Build cancelled"
exit 0;

# https://zenn.dev/catnose99/articles/b37104fc7ef214
# if [[ "$VERCEL_GIT_COMMIT_REF" == "develop" ]] ; then
#   echo "✅ - Build can proceed"
#   exit 1;

# else
#   echo "🛑 - Build cancelled"
#   exit 0;
# fi
