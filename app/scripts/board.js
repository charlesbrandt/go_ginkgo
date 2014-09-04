/*global $: true */
'use strict';

var $ = require('jquery');
var lodash = require('lodash-node/underscore');
//I had trouble getting this version to work with broserify + node + mocha:
//var lodash = require('lodash');
var ko = require('knockout');

var SGF = require('./sgf').SGF;
var Space = require('./space').Space;

//since we have lodash, just stick with _.isEqual(a, b)
//http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
//function compare_arrays(array1, array2) {

var label_options = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T' ];

//Only represent board data here (no side labels)
//module.exports.Board = function (size, pixels) {
function Board(size, pixels) {
  var self = this;

  self.init = function () {
  
    self.next_move = 'B';

    self.last_move = false;
  
    //tracking this here so we know which direction a change happens for self.go
    self.move = 0;
  }

  self.init();
  
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

  self.sgf = new SGF();
  
  //aka labels_x
  self.labels_h = ko.computed(function() {
    return lodash.first(label_options, self.size());
  });
  //console.log(self.labels_h);
  
  //aka labels_y
  self.labels_v = ko.computed(function() {
    var temp = [ ];
    for (var i = 1; i <= self.size(); i++) { 
      temp.push(i.toString());
    }
    //this is the way they're shown when rendering them:
    temp.reverse();
    return temp;
  });

  //console.log(self.labels_v);
  
  self.spaces = ko.observableArray();
  
  self.make_spaces = ko.computed(function() {
    //console.log("Regenerating board spaces");
    
    self.rows = [ ];
    self.spaces.removeAll();
    
    var space_name = '';
    var current;
  
    for (var i = 0; i < self.size(); i++) {
      
      //space_name is generated in the following loop:
      var row_spaces = [ ];
      for (var j = 0; j < self.size(); j++) {
        space_name = label_options[i] + label_options[j];
        current = new Space(self, space_name, '', self.space_pixels, i, j);
        self.spaces.push(current);
        row_spaces.push(current);
      }
    
      self.rows.push(row_spaces);
    }
  });

  //console.log(self.spaces());
  
  // done with setup.

  //self.go = function(position) {
  self.go = function(move) {
    //hehe... go... get it?
    //move to a specific position within the board

    //TODO:
    //unset markers from current node first:
    
    var last_node;
    
    //use SGF object to determine branches and track positions
    var nodes = self.sgf.go(move);
    if (move > self.move) {
      
      lodash.each(nodes, function(node, i) {
        self.apply_node(node);
        last_node = node;
      });
    }
    else {        
      lodash.each(nodes, function(node, i) {
        self.undo_node(node);
        last_node = node;
      });
    }

    //TODO:
    //set markers from last node now

    
  }

  self.next = function(branch) {
    if (!branch) {
      branch = 0;
    }
    //console.log(branch);
    //console.log(self.sgf);
    //use SGF object to determine branches and track positions


    var node = self.sgf.next(branch);
    console.log(node);

    //first apply any markers
    
    self.apply_node(node);
  }

  self.previous = function() {
    var node = self.sgf.previous();
    self.undo_node(node);
  }

  self.undo_node = function(node) {
    // similar to apply_node
    // but in reverse

  }

  self.apply_marker = function(marker) {
    //if (marker.space) {
    var cur_space;
    var indexes;

    indexes = marker.indexes();
    cur_space = self.rows[indexes[0]][indexes[1]];
    console.log(cur_space);
    //}
  }

  self.set_markers = function(node) {
    lodash.each(node.markers, function(marker) {
      self.apply_marker(marker);
    });

    lodash.each(node.stones, function(marker) {
      self.apply_marker(marker);
    });

    lodash.each(node.labels, function(marker) {
      self.apply_marker(marker);
    });
    
  }    
  
  self.apply_node = function(node) {
    // similar to make move,
    // but there may be other actions, like adding a marker

    var cur_space;
    var indexes;

    //clear all current markers

    //clear all current labels

    //then apply the move
    if (node.move.space) {
      indexes = node.move.indexes();
      cur_space = self.rows[indexes[0]][indexes[1]];

      if (node.move.type !== self.next_move) {
        console.log("Next move in SGF: ", node.move.type, " != expected next move: ", self.next_move);
      }
      
      // reset these before handle move, so they get updated appropriately
      node.total_captures.B = node.parent.total_captures.B;
      node.total_captures.W = node.parent.total_captures.W;
      node.captures = self.handle_move(cur_space, node);      
    }    
               
  }

  self.make_move = function(space) {
    //update the SGF and handle_move
    if (space.contains() === '') {
      var node;
      node = self.sgf.add_move(space.name, self.next_move);
      self.sgf.captures = self.handle_move(space, node);
    }
  };
  
  self.handle_move = function(space, node) {
    // only pass in node if you want captures applied to it
    // no sgf interaction here...
    // this should be the common bits between advancing in SGF
    // and make_move
    var captures;
    if (space.contains() === '') {
      //update the value of space.contains()
      //this will automatically trigger updates of DOM
      //(thanks knockout!)
      space.contains(self.next_move);

      captures = self.check_captures(space, node);
      
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
      self.last_move = space;
      space.mtype('circle');
    }
    return captures;
  };
      
  self.get_neighbors = function(space) {
    //can cache what we find in space.neighbors
    //but that is tricky to do on setup 
    //before all spaces have been initialized
    if (!(space.neighbors.length)) {
      var row_i, column_i;
      //var row = parseInt(space.name.split(',')[0]);
      //var column = parseInt(space.name.split(',')[1]);
      
      //north
      if (space.row !== 0) {
	row_i = space.row - 1;
	space.neighbors.push(self.rows[row_i][space.column]);
      }
      //east
      if (space.column !== self.size()-1) {
	column_i = space.column + 1;
	space.neighbors.push(self.rows[space.row][column_i]);
      }
      //south
      if (space.row !== self.size()-1) {
	row_i = space.row + 1;
	space.neighbors.push(self.rows[row_i][space.column]);
      }
      //west
      if (space.column !== 0) {
	column_i = space.column - 1;
	space.neighbors.push(self.rows[space.row][column_i]);
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
  
  self.capture_group = function(group, node) {
    //var message = 'capturing group of ' + group.length + ' stones at: ' + group[0].name + ' containing: ' + group[0].contains();
    //alert(message);
    //console.log(message);
    
    if (group[0].contains() === 'B') {
      //self.captures['B'] += group.length;
      //self.sgf.cur_node.total_captures.B += group.length;
      node.total_captures.B += group.length;
    }
    else if (group[0].contains() === 'W') {
      //self.sgf.cur_node.total_captures.W += group.length;
      node.total_captures.W += group.length;
    }
    
    lodash.each(group, function(space) {
      space.contains('');
    });
    
  };
  
  self.check_captures = function(space, node) {
    var neighbors = self.get_neighbors(space);
    var libs = false;
    var captures = [];
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
	  self.capture_group(group, node);
          captures.push(group);
	}
      }
    });
    
    //now make sure that the current space's group has liberties:
    group = [];
    group = self.get_group(space, group);
    libs = self.has_liberties(group);
    if (!(libs)) {
      self.capture_group(group);
      captures.push(group);
    }

    return captures;    
  };

  //by making this computed(), unit tests will try to run it
  //which will then require jquery, which requires a window + document... fail
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

module.exports.Board = Board;

