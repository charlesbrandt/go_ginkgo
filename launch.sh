#!/bin/bash

export ROOT=/c/go_ginkgo
python /c/mindstream/mindstream/launch.py -c $ROOT todo

echo "Other common options:
python /c/mindstream/mindstream/launch.py -c $ROOT code

python /c/mindstream/mindstream/launch.py -c /c/technical yeoman

to start development:
gulp watch

to build for deployment:
gulp

"

