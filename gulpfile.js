'use strict';
// generated on 2014-07-30 using generator-gulp-webapp 0.1.0

var gulp = require('gulp');

// load plugins
var $ = require('gulp-load-plugins')();

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');

var plumber = require('gulp-plumber');

gulp.task('browserify', function() {
  //https://github.com/gulpjs/gulp/issues/369
  //return browserify('./app/scripts/board.js')
  //return browserify({entries:'./app/scripts/board.js', debug:true})
  return browserify({debug:true})
    .add('./app/scripts/board.js')
    .bundle()
      .on('error', function (err) {
        console.log(err.toString());
        this.emit("end");
      })

    //bundle() no longer accepts option arguments.
    //Move all option arguments to the browserify() constructor.
    //.bundle({debug:true})

    //.pipe(plumber())
  
    //Pass desired output filename to vinyl-source-stream
    .pipe(source('bundle.js'))
    //.pipe(process.stdout)

    //Error: gulp-sourcemap-init: Streaming not supported
    //.pipe(sourcemaps.init({loadMaps: true}))

    //Start piping stream to tasks!
    //.pipe($.jshint())
    //.pipe($.jshint.reporter(require('jshint-stylish')))

    //.pipe(sourcemaps.write())

    .pipe(gulp.dest('.tmp/scripts/'))
    //.pipe(gulp.dest('./dist/scripts/'));
    //.pipe($.size());
});

gulp.task('styles', function () {
  return gulp.src('app/styles/main.less')
    .pipe($.less())
    .pipe($.autoprefixer('last 1 version'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size());
});

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
    .pipe(plumber())
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
      .use(connect.static('app'))
      .use(connect.static('.tmp'))
      .use(connect.directory('app'));
  
  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('serve', ['connect', 'styles', 'browserify'], function () {
  require('opn')('http://localhost:9000');
});

gulp.task('watch', ['connect', 'serve'], function () {
  var server = $.livereload();
  
  // watch for changes
  
  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    'app/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', function (file) {
    server.changed(file.path);
  });
  
  gulp.watch('app/styles/**/*.less', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['browserify']);
  gulp.watch('app/images/**/*', ['images']);
});
