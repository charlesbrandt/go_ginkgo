/*global $: true */
'use strict';

var $ = require('jquery');
var lodash = require('lodash-node/underscore');
//I had trouble getting this to work with broserify + node + mocha:
//var lodash = require('lodash');
var ko = require('knockout');

function SGF(board) {
  
  var self = this;
  
  self.board = board;
  
  //maybe position needs to be an array of indexes 
  //multiple points required to get to correct branch
  self.position = [ 0 ];
  
  // [ 1, 2, [3, [branch], [branch]], 4, 5, ... ]
  self.moves = [];
  
  self.setup = function() {
    //take any setup parameters from the board
    //this could also be part of initialization call to SGF 
    //(rather than a separate function
    
  };
  
  self.add_move = function() {
    //if there is already an existing move at this position
    //add a new branch
    //keep adding on current branch, unless previous branch is restored
    
  };
  
  self.go_to = function(index) {
    //go to the given index file.
    console.log(index);
  };
  
  self.next = function() {
    //change position
    //and change board state too
  };
  
  self.previous = function() {
    
  };
  
  self.load = function(data) {
    //load moves from an existing SGF data stream (do not change position)
    //should probably check that position is 0, no existing moves...
    //that or else clear everything previous out...
    //that includes resetting board state...
    //go_to(0) first?
    console.log(data);
    
  };
  
  self.serialize = function() {
    //return a string representation of the SGF
    
    
  };
  
  self.save = function() {
    //return a downloadable sgf text file of current state
    
  };
  
  
}

function Space(board, name, contains, pixels, row, col) {
  var self = this;
  
  self.board = board;

  //should all be observable / computed values now
  //self.left = left;
  //self.top = top;
  self.row = row;
  self.col = col;
  
  if (ko.isObservable(pixels)) {
    self.pixels = pixels;
  }
  else {
    self.pixels = ko.observable(pixels);
  }
    
  //console.log(self.pixels);
  self.image_px = self.pixels;

  self.top = ko.computed(function() {
    return self.row * self.pixels();
  });

  self.left = ko.computed(function() {
    return self.col * self.pixels();
  });

  
  //alert(self.image_px);
  self.name = name;
  self.contains = ko.observable(contains);
  
  // this can be initialized later, after board has been set up properly
  self.neighbors = [ ];
  
  //marker type
  self.mtype = ko.observable('');
  
  self.hovering = ko.observable(false);
  
  self.shadow = ko.computed(function() {
    if (self.contains() === 'B' || self.contains() === 'W') {
      //return '{ display: block; }' ;
      return 'block';
    }
    else {
      return 'none';
    }
  }, this);
  
  self.stone = ko.computed(function() {
    if (self.contains() === 'B') {
      return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/stone-black.png">';
      
      //return 'url("images/black.png") no-repeat center center' ;
      //return 'url("images/black.png")' ;
      //return '';
      
    }
    else if (self.contains() === 'W') {
      return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/stone-white.png">';
      
      //return 'url("images/white.png") no-repeat center center' ;
      //return 'url("images/white.png")' ;
      //return '';
    }
    else {
      //return self.name + ": " + self.contains();
      return '';
    }
  }, this);
  
  //look in self.board.next_move instead of self.contains()
  self.hover = ko.computed(function() {
    if (self.hovering()) {
      if (self.board.next_move === 'B') {
	return '<img class="hover" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/stone-black.png">';
	//return 'url("images/black.png") no-repeat center center' ;
      }
      else {
	return '<img class="hover" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/stone-white.png">';
	//return 'url("images/white.png") no-repeat center center' ;
      }
      
    }
    else {
      //return self.name + ": " + self.contains();
      return '';
    }
  }, this);
  
  self.hover_on = function() {
    if (self.contains() === 'B' || self.contains() === 'W') {
      self.hovering(false);
    }
    else {
      self.hovering(true);
    }
  };
  
  self.hover_off = function() {
    self.hovering(false);
  };
  
  self.marker = ko.computed(function() {
    if (self.mtype() === 'circle') {
      if (self.contains() === 'B') {
	return 'transparent url("images/circle-white.png") no-repeat center center' ;
      }
      else if (self.contains() === 'W') {
	return 'transparent url("images/circle-black.png") no-repeat center center' ;
      }
      else {
	return 'transparent url("images/circle-red.png") no-repeat center center' ;
      }
      
    }
    else {
      return '';
    }
  }, this);
  
  self.has_stone = ko.computed(function() {
    if (self.contains() === 'B' || self.contains() === 'W') {
      return true;
    }
    else {
      return false;
    }
  }, this);
  
  self.has_liberties = function() {
    //use the board, in case neighbors have not been determined yet:
    var neighbors = self.board.get_neighbors(self);
    var liberties = false;
    var neighbor;
    
    for (var i = 0; i < neighbors.length; i++) {
      neighbor = neighbors[i];
      //console.log(self.name + " checking: " + neighbor.name)
      if (neighbor.contains() === '') {
	//alert("found empty neighbor at: " + neighbor.name + " for: " + space.name);
	liberties = true;
	break;
      }
    }
    //console.log("found liberties?: " + liberties);
    
    return liberties;
    
  };
  
  self.test = function() { 
    //alert('TEST!');
    console.log('TEST!');
  };
  
}

