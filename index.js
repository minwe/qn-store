'use strict';

// # Qiniu storage module for Ghost blog http://ghost.org/

var path = require('path');
var fs = require('fs');
var util = require('util');
var Promise = require('bluebird');
var moment = require('moment');
var qn = require('qn');
var utils = require(path.join(process.cwd(), 'core/server/utils'));
var BaseStore = require(path.join(process.cwd(), 'core/server/storage/base'));
var getHash = require('./lib/getHash');

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
    _this.getFileKey(file).then((function(key) {
      client.upload(fs.createReadStream(file.path), {
        key: key
      }, function(err, result) {
        console.log(result);
        // console.log('[' + err.code + '] ' + err.name);
        err ? reject(err) : resolve(result.url);
      });
    }));
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
  var fileKey = null;

  if (keyOptions) {
    var getValue = function(obj) {
      return typeof obj === 'function' ? obj() : obj;
    };
    var ext = path.extname(file.name);
    var basename = path.basename(file.name, ext);
    var prefix = '';
    var suffix = '';
    var extname = '';

    if (keyOptions.prefix) {
      prefix = moment().format(getValue(keyOptions.prefix)).replace(/^\//, '');
    }

    if (keyOptions.suffix) {
      suffix = getValue(keyOptions.suffix)
    }

    if (keyOptions.extname !== false) {
      extname = ext.toLowerCase();
    }

    var contactKey = function(name) {
      return prefix + name + suffix + extname;
    };

    if (keyOptions.hashAsBasename) {
      return getHash(file).then(function(hash) {
        return contactKey(hash);
      });
    } else if (keyOptions.safeString) {
      basename = utils.safeString(basename);
    }

    fileKey = contactKey(basename);
  }

  return Promise.resolve(fileKey);
};


// don't need it in Qiniu
// @see https://support.qiniu.com/hc/kb/article/112817/
// TODO: if fileKey option set, should use key to check file whether exists
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
      } else if (err && err.code === 612) { // File not exists
        resolve(false);
      } else {
        reject('Can\'t get file info.');
      }
    });
  });
};
*/

module.exports = QiniuStore;
