'use strict';
//http://www.smashingmagazine.com/2014/06/11/building-with-gulp/

var gulp = require('gulp');

// load all gulp plugins to $
var $ = require('gulp-load-plugins')();
//these get loaded as part of the plugins:
//var mocha = require('gulp-mocha');
//var sourcemaps = require('gulp-sourcemaps');
//var plumber = require('gulp-plumber');

var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');

//TODO:
//split external libraries out to a separate browserify function
//they don't change as often... no need to rebuild them every time

gulp.task('browserify', function() {
  //https://github.com/gulpjs/gulp/issues/369
  //return browserify('./app/scripts/board.js')
  //return browserify({entries:'./app/scripts/board.js', debug:true})
  return browserify({debug:true})
    .add('./app/scripts/init.js')

    //bundle() no longer accepts option arguments.
    //Move all option arguments to the browserify() constructor.
    //.bundle({debug:true})
    .bundle()
      .on('error', function (err) {
        console.log(err.toString());
        this.emit("end");
      })

    //.pipe($.plumber())
  
    //Pass desired output filename to vinyl-source-stream
    .pipe(source('bundle.js'))
    //.pipe(process.stdout)

    //seems like sourcemaps are included already by browserify when debug:true
    //Error: gulp-sourcemap-init: Streaming not supported
    //.pipe($.sourcemaps.init({loadMaps: true}))

    //Start piping stream to tasks!
    //.pipe($.jshint())
    //.pipe($.jshint.reporter(require('jshint-stylish')))

    //.pipe($.sourcemaps.write())

    .pipe(gulp.dest('.tmp/scripts/'))
    //.pipe(gulp.dest('./dist/scripts/'));
    //.pipe($.size());
});


/*
//this one reports errors:
//Cannot read property 'cache' of undefined

gulp.task('watchify', function() {
  //https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md
  
  var bundler = watchify(browserify('./app/scripts/init.js', watchify.args));
  //var bundler = watchify(browserify('./app/scripts/init.js', {debug:true}));

  // Optionally, you can apply transforms
  // and other configuration options on the
  // bundler just as you would with browserify
  //bundler.transform('brfs')

  bundler.on('update', rebundle)

  function rebundle () {
    return bundler.bundle()
      // log errors if they happen
      .on('error', function(e) {
        gutil.log('Browserify Error', e);
      })
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('./tmp/scripts/'))
  }

  return rebundle()
})
*/

/*
// this is mostly working, but hangs the rest of the watch commands...

var browserify_task = function(src, dest, watch, cb) {

  //return function() {

  //if you get:
  //node_modules/watchify/index.js:100
  //      delete cache[id];
  //TypeError: Cannot convert null to object
  // be sure that args are set for watchify correctly
  //https://github.com/substack/watchify/blob/master/readme.markdown#var-w--watchifyb-opts
  var w = browserify({ cache: {}, packageCache: {}, fullPaths: true, debug:true});
  w.add(src);
  var rebundle = function(ids) {
    return w.bundle()
      .on("error", function(error) {
        //util.log(util.colors.red("Error: "), error);
        console.log("Error: ", error);
      })
      .on("end", function() {
        //util.log("Created:", util.colors.cyan(dest), (ids||[]).join(", "));
        console.log("Created:", dest, (ids||[]).join(", "));
      })
      .pipe(source(dest))
    //.pipe(gulp.dest("./src/"));
      .pipe(gulp.dest('.tmp/scripts/'));
      cb();
  };

  //console.log(w);
  // Wrap browserify in watchify, which will do an incremental
  // recompile when one of the files used to create the bundle is
  // changed.
  if (watch) {
    //console.log('prewatchify');
    w = watchify(w);
    //console.log('postwatchify');
    w.on("update", rebundle)
      .on("log", function(message) {
        //https://github.com/gulpjs/gulp-util
        //util.log("Browserify:", message);
        console.log("Browserify:", message);
      })
      .on("error", function(message) {
        //https://github.com/gulpjs/gulp-util
        //util.log("Browserify:", message);
        console.log("Browserify Error:", message);
      })
      .on("end", function() {
        cb();
      });
  }
  return rebundle();
  //};
};

gulp.task('watchify', function(cb) {
  var src = './app/scripts/init.js';
  var dest = 'bundle.js';
  return browserify_task(src, dest, true, cb);
});

gulp.task('browserify', function(cb) {
  var src = './app/scripts/init.js';
  var dest = 'bundle.js';
  browserify_task(src, dest, false, cb);
});

*/
  
gulp.task('styles', function () {
  return gulp.src('app/styles/main.less')
    .pipe($.less())
    .pipe($.autoprefixer('last 1 version'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size());
});

//for running tests before lint:
//gulp.task('scripts', ['test'], function () {
gulp.task('scripts', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter(require('jshint-stylish')))
    .pipe($.size());
});

gulp.task('html', ['styles', 'browserify'], function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src('app/*.html')
    .pipe($.plumber())
    .pipe($.useref.assets({searchPath: '{.tmp,app}'}))
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe($.useref.restore())
    .pipe($.useref())
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size());
});

gulp.task('fonts', function () {
  //return $.bowerFiles()
  return gulp.src('app/fonts/**/*')
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size());
});

gulp.task('extras', function () {
  return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});

gulp.task('build', ['html', 'images', 'fonts', 'extras']);

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});

gulp.task('connect', function () {
  var connect = require('connect');
  var app = connect()
      .use(require('connect-livereload')({ port: 35729 }))
      // allow CORS
      // http://enable-cors.org/
      // adapted via: https://gist.github.com/Vp3n/5340891
      .use(function(req, res, next){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        next();
      })
      .use(connect.static('app'))
      .use(connect.static('.tmp'))
      .use(connect.directory('app'));
  
  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('serve', ['connect', 'styles'], function () {
  require('opn')('http://localhost:9000');
});

//want browserify to finish before the tests run...
//otherwise live reload may not work as well.
gulp.task('test', ['browserify'], function() {
  return gulp.src('test/spec/test.js', {read: false})
    .pipe($.mocha({reporter: 'nyan'}));
});

//gulp.task('watch', ['watchify', 'connect', 'serve'], function () {
gulp.task('watch', ['connect', 'serve'], function () {
  var server = $.livereload();
  
  // watch for changes
  
  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    '.tmp/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', function (file) {
    server.changed(file.path);
  });

  gulp.watch('app/styles/**/*.less', ['styles']);
  gulp.watch('app/images/**/*', ['images']);

  gulp.watch('test/spec/**/*.js', ['test']);
  //gulp.watch('app/scripts/**/*.js', ['watchify', 'test']);
  gulp.watch('app/scripts/**/*.js', ['scripts', 'test']);
  
});
