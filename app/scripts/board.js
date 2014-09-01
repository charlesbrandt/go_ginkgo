/*global $: true */
'use strict';

var $ = require('jquery');
var lodash = require('lodash-node/underscore');
//I had trouble getting this version to work with broserify + node + mocha:
//var lodash = require('lodash');
var ko = require('knockout');

// might just stick with _.isEqual(a, b)
//http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
function compare_arrays(array1, array2) {
  // if the other array is a falsy value, return
  if ((!array1) && (!array2))
    return true;
  else if (!array1)
    return false;
  else if (!array2)
    return false;

  // compare lengths - can save a lot of time 
  if (array1.length != array2.length)
    return false;

  for (var i = 0, l=array1.length; i < l; i++) {
    // Check if we have nested arrays
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      // recurse into the nested arrays
      //if (!array1[i].equals(array2[i]))
      if ( !compare_arrays(array1[i],array2[i]) )
        return false;       
    }           
    else if (array1[i] != array2[i]) { 
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;   
    }           
  }       
  return true;
}

function Marker(space, type) {
  var self = this;

  self.space = space;
  self.type = type;
}
  
//aka Node
//function Move(space, color) {
//going back to Node.. this will help accomodate setup / add stones
//in addition to handling multiple markers
function Node(space, action, content) {
  
  var self = this;
  
  //should this be position represented as a string?
  //is it necessary?
  //corresponds well to 'N' in SGF... Nodename
  self.name = '';

  //current space... only applies for one move
  //TODO:
  //migrate this to a marker?
  self.space = space;
  self.contains = content;

  // rather than worry about action,
  // can just keep stone markers in separate list
  //move, add, mark
  //http://www.red-bean.com/sgf/ff5/m_vs_ax.htm
  //self.action = action;

  //these only apply for add stones
  self.stones = [];
    
  //may have more than one marker for current description
  self.markers = [];

  //keeping labels separate...
  //would be nice to be able to have a marker and a label on the same space
  self.labels = [];
  
  //as they stand, after the current move
  self.captures = { 'B': 0, 'W': 0 };
  
  self.comment = '';
  
  //a flat representation of the position (only valid for current branch)
  self.number = 1;
  
  self.children = [];


  
  self.add_move = function(space, color) {
    //if there is already an existing move at this space with same color
    //return the index of that space
    //if the color is different
    //return an error

    var matched = false;
    var index;
    
    lodash.each(self.children, function(option, i) {
      //if ( (option.spaces === [space]) && (option.contains === color) ) {
      //if ( lodash.isEqual(option.spaces,[space]) && (option.contains === color) ) {
      if ( (option.space === space) && (option.contains === color) ) {
        //console.log("MATCHED EXISTING");
        matched = true;
        index = i;
      }
      //else if ( lodash.isEqual(option.spaces,[space]) && (option.contains !== color) ) {
      else if ( (option.space === space) && (option.contains !== color) ) {
        var err = new ReferenceError('Invalid move. Space: ' + option.space + ' already contains: ' + option.contains);
        throw err;
      }
    });

    if (! matched) {
      //trying to decide of self.space should be singular (for a move)
      //or a list (for adding stones)...
      //if adding stones for setup purposes, could use marker list
      //var move = new Node([space], 'move', color);
      var move = new Node(space, 'move', color);
      move.number = self.number + 1;
      self.children.push(move);
      return self.children.indexOf(move);
    }
    else {
      return index;
    }
  };

  self.add_marker = function(space, type) {
    //similar to add_move, but not adding a new move to children
    //only adding a marker to this current Node
    
    //if there is already an existing marker at this space (in this Node)
    //return the index of that space
    //if the type is different
    //log a warning, but not as dire... 

    var matched = false;
    var index;
    
    lodash.each(self.markers, function(option, i) {
      //if ( lodash.isEqual(option.spaces,spaces) && (option.contains === color) ) {
      if ( (option.space === space) && (option.type === type) ) {
        matched = true;
        index = i;
      }
      //else if ( lodash.isEqual(option.spaces,spaces) && (option.contains !== color) ) {
      else if ( (option.space === space) && (option.type !== type) ) {
        var err = new ReferenceError('Invalid marker. Space: ' + option.space + ' already contains: ' + option.type);
        throw err;
      }
    });

    if (! matched) {
      console.log("Adding: ->", type, "<- to: ", space);
      var marker = new Marker(space, type);
      self.markers.push(marker);
      return self.markers.indexOf(marker);
    }
    else {
      return index;
    }
  };  

  self.add_stone = function(space, type) {
    //not the same as a move... these are setup configurations
    //similar to add_marker, but not a marker...
    //want to be able to add a stone and a marker in the same node
    
    var matched = false;
    var index;
    
    lodash.each(self.stones, function(option, i) {
      //if ( lodash.isEqual(option.spaces,spaces) && (option.contains === color) ) {
      if ( (option.space === space) && (option.type === type) ) {
        matched = true;
        index = i;
      }
      //else if ( lodash.isEqual(option.spaces,spaces) && (option.contains !== color) ) {
      else if ( (option.space === space) && (option.type !== type) ) {
        var err = new ReferenceError('Invalid stone. Space: ' + option.space + ' already contains: ' + option.type + " cannot add: " + type);
        throw err;
      }
    });

    if (! matched) {
      console.log("Adding: ->", type, "<- to: ", space);
      var stone = new Marker(space, type);
      self.stones.push(stone);
      return self.stones.indexOf(stone);
    }
    else {
      return index;
    }
  };  


}

