#!/bin/bash

print_results() {
  echo "Ran:    $(ls logs/vitest-* | wc -l)";
  echo "Failed: $(grep 'failed (' logs/vitest-* | wc -l)";
  echo "Failed files:";
  grep "failed (" logs/vitest-*;
}

export -f print_results

watch --color -n 2 'print_results'
