'use strict';

var ko = require('knockout');

function Space(board, contains, pixels, row, column) {
  //representation of a Space within the DOM (on the board)
  
  var self = this;
  
  self.board = board;

  //should all be observable / computed values now
  //self.left = left;
  //self.top = top;
  self.row = row;
  self.column = column;
  
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
    return self.column * self.pixels();
  });
  
  //this is useful for debugging:
  //should just use row and column now...
  //self.name = name;

  //TODO
  //thoughts on refactoring these to be closer to expectations
  //(stone, marker, label)
  //would also need to refactor computed fuctions by those names
  //used to render html in the dom
  self.contains = ko.observable(contains);
  
  //marker type
  self.mtype = ko.observable('');

  self.label = ko.observable('');

  self.hovering = ko.observable(false);
  
  // this can be initialized later, after board has been set up properly
  self.neighbors = [ ];

  self.clear_markers = function() {
    // clear both marker and label
    self.mtype('');
    self.label('');
  };
  
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
}

module.exports.Space = Space;
