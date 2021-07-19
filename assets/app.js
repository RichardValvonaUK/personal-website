/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './app.css';

// start the Stimulus application
//import './bootstrap.js';

//import './jquery-3.6.0.min.js';


// app.js

// require jQuery normally
const $ = require('./jquery-3.6.0.min.js');

// create global $ and jQuery variables
global.$ = global.jQuery = $;