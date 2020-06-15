'use strict';

const fs = require('fs');

let indexedPath = __dirname + '../data/index';

function rebuildIndexCb(err, files) {
    let a = 1;
}

fs.readDir(indexedPath, rebuildIndexCb());