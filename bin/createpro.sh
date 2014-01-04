#!/bin/bash

PROFILE=maily.pro

echo "QMAKE_LINK=echo" > ${PROFILE}
echo OTHER_FILES=\\ >> ${PROFILE}

$(find . -iname "*.js" -o -iname "*.ts" -o -iname "*.scss" -o -iname "*.html" \
-o -iname "*.htm" -o -iname "*.py" -o -iname "*.php" -o -iname "*.json" | \
grep -v node_modules/ | \
awk '{print $1" \\"}' | \
sed -e 's|./||' >> ${PROFILE})
