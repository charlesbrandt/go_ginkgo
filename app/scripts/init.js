/*global $: true */
'use strict';

/*
Take care of initializing elements needed in the DOM, 
or requiring access to the DOM 
here
*/

var ko = require('knockout');
var $ = require('jquery');
var mustache = require('mustache');

var go_ginko = require('./view');

//https://github.com/WTK/ko.mustache.js/blob/master/ko.mustache.js
ko.mustacheTemplateEngine = function () { };

ko.mustacheTemplateEngine.prototype = ko.utils.extend(new ko.templateEngine(), {
  
  //renderTemplateSource: function (templateSource, bindingContext, options) {
  renderTemplateSource: function (templateSource, bindingContext) {
    var data = bindingContext.$data;
    var templateText = templateSource.text();		
    var htmlResult = mustache.to_html(templateText, data);
    
    return ko.utils.parseHtmlFragment(htmlResult);
  },
  
  allowTemplateRewriting: false,
  
  version: '0.9.0'
});

ko.setTemplateEngine(new ko.mustacheTemplateEngine());

//ko.applyBindings(new BoardViewModel(19, 850, 850));
//ko.applyBindings(new BoardViewModel(19, 400, 400));

var bv = new go_ginko.BoardViewModel(19, 762);
//choosing a pixel size that is evenly divisible by board size 
//makes everything line up more accurately
ko.applyBindings(bv);

$(document).ready(function() {
  bv.update_all();
});

$(window).resize(function() {
  //$('body').prepend('<div>Window: ' + $(window).width() + ' x ' + $(window).height() + '</div>');
  //$('body').prepend('<div>Document: ' + $(document).width() + ' x ' + $(document).height() + '</div>');
  bv.update_all();
});

document.getElementById('source').addEventListener('change', bv.load_local, false);


//aka modal, lightbox
//https://kopepasah.com/tutorial/awesome-overlays-with-simple-css-javascript-html/
$( '.overlay-trigger' ).on( 'click', function( event ) {
  event.preventDefault();
  
  /**
   * Set the overlay variable based on the data provided
   * by the overlay trigger.
   */
  var overlay = $( this ).data( 'overlay' );
  
  /**
   * If the overlay variable is not defined, give a message
   * and return.
   */
  if ( ! overlay ) {
    console.log( 'You must provide the overlay id in the trigger. (data-overlay="overlay-id").' );
    return;
  }
  
  /**
   * If we've made it this far, we should have the data
   * needed to open a overlay. Here we set the id variable
   * based on overlay variable.
   */
  var id = '#' + overlay;
  
  /**
   * Let's open up the overlay and prevent the body from
   * scrolling, both by adding a simple class. The rest
   * is handled by CSS (awesome).
   */
  $( id ).addClass( 'overlay-open' );
  $( 'body' ).addClass( 'overlay-view' );
  
  /**
   * When the overlay outer wrapper or `overlay-close`
   * triger is clicked, lets remove the classes from
   * the current overlay and body. Removal of these
   * classes restores the current state of the user
   * experience. Again, all handled by CSS (awesome).
   */
  $( id ).on( 'click', function( event ) {
    // Verify that only the outer wrapper was clicked.
    if ( event.target.id == overlay ) {
      $( id ).removeClass( 'overlay-open' );
      $( 'body' ).removeClass( 'overlay-view' );
    }
  });
  
  /**
   * Closes the overlay when the esc key is pressed. See
   * comment above on closing the overlay for more info
   * on how this is accomplished.
   */
  $( document ).keyup( function( event ) {
    // Verify that the esc key was pressed.
    if ( event.keyCode == 27 ) {
      $( id ).removeClass( 'overlay-open' );
      $( 'body' ).removeClass( 'overlay-view' );
    }
  });
});

//console.log("made it here");
