#!/bin/bash

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
