/*
 * grunt-react
 * https://github.com/ericclemmons/grunt-react
 *
 * Copyright (c) 2013 Eric Clemmons, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('react', 'Compile Facebook React JSX templates into JavaScript', function() {
    var done = this.async();

    var options = this.options();

    var transform;
    if (options.separateSourceMaps) {
      transform = require('react-tools').transformWithDetails;
    }
    else {
      transform = require('react-tools').transform;
    }

    grunt.verbose.writeflags(options, 'Options');

    if (this.files.length < 1) {
      grunt.verbose.warn('Destination not written because no source files were provided.');
    }

    grunt.util.async.forEachSeries(this.files, function(f, nextFileObj) {
      var destFile = f.dest;

      var files = f.src.filter(function(filepath) {
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      });

      if (files.length === 0) {
        if (f.src.length < 1) {
          grunt.log.warn('Destination not written because no source files were found.');
        }

        // No src files, go to next target. Warn would have been issued above.
        return nextFileObj();
      }

      var compiled = [];
      var maps = [];
      grunt.util.async.concatSeries(files, function(file, next) {
        grunt.log.writeln('[react] Compiling ' + file.cyan + ' --> ' + destFile.cyan);
        try {
          var transformed = transform(grunt.file.read(file), options);
          if (options.separateSourceMaps) {
            compiled.push(transformed.code);
            transformed.sourceMap.file = destFile;
            transformed.sourceMap.sources = [file];
            maps.push(JSON.stringify(transformed.sourceMap));
          }
          else {
            compiled.push(transformed);
          }

        } catch (e) {
          grunt.event.emit('react.error', file, e);
          grunt.fail.warn(e);
        } finally {
          next();
        }
      }, function () {
        grunt.file.write(destFile, compiled.join(grunt.util.normalizelf(grunt.util.linefeed)));
        grunt.log.writeln('[react] File ' + destFile.cyan + ' created.');
        if (options.separateSourceMaps) {
          grunt.file.write(destFile + '.map', maps.join(grunt.util.normalizelf(grunt.util.linefeed)));
          grunt.log.writeln('[react] Source Map ' + (destFile + '.map' ).cyan + ' created.');
        }
        nextFileObj();
      });

    }, done);
  });
};