//function SGF(board) {
function SGF() {
  
  var self = this;
  
  //self.board = board;
  
  //position needs to be an array of indexes 
  //multiple points required to get to correct branch
  self.position = [ 0 ];
  
  //now that Move object exists, we can track everything there
  //start with a blank object
  self.root = new Node();
  
  self.cur_move = self.root;

  self.last_token_id = '';


  // root level properties
  // not currently making the distinction of different games in one SGF
  self.format = '4'; //FF
  self.size = '19'; //SZ
  self.game = '1'; //GM
  self.application = 'Go Ginkgo 0.1'; //AP

  // game-info properties
  self.annotation = ''; //AN
  self.black_rank = ''; //BR
  self.black_team = ''; //BT
  self.black_player = '';//PB
  
  self.copyright = '';//CP
  self.date = '';//DT
  self.event = '';//EV
  self.comment = '';//GC
  self.name = '';//GN
  self.opening = '';//ON
  self.overtime = '';//*OT
  self.place = '';//PC 
  self.result = '';//!RE
  self.round = '';//RO
  self.rules = '';//!RU 
  self.source = '';//SO
  self.timelimit = '';//TM 
  self.user = '';//US

  self.white_player = '';//PW
  self.white_rank = '';//WR
  self.white_team = '';//WT 

  
  //these can all be attributes of the SGF object. Set as needed. 
  /*
  self.setup = function() {
    //take any setup parameters from the board
    //this could also be part of initialization call to SGF 
    //(rather than a separate function
    
  };
  */
  
  /*
  self.add_marker = function(position, color) {
    //just call add_marker on the Node directly    
  };
  */
  
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


  
  /*
  self.parse_token = function(token) {
    var close_branches = 0;
    var open_branches = 0;
    var token_id = '';
    var token_value = '';
    var in_id = true;
    var in_value = false;

    //console.log('->');
    lodash.each(token, function(character, i) {
      if ( (character === ';') && (! in_value) ) {
      } else if ( (character === ')') && (! in_value) ) {
        close_branches += 1;
      } else if ( (character === '(') && (! in_value) ) {
        close_branches += 1;
      } else if (character === '[') {
        in_id = false;
        in_value = true;
      } else {
        if (in_id) {
          token_id += character;
        }
        else if (in_value) { 
          token_value += character;
        }
        else {
          console.log('Unknown condition!!');
          console.log('->' + character + '<-');
        }
        
        //console.log('->' + character + '<-');
        //console.log('id: ' + token_id + ' value: ' + token_value);
      }
    });
    token_id = token_id.trim();
    token_value = token_value.trim();
    //console.log('<-');
    //console.log('id: ' + token_id + ' value: ' + token_value);
    //console.log('');
    return [ token_id, token_value, close_branches, open_branches ]
  }
                
  self.handle_token = function(result, cur_move) {
    var token_id;
    if (! result[0]) {
      token_id = self.last_token_id;
    }
    else token_id = result[0];

    var token_value = result[1];
    
    //TODO:
    //handle open and close branches
    var close_branches = result[2];
    var open_branches = result[3];
    
    
    //start checking for options, and handle accordingly
    if (token_id === 'C') {
      //have a comment
      self.cur_move.comment = token_value;
    } else if (token_id === 'B') {
      self.add_move(token_value, 'B');
    } else if (token_id === 'W') {
      self.add_move(token_value, 'W');
    } else {
      console.log('->' + result + '<-');
    }      
    
    
  }
  */

  self.make_point_list = function(value) {
    var point_list = [];
    var parts = value.split(':');
    if (parts.length === 2) {
      var start = parts[0];
      var end = parts[1];

      //console.log(start[0], start[1], end[0], end[1]);
      
      var start_row = start[0].charCodeAt(0);
      var start_col = start[1].charCodeAt(0);
      var end_row = end[0].charCodeAt(0);
      var end_col = end[1].charCodeAt(0);

      //console.log(start_row, start_col, end_row, end_col);

      for (var i = start_row; i <= end_row; i++) {
        for (var j = start_col; j <= end_col; j++) {
          point_list.push(String.fromCharCode(i) + String.fromCharCode(j));
        }
      }
    }
    else {
      point_list.push(value);
    }
    //console.log(point_list);
    return point_list
  }
  
  self.add_markers = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point, i) {
      node.add_marker(point, id);
    });
  }

  self.add_labels = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point, i) {
      node.add_label(point, id);
    });
  }

  self.add_stones = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point, i) {
      node.add_stone(point, id);
    });
  }
  
  self.add_move = function(position, color) {
    //use the current position to add the move
    //if there is already an existing move at this position
    //add a new branch
    //keep adding on current branch, unless previous branch is restored
    //will need to use position to find current branch
    //and should also update position accordingly

    var index = self.cur_move.add_move(position, color);
    self.position.push(index);
    self.cur_move = self.cur_move.children[index];
    return self.cur_move;
  };


  
  self.handle_substring = function(data, start, index, cur_sequences) {
    /*helper to push the current substring on to the list
      but only if it has data

      may want to consider keeping the trimmed version here.
    */
    
    var cur_string = data.substring(start, index);
    //strip whitespace:
    cur_string = cur_string.trim();
    if (cur_string) {
      //for keeping origingal
      //cur_sequences.push(data.substring(start, index));
      //for keeping trimmed version:
      cur_sequences.push(cur_string);
    }
  }
  

  self.parse_property_value = function(data) {
    /* helper to scan to the end of a property value, designated with ']'
       this avoids handling parenthesis within a property value
       e.g. in comments
    */

    var next_char = '';
    var result = {};    
    var index = 0;
    var start = index;
    
    while (index < data.length) {
      next_char = data[index];
      if (next_char === ']') {
        result = { 'index': index+1,
                   'sequences': '[' + data.substring(start, index) + ']' };
        return result; 
      }
      index += 1;
    }
  }
  
  self.parse_sequences = function(data) {
    /* a recursive call to split up all sequences into actual lists of lists
       so they can be processed together
       
       expects that the open parenthesis was already found
       scan until we find our matching close parenthesis

       the end result will always have one extra surrounding list
       eg. self.parse_sequences('') == ['']

       good reminder on the different ways to manually parse a tree:
       http://www.sunshine2k.de/coding/java/SimpleParser/SimpleParser.html
    */

    //console.log("Starting with ->", data, "<-");
    var closed = false;
    var next_char = '';
    var cur_sequences = [];
    var result = {};
    
    var index = 0;
    var start = index;
    while (index < data.length) {
      next_char = data[index];
      if (next_char === '(') {

        self.handle_substring(data, start, index, cur_sequences);
    
        //move past current open parenthesis:
        index += 1;

        var remainder = data.substring(index);

        result = self.parse_sequences(remainder);

        //move ahead the amount we've parsed
        index += result.index;
        start = index;
        //cur_sequences.push(result['sequences']);
        cur_sequences.push(result.sequences);

        //console.log("finished parsing,", index, cur_sequences);
        //console.log(data);
        //console.log(data.substring(index));
      }

      else if (next_char === '[') {
        //parse a property value too...
        //this will prevent parsing parenthesis within a property value

        self.handle_substring(data, start, index, cur_sequences);

        /*
        cur_string = data.substring(start, index);
        //strip whitespace:
        cur_string = cur_string.trim();
        if (cur_string) {
          cur_sequences.push(data.substring(start, index));
        }
        */
        
        //move past current open parenthesis:
        index += 1;

        var remainder = data.substring(index);

        result = self.parse_property_value(remainder);

        index += result.index;
        start = index;
        //cur_sequences.push(result['sequences']);
        cur_sequences.push(result.sequences);
      }

      else if (next_char === ')') {
        self.handle_substring(data, start, index, cur_sequences);

        /*
        //console.log(start, index);
        cur_string = data.substring(start, index);
        //strip whitespace:
        cur_string = cur_string.trim();
        if (cur_string) {
          cur_sequences.push(data.substring(start, index));
        }
        */
        
        //cur_sequences.push(data.substring(start, index));
        result = { 'index': index+1,
                   'sequences': cur_sequences };
        //console.log(result);
        //shouldn't be necessary... return should break the while loop..
        //closed = true;
        return result; 
      }

      else {
        //shouldn't need to worry about anything else... not parsing tokens yet
        index += 1;
      }

    }
    result = { 'index': index+1,
               'sequences': cur_sequences };
    return result;    
  }

  
  self.handle_sequence = function(sequence, parent) {
    /* recursive call to convert a sequence into actual javascript nodes 
       within this SGF object
       for use in system
    */
    
    var last_property_id = '';
    var local_cur_node = parent;
    var token_value;
    lodash.each(sequence, function(item, i) {
      if (typeof item === "string") {
        if (item[0] === '[') {
          // must have a property value...
          // process that
          // base action on last_property_id value
          // http://www.red-bean.com/sgf/proplist_t.html
          token_value = item.substring(1, item.length-1);

          //a move is currently the only action that changes the local_cur_node
          if (last_property_id === 'B') {
            local_cur_node = self.add_move(token_value, 'B');
          } else if (last_property_id === 'W') {
            local_cur_node = self.add_move(token_value, 'W');

          } else if (last_property_id === 'C') {
            //have a comment
            //self.cur_move.comment = token_value;
            local_cur_node.comment = token_value;

          } else if (last_property_id === 'N') {
            //self.cur_move.name = token_value;
            local_cur_node.name = token_value;

          //markers
          //need to break up any point lists appropriately
          //http://www.red-bean.com/sgf/sgf4.html
          } else if ( (last_property_id === 'AB') ||
                      (last_property_id === 'AE') ||
                      (last_property_id === 'AW')
                    ){
            self.add_stones(local_cur_node, last_property_id, token_value);

          } else if ( (last_property_id === 'CR') ||
                      (last_property_id === 'MA') ||
                      (last_property_id === 'SL') ||
                      (last_property_id === 'SQ') ||
                      (last_property_id === 'TR') 
                    ){
            self.add_markers(local_cur_node, last_property_id, token_value);
          
 /*          
AB   Add Black       setup            list of stone
AE   Add Empty       setup            list of point
AW   Add White       setup            list of stone
CR   Circle          -                list of point
MA   Mark            -                list of point
SL   Selected        -                list of point
*SQ  Square          -                list of point
TR   Triangle        -                list of point

*AR  Arrow           -                list of composed point ':' point
!LB  Label           -                list of composed point ':' simpletext

 */
            
/*            
            *DD  Dim points      - (inherit)      elist of point
DM   Even position   -                double
!FG  Figure          -                none | composed number ":" simpletext
GB   Good for Black  -                double
GW   Good for White  -                double
HO   Hotspot         -                double
*LN  Line            -                list of composed point ':' point
*PM  Print move mode - (inherit)      number

            
UC   Unclear pos     -                double
V    Value           -                real
*VW  View            - (inherit)      elist of point            

PL   Player to play  setup            color
*/
            
          //root
          } else if (last_property_id === 'FF') {
            self.format = token_value; //FF
          } else if (last_property_id === 'SZ') {
            self.size = token_value; //SZ
          } else if (last_property_id === 'GM') {
            self.game = token_value; //GM          
          } else if (last_property_id === 'AP') {
            self.application = token_value; //AP

          } else if (last_property_id === 'AN') {
            self.annotation = token_value; //AN
          } else if (last_property_id === 'BR') {
            self.black_rank = token_value; //BR
          } else if (last_property_id === 'BT') {
            self.black_team = token_value; //BT
          } else if (last_property_id === 'PB') {
            self.black_player = token_value; //PB
          } else if (last_property_id === 'CP') {
            self.copyright = token_value; //CP
          } else if (last_property_id === 'DT') {
            self.date = token_value; //DT
          } else if (last_property_id === 'EV') {
            self.event = token_value; //EV
          } else if (last_property_id === 'GC') {
            self.comment = token_value; //GC
          } else if (last_property_id === 'GN') {
            self.name = token_value; //GN
          } else if (last_property_id === 'ON') {
            self.opening = token_value; //ON
          } else if (last_property_id === 'OT') {
            self.overtime = token_value; //OT
          } else if (last_property_id === 'PC') {
            self.place = token_value; //PC 
          } else if (last_property_id === 'RE') {
            self.result = token_value; //RE
          } else if (last_property_id === 'RO') {
            self.round = token_value; //RO
          } else if (last_property_id === 'RU') {
            self.rules = token_value; //RU
          } else if (last_property_id === 'SO') {
            self.source = token_value; //SO
          } else if (last_property_id === 'TM') {
            self.timelimit = token_value; //TM 
          } else if (last_property_id === 'US') {
            self.user = token_value; //US
          } else if (last_property_id === 'PW') {
            self.white_player = token_value; //PW
          } else if (last_property_id === 'WR') {
            self.white_rank = token_value; //WR
          } else if (last_property_id === 'WT') {
            self.white_team = token_value; //WT 
            
          } else {
            console.log(last_property_id + ': ->' + token_value + '<-');
          }
            
        }
        else {
          // must be a property id
          // process that

          console.log(item);

          while (item[0] == ';') {
            item = item.substring(1);
          }
          last_property_id = item.trim();
        }
        //console.log(item);
      }
      
      else if (item instanceof Array) {
        self.handle_sequence(item, local_cur_node);
        //console.log("ARRAY");
        //console.log("ARRAY", item);
        //console.log(item);
      }
      
      else {
        //this is probably an error
        console.log(typeof item);
      }

    });
  }
  
  self.load = function(data) {
    //load moves from an existing SGF data stream (do not change position)
    //should probably check that position is 0, no existing moves...
    //that or else clear everything previous out...
    //that includes resetting board state...
    //go_to(0) first?

    //parse_sequences is better suited to this task:
    //var tokens = data.split(']');
    var sequences = self.parse_sequences(data)

    
    //console.log(tokens);
    //console.log(data);
    //var result;
    //lodash.each(tokens, function(token, i) {
      //console.log('->' + token.trim() + '<-');
      //result = self.parse_token(token.trim());
      //console.log('->' + result + '<-');
      //self.handle_token(result, local_cur_move);
    //});

    self.root = new Node();
    self.cur_move = self.root;

    lodash.each(sequences, function(sequence, i) {
      self.handle_sequence(sequence, self.root);
    });
    
  };
  
  self.serialize = function() {
    //return a string representation of the SGF
    
    
  };
  
  self.save = function() {
    //return a downloadable sgf text file of current state
    
  };
  
  
}

