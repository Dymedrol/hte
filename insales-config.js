'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Настройки поумолчанию
 */
exports.default = {
  account: {
    id: 'a0dbe9610724117f53640fff38c63570',
    token: '64600dd42a6e089ebcb6ccb14b3b545f',
    url: 'hte.myinsales.ru',
    http: true
  },
  theme: {
    id: '9436961',
    root: '.',
    backup: true,
    assetsSync: true,
    excludeFiles: [],
    onUpdate: function onUpdate() {
      // обновление темы
    },
    assetsDomain: 'https://assets.insales.ru'
  },
  util: {
    openBrowser: true
  },
  plugins: {
    exclude: ['*.min.js', '*.min.css', '*.liquid']
  },
  chokidarOptions: {
    ignored: /[\/\\]\./,
    ignoreInitial: true,
    followSymlinks: true,
    usePolling: false,
    interval: 200,
    delay: 0,
    binaryInterval: 300,
    alwaysStat: true,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    },
    ignorePermissionErrors: true
  }
};