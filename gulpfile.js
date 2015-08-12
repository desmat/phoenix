// http://www.sitepoint.com/introduction-gulp-js/

var gulp = require('gulp'); 
var jshint = require('gulp-jshint');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var react = require('gulp-react');
var minifyHTML = require('gulp-minify-html');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var watch = require('gulp-watch');
var babel = require('gulp-babel');

// JS Hint
gulp.task('jshint', function() {
  gulp.src(['./server/scripts/*.js', './client-dist/scripts/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// HTML
gulp.task('htmlpage', function() {
  var htmlSrc = './client/*.html',
      htmlDst = './client-dist';
 
  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
//    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));
});

// JSX
gulp.task('react', function () {
  gulp.src('./client/scripts/**/*.js')
	.pipe(react())
	.pipe(gulp.dest('./client-dist/scripts'));
}); 

// JS
gulp.task('scripts', function() {
  gulp.src(['./client/scripts/*.js'])
    // .pipe(changed('./client/scripts/'))
    .pipe(react())
    .pipe(babel())
    .pipe(concat('script.js'))
    // .pipe(stripDebug())
    // .pipe(uglify())
    .pipe(gulp.dest('./client-dist/scripts/'));
});

// CSS concat, auto-prefix and minify
gulp.task('styles', function() {
  gulp.src(['./client/styles/*.css'])
    .pipe(concat('styles.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./client-dest/styles/'));
});

// minify new images
gulp.task('imagemin', function() {
  var imgSrc = './client/images/**/*',
      imgDst = './client-desc/images';
 
  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
});

//default
gulp.task('default', ['imagemin', 'htmlpage', 'scripts', 'styles'], function() {
});

//watch while dev'ing
gulp.task('watch', ['default'/*, 'browserSync'*/], function() {
    gulp.watch('client/scripts/**/*.js', ['scripts']);
    // gulp.watch('scss/*.scss', ['sass']);
});
