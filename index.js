'use strict';

// # Qiniu storage module for Ghost blog http://ghost.org/

var path = require('path');
var fs  = require('fs');
var Promise = require('bluebird');
var qn = require('qn');
var moment = require('moment');
var utils = require(process.cwd() + '/core/server/utils');

function QiniuStore(config) {
  this.options = config || {};
}

// ### Save
// Saves the image to Qiniu
// - image is the express image object
// - returns a promise which ultimately returns the full url to the uploaded image
QiniuStore.prototype.save = function(image) {
  var _this = this;

  return new Promise(function (resolve, reject) {
    var client = qn.create(_this.options);
    var key = _this.getFileKey(image);

    client.upload(fs.createReadStream(image.path), {
      key: key
    }, function(err, result) {
      if (err) {
        reject('[' + err.code + '] ' + err.name);
      } else {
        resolve(result.url)
      }
    });
  });
};

// middleware for serving the files
QiniuStore.prototype.serve = function() {
  // a no-op, these are absolute URLs
  return function (req, res, next) {
    next();
  };
};

QiniuStore.prototype.getFileKey = function(image) {
  var prefix = moment().format(this.options.filePath || 'YYYY/MM/').
      replace(/^\//, '');
  var ext = path.extname(image.name);
  var name = utils.safeString(path.basename(image.name, ext));

  return prefix + name + '-' + Date.now() + ext.toLowerCase();
};

/*
QiniuStore.prototype.exists = function(filename) {
  return new Promise(function (resolve, reject) {
    // send key to get image info
    client.stat(filename, function(err, info) {
      if (info) {
        resolve(true);
      } else if  (err && err.code === 612) { // File not exists
        resolve(false);
      } else {
        reject('Can\'t get file info.');
      }
    });
  });
};
*/

module.exports = QiniuStore;
