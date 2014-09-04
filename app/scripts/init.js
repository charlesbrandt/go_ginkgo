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
ko.mustacheTemplateEngine = function () { }

ko.mustacheTemplateEngine.prototype = ko.utils.extend(new ko.templateEngine(), {
  
  renderTemplateSource: function (templateSource, bindingContext, options) {
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
  bv.update_all()
});

$(window).resize(function() {
  //$('body').prepend('<div>Window: ' + $(window).width() + ' x ' + $(window).height() + '</div>');
  //$('body').prepend('<div>Document: ' + $(document).width() + ' x ' + $(document).height() + '</div>');
  bv.update_all()
});

document.getElementById('source').addEventListener('change', bv.load_local, false);

//console.log("made it here");
