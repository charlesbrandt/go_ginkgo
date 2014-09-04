var $ = require('jquery');
var lodash = require('lodash-node/underscore');
//I had trouble getting this version to work with broserify + node + mocha:
//var lodash = require('lodash');
var ko = require('knockout');

var Board = require('./board').Board;

function BoardViewModel(size, pixels) {
  var self = this;
  
  // size is in spaces, e.g. 9(x9), 13(x13), 19(x19)
  //self.size = size;
  self.size = ko.observable(size);
  //console.log("initial size: ", self.size());

  //this is also available as board.pixels after board has been initialized
  self.board_pixels = ko.observable(pixels);
  self.board = new Board(self.size, self.board_pixels);

  self.change_size = function(size) {
    //setting size directly from DOM binding is possible with:
    //<li class="action" data-bind="click: function(data, event) { size(19) }">19x19</li>
    //however, using computed functions to
    //automatically triggering update of CSS elements via jQuery
    //breaks unit tests with no DOM access via jQuery
    //so keeping those calls separate, here
    self.size(size);

    //update grid via CSS
    $('.grid').css({'background-size':self.board_pixels()+'px','width':self.board_pixels()+'px','height':self.board_pixels()+'px','left':self.board_left()+'px','top':self.board_top()+'px'}); 
    
    self.update_all();
  }
  
  self.show_configs = ko.observable(false);
  self.show_menu = ko.observable(false);
  self.show_controls = ko.observable(false);
  
  //depending on what is visible,
  //may want to change the widths available to controls
  self.min_control_width = ko.observable(50);
  
  self.gear_active = function() {
    //mouseover and mouseout result in multiple calls
    //use mouseenter and mouseleave to avoid multiple calls
    //http://stackoverflow.com/questions/9387433/onmouseover-running-multiple-times-while-hovering-on-element
    //$('#gear_image').fadeIn();
    $('#gear_image').fadeTo(400,.75);
    //console.log("showing gear!");
  };
  self.gear_inactive = function() {
    //$('#gear_image').fadeOut();
    if (! self.show_configs()) {
      $('#gear_image').fadeTo(400,.25);
    }
    //console.log("hiding gear!");
  };
  
  self.toggle_settings = function() {
    if (self.show_configs()) {
      self.show_configs(false);
      //console.log("hiding configs!");
      if ( (! self.show_controls()) && (self.min_control_width() != 50)) {
        self.min_control_width = ko.observable(50);
        self.update_all();
      }
    }
    else {
      self.show_configs(true);
      //console.log("showing configs!");
      //if (! self.show_controls()) {
      //  self.min_control_width = ko.observable(150);
      //  self.update_all();
      //}
    }      
  };
  

  self.menu_active = function() {
    $('#menu_image').fadeTo(400,.75);
  };
  self.menu_inactive = function() {
    if (! self.show_menu()) {
      $('#menu_image').fadeTo(400,.25);
    }
  };  
  self.toggle_menu = function() {
    if (self.show_menu()) {
      self.show_menu(false);
      if ( (! self.show_controls()) && (self.min_control_width() != 50)) {
        self.min_control_width = ko.observable(50);
        self.update_all();
      }
    }
    else {
      self.show_menu(true);
    }      
  };
  
  self.controls_active = function() {
    $('#controls_image').fadeTo(400,.75);
  };
  self.controls_inactive = function() {
    if (! self.show_controls()) {
      $('#controls_image').fadeTo(400,.25);
    }
  };  
  self.toggle_controls = function() {
    if (self.show_controls()) {
      self.show_controls(false);
      if ( (! self.show_controls()) && (self.min_control_width() != 50)) {
        self.min_control_width = ko.observable(50);
        self.update_all();
      }
    }
    else {
      self.show_controls(true);
    }      
  };

  
  //self.show_labels = ko.observable(true);
  self.show_labels = ko.observable(false);

  self.labels_top = ko.observableArray();
  self.labels_left = ko.observableArray();
  self.labels_right = ko.observableArray();
  self.labels_bottom = ko.observableArray();
    

  self.toggle_labels = function() {
    if (self.show_labels()) {
      self.show_labels(false);
      self.update_all();
    }
    else {
      self.show_labels(true);
      self.update_all();
    }      
  };
    
  //the size of the label border around the board
  //self.label_pixels = 24;
  self.label_pixels = ko.computed(function() {
    return self.board.space_pixels() / 2;
  });

  self.board_grid = ko.computed(function() {
    if (self.size() === 19) {
      //$('.grid').css({'background':'transparent url("/images/grid-19x19.png") no-repeat left top'});
      return 'transparent url("/images/grid-19x19.png") no-repeat left top';
    }
    else if (self.size() === 13) {
      //$('.grid').css({'background':'transparent url("/images/grid-13x13.png") no-repeat left top'});
      return 'transparent url("/images/grid-13x13.png") no-repeat left top';
    }
    else if (self.size() === 9) {
      //$('.grid').css({'background':'transparent url("/images/grid-9x9.png") no-repeat left top'});
      return 'transparent url("/images/grid-9x9.png") no-repeat left top';
      //console.log("updating GRID to 9");
    }
  });
  
  self.board_width = ko.computed(function() {
    //this is different than board.pixels...
    //includes labels *if* they're being shown

    //previously calculated in update_labels:
    //var labels_width = ((self.board.space_pixels() * self.size()) + (self.label_pixels() * 2));
    //var labels_width = (self.board.space_pixels() * (self.size()+2));
    
    if (self.show_labels()) {
      return (self.board.space_pixels() * (self.size()+2));
    }
    else {
      //return (self.board.space_pixels() * (self.size()+2));
      return self.board.pixels();
      
    }
  });
  
  self.board_top = ko.computed(function() {
    if (self.show_labels()) {
      return self.label_pixels();
    }
    else {
      return 0;
    }
  });

  self.board_left = ko.computed(function() {
    if (self.show_labels()) {
      return self.board.space_pixels();
    }
    else {
      return 0;
    }
  });
  
  self.make_labels = ko.computed(function() {
    var cur_pos, l;
    var sp = self.board.space_pixels();

    //want to re-create these incase dimensions have changed:
    self.labels_top.removeAll()
    self.labels_bottom.removeAll()
    self.labels_left.removeAll()
    self.labels_right.removeAll()
    
    if (self.show_labels()) {
      //cur_pos = self.label_pixels();
      cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_h(), function(label) {
	l = {
	  'label': label,
	  'left': cur_pos,
	  'top': 0 };
	self.labels_top.push(l);
	cur_pos += sp;
      });
      
      cur_pos = self.label_pixels();
      //cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_v(), function(label) {
	l = {
	  'label': label,
	  'left': 0,
	  'top': cur_pos };
	self.labels_left.push(l);
	cur_pos += sp;
      });
      
      cur_pos = self.label_pixels();
      //cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_v(), function(label) {
	l = {
	  'label': label,
	  //'left': self.label_pixels() + self.board_pixels(),
	  'left': self.board.space_pixels() + self.board_pixels(),
	  'top': cur_pos };
	self.labels_right.push(l);
	cur_pos += sp;
      });
      
      //cur_pos = self.label_pixels();
      cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_h(), function(label) {
	l = {
	  'label': label,
	  'left': cur_pos,
	  'top': self.label_pixels() + self.board_pixels() };
	  //'top': self.board.space_pixels() + self.board_pixels() };
	self.labels_bottom.push(l);
	cur_pos += sp;
      });
    }
    
  }, this);
    
  self.update_labels = function() { 
    $('.label_h').css({'width':self.board.space_pixels()+'px'});
    $('.label_h').css({'height':self.label_pixels()+'px'});
    $('.label_h').css({'line-height':self.label_pixels()+'px'});
    
    //$('.label_v').css({'width':self.label_pixels()+'px'});
    $('.label_v').css({'width':self.board.space_pixels()+'px'});
    $('.label_v').css({'height':self.board.space_pixels()+'px'});
    $('.label_v').css({'line-height':self.board.space_pixels()+'px'});
     
    var label_font = self.label_pixels() * .8;
    //console.log(self.board_width());
    $('.labels').css({'width':self.board_width()+'px'});
    //$('.labels').css({'height':self.label_pixels()+'px'});
    $('.labels').css({'font-size':label_font+'px'});
    $('.view').css({'width':self.board_width()+'px'});
    $('.view').css({'height':self.board_width()+'px'});
  };

  self.find_max_board_dimension = function() {
    // Not sure how to unit test this one with Node / Mocha...
    // no document or window there.
    //console.log("document: ", $(document).width(), $(document).height());
    //console.log("window: ", $(window).width(), $(window).height()); 

    var min_dimension;

    //($(window).width()+(self.min_control_width()/2))
    if ( $(window).width() <= $(window).height()) {
      //taller, vertical

      if ( ($(window).width()+(self.min_control_width())) > $(window).height() ) {
        min_dimension = $(window).height() - self.min_control_width();
      }
      else {
        min_dimension = $(window).width();
      }
    }
    else {
      //wider, horizontal
      if ( ($(window).height()+(self.min_control_width())) > $(window).width() ) {
        min_dimension = $(window).width() - self.min_control_width();
      }
      else {
        min_dimension = $(window).height();
      }
    }

    /*
    if ( ($(window).width()+(self.min_control_width()/2)) <= $(window).height()) {
      //taller, vertical
      min_dimension = $(window).width();
    }
    else {
      min_dimension = $(window).height();
    }
    */

    if (self.show_labels()) {
      //get rid of page padding:
      min_dimension = min_dimension - 16;
    
      //console.log('min_dimension (first): ', min_dimension);
      //min_dimension = min_dimension - (2 * self.label_pixels());
      //min_dimension = min_dimension - (2 * 24);
      //find what a space_pixels would be if using the max:
      var temp_pixels = min_dimension / (self.size() + 2);
      //console.log('temp_pixels: ', temp_pixels);
      
      min_dimension = min_dimension - (2 * temp_pixels);
      //console.log('min_dimension (second): ', min_dimension);
      
      //At some point I thought spaces would line up better if
      //integer pixel values were used
      //this doesn't seem to be necessary any more...
      //fixed something layout related along the line
      
      //console.log('self.size: ', self.size()); 
      var nearest_f = min_dimension / self.size();
      //console.log('nearest_f: ', nearest_f);
      //var nearest = Math.floor(min_dimension/self.size());
      var nearest = nearest_f;
      //console.log('nearest: ', nearest);
      return nearest * self.size();
    }
    else {
      //add in a little padding
      return min_dimension - 20;
    }
  };

  
  self.place_controls = function() {
    //figure out where the controls should go, based on the space available
    //if wider... put them to the right
    //if longer, put them underneath

    // this should be called after self.board_pixels
    // has been updated by find_max_board_dimension

    // minimum number of pixels needed on the right to show conrols
    
    //could use container instead of $(window) to get size if embedding
    if (($(window).width()<= $(window).height()) ) {
      //taller, vertical
      $('.left').css({'width':'100%'});
      $('.right').css({'width':'100%'});
    }
    else {
      //wider, horizontal
      $('.left').css({'width':self.board_width()+'px'});
      //need to calculate margins... setting to 50 for now
      var diff = $(window).width() - self.board_width() - 50;
      $('.right').css({'width':diff+'px'});
    }

  };

  
  self.update_all = function() {
    //console.log('pixels pre: ', self.board_pixels());
    self.board_pixels(self.find_max_board_dimension());
    self.place_controls();
    //console.log('pixels post: ', self.board_pixels());
    //console.log('starting updating dimensions');
    self.board.update_dimensions();
    //console.log('finished updating dimensions');
    self.make_labels();
    self.update_labels();
    //console.log('finished updating labels');
  };


  //having difficulty getting this to work.
  //http://www.red-bean.com/sgf/examples/ff4_ex.sgf
  //XMLHttpRequest cannot load http://www.red-bean.com/sgf/examples/ff4_ex.sgf.
  //No 'Access-Control-Allow-Origin' header is present on the requested resource.
  //Origin 'http://localhost:9000' is therefore not allowed access.
  self._remote_file = ko.observable("");
  self.editing_remote_file = ko.observable(false);
  self.edit_remote_file = function() { self.editing_remote_file(true) };	
  self.remote_file = ko.computed({
    read: function () {
      return self._remote_file();
    },
    write: function (value) {
      self._remote_file(value);
      $.ajax({  
        url: self._remote_file(),  
        dataType: "text",  
        done: function(data) {
          console.log(data);
          //if it works, could parse the data accordingly here
          remoteFile = data;
        },
        fail: function() {
          alert("Could not load: " + self._remote_file());
        },
      });       
    },
    owner: self
  });


  self.copy_diagram = function() {
    window.prompt ('Copy to clipboard: Ctrl+C, Enter', 'text');
  }

  self.filename = ko.observable("");
  self.local_file = ko.observable("");
  //http://www.html5rocks.com/en/tutorials/file/dndfiles/
  self.load_local = function (evt) {
    var files = evt.target.files; // FileList object    
    //javascript regular expressions:
    //https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Regular_Expressions
    var check_dash = /-/g;
    // files is a FileList of File objects. 
    for (var i = 0, f; f = files[i]; i++) {
      var reader = new FileReader();
      
      console.log(f);
      
      //update self.filename with loaded name:
      var parts = f.name.split('.');
      var prefix = parts[0];
      if (check_dash.test(prefix)) {
	console.log("Prefix has dash: ", prefix);
	parts = prefix.split('-');
	self.local_file(parts[2]);
      }
      else {
	self.local_file(prefix);
      }
      
      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        //console.log("reader.onload() called");
	return function(e) {
          //console.log("function called");
          //console.log(e.target.result);
          // call the function to process data:
	  //self.original.from_json(e.target.result);
          self.board.sgf.load(e.target.result);
          //reset board properties
          self.board.init();
          var size = parseInt(self.board.sgf.size);
          console.log(size);
          self.board.size(size);
          self.update_all();
	};
      })(f);
      
      // Read in the file...
      // this triggers the reader.onload() call... not optional!
      reader.readAsText(f);
    }
  };
  
}

module.exports.BoardViewModel = BoardViewModel;
