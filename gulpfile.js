
var gulp = require('gulp');

var jade = require('gulp-jade');
var jshint = require('gulp-jshint');
var deploy = require('gulp-gh-pages');

var gm = require('gm');
var del = require('del');
var async = require('async');
var connect = require('connect');
var serveStatic = require('serve-static');
var mkdirp = require('mkdirp');


var vendors = {
  'webkit': '-webkit-image-set',
  'mozila': '-moz-image-set',
  'opera': '-o-image-set',
  'ie': '-ms-image-set',
  'w3c': 'image-set'
};

var scales = [1, 2, 3];

var originalWidth = 240;
var originalHeight = 60;

var notSupportedImgSet = 'not-supported.png';
var imgDir = 'images';


function createImage (name, color, scale, cb) {
  var width = originalWidth * scale;
  var height = originalHeight * scale;

  gm(width, height, color)
    .fontSize(16)
    .drawText(16, height/3, name)
    .drawText(16, 3*height/4, 'width: ' + width +'px height: '+ height + 'px')
    .write('./build/' + imgDir + '/' + name, cb);
}

/*
http://dev.w3.org/csswg/css-images/#funcdef-image-set
background-image: image-set( "foo.png" 1x,
                             "foo-2x.png" 2x,
                             "foo-print.png" 600dpi );
*/

function generateCssTest () {

  var cssString = '\n';
  var imgSet;
  var scale;
  var name;

  for (var vendor in vendors) {
    imgSet = vendors[vendor];

    cssString += 'background-image: ';
    cssString += imgSet + '(\n';

    for (var i in scales) {
      scale = scales[i];
      name = vendor + '@' + scale + 'x.png';

      cssString += 'url(./' + imgDir + '/' + name + ') ' + scale + 'x';

      if (i !== ''+(scales.length-1)) {
        cssString += ',\n';
      }
    }
    cssString += ');\n';
  }
  return cssString;
}


gulp.task('images', ['clean'], function(cb) {
  mkdirp.sync('./build/images/');

  async.parallel([
    function (cb) {
      async.each(Object.keys(vendors), function (vendor, cb){
        async.each(scales, function (scale, cb){
          createImage(vendor+'@'+scale+'x.png', '#00cc33', scale, cb);
        }, cb);
      }, cb);
    },
    function (cb) {
      createImage(notSupportedImgSet, '#FF3333', 1, cb);
    }
  ], cb);
});


gulp.task('template', ['clean'], function() {
  return gulp.src('./src/index.jade')
    .pipe(jade({
      pretty: true,
      locals: {
        vendors: vendors,
        scales: scales,
        cssString: generateCssTest(),
        originalWidth: originalWidth,
        originalHeight: originalHeight,
        notSupportedImgSet: notSupportedImgSet,
        imgDir: imgDir
      }
    }))
    .pipe(gulp.dest('./build/'));
});

gulp.task('lint', function() {
  return gulp.src('./gulpfile.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('connect', ['build'], function () {
  var app = connect()
    .use(serveStatic('./build/'));

  require('http').createServer(app)
    .listen(8080)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:8080');
    });
});

gulp.task('deploy', ['build'], function () {
  gulp.src('./build/**/*')
    .pipe(deploy());
});

gulp.task('clean', function(cb) {
  del(['build'], cb);
});



gulp.task('build', ['images', 'template']);

gulp.task('default', ['lint', 'build']);
