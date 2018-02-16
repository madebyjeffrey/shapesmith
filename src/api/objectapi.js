var objects = require('./objects');
var userDB = require('./userdb');

var ObjectAPI = function(app) {

  // Create graph
  app.post(/^\/api\/([\w._-]+)\/graph\/?$/, function(req, res) {
    var username = decodeURIComponent(req.params[0]);
    create(username, 'graph', req.body, res);
  });

  // Get graph
  app.get(/^\/api\/([\w._-]+)\/graph\/([\w%]+)\/?$/, function(req, res) {
    var username = decodeURIComponent(req.params[0]);
    var sha = req.params[1];
    get(username, 'graph', sha, res);
  });

  // Create vertex
  app.post(/^\/api\/([\w._-]+)\/vertex\/?$/, function(req, res) {
    var username = decodeURIComponent(req.params[0]);
    create(username, 'vertex', req.body, res);
  });

  // Get vertex
  app.get(/^\/api\/([\w._-]+)\/vertex\/([\w%]+)\/?$/, function(req, res) {
    var username = decodeURIComponent(req.params[0]);
    var sha = req.params[1];
    get(username, 'vertex', sha, res);
  });


  var create = function(username, type, object, res) {
    userDB.init(username, function(err, db) {
      if (err) {
        return res.status(500).json(err);
      }

      objects.create(db, username, type, object, function(err, sha) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.status(201).json(sha);
        }
      });
    });
  };

  var get = function(username, type, sha, res) {
    userDB.init(username, function(err, db) {
      if (err) {
        return res.send(500, err);
      }

      objects.get(db, username, type, sha, function(err, object) {
        if (err) {
          res.status(500).send(err);
        } else if (object === null) {
          res.status(404).json('not found');
        } else {
          return res.status(200).json(object);
        }
      });
    });
  };

};

module.exports = ObjectAPI;
