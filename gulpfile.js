var gulp = require('gulp');
var args = require('yargs').argv;
var del = require('del');
var config = require('./gulp.config')();
//as it hasn't been executed yet, we tell it to execute so we can access its properties

let port = process.env.PORT || config.defaultPort;

// var jshint = require('gulp-jshint');
// var jscs = require('gulp-jscs');
// var util = require('gulp-util');
// var gulpprint = require('gulp-print').default;
// var gulpif = require('gulp-if');

var $ = require('gulp-load-plugins')({ lazy: true });

gulp.task('hello-world', function() {
    console.log('this is my first hello world task...');
});

gulp.task('vet', function() {
    return (
        gulp
            .src(config.alljs)
            // .pipe($.if(args.verbose, $.print()))
            .pipe($.jscs())
            .pipe($.jshint()) /**how to ignore a line */
            /* jshint -W033*/ .pipe(
                $.jshint.reporter('jshint-stylish', { verbose: true })
            )
            .pipe($.jshint.reporter('fail'))
    );
});

//run clea-styles before running this task
gulp.task('styles', ['clean-styles'], function() {
    log('compiling less --->>> sass ');

    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({ browsers: ['last 2 version', '> 5%'] }))
        .pipe(gulp.dest(config.temp));
});

//because we're not suing sream, we use a callback to signify to 'styles' (which is waiting for 'clean-styles' to finish) that it has finished
// gulp.task('clean-styles', function(done) {
gulp.task('clean-styles', function() {
    var files = config.temp + '**/*.css';
    // del(files);
    // clean(files, done);
    clean(files);
});

gulp.task('less-watcher', function() {
    //watch the directory we specified from teh config, and then fire a task accordingly
    gulp.watch([config.less], ['styles']);
});

gulp.task('wiredep', function() {
    log('wire up the bower css js and app js into our html');
    let options = config.getWiredepDefaultOptions();
    let wiredep = require('wiredep').stream;

    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles'], function() {
    log('wire up the app css into our html, and call wiredep');

    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['inject'], function() {
    let isDev = true;

    let nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
            PORT: port,
            NODE_ENV: isDev ? 'dev' : 'build'
        },
        watch: [config.server]
    };

    return (
        $.nodemon(nodeOptions)
            // .on('restart', ['vet'], function(ev) {
            .on('restart', function(ev) {
                log('*** nodemon restarted ***');
                log(`files changed on restart:\n ${ev}`);
            })
            .on('start', function() {
                log('*** nodemon started ***');
            })
            .on('crash', function() {
                log('*** nodemon crashed: script crashed for soem reason ***');
            })
            .on('exit', function() {
                log('*** nodemon exited cleanly ***');
            })
    );
});

// function clean(path, done) {
function clean(path) {
    log('Cleaning : ' + $.util.colors.yellow(path));
    // del(path, done); //done happens to take 2nd param of a callback
    del(path);
}

function log(msg) {
    if (typeof msg === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.yellow(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.yellow(msg));
    }
}
