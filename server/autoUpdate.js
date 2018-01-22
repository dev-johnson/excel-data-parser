'use strict';

require('events').EventEmitter.prototype._maxListeners = 100;
var ds = require('./server').dataSources.postgres;
var models = [
  'AdminRewardPoint',
  'Job'
];

ds.connector.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
  null, function(err) {
    if (err)
      throw err;
    console.log('Enabled the pgcrypto Extension');
    ds.autoupdate(models, function(er) {
      if (er)
        throw er;
      console.log('Tables created done');
      console.log('Loopback tables [' + models + '] created in ',
       ds.adapter.name);
      ds.disconnect();
    });
  });
