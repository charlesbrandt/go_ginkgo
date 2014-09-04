var lodash = require('lodash-node/underscore');

var Marker = require('./marker').Marker;

function Node(space, type) {
  //if space and type are supplied, they get applied to the move
  //all other attributes should be applied after initialization
  
  var self = this;
  
  self.move = new Marker(space, type);

  //these only apply for add stones
  self.stones = [];

  //may have more than one marker for current description
  self.markers = [];

  //keeping labels separate...
  //would be nice to be able to have a marker and a label on the same space
  self.labels = [];
  
  //will not be provided by SGF,
  //but will help when returning to previous board states (undoing)
  //only hold captures after *this* move
  self.captures = [];
  
  //as they stand, cumulatively, after the current move
  self.total_captures = { 'B': 0, 'W': 0 };
  
  //should this be position represented as a string?
  //is it necessary?
  //corresponds well to 'N' in SGF... Nodename
  self.name = '';

  self.comment = '';
  
  self.children = [];

  //not sure that this will ever be needed within a Node
  //a flat representation of the position (only valid for current branch)
  //should just be able to use sgf.postion.length for equivalent value
  //self.number = 1;
  
  //this should be set after initialization by caller
  self.parent = null;

  self.set_move = function(space, color) {
    //rather than creating a new node and adding it to children
    //this simply sets the properties on the current node (self)
    //this is more useful when loading an SGF

    if ( (self.move.space) && (self.move.space !== space) ) {
      var err = new ReferenceError('Invalid move. Space: ' + self.move.space + ' already contains: ' + self.move.type + " cannot change space to: " + space);
      throw err;
    }

    else if ( (self.move.type) && (self.move.type !== color) ) {
      var err = new ReferenceError('Invalid move. Space: ' + self.move.space + ' already contains: ' + self.move.type + " cannot change content to: " + color);
      throw err;
    }
    else {
      self.move.space = space;
      self.move.type = color;
    }
  }

  self.make_node = function() {
    //no error checking here
    //just create a new node and return the index of the new node in children

    var node = new Node();
    //node.number = self.number + 1;
    node.parent = self;
    node.total_captures.B = self.total_captures.B;
    node.total_captures.W = self.total_captures.W;
    self.children.push(node);
    return self.children.indexOf(node);
  }
  
  self.add_move = function(space, color) {
    //this is more useful when playing a game and recording the action
    //for SGF loading, see set move instead
    
    //if there is already an existing move at this space with same color
    //return the index of that space
    //if the color is different
    //return an error

    var matched = false;
    var index;
    
    lodash.each(self.children, function(option, i) {
      if ( (option.move.space === space) && (option.move.type === color) ) {
        //console.log("MATCHED EXISTING");
        matched = true;
        index = i;
      }
      else if ( (option.move.space === space) && (option.move.type !== color) ) {
        var err = new ReferenceError('Invalid move. Space: ' + option.move.space + ' already contains: ' + option.move.type);
        throw err;
      }
    });

    if (! matched) {
      var index = self.make_node();
      var child = self.children[index];
      child.move.space = space;
      child.move.type = color;
      return index;      
    }
    else {
      return index;
    }
  }

  self.check_for_conflict = function(options, space, type, attribute) {
    //var matched = false;
    //var index;
    var result = { 'matched': false, 'index': null };
    
    lodash.each(options, function(option, i) {
      if ( (option.space === space) && (option.type === type) ) {
        result.matched = true;
        result.index = i;
      }
      else if ( (option.space === space) && (option.type !== type) ) {
        var err = new ReferenceError('Invalid ' + attribute + ' Space: ' + option.space + ' already contains: ' + option.type + " cannot add: " + type);
        throw err;
      }
    });

    return result;
  }
  
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
  }

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
  }  

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
  }  
}

module.exports.Node = Node;
