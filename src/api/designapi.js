var _ = require('underscore');
var designs = require('./designs');
var userDB = require('./userdb');

var DesignAPI = function(app) {

  // Get all the user's designs
  app.get(/^\/api\/([\w._-]+)\/designs\/?$/, function(req, res) {

    var username = decodeURIComponent(req.params[0]);

    userDB.init(username, function(err, db) {
      if (err) {
        return res.status(500).json(err);
      }

      designs.getAll(db, username, function(err, list) {
        if (err) {
          res.status(500).json(err);
        } else if (list === null) {
          res.status(200).json([]);
        } else {
          res.status(200).json(list);
        }
      });
    });

  });

  // Get the design refs
  app.get(/^\/api\/([\w._-]+)\/design\/([\w-%]+)\/?$/, function(req, res) {

    var username = decodeURIComponent(req.params[0]);
    var design = decodeURIComponent(req.params[1]);

    userDB.init(username, function(err, db) {
      if (err) {
        return res.status(500).json(err);
      }

      designs.get(db, username, design, function(err, refs) {
        if (err) {
          res.status(500).json(err);
        } else if (refs === null) {
          res.status(404).json('not found');
        } else {
          res.status(200).json(refs);
        }
      });
    });

  });

  // Create a new design
  app.post(/^\/api\/([\w._-]+)\/design\/?$/, function(req, res) {

    var username = decodeURIComponent(req.params[0]);
    var design = req.body.name && req.body.name.trim();
    if (design === undefined) {
      res.status(400).json({errors: [{missing: 'name'}]});
      return;
    }
    if (!designs.validate(design)) {
      res.status(400).json({errors: [{invalid: 'name'}]});
      return;
    }

    userDB.init(username, function(err, db) {
      if (err) {
        return res.status(500).json(err);
      }

      designs.get(db, username, design, function(err, value) {
        if (err) {
          res.status(500).json(err);
          return;
        }
        if (value !== null) {
          res.status(409).json('design already exists');
          return;
        }

        designs.create(db, username, design, function(err, obj) {
          if (err) {
            res.status(500).json(err);
          } else {
            res.status(201).json(obj);
          }
        });

      });
    });

  });

  // Delete
  app.delete(/^\/api\/([\w._-]+)\/design\/([\w-%]+)\/?$/, function(req, res) {

    var username = decodeURIComponent(req.params[0]);
    var design = decodeURIComponent(req.params[1]);

    userDB.init(username, function(err, db) {
      if (err) {
        return res.status(500).json(err);
      }

      designs.del(db, username, design, function(err) {
        if (err === 'notFound') {
          res.status(400).json('not found');
        } else if (err) {
          res.status(500).json(err);
        } else {
          res.status(200).json('ok');
        }
      });
    });

  });

  // Update ref
  app.put(/^\/api\/([\w._-]+)\/design\/([\w-%]+)\/refs\/(\w+)\/(\w+)\/?$/, function(req, res) {

    var username = decodeURIComponent(req.params[0]);
    var design = decodeURIComponent(req.params[1]);
    var type = req.params[2];
    var ref = req.params[3];
    var newRef = req.body;
    if (!(_.isString(newRef) || (_.isObject(newRef) && newRef.hasOwnProperty('commit')))) {
      res.status(400).json({errors: ['value must be a JSON string or a commit object']});
      return;
    }

    if (_.isString(newRef)) {
      if (newRef.length !== 40) {
        res.status(400).json({errors: ['value must be a 160bit (40 character) SHA']});
        return;
      }
    } else {
      if (newRef.commit.length !== 40) {
        res.status(400).json({errors: ['commit must be a 160bit (40 character) SHA']});
        return;
      }
    }

    userDB.init(username, function(err, db) {
      if (err) {
        return res.status(500).json(err);
      }

      designs.updateRef(db, username, design, type, ref, newRef, function(err) {
        if (err === 'notFound') {
          res.status(404).json('not found');
        } else if (err) {
          res.status(500).json(err);
        } else {
          res.status(200).json('ok');
        }
      });
    });

  });

  // Rename
  app.post(/^\/api\/([\w._-]+)\/design\/([\w-%]+)\/?$/, function(req, res) {

    var username = decodeURIComponent(req.params[0]);
    var design = decodeURIComponent(req.params[1]);
    var newName = req.body.newName && req.body.newName.trim();
    if (newName === undefined) {
      res.status(404).json({errors: [{missing: 'newName'}]});
      return;
    }

    userDB.init(username, function(err, db) {
      if (err) {
        return res.status(500).json(err);
      }

      designs.rename(db, username, design, newName, function(err) {
        if (err === 'notFound') {
          res.status(404).json('not found');
        } else if (err === 'alreadyExists') {
          res.status(409).json('already exists');
        } else if (err) {
          res.status(500).json(err);
        } else {
          res.status(200).json('ok');
        }
      });
    });
  });
};

module.exports = DesignAPI;
