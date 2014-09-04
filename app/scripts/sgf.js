var lodash = require('lodash-node/underscore');
var Node = require('./node').Node;

function SGF() {  
  var self = this;

  //whether or not to show some console messages
  self.debug = false;
  
  self.init = function(size) {
    //position needs to be an array of indexes 
    //multiple points required to get to correct branch
    self.position = [ ];
    
    //now that Node object exists, we can track everything there
    //start with a blank object
    self.root = new Node();  
    self.root.name = 'root';
    self.cur_node = self.root;
    self.empty = true;
    
    // root level properties
    // not currently making the distinction of different games in one SGF
    self.format = '4'; //FF

    if (size) { 
      self.size = size; //SZ
    }
    else self.size = '19'; //SZ
      
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
  }

  self.init(19);
  
  self.go = function(index) {
    //go to the given index file.
    //generate a list of nodes in the order they should be applied
    var nodes = [];
    var cur_node;
    var at_end = false;
    var at_beginning = false;
    //console.log(self.position);    

    //handle if we're moving forward
    while ((index > self.position.length) && (! at_end)) {
      cur_node = self.next();
      if (cur_node) {
        nodes.push(cur_node);
      }
      else {
        at_end = true;
      }
    }
    
    //handle if we're moving backward
    //if going backwards, we want to include the current node in the list
    if (index < self.position.length) {
      nodes.push(self.cur_node);
      while ((index < self.position.length) && (! at_beginning)) {
        cur_node = self.previous();
        if (cur_node) {
          nodes.push(cur_node);
        }
        else {
          at_beginning = true;
        }
      }
    }

    return nodes;    
  };
  
  self.next = function(branch) {
    //change position
    //retun node
    //board state will be updated by the board object
    if (self.cur_node.children.length) {
      if (branch) {
        if (branch < self.cur_node.children.length) {
          self.cur_node = self.cur_node.children[branch];
          self.position.push(branch);
        }
        else {
          var err = new ReferenceError('Invalid branch: ' + branch + ' cur_node only has: ' + self.cur_node.children.length + " children." + self.cur_node);
          throw err;
        }
      }
      else {
        self.cur_node = self.cur_node.children[0];
        self.position.push(0);
      }
      return self.cur_node;
    }
    else {
      //console.log("No more moves!");
      return null;
    }
  };
  
  self.previous = function() {
    //change position
    //retun node
    //board state will be updated by the board object
    if (self.cur_node.parent) {
      self.cur_node = self.cur_node.parent;
      self.position.pop();
      return self.cur_node;
    }
    else {
      //console.log("No more moves!");
      return null;
    }    
  };
  
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

  self.add_move = function(position, color) {
    //use the current position to add the move
    //if there is already an existing move at this position
    //add a new branch
    //keep adding on current branch, unless previous branch is restored
    //will need to use position to find current branch
    //and should also update position accordingly

    var index = self.cur_node.add_move(position, color);
    self.position.push(index);
    self.cur_node = self.cur_node.children[index];
    return self.cur_node;
  };

  self.add_node = function() {
    if (self.empty) {
      self.empty = false;
      return self.cur_node
    }
    else {
      var index = self.cur_node.make_node();
      self.position.push(index);
      self.cur_node = self.cur_node.children[index];
      return self.cur_node;
    }
  };
  
  self.add_markers = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point, i) {
      node.add_marker(point, id);
    });
  }

  self.add_labels = function(node, id, value) {
    //we know id == "LB" in this case... don't need to use that in Marker object
    var parts = value.split(':');
    var point = parts[0];
    var label = parts[1];
    node.add_label(point, label);
  }

  self.add_stones = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point, i) {
      node.add_stone(point, id);
    });
  }
  
  self.handle_substring = function(data, start, index, cur_sequences) {
    /*helper to push the current substring on to the list
      but only if it has data

      keeping the trimmed version here, but could keep original if needed
    */
    
    var cur_string = data.substring(start, index);
    //strip whitespace:
    cur_string = cur_string.trim();
    if (cur_string) {
      //for keeping original
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
    var previous_char = '';
    var result = {};    
    var index = 0;
    var start = index;
    
    while (index < data.length) {
      next_char = data[index];
      //be sure to check for escaped ']'...
      if ( (next_char === ']') && (previous_char !== '\\') ) {
        result = { 'index': index+1,
                   'sequences': '[' + data.substring(start, index) + ']' };
        return result; 
      }
      previous_char = next_char;
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
            //local_cur_node = self.add_move(token_value, 'B');
            local_cur_node.set_move(token_value, 'B');
          } else if (last_property_id === 'W') {
            //local_cur_node = self.add_move(token_value, 'W');
            local_cur_node.set_move(token_value, 'W');

          } else if (last_property_id === 'C') {
            //have a comment
            //self.cur_node.comment = token_value;
            local_cur_node.comment = token_value;

          } else if (last_property_id === 'N') {
            //self.cur_node.name = token_value;
            local_cur_node.name = token_value;

          //markers
          //need to break up any point lists appropriately
          //http://www.red-bean.com/sgf/sgf4.html

          /*          
           AB   Add Black       setup            list of stone
           AE   Add Empty       setup            list of point
           AW   Add White       setup            list of stone
          */
          } else if ( (last_property_id === 'AB') ||
                      (last_property_id === 'AE') ||
                      (last_property_id === 'AW')
                    ){
            self.add_stones(local_cur_node, last_property_id, token_value);

          /*
            CR   Circle          -                list of point
            MA   Mark            -                list of point
            SL   Selected        -                list of point
            *SQ  Square          -                list of point
            TR   Triangle        -                list of point
          */
          } else if ( (last_property_id === 'CR') ||
                      (last_property_id === 'MA') ||
                      (last_property_id === 'SL') ||
                      (last_property_id === 'SQ') ||
                      (last_property_id === 'TR') 
                    ){
            self.add_markers(local_cur_node, last_property_id, token_value);

          //!LB  Label       -   list of composed point ':' simpletext 
          } else if ( (last_property_id === 'LB') ||
                      (last_property_id === 'L')
                    ){
            self.add_labels(local_cur_node, last_property_id, token_value);

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

/*
TODO:
PL   Player to play  setup            color

TB   Territory Black -                elist of point
TW   Territory White -                elist of point

HA   Handicap        game-info        number
KM   Komi            game-info        real


*AR  Arrow           -                list of composed point ':' point

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

*/

            
          } else {
            //might want to see what properties were not applied from a SGF
            //but sometimes don't want to see the output:
            if (self.debug) {
              console.log(last_property_id + ': ->' + token_value + '<-');
            }
          }
            
        }
        else {
          // must be a property id
          // process that

          //console.log(item);

          while (item[0] == ';') {
            //now this is the only place new nodes are created!
            local_cur_node = self.add_node();
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

    var sequences = self.parse_sequences(data)

    //reset everything:
    self.init();
    
    lodash.each(sequences, function(sequence, i) {
      self.handle_sequence(sequence, self.root);
    });
    self.go(0);
    return true;
  };
  
  self.serialize = function() {
    //return a string representation of the SGF
        
  };
  
  self.save = function() {
    //return a downloadable sgf text file of current state
    
  };
  
}

module.exports.SGF = SGF;