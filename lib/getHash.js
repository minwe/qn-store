'use strict';

// @see https://github.com/qiniu/qetag/blob/master/qetag.js

var fs = require('fs');
var crypto = require('crypto');
var Promise = require('bluebird');

// sha1 算法
var sha1 = function(content) {
  return crypto.createHash('sha1').update(content).digest();
};

function getHash(file) {
  var stream = fs.createReadStream(file.path);

  // 以 4M 为单位分割
  var blockSize = 4 * 1024 * 1024;
  var sha1String = [];
  var prefix = 0x16;
  var blockCount = 0;

  function calcHash() {
    if (!sha1String.length) {
      return 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ';
    }
    var sha1Buffer = Buffer.concat(sha1String, blockCount * 20);

    // 如果大于4M，则对各个块的 sha1 结果再次 sha1
    if (blockCount > 1) {
      prefix = 0x96;
      sha1Buffer = sha1(sha1Buffer);
    }

    sha1Buffer = Buffer.concat(
      [new Buffer([prefix]), sha1Buffer],
      sha1Buffer.length + 1
    );

    return sha1Buffer
      .toString('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-');
  }

  stream.on('readable', function() {
    var chunk;
    while (chunk = stream.read(blockSize)) {
      sha1String.push(sha1(chunk));
      blockCount++;
    }
  });

  return new Promise(function(resove, reject) {
    stream.on('end', function() {
      resove(calcHash());
    });
  });
}

module.exports = getHash;
