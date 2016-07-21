/**************************************************
 * Author: Justin Rokisky
 * Date:   July 2016
 * Info:   This is an implementation of the project described in Chapter 7 of 
 * 	    the online course From Nand To Tetris
 * Post-Mordem:
 *      -> Function names are not concise. Ex: translate, parser
 *      -> Translate function is one giant set of if else statements.
 *      	Perhaps switch or case statements would be easier to read
 *      -> Outputting direct strings with newlines interspersed is 
 *      	difficult to read and understand. Maybe store asm as
 *      	items in array and then join with \n.
 *      -> There's a lack of consistent usage with Constants. 
 *      	PUSH and other constants should have been used more to 
 *      	increase readability
 *      -> I don't believe I'm taking advantage of Javascripts features.
 * 	-> No error handling has been implemented. The goal of the
 * 		project was to gain an understanding of translating vm
 * 		code to assembly.
 ****************************************************/



//Code pulled from http://www.codeproject.com/Articles/664032/Creating-a-File-Uploader-Using-JavaScript-and-HTML
if (window.File && window.FileReader && window.FileList && window.Blob == false) {
  alert("The File APIs are not fully supported in this browser.");
}

//Used to create unique Assembly lables
var U_LABEL_ID = 1; 


var fileDetails = [];

//get name of files and contents and add to fileDetails
function getFiles(cb) {
    var files = document.getElementById("file").files;
    for(var i = 0; i < files.length; i++) {
      var myRead = new FileReader();

      myRead.onload = (function(file) {
        return function(evt) {
          cb(fileDetails, [file.name, this.result]);
        };
      })(files.item(i));
      
      myRead.readAsText(files.item(i));
    }
}


function handleFiles() {
  removeChildren(document.getElementById("list"));
  getFiles(function(list, item) {
    list.push(item);
    updatePage(item[0], item[1], parser(item[0], item[1]));
  });
}

/*********************************************
 * Adds a list item with given file name and
 * contents.
 *********************************************/
function updatePage(fileName, fileContent, parsedContent) {
  var list = document.createElement("li");
  var h1 = document.createElement("h1");
  var textArea = document.createElement("textarea");
  var textArea2 = document.createElement("textarea");
  
  h1.innerHTML = fileName;
  textArea2.innerHTML = fileContent;
  textArea2.cols = "30";
  textArea2.rows = "30";
  textArea.innerHTML = parsedContent;
  textArea.cols = "14";
  textArea.rows = "30";

  list.appendChild(h1);
  list.appendChild(textArea2);
  list.appendChild(textArea);
  document.getElementById("list").appendChild(list);
}

//remove all children of an html object
function removeChildren(node) {
  while(node.firstChild) {
    node.removeChild(node.firstChild);
  }
}


// remove everything after // in a string
var removeComments = function(str) {
  var ind = str.indexOf("//");
  if(ind > -1) {
    return str.slice(0,ind);
  }
  else {
    return str;
  }
}

var isNotEmptyStr = function(str) {
    return str.trim().length > 0;
}


var parser = function(filename, file) {
  var lines = file.split("\n");
  lines = lines.map(removeComments);
  lines = lines.filter(isNotEmptyStr);
  return lines.map(partial(translate, filename)).join("");
}


// COPIED FROM: https://blog.thesoftwarecraft.com/2013/05/partial-functions-in-javascript.html
// Allows for partial functions to be created
function partial(f) {
	var args = Array.prototype.slice.call(arguments, 1);
	return function() {
		var remainingArgs = Array.prototype.slice.call(arguments);
		return f.apply(null, args.concat(remainingArgs));
	 };
}


/**************************************
 * Translates a given TRIMMED vm instructrion to equivalent assembly instruction(s)
 * Instructions will either be 3 or two characters long
 * ************************************/