//Only represent board data here (no labels)
//module.exports.Board = function (size, pixels) {
function Board(size, pixels) {
  var self = this;

  if (ko.isObservable(size)) {
    self.size = size;
  }
  else {
    self.size = ko.observable(size);
  }
    
  if (ko.isObservable(pixels)) {
    self.pixels = pixels;
  }
  else {
    self.pixels = ko.observable(pixels);
  }
    
  //self.space_pixels = pixels / size; 
  ///just resetting forward slash for syntax highlighting to work in 902 editor

  self.space_pixels = ko.computed(function() {
    return self.pixels() / self.size();
  });
  
  self.next_move = 'B';

  self.last_move = false;
  
    //this might be better in an sgf object
  self.move = 0;
  
  self.captures = { 'B': 0, 'W': 0 };
  
  
  
  self.label_options = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T' ];
  //aka labels_x
  self.labels_h = lodash.first(self.label_options, self.size());
  //console.log(self.labels_h);
  
  //aka labels_y
  self.labels_v = [ ];
  for (var i = 1; i <= self.size(); i++) { 
    self.labels_v.push(i.toString());
  }
  //this is the way they're shown when rendering them:
  self.labels_v.reverse();
  //console.log(self.labels_v);
  
  self.rows = [ ];
  self.spaces = [ ];
  
  var space_name = '';
  //var left;
  //var top;
  var current;
  
  for (i = 0; i < self.size(); i++) {
    //aka position
    //var top = i * self.space_pixels();

    /*
    var top = ko.computed(function() {
      return i * self.space_pixels();
    });
    */
      
    //going to generate space_name in following loop:
    var row_spaces = [ ];
    for (var j = 0; j < self.size(); j++) {
      space_name = i + ',' + j;
      //left = j * self.space_pixels();

      //console.log('pixels: ', self.space_pixels(), ' left: ', left(), ' top: ', top());
      current = new Space(self, space_name, '', self.space_pixels, i, j);
      //this might be all we actually need:
      self.spaces.push(current);
      row_spaces.push(current);
    }
    
    //self.rows.push(new Row(self.size(), row_name, self.space_pixels()));
    self.rows.push(row_spaces);
  }
  
  // done with setup.
  
  
  self.make_move = function(space) { 
    if (space.contains() === '') {
      
      //update the value of space.contains()
      //this will automatically trigger updates of DOM
      //(thanks knockout!)
      space.contains(self.next_move);
      
      if (self.next_move === 'B') {
	self.next_move = 'W';
      }
      else {
	self.next_move = 'B';
      }
      self.move += 1;
      
      //update last move marker
      if (self.last_move) {
	self.last_move.mtype('');
      }
      space.mtype('circle');
      self.last_move = space;
      
      self.check_captures(space);
      
      //TODO: UPDATE SGF WITH MOVE HERE
    }
    
  };
  
  self.get_neighbors = function(space) {
    //can cache what we find in space.neighbors
    //but that is tricky to do on setup 
    //before all spaces have been initialized
    if (!(space.neighbors.length)) {
      var row_i, column_i;
      var row = parseInt(space.name.split(',')[0]);
      var column = parseInt(space.name.split(',')[1]);
      
      //north
      if (row !== 0) {
	row_i = row - 1;
	space.neighbors.push(self.rows[row_i][column]);
      }
      //east
      if (column !== self.size()-1) {
	column_i = column + 1;
	space.neighbors.push(self.rows[row][column_i]);
      }
      //south
      if (row !== self.size()-1) {
	row_i = row + 1;
	space.neighbors.push(self.rows[row_i][column]);
      }
      //west
      if (column !== 0) {
	column_i = column - 1;
	space.neighbors.push(self.rows[row][column_i]);
      }
      
      //alert(space.neighbors.length);
    }
    return space.neighbors;
  };
  
  
  //recursively call get_group for all neighbors that are connected
  //keep track of group in 'group'
  //works for spaces with any contains() type (including empty)
  self.get_group = function(space, group) {
    var neighbors = self.get_neighbors(space);
    
    group.push(space);
    
    //console.log('group contains: ' + group.length + ' items');
    
    lodash.each(neighbors, function(neighbor) {
      //make sure there is something in neighbor, 
      //and that is the same as what is in this space (it's connected)
      //and we don't already have it as part of the group:
      if (neighbor.contains() && (neighbor.contains() === space.contains()) && (lodash.indexOf(group, neighbor) === -1)) {
	group = self.get_group(neighbor, group);
      }
    });
    
    return group;
  };
  
  self.has_liberties = function(group) {
    var liberties = false;
    //using for loop to enable break on first found liberty:
    var current;
    
    //var message = 'Checking group of: ';
    //lodash.each(group, function(space) { 
    //    message += space.name + ', ';
    //});
    //console.log(message)
    
    for (var i = 0; i < group.length; i++) {
      current = group[i];
      if (current.has_liberties()) {
	liberties = true;
	break;
      }
    }
    return liberties;
  };
  
  self.capture_group = function(group) {
    //var message = 'capturing group of ' + group.length + ' stones at: ' + group[0].name + ' containing: ' + group[0].contains();
    //alert(message);
    //console.log(message);
    
    if (group[0].contains() === 'W') {
      //self.captures['B'] += group.length;
      self.captures.B += group.length;
    }
    else if (group[0].contains() === 'B') {
      self.captures.W += group.length;
    }
    
    lodash.each(group, function(space) {
      space.contains('');
    });
    
  };
  
  self.check_captures = function(space) {
    var neighbors = self.get_neighbors(space);
    var libs = false;
    var group = [];
    
    //see if our move captures any of our neighboring groups:
    lodash.each(neighbors, function(neighbor) {
      if (neighbor.contains() && (neighbor.contains() !== space.contains())) {
	//want to reset group every time:
	group = [];
	group = self.get_group(neighbor, group);
	//console.log('checking liberties');
	libs = self.has_liberties(group);
	//alert('has_liberties result: ' + libs);
        
	if (!(libs)) {
	  self.capture_group(group);
	}
      }
    });
    
    //now make sure that the current space's group has liberties:
    group = [];
    group = self.get_group(space, group);
    libs = self.has_liberties(group);
    if (!(libs)) {
      self.capture_group(group);
    }
    
  };

  self.update_dimensions = function() {
    //console.log('starting dimension update');
    $('.shadow').css({'width':self.space_pixels()+'px'});
    $('.shadow').css({'height':self.space_pixels()+'px'});
    $('.space').css({'width':self.space_pixels()+'px'});
    $('.space').css({'height':self.space_pixels()+'px'});
    $('div.stone').css({'width':self.space_pixels()+'px'});
    $('div.stone').css({'height':self.space_pixels()+'px'});
    $('div.hover').css({'width':self.space_pixels()+'px'});
    $('div.hover').css({'height':self.space_pixels()+'px'});
    $('.marker').css({'width':self.space_pixels()+'px'});
    $('.marker').css({'height':self.space_pixels()+'px'});
  };
  
}

