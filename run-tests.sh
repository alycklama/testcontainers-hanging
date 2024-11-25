#!/bin/bash

# Ensure the number of iterations is provided
if [ -z "$1" ]; then
  echo "Error: Number of iterations not provided."
  exit 1
fi

n=$1
test_id=$(uuidgen)

export DEBUG="*";

rm -rf logs
mkdir logs
for ((i=1; i<=n; i++))
do
  npx vitest run src/__test__/testExample.test.ts 2>&1 | tee "logs/vitest-$test_id-$i.log"
done

ls logs/vitest-* | wc -l
cat logs/vitest-* | grep "failed ("
