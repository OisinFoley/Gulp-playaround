var gulp = require('gulp');
var args = require('yargs').argv;
var del = require('del');
let browserSync = require('browser-sync');
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

gulp.task('helper', $.taskListing);
gulp.task('default', ['helper']);

gulp.task('fonts', ['clean-fonts'], function() {
    log('copying fonts');

    /* prettier-ignore */
    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function() {
    log('copying and compressing images');

    return gulp
        .src(config.images)
        .pipe($.imagemin({ optimizationLevel: 4 }))
        .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean', function(done) {
    let delConfig = [].concat(config.build, config.temp);
    log(`Cleaning: ${$.util.colors.blue(delConfig)}`);
    del(delConfig, done);
});

gulp.task('clean-fonts', function(done) {
    clean(config.build + 'fonts/**/*.*', done);
});

gulp.task('clean-images', function(done) {
    clean(config.build + 'images/**/*.*', done);
});

gulp.task('clean-styles', function(done) {
    clean(config.build + 'styles/**/*.*', done);
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
                setTimeout(function() {
                    browserSync.notify('reloading now ...');
                    browserSync.reload({ stream: false });
                }, config.browserReloadDelay);
            })
            .on('start', function() {
                log('*** nodemon started ***');
                startBrowserSync();
            })
            .on('crash', function() {
                log('*** nodemon crashed: script crashed for soem reason ***');
            })
            .on('exit', function() {
                log('*** nodemon exited cleanly ***');
            })
    );
});

function changeEvent(event) {
    let srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync() {
    if (args.nosync || browserSync.active) {
        return;
    }

    log(`*****Starting browser sync on port: ${port}*****`);

    /* prettier-ignore */
    gulp.watch([config.less], ['styles'])
        .on('change', function(event) { changeEvent(event); });

    let options = {
        // proxy: `localhost:${port}`,
        proxy: 'localhost:' + port,
        port: 3000,
        files: [
            config.client + '**/*.*',
            //we ignore less files because the watcher that appears earlier in this function is converting our less to css
            //like always, hence only watching css
            '!' + config.less,
            config.temp + '**/*.css'
        ],
        ghostMode: {
            clicks: true,
            location: false,
            form: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };

    browserSync(options);
}

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
