/*global $: true */
'use strict';

var $ = require('jquery');
var lodash = require('lodash-node/underscore');
//I had trouble getting this version to work with broserify + node + mocha:
//var lodash = require('lodash');
var ko = require('knockout');

var SGF = require('./sgf').SGF;
var Marker = require('./marker').Marker;
var Space = require('./space').Space;

//since we have lodash, just stick with _.isEqual(a, b)
//http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
//function compare_arrays(array1, array2) {

//Only represent board data here (no side labels)
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

  //this is used mostly in the view level,
  //but it is also useful when generating a diagram, so keeping it here.
  //self.show_labels = ko.observable(true);
  self.show_labels = ko.observable(false);

  //not to be confused with the board labels...
  //this is the label used when adding a marker that has text
  self.label_marker = ko.observable('a');
  
  self.space_pixels = ko.computed(function() {
    return self.pixels() / self.size();
  });  

  self.sgf = ko.observable(new SGF());
  //self.sgf = new SGF();
  
  self.spaces = ko.observableArray();
    
  self.make_spaces = ko.computed(function() {
    //because this is computed, if size() changes
    //this will automatically be called
    
    //console.log("Regenerating board spaces");
    
    self.rows = [ ];
    self.spaces.removeAll();
    
    //var space_name = '';
    var current;
  
    for (var i = 0; i < self.size(); i++) {
      
      //space_name is generated in the following loop:
      var row_spaces = [ ];
      for (var j = 0; j < self.size(); j++) {
        //space_name = label_options[i] + label_options[j];
        //current = new Space(self, space_name, '', self.space_pixels, i, j);
        current = new Space(self, '', self.space_pixels, i, j);
        self.spaces.push(current);
        row_spaces.push(current);
      }
    
      self.rows.push(row_spaces);
    }
  });

  self.clear_markers = function() {
    //go through each space on the board
    //and make sure no markers or labels are set
    lodash.each(self.rows, function(row) {
      lodash.each(row, function(space) {
        space.clear_markers();
      });
    });
  };

  
  self.clear_spaces = function() {
    //go through each space on the board
    //and make sure no markers or labels are set
    lodash.each(self.rows, function(row) {
      lodash.each(row, function(space) {
        space.clear_markers();
        space.contains('');
      });
    });
  };

  self.init = function () {

    //moving this to be an attribute of SGF.node
    //self.next_move = 'B';

    //use this to determine if the click should cause a move or a marker
    self.cur_action = 'move';

    //this is used in hover_helper function
    self.cur_space = null;

    self.last_move = false;
  
    //tracking this here so we know which direction a change happens for self.go
    self.move = 0;

    self.sgf(new SGF());

    //this might get called twice when first loading,
    //but we want to call it on subsequent calls
    self.clear_spaces();

    //place to track if changes have been made locally
    //this way we can prompt to save if so (and not prompt, if no changes)
    self.dirty = false;  

  };

  self.init();
  
  //console.log(self.spaces());
  
  // done with setup.

  self.make_diagram = function(node) {
    var text;
    var i;

    if (node) {
      // generate a text based representation of the board state (snapshot)
      // http://senseis.xmp.net/?HowDiagramsWork
      
      // TODO:
      // (eventually)
      // get (up to) the last 10 *moves* from the SGF
      
      //var text = '$$' + self.sgf().cur_node().next_move();
      text = '$$' + node.next_move();
      if (self.show_labels()) {
        //c is for show coordinates
        text += 'c';
      }
      text += self.size();
      //text += 'm' + self.sgf().position.length + ' ';
      //just in case self.sgf() hasn't updated its position yet
      //text += 'm' + self.sgf().cur_node().position() + ' ';
      text += 'm' + node.position() + ' ';
      //text += self.sgf().cur_node().name;
      text += node.name;
      text += '\n';
      
      // ok... now we can start with the actual board representation:
      
      // add top edge
      text += '$$ +-';
      for (i = 0; i < self.size(); i++) {
        text += '--';
      }
      text += '+\n';
      
      lodash.each(self.rows, function(row) {
        text += '$$ | ';
        lodash.each(row, function(space) {
          //TODO: handle markers here
          if (! space.contains()) {
            text += '. ';
          }
          else {
            text += space.contains() + ' ';
          }
        });
        text += '|\n';
      });
      
      text += '$$ +-';
      for (i = 0; i < self.size(); i++) {
        text += '--';
      }
      text += '+\n';
    }
    //else {
    //  console.log("No node:", node);
    //}
    return text;
  };
  
  self.import_diagram = function(text) {
    //first apply_diagram to board
    //then update SGF

    //could try to be clever and see if the diagram
    //represents an existing state within the current sgf
    //
    //but for now, just going to make a new node in the SGF
    //
    //may be better to apply to SGF only if needed...
    var results = self.apply_diagram(text);
    var new_node = self.sgf().add_node();
    new_node.stones = results.stones;
    new_node.markers = results.markers;
  };
  
  self.apply_diagram = function(text) {
    //inverse of make_diagram
    //if we're loading from a saved state in the SGF,
    //don't want to automatically trigger a new node

    //collect and return these, just in case they should be applied to SGF
    var markers = [];
    var stones = [];
      
    //http://stackoverflow.com/questions/5034781/js-regex-to-split-by-line
    //console.log(text);
    var lines = text.match(/[^\r\n]+/g);
    //console.log(lines);
    //var header = lines[0];
    //console.log(header);

    if (lines) {
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-character-set
      //var header_parts = header.match(/^\$\$([WB])(c)(\d+)(m\d+) (.*)/);
      //var re = /^(?:\$+)([WB])(c)(\d+)(m\d+) (.*)/;
      //var header_parts = re.exec(header);
      var header_parts = lines[0].split(/^\$\$([WB])(c)(\d+)(m\d+) (.*)/);
      var sub_parts = header_parts.slice(1, header_parts.length-2);
      
      var comment = header_parts[header_parts.length-2];
      
      //console.log(comment);
      //console.log(sub_parts);
      //console.log(header_parts);
      lodash.each(sub_parts, function(part) {
        if (part === 'W') {
	  //self.sgf().cur_node().next_move = 'W';        
	  self.sgf().cur_node().next_move('W');
        }
        else if (part === 'B') {
	  //self.sgf().cur_node().next_move = 'B';        
	  self.sgf().cur_node().next_move('B');
        }
        else if (part === 'c') {
          //show labels (coordinates)
          //might not want to enable just yet
        }
        else if ( (part.length) && (part[0] === 'm') ) {
          //move number
          //console.log(self.move);
          self.move = parseInt(part.slice(1));
          //console.log(self.move);        
        }
        else {
          //must be the board size... everything else has been accounted for
          var size = parseInt(part);
          if (size !== self.size()) {
            console.log('Found size:', size, '!= Board size:', self.size());
          }
        }                
      });   
      //var top_border = lines[1];
      var next_line;
      var next_part;
      var cur_space;
      var parts;
      var row, column;
      var marker;    

      for (var i = 2; i < lines.length; i++) {
        next_line = lines[i];
        parts = next_line.split(' ');
        //console.log(parts);
        if (parts.length > 2) {
          for (var j = 2; j < parts.length; j++) {
            next_part = parts[j];
            row = i-2;
            column = j-2;
            cur_space = self.rows[row][column];
            if (next_part === '.' && cur_space.contains() !== '') {
              marker = new Marker();
              marker.apply_indexes(row, column);
              marker.type = 'AE';
              cur_space.contains('');
              stones.push(marker);
            }
            else if (next_part === 'B' && cur_space.contains() !== 'B') {
              marker = new Marker();
              marker.apply_indexes(row, column);
              marker.type = 'AB';
              cur_space.contains('B');
              stones.push(marker);
            }
            else if (next_part === 'W' && cur_space.contains() !== 'W') {
              marker = new Marker();
              marker.apply_indexes(row, column);
              marker.type = 'AW';
              cur_space.contains('W');
              stones.push(marker);
            }
            
            //TODO: handle markers in a diagram
            
          }
        }
      }      
    }
    else {
      self.clear_spaces();
    }
      
    var result = { 'stones': stones, 'markers': markers };
    //console.log(result);
    return result;
  };

  
  
  //self.go = function(position) {
  self.go = function(move) {
    //hehe... go... get it?
    //move to a specific position within the board

    var last_node;
    
    //use SGF object to determine branches and track positions
    //var nodes = self.sgf.go(move);
    //get the nodes first... apply node will need the cur node to unset markers?
    //var nodes = self.sgf.get(move);
    var nodes = self.sgf().go(move);
    if (move > self.move) {      
      lodash.each(nodes, function(node) {
        self.apply_node(node);
        last_node = node;
      });
    }
    
    else {
      //if going backwards, node snapshot should be set
      //use that to apply_diagram
      //and then update markers and labels accordingly
      var node = nodes[nodes.length-1];
      self.clear_markers();
      self.apply_diagram(node.snapshot);
      self.set_markers(node);
    }    
  };

  
  self.next = function(branch) {
    if (!branch) {
      branch = 0;
    }
    //console.log(branch);
    //console.log(self.sgf());
    //use SGF object to determine branches and track positions

    var node = self.sgf().next(branch);
    if (node) {
      //console.log(node);
      //console.log(self.sgf().cur_node().comment());
      //self._current_comment(self.sgf().cur_node().comment());
      self.apply_node(node);
    }
    else {
      console.log('No more moves!');
    }
  };

  self.previous = function() {
    var node = self.sgf().previous();
    self.clear_markers();
    if (node) {
      self.apply_diagram(node.snapshot);
      self.set_markers(node);
    }
  };

  
  self.apply_marker = function(marker) {
    //if (marker.space) {
    var cur_space;
    var indexes;

    indexes = marker.indexes();
    cur_space = self.rows[indexes[0]][indexes[1]];
    if (marker.type === 'AW') {
      cur_space.contains('W');
    }
    else if (marker.type === 'AB') {
      cur_space.contains('B');
    }
    else if (marker.type === 'AE') {
      cur_space.contains('');
    }
    else if (marker.type === 'TR') {
      cur_space.mtype('triangle');
    }
    else if (marker.type === 'CR') {
      cur_space.mtype('circle');
    }
    else if (marker.type === 'SQ') {
      cur_space.mtype('square');
    }
    else if (marker.type === 'MA') {
      cur_space.mtype('mark');
    }
    else if (marker.type === 'SL') {
      cur_space.mtype('selected');
    }
    else if (marker.type === 'TB') {
      cur_space.mtype('territory_black');
    }
    else if (marker.type === 'TW') {
      cur_space.mtype('territory_white');
    }
    else {
      console.log('Unhandled Marker:');
      console.log(cur_space);
      console.log(marker.type);
    }
    //}
  };

  self.apply_label = function(marker) {
    // Don't want to do any checks in this case...
    // if a label is set to AB, don't want to confuse it with 'add black'
    
    //if (marker.space) {
    var cur_space;
    var indexes;

    indexes = marker.indexes();
    cur_space = self.rows[indexes[0]][indexes[1]];
    //console.log(cur_space);
    //console.log(marker.type);
    cur_space.label(marker.type);
  };
  
  self.set_markers = function(node) {
    lodash.each(node.markers, function(marker) {
      self.apply_marker(marker);
    });

    lodash.each(node.stones, function(marker) {
      self.apply_marker(marker);
    });

    lodash.each(node.labels, function(marker) {
      self.apply_label(marker);
    });

    lodash.each(node.territory, function(marker) {
      self.apply_marker(marker);
    });
    
  };   
  
  self.apply_node = function(node) {
    // similar to make move,
    // but there may be other actions, like adding a marker

    var cur_space;
    var indexes;

    //clear all current markers
    //clear all current labels
    self.clear_markers();

    self.set_markers(node);

    //then apply the move
    if (node.move.type) {
      if ( (! node.move.space) || (node.move.space === 'tt') ) {
        self.handle_pass(node);
      }

      else {
        indexes = node.move.indexes();
        //console.log(self.rows);
        cur_space = self.rows[indexes[0]][indexes[1]];

        /*
        if (node.move.type !== self.sgf().cur_node().next_move) {
          //this seems likely to happen after jumping
          //to a different position or node in the SGF
          console.log('Next move in SGF: ', node.move.type, ' != expected next move: ', self.sgf().cur_node().next_move());
        }
        */
      
        // reset these before handle move, so they get updated appropriately
        //node.total_captures.B = node.parent.total_captures.B;
        //node.total_captures.W = node.parent.total_captures.W;
        node.total_captures_b(node.parent.total_captures_b());
        node.total_captures_w(node.parent.total_captures_w());
        node.captures = self.handle_move(cur_space, node);
        //console.log(node.snapshot);

      }
    }

    //want this to happen if it was a move, or just markers...
    //separating call from handle_move
    //make a snapshot for future reference (easier moving between states)
    if (! node.snapshot) {
      node.snapshot = self.make_diagram(node);
      //console.log('made snapshot:', node.snapshot);      
    }
    //else {
    //  console.log('already had snapshot:', node.snapshot);
    //}
    


  };

  //*2014.10.19 10:45:19 
  //aka take action...
  //now that cur_action could be more than 'move', need to expand the checks
  self.make_move = function(space) {
    var marker;
    //this may get updated if it's a new move, but get it now for markers
    var node = self.sgf().cur_node();

    //update the SGF *and* handle_move
    if (self.cur_action === 'move' && space.contains() === '') {
      self.clear_markers();
      
      //save this for later:
      //self.cur_move = self.sgf().cur_node().next_move();
      //node = self.sgf().add_move(space.name, self.sgf().cur_node().next_move());
      node = self.sgf().add_move(space.row, space.column, self.sgf().cur_node().next_move());
      //console.log(node);
      self.sgf().captures = self.handle_move(space, node);

      //var result = self.check_for_conflict(self.markers, space, type, 'marker');

      //make a snapshot for future reference (easier moving between states)
      if (! node.snapshot) {
        node.snapshot = self.make_diagram(node);
        //console.log('made snapshot:', node.snapshot);      
      }
      //else {
      //  console.log('already had snapshot:', node.snapshot);
      //}
    
      
      //add it for visiting later 
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      node.add_marker(marker.space, 'CR');
      //marker.type = 'CR';

      self.dirty = true;

    }
    
    /*
      CR   Circle          -                list of point
      MA   Mark            -                list of point
      SL   Selected        -                list of point
      *SQ  Square          -                list of point
      TR   Triangle        -                list of point
    */
    else if (self.cur_action === 'mark') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'MA';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'MA');
      self.dirty = true;
    }
    else if (self.cur_action === 'circle') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'CR';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'CR');
      self.dirty = true;
    }
    else if (self.cur_action === 'selected') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'SL';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'SL');
      self.dirty = true;
    }
    else if (self.cur_action === 'square') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'SQ';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'SQ');
      self.dirty = true;
    }
    else if (self.cur_action === 'triangle') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'TR';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'TR');
      self.dirty = true;
    }

    else if (self.cur_action === 'add_black') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'AB';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'AB');
      self.dirty = true;
    }

    else if (self.cur_action === 'add_white') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'AW';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'AW');
      self.dirty = true;
    }

    else if (self.cur_action === 'add_empty') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = 'AE';
      self.apply_marker(marker);
      node.add_marker(marker.space, 'AE');
      self.dirty = true;
    }

    else if (self.cur_action === 'add_label') {
      marker = new Marker();
      marker.apply_indexes(space.row, space.column);
      marker.type = self.label_marker().slice(0, 8);
      self.apply_label(marker);
      node.add_label(marker.space, self.label_marker().slice(0, 8));
      self.dirty = true;
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
      //space.contains(self.sgf().cur_node().next_move());

      //this:
      //space.contains(self.sgf().cur_node().move.type);
      //should be the same as:
      space.contains(node.move.type);
      space.hover_off();
      
      captures = self.check_captures(space, node);
      
      //if (self.sgf().cur_node().next_move() === 'B') {
      if (node.move.type === 'B') {
	//self.sgf().cur_node().next_move = 'W';
	self.sgf().cur_node().next_move('W');
	//node.next_move = 'W';
	node.next_move('W');
      }
      else {
	//self.sgf().cur_node().next_move = 'B';
	self.sgf().cur_node().next_move('B');
	//node.next_move = 'B';
	node.next_move('B');
      }
      self.move += 1;
      
      //update last move marker
      if (self.last_move) {
	self.last_move.mtype('');
      }
      self.last_move = space;
      space.mtype('circle');
    }

    //console.log(self.sgf());
    return captures;
  };
      
  self.make_pass = function() {
    //take care of a pass request from the view
    //update the SGF
    //console.log('make pass called');
    //console.log(self.sgf().position());
    
    self.clear_markers();

    var next_move = self.sgf().cur_node().next_move();


    var matched = false;
    var index;
    lodash.each(self.sgf().cur_node().children, function(option, i) {
      if ( (option.move.space === '') && (option.move.type === next_move) ) {
        matched = true;
        index = i;
      }
    });

    var node;    
    if (! matched) {
      console.log('creating new node');
      node = self.sgf().add_node();
      node.move.space = '';
      node.move.type = next_move;
    }
    else {
      console.log('matched existing node');
      node = self.sgf().cur_node().children[index];
    }

    //console.log(self.sgf().cur_node());
    
    self.handle_pass(node);


    //make a snapshot for future reference (easier moving between states)
    if (! node.snapshot) {
      node.snapshot = self.make_diagram(node);
    }

    console.log(node);
    console.log(self.sgf().cur_node());
    console.log(self.sgf().position());
    console.log();
    
    self.dirty = true;

  };
  
  self.handle_pass = function(node) {
    if (node.move.type === 'B') {
      //self.sgf().cur_node().next_move = 'W';
      self.sgf().cur_node().next_move('W');
      //node.next_move = 'W';
      node.next_move('W');
    }
    else {
      //self.sgf().cur_node().next_move = 'B';
      self.sgf().cur_node().next_move('B');
      //node.next_move = 'B';
      node.next_move('B');
    }
    self.move += 1;

    //update last move marker
    if (self.last_move) {
      self.last_move.mtype('');
    }
    self.last_move = '';
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
      //if captureing a group of black stones,
      //want to update the counter for white
      
      //self.captures['B'] += group.length;
      //self.sgf().cur_node().total_captures.B += group.length;
      //node.total_captures.B += group.length;
      node.total_captures_w(node.total_captures_w() + group.length);
    }
    else if (group[0].contains() === 'W') {
      //self.sgf().cur_node().total_captures.W += group.length;
      //node.total_captures.W += group.length;
      node.total_captures_b(node.total_captures_b() + group.length);
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
      self.capture_group(group, node);
      captures.push(group);
    }

    return captures;    
  };

  self.hover_helper = function(action, event) {
    /*function to help with touch events...
      they don't work the same way as a standard mouse hover
      so we need to look up the current space and set the hover manually here
    */
    
    //console.log(action);
    //console.log(event);
    //console.log();
    var ct = event['changedTouches'][0];
    //for (var key in event) {
    //  console.log(key);
    //  ct = event[key];
    //  console.log(ct);
    //}
    
    //console.log(ct);
    //ct.pageX and ct.pageY are the values we want
    //console.log(ct.pageX, ct.pageY, ct.screenX, ct.screenY );

    var space_col;
    var space_row;
    
    if (self.show_labels()) {
      //adjust for label space,
      //which is actually defined in view.label_pixels() (top)
      //and self.space_pixels() (left)
      //redefining label_pixels here for convenience:
      var label_pixels = self.space_pixels() / 2;
      space_col = Math.floor( (ct.pageX - self.space_pixels()) / self.space_pixels());
      space_row = Math.floor( (ct.pageY - label_pixels) / self.space_pixels());
    }
    else {
      space_col = Math.floor(ct.pageX / self.space_pixels());
      space_row = Math.floor(ct.pageY / self.space_pixels());
    }
    
    //console.log(space_col, space_row);

    if ( (space_col >= self.size()) || (space_col < 0) ||
         (space_row >= self.size()) || (space_row < 0) ) {
      if (self.cur_space) {
        self.cur_space.hover_off();
        self.cur_space = null;
      }
    }
    else {
      //must be hovering within a reasonable range

      //use this to prevent scrolling behavior while hovering
      //TODO: not working
      if ( (action == 'move') || (action === 'on') ) {
        //window.blockMenuHeaderScroll = true;
        //event.preventDefault();
        //event.stopPropagation();
        /*
        $(document).bind("touchstart", function(e){
          e.preventDefault();
        });
        
        $(document).bind("touchmove", function(e){
          e.preventDefault();
        });
        */
        
      }
      
      if (! self.cur_space) {
        self.cur_space = self.rows[space_row][space_col];
        self.cur_space.hover_on();
      }
      else if ( (self.cur_space.row !== space_row) || (self.cur_space.column !== space_col) ) {
        self.cur_space.hover_off();
        self.cur_space = self.rows[space_row][space_col];
        self.cur_space.hover_on();
      }

      if (action == 'off') {
        self.cur_space.hover_off();
        self.make_move(self.cur_space);

        /*
        $(document).unbind("touchstart", function(e){
          e.preventDefault();
        });
        
        $(document).unbind("touchmove", function(e){
          e.preventDefault();
        });
        */

      }
    }
  };
  
  
  self.hover_on = function(marker) {
    //helper for board view when showing given variations at a specific node
    //node only has markers...
    //access to board spaces would be tricky
    //hoping this can tie the two together

    if (marker && marker.space) {
      //look up the corresponding space:
      var indexes = marker.indexes();
      //console.log(indexes);
      var cur_space = self.rows[indexes[0]][indexes[1]];
      //cur_space.hover_on();
      cur_space.hovering(true);
      //console.log(cur_space);
      //console.log("hover_on");
    }
  };
  
  self.hover_off = function(marker) {
    if (marker && marker.space) {
      var indexes = marker.indexes();
      var cur_space = self.rows[indexes[0]][indexes[1]];
      //cur_space.hover_off();
      cur_space.hovering(false);
      //console.log("hover_off");
    }
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