var translate = function(filename, str){
	var pre4 = str.substring(0,4);
	var pre3 = str.substring(0,3);
	var pre2 = str.substring(0,2);


	if(pre4 == "push") {
		var segment = str.substring(4).trim();
                var idx = segment.indexOf(' ');
		var index = "";

		if(idx > -1) {
			index = segment.substring(idx).trim();	
			segment = segment.substring(0,idx);
		}
		else{
			return "ERROR"; //TODO
		}

		if(segment == "static") {
			var addr = filename.concat(".").concat(index);
			return "@".concat(addr).concat("\nD=M\n@SP\nA=M\nM=D\n").concat(INC_SP);	
		} else
		if(segment == "pointer") {
			if(index == "0") {
				return "@R3\nD=M\n@SP\nA=M\nM=D\n".concat(INC_SP);
			} else
			if(index == "1") {
				return "@R4\nD=M\n@SP\nA=M\nM=D\n".concat(INC_SP);
			} else {
				return "ERROR"; //TODO
			}
		} else
		if(segment == "argument") {
			segment = "2";
			return pushSegToStack(segment, index).concat(INC_SP);
		} else
		if(segment == "temp") {
			var i = parseInt(index);
			return "@R".concat((5 + i).toString()).concat("\nD=M\n@SP\nA=M\nM=D\n").concat(INC_SP);
		} else
		if(segment == "static") {
			return "ERROR"; //TODO
		} else 
		if(segment == "local") {
			segment = "1";
			return pushSegToStack(segment, index).concat(INC_SP);
		} else
		if(segment == "this") {
			segment = "3";
			return pushSegToStack(segment, index).concat(INC_SP);
		} else 
		if(segment == "that") {
			segment = "4";
			return pushSegToStack(segment, index).concat(INC_SP);
		} else
		if(segment == "constant") {
			return "@".concat(index).concat("\nD=A\n").concat(PUSH).concat(INC_SP);
		}
	} else
	if(pre3 == "add") {
		return DEC_SP.concat("D=M\n").concat(DEC_SP).concat("M=M+D\n").concat(INC_SP);	
	} else 
	if (pre3 == "sub") {
		return DEC_SP.concat("D=M\n").concat(DEC_SP).concat("M=M-D\n").concat(INC_SP);
	} else 
	if (pre3 == "neg") {
		return DEC_SP.concat("M=-M\n").concat(INC_SP);
	} else 
	if (pre3 == "and") {
		return DEC_SP.concat("D=M\n").concat(DEC_SP).concat("M=M&D\n").concat(INC_SP);
	} else
	if (pre3 == "not") {
		return DEC_SP.concat("M=!M\n").concat(INC_SP);
	} else 
	if(pre3 == "pop") {
		var segment = str.substring(3).trim();
                var loc_whtspce = segment.indexOf(' ');
		var index = "";

		if(loc_whtspce > -1) {
			index = segment.substring(loc_whtspce).trim();	
			segment = segment.substring(0,loc_whtspce);
		}
		else{
			return "ERROR"; //TODO
		}

		if(segment == "static") {
			var addr = filename.concat(".").concat(index);
			return DEC_SP.concat("D=M\n@").concat(addr).concat("\nM=D\n");	
		} else
		if(segment == "pointer") {
			if(index == "0") {
				return DEC_SP.concat("D=M\n@R3\nM=D\n");
			} else
			if(index == "1") {
				return DEC_SP.concat("D=M\n@R4\nM=D\n");
			} else {
				return "ERROR"; //TODO
			}
		} else
		if(segment == "argument") {
			segment = "2";
			return POP_AND_STOR_R13.concat(getAddrOfSegAndIdx(segment, index)).concat(STOR_R13_AT_R14); 
		} else
		if(segment == "temp") {
			var i = parseInt(index);
			return "@R0\nM=M-1\nA=M\nD=M\n@R".concat((5 + i).toString()).concat("\nM=D\n");
		} else
		if(segment == "static") {
			return "ERROR"; //TODO
		} else 
		if(segment == "local") {
			segment = "1";
			return POP_AND_STOR_R13.concat(getAddrOfSegAndIdx(segment, index)).concat(STOR_R13_AT_R14); 
		} else
		if(segment == "this") {
			segment = "3";
			return POP_AND_STOR_R13.concat(getAddrOfSegAndIdx(segment, index)).concat(STOR_R13_AT_R14); 
		} else 
		if(segment == "that") {
			segment = "4";
			return POP_AND_STOR_R13.concat(getAddrOfSegAndIdx(segment, index)).concat(STOR_R13_AT_R14); 
		} else
		if(segment == "constant") {
			return "@".concat(index).concat("\nD=A\n").concat(PUSH).concat(INC_SP);
		}
	} else
	if(pre2 == "eq") {
		var true_label = "EQ_TRUE_".concat(U_LABEL_ID.toString());
		var done_label = "DONE_".concat(U_LABEL_ID.toString());

		U_LABEL_ID++;
		return DEC_SP.concat("D=M\n").concat(DEC_SP).concat("D=D-M\n@").concat(true_label)
			.concat("\nD;JEQ\n").concat(SET_FALSE).concat("@").concat(done_label)
			.concat("\n0;JMP\n(").concat(true_label).concat(")\n").concat(SET_TRUE)
			.concat("(").concat(done_label).concat(")\n").concat(INC_SP);
	} else
	if(pre2 == "gt") {
		var true_label = "GT_TRUE_".concat(U_LABEL_ID.toString());
		var done_label = "DONE_".concat(U_LABEL_ID.toString());

		U_LABEL_ID++;
		return DEC_SP.concat("D=M\n").concat(DEC_SP).concat("D=M-D\n@").concat(true_label)
			.concat("\nD;JGT\n").concat(SET_FALSE).concat("@").concat(done_label)
			.concat("\n0;JMP\n(").concat(true_label).concat(")\n").concat(SET_TRUE)
			.concat("(").concat(done_label).concat(")\n").concat(INC_SP);
	} else
	if(pre2 == "lt") {
		var true_label = "LT_TRUE_".concat(U_LABEL_ID.toString());
		var done_label = "DONE_".concat(U_LABEL_ID.toString());

		U_LABEL_ID++;
		return DEC_SP.concat("D=M\n").concat(DEC_SP).concat("D=M-D\n@").concat(true_label)
			.concat("\nD;JLT\n").concat(SET_FALSE).concat("@").concat(done_label)
			.concat("\n0;JMP\n(").concat(true_label).concat(")\n").concat(SET_TRUE)
			.concat("(").concat(done_label).concat(")\n").concat(INC_SP);
	} else
	if(pre2 == "or") {
		return DEC_SP.concat("D=M\n").concat(DEC_SP).concat("M=D|M\n").concat(INC_SP);
	} else {
		return "SOMETHING IS WRONG AHHHHHHHHHH!"; //TODO
	}

}


