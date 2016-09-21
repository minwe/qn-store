'use strict';

// # Qiniu storage module for Ghost blog http://ghost.org/

var path = require('path');
var fs  = require('fs');
var Promise = require('bluebird');
var moment = require('moment');
var qn = require('qn');
var utils = require(path.join(process.cwd(), 'core/server/utils'));
var BaseStore = require(path.join(process.env.GHOST_SOURCE,'core/server/storage/base'));
var util = require('util');

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
        resolve((process.env.PROTO_TYPE || 'http') + '://' + result.url)
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

QiniuStore.prototype.exists = function () {
	// Server side will automatically replace the file.
	return;
};

QiniuStore.prototype.delete = function (target) {
	//For backup and security purposes there is no way to delete files
	//whatever on local or server side through Ghost, please do it manually.
	return;
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
