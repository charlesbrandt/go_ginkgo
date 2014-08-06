/*
Take care of initializing elements needed in the DOM, 
or requiring access to the DOM 
here
*/

//ko.applyBindings(new BoardViewModel(19, 850, 850));
//ko.applyBindings(new BoardViewModel(19, 400, 400));

//TODO:
//determine screen width in JavaScript, then pass in size during initialization
//catch window resize event and resize board accordingly
//
var ko = require('knockout');
var $ = require('jquery');
var go_ginko = require('./board');

var bv = new go_ginko.BoardViewModel(19, 762);
//choosing a pixel size that is evenly divisible by board size 
//makes everything line up more accurately
ko.applyBindings(bv);

$(document).ready(function() {
  bv.update_all()
});

$(window).resize(function() {
  //$('body').prepend('<div>Window: ' + $(window).width() + ' x ' + $(window).height() + '</div>');
  //$('body').prepend('<div>Document: ' + $(document).width() + ' x ' + $(document).height() + '</div>');
  bv.update_all()
  
});

//console.log("made it here");