function Space(board, name, contains, pixels, row, column) {
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

  self.sgf = new SGF();
  
  
  self.label_options = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T' ];
  //aka labels_x
  self.labels_h = ko.computed(function() {
    return lodash.first(self.label_options, self.size());
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
    self.rows = [ ];
    self.spaces.removeAll();
    
    var space_name = '';
    var current;
  
    for (var i = 0; i < self.size(); i++) {
      
      //going to generate space_name in following loop:
      var row_spaces = [ ];
      for (var j = 0; j < self.size(); j++) {
        //space_name = i + ',' + j;
        //space_name = self.label_options[i] + j;
        space_name = self.label_options[i] + self.label_options[j];
        current = new Space(self, space_name, '', self.space_pixels, i, j);
        self.spaces.push(current);
        row_spaces.push(current);
      }
    
      //self.rows.push(new Row(self.size(), row_name, self.space_pixels()));
      self.rows.push(row_spaces);
    }
  });

  //console.log(self.spaces());
  
  // done with setup.
  
  
  self.make_move = function(space) { 
    if (space.contains() === '') {
      
      //update the value of space.contains()
      //this will automatically trigger updates of DOM
      //(thanks knockout!)
      space.contains(self.next_move);

      self.sgf.add_move(space.name, self.next_move);

      self.check_captures(space);
      
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
      
      
    }
    
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
  
  self.capture_group = function(group) {
    //var message = 'capturing group of ' + group.length + ' stones at: ' + group[0].name + ' containing: ' + group[0].contains();
    //alert(message);
    //console.log(message);
    
    if (group[0].contains() === 'W') {
      //self.captures['B'] += group.length;
      self.sgf.cur_move.captures.B += group.length;
    }
    else if (group[0].contains() === 'B') {
      self.sgf.cur_move.captures.W += group.length;
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

//module.exports.BoardViewModel = function (size, pixels) {
function BoardViewModel(size, pixels) {
  // size is in spaces, e.g. 9(x9), 13(x13), 19(x19)
  var self = this;
  
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
    //TODO:
    //update grid via CSS
    $('.grid').css({'background-size':self.board_pixels()+'px','width':self.board_pixels()+'px','height':self.board_pixels()+'px','left':self.board_left()+'px','top':self.board_top()+'px'}); 
    
    self.update_all();
  }
  
  self.show_configs = ko.observable(false);
  self.show_menu = ko.observable(false);
  self.show_controls = ko.observable(false);

  /*
  self.gear = ko.observable(false);
  self.toggle_gear = function() {
    if (self.gear()) {
      self.gear(false);
      console.log("hiding gear!");
      $('#gear_image').fadeOut();
    }
    else {
      self.gear(true);
      console.log("showing gear!");
      $('#gear_image').fadeIn();
    }      
  };
  */

  
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
	};
      })(f);
      
      // Read in the file...
      // this triggers the reader.onload() call... not optional!
      reader.readAsText(f);
    }
  };
  
}

module.exports.SGF = SGF;
//module.exports.Move = Move;
module.exports.Node = Node;
module.exports.Space = Space;
module.exports.Board = Board;
module.exports.BoardViewModel = BoardViewModel;

