#!/bin/sh
# vim: set ft=sh fdm=manual ts=2 sw=2 sts=2 tw=85 et:

(cd ../p2p-core/ && npm run build) \
  && (cd ./node_modules && ln -snf ../../p2p-core ./p2p-core) \
  && npm run build \
  && echo 'done.'
