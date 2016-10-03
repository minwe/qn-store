'use strict';

// # Qiniu storage module for Ghost blog http://ghost.org/

var path = require('path');
var fs  = require('fs');
var util = require('util');
var Promise = require('bluebird');
var moment = require('moment');
var qn = require('qn');
var utils = require(path.join(process.cwd(), 'core/server/utils'));
var BaseStore = require(path.join(process.cwd(), 'core/server/storage/base'));

function QiniuStore(config) {
  BaseStore.call(this);
  this.options = config || {};
  this.client = qn.create(this.options);
}

util.inherits(QiniuStore, BaseStore);

// ### Save
// Saves the image to Qiniu
// - image is the express image object
// - returns a promise which ultimately returns the full url to the uploaded image
QiniuStore.prototype.save = function(file) {
  var client = this.client;
  var _this = this;

  return new Promise(function(resolve, reject) {
    var key = _this.getFileKey(file);

    client.upload(fs.createReadStream(file.path), {
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
  return function(req, res, next) {
    next();
  };
};

QiniuStore.prototype.getFileKey = function(file) {
  var keyOptions = this.options.fileKey;

  if (keyOptions) {
    var getValue = function(obj) {
      return typeof obj === 'function' ? obj() : obj;
    };
    var ext = path.extname(file.name);
    var name = path.basename(file.name, ext);

    if (keyOptions.safeString) {
      name = utils.safeString(name)
    }

    if (keyOptions.prefix) {
      name = moment().format(getValue(keyOptions.prefix)).replace(/^\//, '') + name;
    }

    if (keyOptions.suffix) {
      name += getValue(keyOptions.suffix)
    }

    return name + ext.toLowerCase();
  }

  return null;
};


// don't need it in Qiniu
// @see https://support.qiniu.com/hc/kb/article/112817/
QiniuStore.prototype.exists = function(filename) {
  return new Promise(function(resolve, reject) {
    resolve(false);
  });
};

// not really delete from Qiniu, may be implemented later
QiniuStore.prototype.delete = function(fileName, targetDir) {
  return new Promise(function(resolve, reject) {
    resolve(true);
  });
};

/*
 QiniuStore.prototype.exists = function(filename) {
 return new Promise(function(resolve, reject) {
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
