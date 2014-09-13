'use strict';

//this includes 'i'!!
var sgf_points = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z' ];

function Marker(space, type) {
  //very similar to a board space
  //holds one type of item
  //stones are a valid item type
  //should use the SGF property id for the type
  
  var self = this;

  self.space = space;
  self.type = type;

  self.indexes = function() {
    // return the corresponding number representation of the space
    // useful for looking up the space within the board object
    var numbers = [];
    if (self.space && (self.space.length === 2)) { 
      numbers = [ sgf_points.indexOf(self.space[1]),
                  sgf_points.indexOf(self.space[0]) ];
    }
    else {
      console.log('WARNING: No space available!', self.space, self.type);
    }
    
    return numbers;
  };

  self.apply_indexes = function(row, column) {
    // take a row and column and set the corresponding self.space value
    // assumes zero indexed row/column values
    self.space = sgf_points[column] + sgf_points[row];
  };

  self.euro_coordinates = function() {
    //http://senseis.xmp.net/?Coordinates
    //Style A1
    //In Europe it is usual to give coordinates in the form of A1 to T19. Where A1 is in the lower left corner and T19 in the upper right corner (from black's view).
    //Note: "I" is not used, historically to avoid confusion with "J"
  };   

  self.sgf_coordinates = function() {
    //http://www.red-bean.com/sgf/go.html
    //this is what should be stored in space
    //column first, then row
    return self.space;
  };   
  
  
}
  
module.exports.Marker = Marker;