var DEC_SP      = "@R0\nM=M-1\nA=M\n"; //Decrement the stack Pointer
var PUSH        = "@R0\nA=M\nM=D\n";  //Push the current D value onto the stack
var INC_SP      = "@R0\nM=M+1\n";  //increment the stack pointer
var SET_FALSE   = "@R0\nA=M\nM=0\n"; //Push False onto the Stack
var SET_TRUE    = "@R0\nA=M\nM=-1\n"; //Push true onto the stack
var POP_AND_STOR_R13 = "@R0\nM=M-1\nA=M\nD=M\n@R13\nM=D\n"; //Pop value off stack and store in R13
var STOR_R13_AT_R14  = "@R13\nD=M\n@R14\nA=M\nM=D\n"; //Store the value in R13 at the address in R14


// Given a segment and index return asm that will find the address of the segment + index
var getAddrOfSegAndIdx = function(seg, idx) {
	return "@".concat(idx).concat("\nD=A\n@R").concat(seg).concat("\nD=M+D\n@R14\nM=D\n");

}

//Given a segment and index, return assembly that will push the value located there to the stack
var pushSegToStack = function(seg, idx) {
	return "@".concat(idx).concat("\nD=A\n@").concat(seg).concat("\nA=M+D\nD=M\n@SP\nA=M\n\M=D\n");
}






