/**
 * This is the main workflow processing file,
 * and all the basic configurations are done
 * here:
 *
 *    - SCSS compilation
 *    - CSS Autoprefixing
 *    - JS concatenation & minification
 *    - Image optimisation
 *    - Assets copying
 *    - Removing unused assets
*/

"use strict";

/* 0- Set processing paths */

var appRoot  = './app';
var distRoot = './dist';
var fonts    = { src: appRoot + '/fonts', dest: distRoot + '/assets/fonts'};
var views    = { src: appRoot + '/views', tpls: appRoot + '/views/pages', dest: distRoot };
var imgs     = { src: appRoot + '/imgs',  dest: distRoot + '/assets/imgs' };
var css      = { src: appRoot + '/scss',  dest: distRoot + '/assets/css' };
var js       = { src: appRoot + '/js',    dest: distRoot + '/assets/js' };



/* 1- Loading all plugins */
var gulp    = require('gulp');
var plugins = require('gulp-load-plugins')({
  pattern: '*',
  rename: {
    jshint: 'jslint'
  }
});

plugins.browserSync.create();



/* 2- Setting tasks */
gulp.task('debug', function(){
  console.log(plugins);
});



/* 3- Define tasks */

// Font compilation tasks
gulp.task('fonts', function(){
  gulp.src(fonts.src + '/**')
    .pipe(plugins.plumber())
    .pipe(gulp.dest(fonts.dest))
    .pipe(plugins.browserSync.stream());
});

gulp.task('sync-fonts', function(done){
  plugins.syncy(fonts.src + '/**/*.{ttf,otf,eot,svg,woff,woff2}', fonts.dest, {
    verbose: true,
    base: appRoot + '/fonts'
  })
    .then(function() {
      done();
    })
    .catch(function(err){
      done(err);
    });
});


// Image optimisation tasks
gulp.task('imgmin', function(){
  gulp.src(imgs.src + '/**/*.{jpg,jpeg,png,gif,ico,svg}')
    .pipe(plugins.plumber())
    .pipe(plugins.newer(imgs.dest))
    .pipe(plugins.imagemin({
      progressive: true,
      use: [plugins.pngquant()]
    }))
    .pipe(gulp.dest(imgs.dest))
    .pipe(plugins.browserSync.stream());
});

gulp.task('sync-imgs', function (done) {
  plugins.syncy(imgs.src + '/**/*.{jpg,jpeg,png,gif,ico,svg}', imgs.dest, {
    verbose: true,
    base: appRoot + '/imgs'
  })
    .then(function () {
      done();
    })
    .catch(function (err) {
      done(err);
    });
});


// SCSS compilation tasks
gulp.task('scss', function () {
  gulp.src([css.src + '/*.scss'])
    .pipe(plugins.sass().on('error', plugins.sass.logError))
    .pipe(gulp.dest(css.dest))
    .pipe(plugins.concat('main.min.css'))
    .pipe(plugins.cleanCss())
    .pipe(gulp.dest(css.dest))
    .pipe(plugins.browserSync.stream());
});

gulp.task('scss-lint', function () {
  return gulp.src([css.src + '/*.scss', css.src + '/includes/**/*.scss'])
    .pipe(plugins.sassLint({
      options: { formatter: 'stylish' },
      configFile: '.sass-lint.yml'
    }))
    .pipe(plugins.sassLint.format())
    .pipe(plugins.sassLint.failOnError());
});

gulp.task('csslibs', function () {
  gulp.src(css.src + '/vendor/**/*.css')
    .pipe(plugins.concat('libs.min.css'))
    .pipe(plugins.cleanCss())
    .pipe(gulp.dest(css.dest + '/vendor'))
    .pipe(plugins.browserSync.stream());
});

gulp.task('sync-css', function (done) {
  plugins.syncy(css.src + '/vendor/*.css', css.dest + '/vendor', {
    verbose: true,
    base: appRoot + '/scss/vendor',
  })
    .then(function () {
      done();
    })
    .catch(function (err) {
      done(err);
    });
});

// JavaScript compilation tasks
gulp.task('jshint', function () {
  gulp.src([js.src + '/*.js', js.src + '/custom/**/*.js'])
    .pipe(plugins.plumber())
    .pipe(plugins.newer(js.dest + '/*.js'))
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish', { beep: true }))
    .pipe(plugins.concat('main.js'))
    .pipe(plugins.stripDebug())
    .pipe(gulp.dest(js.dest))
    .pipe(plugins.uglify())
    .pipe(plugins.rename('main.min.js'))
    .pipe(gulp.dest(js.dest))
    .pipe(plugins.browserSync.stream());
});

gulp.task('jslibs', function () {
  gulp.src([js.src + '/vendor/**/*.js'])
    .pipe(plugins.plumber())
    .pipe(plugins.newer(js.dest + '/vendor/**/*.js'))
    .pipe(plugins.concat('libs.js'))
    .pipe(gulp.dest(js.dest + '/vendor'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename('libs.min.js'))
    .pipe(gulp.dest(js.dest + '/vendor'))
    .pipe(plugins.browserSync.stream());
});


// Views compilation tasks
gulp.task('views', function () {
  gulp.src([views.tpls + '/*.html'])
    .pipe(plugins.twig())
    .pipe(gulp.dest(views.dest))
    .pipe(plugins.browserSync.stream());
});

gulp.task('sync-views', function (done) {
  plugins.syncy(views.tpls + '/*.html', views.dest, {
    verbose: true,
    base: views.tpls,
    ignoreInDest: 'assets/**'
  })
    .then(function () {
      done();
    })
    .catch(function (err) {
      done(err);
    });
});

/* Clean before build */
gulp.task('clean', function(){
  gulp.src(distRoot + '/**', {read: false})
    .pipe(plugins.clean());
});

/* Master tasks */
gulp.task('compile-fonts', function () {
  plugins.runSequence(
    'fonts',
    'sync-fonts'
  );
});

gulp.task('compile-imgs', function () {
  plugins.runSequence(
    'imgmin',
    'sync-imgs'
  );
});

gulp.task('compile-scss', function () {
  plugins.runSequence(
    'scss-lint',
    'scss',
    'csslibs',
    'sync-css'
  );
});

gulp.task('compile-scripts', function () {
  plugins.runSequence(
    'jshint',
    'jslibs'
  );
});

gulp.task('compile-views', function () {
  plugins.runSequence(
    'views',
    'sync-views'
  );
});



/* Build process */
gulp.task('build', function () {
  plugins.runSequence(
    ['compile-fonts', 'compile-imgs', 'compile-scss', 'compile-scripts', 'compile-views']
  );
});


/* Watch DOG */
gulp.task('serve', ['build'], function () {
  // Static server & Autoreload
  plugins.browserSync.init({
    server: {
      baseDir: distRoot
    }
  });

  gulp.watch('**/*', {cwd: fonts.src}, ['compile-fonts']);
  gulp.watch('**/*', {cwd: imgs.src}, ['compile-imgs']);
  gulp.watch('**/*', {cwd: css.src}, ['compile-scss']);
  gulp.watch('**/*', {cwd: js.src}, ['compile-scripts']);
  gulp.watch('**/*', {cwd: views.src}, ['compile-views']);
});


gulp.task('default', ['serve']);
