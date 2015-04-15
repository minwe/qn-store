# Ghost Qiniu Storage


This custom storage module allows you to store media file at [Qiniu](http://www.qiniu.com/) instead of storing at local machine, especially helpful for ghost blog hosted at heroku (no local storage). Will work with latest version `0.6.0` of Ghost!

## Installation

In order to replace the storage module, the basic requirements are:

- Create a new folder inside `/content` called `/storage`
- Clone this repo to `/storage`

  ```
  cd [path/to/ghost]/content/storage
  git clone https://github.com/Minwe/qn-store.git
  ```
- Install dependencies

  ```
  cd qn-store
  npm install
  ```

  You can add `qn` to dependencies in Ghost's `package.json`.

## Configuration

In your `config.js` file, you'll need to add a new `storage` block to whichever environment you want to change:

```js
storage: {
  active: 'qn-store',
  'qn-store': {
    accessKey: 'your access key',
    secretKey: 'your secret key',
    bucket: 'your bucket name',
    domain: 'http://xx.xx.xx.glb.clouddn.com',
    // timeout: 3600000, // default rpc timeout: one hour, optional
    // if your app outside of China, please set `uploadURL` to `http://up.qiniug.com/`
    // uploadURL: 'http://up.qiniu.com/'
    filePath: 'YYYY/MM/' // default `YYYY/MM/`, will be formated by moment.js, using `[]` to escape
  }
}
```

## License

Read [LICENSE](LICENSE)