//module.exports.BoardViewModel = function (size, pixels) {
function BoardViewModel(size, pixels) {
  // size is in spaces, e.g. 9(x9), 13(x13), 19(x19)
  var self = this;
  
  //self.size = size;
  self.size = ko.observable(size);
  //console.log("initial size: ", self.size());

  //self.pixels = pixels;
  self.pixels = ko.observable(pixels);
  
  self.board = new Board(self.size, self.pixels);

  self.sgf = new SGF();

  //self.show_labels = ko.observable(true);
  self.show_labels = ko.observable(false);
  
  //the size of the label border around the board
  //self.label_pixels = 24;
  self.label_pixels = ko.computed(function() {
    return self.board.space_pixels() / 2;
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
      return board.space_pixels();
    }
    else {
      return 0;
    }
  });
  
  self.make_labels = ko.computed(function() {
    var cur_pos, l;
    var sp = self.board.space_pixels();
    
    self.labels_top = [];
    self.labels_left = [];
    self.labels_right = [];
    self.labels_bottom = [];
    
    if (self.show_labels()) {
      //cur_pos = self.label_pixels();
      cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_h, function(label) {
	l = {
	  'label': label,
	  'left': cur_pos,
	  'top': 0 };
	self.labels_top.push(l);
	cur_pos += sp;
      });
      
      cur_pos = self.label_pixels();
      //cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_v, function(label) {
	l = {
	  'label': label,
	  'left': 0,
	  'top': cur_pos };
	self.labels_left.push(l);
	cur_pos += sp;
      });
      
      cur_pos = self.label_pixels();
      //cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_v, function(label) {
	l = {
	  'label': label,
	  //'left': self.label_pixels() + self.pixels(),
	  'left': self.board.space_pixels() + self.pixels(),
	  'top': cur_pos };
	self.labels_right.push(l);
	cur_pos += sp;
      });
      
      //cur_pos = self.label_pixels();
      cur_pos = self.board.space_pixels();
      lodash.each(self.board.labels_h, function(label) {
	l = {
	  'label': label,
	  'left': cur_pos,
	  'top': self.label_pixels() + self.pixels() };
	  //'top': self.board.space_pixels() + self.pixels() };
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
     
    var labels_width = ((self.board.space_pixels() * self.size()) + (self.label_pixels() * 2));
    var label_font = self.label_pixels() * .8;
    //console.log(labels_width);
    $('.labels').css({'width':labels_width+'px'});
    //$('.labels').css({'height':self.label_pixels()+'px'});
    $('.labels').css({'font-size':label_font+'px'});
    $('.view').css({'width':labels_width+'px'});
    $('.view').css({'height':labels_width+'px'});
  };

  self.find_board_dimension = function() {
    // Not sure how to unit test this one with Node / Mocha...
    // no document or window there.
    //console.log("document: ", $(document).width(), $(document).height());
    //console.log("window: ", $(window).width(), $(window).height()); 

    var min_dimension;
    if ($(window).width() <= $(window).height()) {
      min_dimension = $(window).width();
    }
    else {
      min_dimension = $(window).height();
    }

    if (self.show_labels()) {
      console.log('min_dimension (first): ', min_dimension);
      //min_dimension = min_dimension - (2 * self.label_pixels());
      //min_dimension = min_dimension - (2 * 24);
      //find what a space_pixels would be if using the max:
      var temp_pixels = min_dimension / (self.size() + 2);
      console.log('temp_pixels: ', temp_pixels);
      
      min_dimension = min_dimension - (2 * temp_pixels);
      console.log('min_dimension (second): ', min_dimension);
      
      //At some point I thought spaces would line up better if
      //integer pixel values were used
      //this doesn't seem to be necessary any more...
      //fixed something layout related along the line
      
      //console.log('self.size: ', self.size()); 
      var nearest_f = min_dimension / self.size();
      //console.log('nearest_f: ', nearest_f);
      //var nearest = Math.floor(min_dimension/self.size());
      var nearest = nearest_f;
      console.log('nearest: ', nearest);
      return nearest * self.size();
    }
    else {
      //add in a little padding
      return min_dimension - 20;
    }
  };

  self.update_all = function() {
    //console.log('pixels pre: ', self.pixels());
    self.pixels(self.find_board_dimension());
    //console.log('pixels post: ', self.pixels());
    //console.log('starting updating dimensions');
    self.board.update_dimensions();
    //console.log('finished updating dimensions');
    self.update_labels();
    //console.log('finished updating labels');
  };
    
}

module.exports.SGF = SGF;
module.exports.Space = Space;
module.exports.Board = Board;
module.exports.BoardViewModel = BoardViewModel;
