'use strict';

var lodash = require('lodash-node/underscore');
var ko = require('knockout');

var Marker = require('./marker').Marker;

function Node(space, type) {
  //if space and type are supplied, they get applied to the move
  //all other attributes should be applied after initialization
  
  var self = this;
  
  self.move = new Marker(space, type);

  //track this on a node by node basis,
  //rather than at board level (as before)
  //this way we can respond to the 'Player to Play' property from an SGF
  //self.next_move = 'B';
  self.next_move = ko.observable('B');
  
  //the next player to play
  //previously a property of the board
  //use next_move instead????
  //self.player = '';
  
  //these only apply for add stones
  self.stones = [];

  //may have more than one marker for current description
  self.markers = [];

  //keeping labels separate...
  //would be nice to be able to have a marker and a label on the same space
  self.labels = [];

  /*
  //territory uses a different marking logic than MA (marked) 'X' markers
  //if its TB, want black even though space is empty
  //can handle this based on marker type
  //same goes for TW, white
  self.territory = [];
  */
  
  //will not be provided by SGF,
  //but will help when returning to previous board states (undoing)
  //only hold captures after *this* move
  //self.captures = [];

  //rather than track captures and try to recreate
  //hold the snapshot text output from a Diagram
  self.snapshot = '';

  //as they stand, cumulatively, after the current move
  //self.total_captures = { 'B': 0, 'W': 0 };

  //make these observable
  self.total_captures_b = ko.observable(0);
  self.total_captures_w = ko.observable(0);
  
  //in chinese scoring, it may be more useful to keep track of all stones
  self.score = { 'B': 0, 'W': 0 };
  
  
  //should this be position represented as a string?
  //is it necessary?
  //corresponds well to 'N' in SGF... Nodename
  self.name = '';

  self.comment = ko.observable('');
    
  self.children = [];

  //not sure that this will ever be needed within a Node
  //a flat representation of the position (only valid for current branch)
  //should just be able to use sgf.postion.length for equivalent value
  //self.number = 1;
  
  //this should be set after initialization by caller
  self.parent = null;

  self.position = function() {
    // go through all parents to calculate position
    var cur_pos = 0;
    var cur_parent = self.parent;
    while (cur_parent) {
      cur_pos += 1;
      cur_parent = cur_parent.parent;
    }
    return cur_pos;
  };

  self.remove = function() {
    //verification that this is the desired action should happen at the UI level

    //
    if (self.parent) {
      // can really only do this if we have a parent:
      var this_index = self.parent.children.indexOf(self);
      self.parent.children.splice(this_index, 1);
    }
    
  }
  
  self.children_indexes = function() {
    // return a list of indexes for use in referencing
    // different child nodes
    var range = lodash.range(self.children.length);
    //console.log(range);
    return range
  };
  
  self.set_move = function(space, color) {
    //rather than creating a new node and adding it to children
    //this simply sets the properties on the current node (self)
    //this is more useful when loading an SGF
    var err;
    
    if ( (self.move.space) && (self.move.space !== space) ) {
      err = new ReferenceError('Invalid move. Space: ' + self.move.space + ' already contains: ' + self.move.type + ' cannot change space to: ' + space);
      throw err;
    }

    else if ( (self.move.type) && (self.move.type !== color) ) {
      err = new ReferenceError('Invalid move. Space: ' + self.move.space + ' already contains: ' + self.move.type + ' cannot change content to: ' + color);
      throw err;
    }
    else {
      self.move.space = space;
      self.move.type = color;
    }
  };

  self.make_node = function() {
    //no error checking here
    //just create a new node and return the index of the new node in children

    var node = new Node();
    //node.number = self.number + 1;
    node.parent = self;
    //node.total_captures.B = self.total_captures.B;
    //node.total_captures.W = self.total_captures.W;
    node.total_captures_b(self.total_captures_b());
    node.total_captures_w(self.total_captures_w());
    self.children.push(node);
    return self.children.indexOf(node);
  };
  
  //self.add_move = function(space, color) {
  self.add_move = function(row, col, color) {
    //this is more useful when playing a game and recording the action
    //for SGF loading, see set move instead
    
    //if there is already an existing move at this space with same color
    //return the index of that node
    //if the color is different
    //return an error

    var matched = false;
    var index;
    
    lodash.each(self.children, function(option, i) {
      //if ( (option.move.space === space) && (option.move.type === color) ) {
      var row_col = option.move.indexes();
      if ( (row_col[0] === row) && (row_col[1] === col) && (option.move.type === color) ) {
        //console.log("MATCHED EXISTING");
        matched = true;
        index = i;
      }
      //else if ( (option.move.space === space) && (option.move.type !== color) ) {
      else if ( (row_col[0] === row) && (row_col[1] === col) && (option.move.type !== color) ) {
        var err = new ReferenceError('Invalid move. Space: ' + option.move.space + ' already contains: ' + option.move.type);
        throw err;
      }
    });

    if (! matched) {
      index = self.make_node();
      var child = self.children[index];
      //child.move.space = space;
      child.move.apply_indexes(row, col);
      child.move.type = color;
      return index;      
    }
    else {
      return index;
    }
  };

  self.check_for_conflict = function(options, space, type, attribute) {
    //var matched = false;
    //var index;
    var result = { 'matched': false, 'index': null };
    
    lodash.each(options, function(option, i) {
      if ( (option.space === space) && (option.type === type) ) {
        result.matched = true;
        result.index = i;
      }

      //*2014.10.19 11:11:07
      //I think it makes more sense to loosen this restriction for markers..
      //even for add_black and add_white
      //if there is something there already,
      //then the latest change will take precedence
      /*
      else if ( (option.space === space) && (option.type !== type) ) {
        var err = new ReferenceError('Invalid ' + attribute + ' Space: "' + option.space + '" already contains: ' + option.type + ' cannot add: ' + type);
        throw err;
      }
      */
    });

    return result;
  };
  
  self.add_marker = function(space, type) {
    //similar to add_move, but not adding a new move to children
    //only adding a marker to this current Node
    
    //if there is already an existing marker at this space (in this Node)
    //return the index of that space
    //if the type is different
    //log a warning, but not as dire... 

    var result = self.check_for_conflict(self.markers, space, type, 'marker');

    if (! result.matched) {
      //console.log("Adding: ->", type, "<- to: ", space);
      var marker = new Marker(space, type);
      self.markers.push(marker);
      return self.markers.indexOf(marker);
    }
    else {
      return result.index;
    }
  };

  /*
  self.add_territory = function(space, type) {
    var result = self.check_for_conflict(self.territory, space, type, 'territory');

    if (! result.matched) {
      //console.log("Adding: ->", type, "<- to: ", space);
      var marker = new Marker(space, type);
      self.territory.push(marker);
      return self.territory.indexOf(marker);
    }
    else {
      return result.index;
    }
  };
  */
  
  self.add_stone = function(space, type) {
    //not the same as a move... these are setup configurations
    //similar to add_marker, but not a marker...
    //want to be able to add a stone and a marker in the same node
    
    var result = self.check_for_conflict(self.stones, space, type, 'stone');

    if (! result.matched) {
      //console.log("Adding: ->", type, "<- to: ", space);
      var stone = new Marker(space, type);
      self.stones.push(stone);
      return self.stones.indexOf(stone);
    }
    else {
      return result.index;
    }
  }; 

  self.add_label = function(space, type) {
    //similar to add_marker, but not a marker...
    //using type to store the actual label text
    
    var result = self.check_for_conflict(self.labels, space, type, 'label');

    if (! result.matched) {
      //console.log("Adding: ->", type, "<- to: ", space);
      var label = new Marker(space, type);
      self.labels.push(label);
      return self.labels.indexOf(label);
    }
    else {
      return result.index;
    }
  };

  self.render = function() {
    /* return an sgf string representation of this node
       recursively call this function for all children
    */
    var result = '';
    //console.log(self.move);
    if (self.move.space) {
      result += self.move.render();
    }
    if (self.name) {
      result += 'N['+ self.name + ']';
    }
    if (self.comment()) {
      result += 'C['+ self.comment() + ']';
    }

    lodash.each(self.stones, function(stone) {
      result += stone.render();
    });

    lodash.each(self.markers, function(marker) {
      result += marker.render();
    });

    lodash.each(self.labels, function(label) {
      result += label.render_label();
    });

    //finally, handle children
    if (self.children.length > 1) {
      lodash.each(self.children, function(child) {
        result += '(;';
        result += child.render();
        result += ')';
      });
      
    }
    else if (self.children.length === 1) {
      result += ';';
      result += self.children[0].render();
    }
    
    return result;
  };
}

module.exports.Node = Node;
