var LimitdServer = require('../server');
var LimitdClient = require('../client');

var assert = require('chai').assert;
var rimraf = require('rimraf');
var client;

var async = require('async');
var _ = require('lodash');

describe('limitd server', function () {
  before(function (done) {
    var db_file = __dirname + '/dbs/server.tests.db';

    try{
      rimraf.sync();
    } catch(err){}

    LimitdServer.start({config_file: __dirname + '/fixture.yml', db: db_file}, function (err, address) {
      if (err) return done(err);
      client = new LimitdClient(address);
      client.once('connect', done);
    });
  });

  after(function () {
    LimitdServer.stop();

  });

  it('should work with a simple request', function (done) {
    client.request('ip', '211.123.12.12', function (err, response) {
      if (err) return done(err);
      assert.ok(response.conformant);
      done();
    });
  });

  it('should fail when the bucket class doesnt exist', function (done) {
    client.request('blabla', '211.123.12.12', function (err) {
      assert.equal(err.message, 'blabla is not a valid bucket class');
      done();
    });
  });

  it('should return false when traffic is not conformant', function (done) {
    async.each(_.range(0, 10), function (i, done) {
      client.request('ip', '211.123.12.24', done);
    }, function (err) {
      if (err) return done(err);
      client.request('ip', '211.123.12.24', function (err, response) {
        assert.notOk(response.conformant);
        done();
      });
    });
  });

});