#!/bin/bash

watch --color -n 1 '(ls logs/vitest-* | wc -l); (grep failed logs/vitest-*)'
