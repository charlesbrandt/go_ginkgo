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

  self.render = ko.computed(function() {
    //render everything for the space here
    //that way less extra stuff if it's not needed
    var result = '';
    
    if (self.contains()) {
      //result += '<div class="space" style="left: ' + self.left() + 'px; top: ' + self.top() + 'px;">\n';
      result += '<div class="space" style="left: 0px; top: 0px;">\n';
      result += '<div class="stone">' + self.stone() + '</div>\n';
      result += '</div>';
    }

    if (self.hovering()) {
      result += '<div class="space" style="left: 0px; top: 0px;">\n';
      //result += '<div class="space" style="left: ' + self.left() + 'px; top: ' + self.top() + 'px;">\n';
      result += '<div class="hover">' + self.hover() + '</div>\n';
      result += '</div>';
    }

    if (self.mtype()) {
      //old approach of using background to show marker
      //this was more of a concern when trying to limit the number of empty divs
      //result += '<div class="marker" style="left: ' + self.left() + 'px; top: ' + self.top() + 'px; background: ' + self.marker() + '; background-size: contain">\n';
      
      //result += '<div class="marker" style="left: 0px; top: 0px; background: ' + self.marker() + '; background-size: contain">\n';
      //result += '</div>';

      result += '<div class="space" style="left: 0px; top: 0px;">\n';
      result += '<div class="marker">' + self.marker() + '</div>\n';
      result += '</div>';

    }

    if (self.label()) {
      result += '<div class="marker" style="left: 0px; top: 0px; line-height: ' + self.image_px() + 'px">\n';
      //result += '<div class="marker">' + self.label() + '</div>\n';
      if (self.contains() === 'B') {
          result += '<font color="white">' + self.label() +'</font>\n';
      }
      else if (self.contains() === 'W') {
        result += self.label() +'\n';
      }
      else {
          result += '<div style="background-color:rgba(144, 144, 144, 0.7);"><font color="red">' + self.label() +'</font></div>\n';
      }
      result += '</div>';

    }
    
    
    return result;

  }, this);
  


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
      if (self.board.sgf().cur_node().next_move === 'B') {
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
    //console.log('hover_on called', self.hovering());
  };
  
  self.hover_off = function() {
    self.hovering(false);
    //console.log('hover_off called', self.hovering());
  };
  
  self.marker = ko.computed(function() {
    if (self.mtype() === 'circle') {
      if (self.contains() === 'B') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/circle-white.png">';
      }
      else if (self.contains() === 'W') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/circle-black.png">';
      }
      else {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/circle-red.png">';
      }      
    }

    else if (self.mtype() === 'triangle') {
      if (self.contains() === 'B') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/triangle-white.png">';
      }
      else if (self.contains() === 'W') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/triangle-black.png">';
      }
      else {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/triangle-red.png">';
      }      

    }

    else if (self.mtype() === 'square') {
      if (self.contains() === 'B') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/square-white.png">';
      }
      else if (self.contains() === 'W') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/square-black.png">';
      }
      else {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/square-red.png">';
      }      

      if (self.contains() === 'B') {
	return 'transparent url("images/square-white.png") no-repeat center center' ;
      }
      else if (self.contains() === 'W') {
	return 'transparent url("images/square-black.png") no-repeat center center' ;
      }
      else {
	return 'transparent url("images/square-red.png") no-repeat center center' ;
      }      
    }
    
    else if (self.mtype() === 'selected') {
      if (self.contains() === 'B') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/selected-white.png">';
      }
      else if (self.contains() === 'W') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/selected-black.png">';
      }
      else {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/selected-red.png">';
      }      

    }

    else if (self.mtype() === 'mark') {
      if (self.contains() === 'B') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/mark-white.png">';
      }
      else if (self.contains() === 'W') {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/mark-black.png">';
      }
      else {
        return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/mark-red.png">';
      }      

      if (self.contains() === 'B') {
	return 'transparent url("images/mark-white.png") no-repeat center center' ;
      }
      else if (self.contains() === 'W') {
	return 'transparent url("images/mark-black.png") no-repeat center center' ;
      }
      else {
	return 'transparent url("images/mark-red.png") no-repeat center center' ;
      }      
    }

    else if (self.mtype() === 'territory_white') {
      return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/mark-white.png">';
    }
    
    else if (self.mtype() === 'territory_black') {
      return '<img class="stone" width="' + self.image_px() + 'px" height="' + self.image_px() + 'px" src="images/mark-black.png">';
    }
    
    else {
      return '';
    }
  }, this);

  /*
  self.marker_background = ko.computed(function() {
    if (self.mtype() === 'circle') {
      if (self.contains() === 'B') {
	return "transparent url('images/circle-white.png') no-repeat center center" ;
      }
      else if (self.contains() === 'W') {
	return "transparent url('images/circle-black.png') no-repeat center center" ;
      }
      else {
	return "transparent url('images/circle-red.png') no-repeat center center" ;
      }      
    }

    else if (self.mtype() === 'triangle') {
      if (self.contains() === 'B') {
	return 'transparent url("images/triangle-white.png") no-repeat center center' ;
      }
      else if (self.contains() === 'W') {
	return 'transparent url("images/triangle-black.png") no-repeat center center' ;
      }
      else {
	return 'transparent url("images/triangle-red.png") no-repeat center center' ;
      }      
    }

    else if (self.mtype() === 'square') {
      if (self.contains() === 'B') {
	return 'transparent url("images/square-white.png") no-repeat center center' ;
      }
      else if (self.contains() === 'W') {
	return 'transparent url("images/square-black.png") no-repeat center center' ;
      }
      else {
	return 'transparent url("images/square-red.png") no-repeat center center' ;
      }      
    }
    
    else if (self.mtype() === 'selected') {
      if (self.contains() === 'B') {
	return 'transparent url("images/selected-white.png") no-repeat center center' ;
      }
      else if (self.contains() === 'W') {
	return 'transparent url("images/selected-black.png") no-repeat center center' ;
      }
      else {
	return 'transparent url("images/selected-red.png") no-repeat center center' ;
      }      
    }

    else if (self.mtype() === 'mark') {
      if (self.contains() === 'B') {
	return 'transparent url("images/mark-white.png") no-repeat center center' ;
      }
      else if (self.contains() === 'W') {
	return 'transparent url("images/mark-black.png") no-repeat center center' ;
      }
      else {
	return 'transparent url("images/mark-red.png") no-repeat center center' ;
      }      
    }

    else if (self.mtype() === 'territory_white') {
      return 'transparent url("images/mark-white.png") no-repeat center center' ;
    }
    
    else if (self.mtype() === 'territory_black') {
      return 'transparent url("images/mark-black.png") no-repeat center center' ;
    }
    
    else {
      return '';
    }
  }, this);
  */
  
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
