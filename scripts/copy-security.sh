#!/bin/bash

set -e
cp -R .well-known _site || { echo 'Failed to copy .well-known directory'; exit 1; }