module.exports = function() {
    let client = './src/client/';
    let clientApp = client + 'app/';
    let temp = './.tmp/';
    let server = './src/server/';

    var config = {
        //all js to vet task
        alljs: ['./src/**/*.js', './*.js'],
        build: './build/',
        client: client,
        css: temp + 'styles.css',
        fonts: './bower_components/font-awesome/fonts/**/*.*',
        html: clientApp + '**/*.html',
        htmltemplates: clientApp + '**/*.html',
        images: client + 'images/**/*.*',
        index: client + 'index.html',
        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],

        less: client + 'styles/styles.less',
        // less: `${client}styles/styles.less`
        server: server,
        temp: temp,

        /*
            template cache
        */
        //if standalone set to true you also have to tell
        //main module to depend upon this new standalone cache file
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.core',
                standAlone: false,
                root: 'app/'
            }
        },

        /* browser sync */
        browserReloadDelay: 1000,

        /*
            bower and npm locations
        */
        bower: {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../..'
        },

        /*
            node settings
        */
        defaultPort: 7203,
        nodeServer: './src/server/app.js'
    };

    config.getWiredepDefaultOptions = function() {
        let options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };

    return config;
};
