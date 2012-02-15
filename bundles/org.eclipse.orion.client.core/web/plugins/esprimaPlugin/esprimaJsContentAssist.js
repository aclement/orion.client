/*******************************************************************************
 * @license
 * Copyright (c) 2012 Contributors
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Andy Clement (vmware) - initial API and implementation
 *     Andrew Eisenberg (vmware) - implemented visitor pattern
 *******************************************************************************/

/*global define require eclipse esprima window console inTest*/
define("esprimaJsContentAssist", [], function() {

	/**
	 * A prototype of that contains the common built-in types
	 */
	var Types = function() {
		/**
		 * Properties common to all objects - ECMA 262, section 15.2.4.
		 */
		this.Object = {
			// Urrrgh...can't use the real name here because would override the real methods of that name
			$$toString: "String",
			$$toLocaleString : "String",
			$$valueOf: "Object",
			$$hasOwnProperty: "boolean",
			$$isPrototypeOf: "boolean",
			$$propertyIsEnumerable: "boolean",
			
			// FIXADE should really be on Function, but arguments is a reserved word.
			$$arguments : "Arguments",
			
			$$args : {
				$$toString: [],
				$$toLocaleString: [],
				$$hasOwnProperty: ["property"],
				$$isPrototypeOf: ["object"],
				$$propertyIsEnumerable: ["property"],
				$$valueOf: []
			}
		};
		
		/**
		 * Properties common to all Strings - ECMA 262, section 15.5.4
		 */
		this.String = {
			charAt : "String",
			charCodeAt : "Number",
			concat : "String",
			indexOf : "Number",
			lastIndexOf : "Number",
			length : "Number",
			localeCompare : "Number",
			match : "Boolean",
			replace : "String",
			search : "String",
			slice : "String",
			split : "Array",  // Array of string
			substring : "String",
			toLocaleUpperCase : "String",
			toLowerCase : "String",
			toUpperCase : "String",
			trim : "String",
			$$args : {
				charAt : ["index"],
				charCodeAt : ["index"],
				concat : ["array"],
				indexOf : ["searchString"],
				lastIndexOf : ["searchString"],
				localeCompare : ["object"],
				match : ["regexp"],
				replace : ["searchValue", "replaceValue"],
				search : ["regexp"],
				slice : ["start", "end"],
				split : ["separator", "[limit]"],
				substring : ["start", "[end]"],
				toLowerCase : [],
				toUpperCase : [],
				toLocaleUpperCase : [],
				trim : []
			},
			"$$prototype" : "Object"
		};
		
		/**
		 * Properties common to all arrays.  may be incomplete
		 */
		this.Array = {
			length : "Number",
			sort : "Array",
			concat : "Array",
			slice : "Array",
			$$prototype : "Object",
			$$args : {
				sort : ["[sorter]"],
				concat : ["left", "right"],
				slice : ["start", "end"]
			}
		};
		
		/**
		 * Properties common to all dates.  may be incomplete
		 */
		this.Date = {
			getDay : "Number",
			getFullYear : "Number",
			getHours : "Number",
			getMinutes : "Number",
			setDay : null,
			setFullYear : null,
			setHours : null,
			setMinutes : null,
			setTime : null,
			$$prototype : "Object",
			$$args : {
				getDay : [],
				getFullYear : [],
				getHours : [],
				getMinutes : [],
				setDay : ["dayOfWeek"],
				setFullYear : ["year"],
				setHours : ["hour"],
				setMinutes : ["minute"],
				setTime : ["millis"]
			}
		};
		
		this.Boolean = {
			$$prototype : "Object",
			$$args : {}
		};
		
		this.Number = {
			toExponential : "Number",
			toFixed : "Number",
			toPrecision : "Number",
			// do we want to include NaN, MAX_VALUE, etc?	
		
			$$prototype : "Object",
			$$args : {
				toExponential : ["digits"],
				toFixed : ["digits"],
				toPrecision : ["digits"]
			}
		};
		
		// must refactor this part for the new format
		this.Function = {
			apply : "Object",
			// FIXADE a reserved word...put it in object
//			arguments : "Arguments",
			bind : null,
			call : "Object",
			caller : "Function",
			length : "Number",
			name : "String",
			$$prototype : "Object",
			$$args : {
				apply : ["func", "[args]"],
				bind : [],
				call: ["func", "args"]
			}
		};

		this.Arguments = {
			callee : "Function",
			length : "Number",
			$$prototype : "Object"
		};

		this.RegExp = {
			g : "Object",
			i : "Object",
			gi : "Object",
			m : "Object",
			exec : "Array",
			test : "Array",
			
			$$prototype : "Object",
			$$args : {
				exec : ["str"],
				test : ["str"]
			}
		};
		
		this.Error = {
			name : "String",
			message : "String",
			stack : "String",
			$$prototype : "Object",
			$$args : { }
		};
		
		
//		this.Math = [
//			{name: "prototype", type:"Object"},
//		
//			// properties
//			{name: "E", type:"Number"},
//			{name: "LN2", type:"Number"},
//			{name: "LN10", type:"Number"},
//			{name: "LOG2E", type:"Number"},
//			{name: "LOG10E", type:"Number"},
//			{name: "PI", type:"Number"},
//			{name: "SQRT1_2", type:"Number"},
//			{name: "SQRT2", type:"Number"},
//			
//			// Methods
//			{name: "abs", args: ["val"], type:"Number"},
//			{name: "acos", args: ["val"], type:"Number"},
//			{name: "asin", args: ["val"], type:"Number"},
//			{name: "atan", args: ["val"], type:"Number"},
//			{name: "atan2", args: ["val1", "val2"], type:"Number"},
//			{name: "ceil", args: ["val"], type:"Number"},
//			{name: "cos", args: ["val"], type:"Number"},
//			{name: "exp", args: ["val"], type:"Number"},
//			{name: "floor", args: ["val"], type:"Number"},
//			{name: "log", args: ["val"], type:"Number"},
//			{name: "max", args: ["val1", "val2"], type:"Number"},
//			{name: "min", args: ["val1", "val2"], type:"Number"},
//			{name: "pow", args: ["x", "y"], type:"Number"},
//			{name: "random", args: [], type:"Number"},
//			{name: "round", args: ["val"], type:"Number"},
//			{name: "sin", args: ["val"], type:"Number"},
//			{name: "sqrt", args: ["val"], type:"Number"},
//			{name: "tan", args: ["val"], type:"Number"}		
//		];

		this.JSON = {
			parse : "Object",
			stringify : "String",
			$$prototype : "Object",
			$$args : {
				parse : ["str"],
				stringify : ["obj"]
			}
		};
		
	};

	/**
	 * Generic AST visitor.  Visits all children in source order, if they have a range property.  Children with
	 * no range property are visited first.
	 * 
	 * @param node The AST node to visit
	 * @param data any extra data (is this strictly necessary, or should it be folded into the operation?).
	 * @param operation function(node, data) an operation on the AST node and the data.  Return falsy if
	 * the visit should no longer continue. Return truthy to continue.
	 * @param postoperation (optional) function(node, data) an operation that is exectuted after visiting the current node's children.
	 * will only be invoked if operation returns true for the current node
	 */
	function visit(node, data, operation, postoperation) {
		var i, key, child, children;
		if (operation(node, data, true)) {
			// gather children to visit
			children = [];
			for (key in node) {
				if (key !== "range") {
					child = node[key];
					if (child instanceof Array) {
						for (i = 0; i < child.length; i++) {
							if (child[i] && child[i].hasOwnProperty("type")) {
								children.push(child[i]);
							} else if (key === "properties") {
								// might be key-value pair of an object expression
								// don't visit the key since it doesn't have an sloc
								// and it is handle later by inferencing
								if (child[i].hasOwnProperty("key") && child[i].hasOwnProperty("value")) {
									children.push(child[i].key);
									children.push(child[i].value);
								}
							}
						}
					} else {
						if (child && child.hasOwnProperty("type")) {
							children.push(child);
						}
					}
				}
			}
			
			if (children.length > 0) {
				// sort children by source location
				children.sort(function(left, right) {
					if (left.range && right.range) {
						return left.range[0] - right.range[0];	
					} else if (left.range) {
						return 1;
					} else if (right.range) {
						return -1;
					} else {
						return 0;
					}
				});
				
				// visit children in order
				for (i = 0; i < children.length; i++) {
					visit(children[i], data, operation, postoperation);
				}
			}
			if (postoperation) {
				postoperation(node, data, false);
			}
		}
	}

	/**
	 * Convert an array of parameters into a string and also compute linked editing positions
	 * @return { completion, positions }
	 */
	function calculateFunctionProposal(name, params, offset) {
		if (!params || params.length === 0) {
			return {completion: name + "()", positions:[]};
		}
		var positions = [];
		var completion = name + '(';
		var plen = params.length;
		for (var p = 0; p < plen; p++) {
			if (p > 0) {
				completion += ', ';
			}
			var argName = params[p].name ? params[p].name : params[p];
			positions.push({offset:offset+completion.length+1, length: argName.length});
			completion += argName;
		}
		completion += ')';
		return {completion: completion, positions: positions};
	}
	
	/**
	 * checks that offset overlaps with the given range
	 * Since esprima ranges are zero-based, inclusive of 
	 * the first char and exclusive of the last char, must
	 * use a +1 at the end.
	 * eg- (^ is the line start)
	 *       ^x    ---> range[0,0]
	 *       ^  xx ---> range[2,3]
	 */
	function inRange(offset, range) {
		return range[0] <= offset && range[1]+1 >= offset;
	}
	/**
	 * checks that offset is before the range
	 */
	function isBefore(offset, range) {
		if (!range) {
			return true;
		}
		return offset < range[0];
	}
	
	/**
	 * checks that offset is after the range
	 */
	function isAfter(offset, range) {
		if (!range) {
			return true;
		}
		return offset > range[1]+1;
	}
	
	/**
	 * Determines if the offset is inside this member expression, but after the '.' and before the 
	 * start of the property.
	 * eg, the following returns true:
	 *   foo   .^bar	 
	 *   foo   .  ^ bar
	 * The following returns false:
	 *   foo   ^.  bar
	 *   foo   .  b^ar
	 */
	function afterDot(offset, memberExpr, contents) {
		// check for broken AST
		var end;
		if (memberExpr.property) {
			end = memberExpr.property.range[0];
		} else {
			end = memberExpr.range[1];
		}
		// only do the work if we are in between the 
		if (!inRange(offset, memberExpr.range) ||
			inRange(offset, memberExpr.object.range) ||
			offset <= end) {
			return false;
		}
		
		var dotLoc = memberExpr.object.range[1];
		while (contents.charAt(dotLoc) !== "." && dotLoc < end) {
			dotLoc++;
		}
		
		if (contents.charAt(dotLoc) !== ".") {
			return false;
		}
		
		return dotLoc < offset;
	}
	
	
	/**
	 * @return "top" if we are at a start of a new expression fragment (eg- at an empty line, 
	 * or a new parameter).  "member" if we are after a dot in a member expression.  false otherwise
	 */
	function shouldVisit(root, offset, contents) {
		/**
		 * A visitor that finds the parent stack at the given location
		 */ 
		var findParent = function(node, parents, isInitialVisit) {
			if (!isInitialVisit) {
				// for the end visit just ensure that the parent stack is empty
				parents.pop();
				// return value is ignored
				return false;
			}
			
			if (node.range && inRange(offset, node.range)) {
				if (node.type === "Identifier") {
					throw "done";
				}
				parents.push(node);
				if ((node.type === "FunctionDeclaration" || node.type === "FunctionExpression") && 
						isBefore(offset, node.body.range)) {
					// completion occurs on the word "function"
					throw "done";
				}
				// special case where we are completing immediately after a '.' 
				if (node.type === "MemberExpression" && !node.property && afterDot(offset, node, contents)) {
					throw "done";
				}
				return true;
			} else {
				return false;
			}
		};
		var parents = [];
		try {
			visit(root, parents, findParent, findParent);
		} catch (done) {
			if (done !== "done") {
				// a real error
				throw(done);
			}
		}

		if (parents && parents.length) {
			var parent = parents.pop();
			if (parent.type === "MemberExpression") {
				if (parent.property && inRange(offset, parent.property.range)) {
					// on the right hand side of a property, eg: foo.b^
					return "member";
				} else if (inRange(offset, parent.range) && afterDot(offset, parent, contents)) {
					// on the right hand side of a dot with no text after, eg: foo.^
					return "member";
				}
			} else if (parent.type === "VariableDeclarator" && (!parent.init || isBefore(offset, parent.init.range))) {
				// the name of a variable declaration
				return false;
			} else if ((parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression") && 
					isBefore(offset, parent.body.range)) {
				// a function declaration
				return false;
			}
			
		}
		return "top";
	}	

	/**
	 * This function takes the current AST node and does the first inferencing step for it.
	 * @param node the AST node to visit
	 * @param data the data for the visitor.  See computeProposals below for full description of contents
	 */
	function proposalCollector(node, data) {
		var type = node.type, currentType = data.currentType, types = data.types, 
				oftype, name, i, property, newTypeName;
		
		if (type === "BlockStatement" && !inRange(data.offset, node.range)) {
			// out of range
			return false;
		} else if (type === "VariableDeclaration" && isBefore(data.offset, node.range)) {
			// must do this check since "VariableDeclarator"s do not seem to have their range set correctly
			return false;
		}
		
		if (type === "Program" || type === "BlockStatement") {
			node.inferredType = data.newScope();
		} else if (type === 'Identifier') {
			name = node.name;
			newTypeName = data.lookupName(name);
			if (newTypeName) {
				// name already exists
				node.inferredType = newTypeName;
			} else {
				// If name doesn't already exist, then just add it to the current type.
				// FIXADE  Is this what we want?  Doing this here will add any otherwise unknown property 
				// to the list of known properties if it is referenced.  Probably OK, but this has the side effect
				// of also including any half-formed property that exists as a prefix to the content assist invocation.
				node.inferredType = "Object";
				data.addVariable(name, "Object");
			}
		} else if (type === "ExpressionStatement" || type === "ReturnStatement") {
			data.resetCurrentType();
		
		} else if (type === "NewExpression") {
			node.inferredType = node.callee.name;
		} else if (type === "Literal") {
			oftype = (typeof node.value);
			node.inferredType = oftype[0].toUpperCase() + oftype.substring(1, oftype.length);
		} else if (type === "ArrayExpression") {
			node.inferredType = "Array";
		} else if (type === "ObjectExpression") {
			// for object literals, create a new object type so that we can stuff new properties into it.
			// we might be able to do better by walking into the object and inferring each RHS of a 
			// key-value pair
			newTypeName = data.newObject();
			for (i = 0; i < node.properties.length; i++) {
				property = node.properties[i];
				// only remember if the property is an identifier
				if (property.key && property.key.name) {
					// FIXADE not correct, we should be inferring inside the object, 
					// but that is for later
					data.addVariable(property.key.name, "Object");
				}
			}
			node.inferredType = newTypeName;
		} else if (type === "BinaryExpression") {
			if (node.operator === "+" || node.operator === "-" || node.operator === "/" || 
					node.operator === "*") {
				// assume number for now
				// rules are really much more complicated
				node.inferredType = "Number";
			}
		} else if (type === "UpdateExpression" || type === "UnaryExpression") {
			// assume number for now.  actual rules are much more complicated
			node.inferredType = "Number";
		} else if (type === "FunctionDeclaration") {
			data.resetCurrentType();

			var params = [];
			for (i = 0; i < node.params.length; i++) {
				params[i] = node.params[i].name;
			}
			data.addFunction(node.id.name, params, "Function");
		} else if (type === "VariableDeclarator" || type === "VariableDeclaration") {
			data.resetCurrentType();
		} else if (type === "CatchClause") {
			// create a new scope for the catch parameter
			node.inferredType = data.newScope();
			if (node.param) {
				node.param.inferredType = "Error";
				data.addVariable(node.param.name, "Error");
				
				// now add the catch parameter to the list of proposals if appropriate
				if (inRange(data.offset, node.range) && 
						isAfter(data.offset, node.param.range) && data.completionKind === "top") {
					name = node.param.name;
					if (name.indexOf(data.prefix) === 0) {
						data.proposals.push({ proposal: name, description: name + " (variable)"});
					}
				}
			}
		} else if (type === "ThisExpression") {
			node.inferredType = types[currentType]["this"];
		}
		return true;
	}
	
	/**
	 * called as the post operation for the proposalCollector visitor.
	 * Finishes off the inferencing and adds all proposals
	 */
	function proposalCollectorPostOp(node, data) {
		var type = node.type, name, params, res, plen, i, inferredType;
		
		if (type === "Program" || type === "BlockStatement" || type === "CatchClause") {
			data.popScope();
			
		} else if (type === "ExpressionStatement" || 
					type === "ReturnStatement" || 
					type === "ForStatement" || 
					type === "WhileStatement" ||
					type === "TryStatement" ||
					type === "VariableDeclaration") {
			data.resetCurrentType();
			
		} if (type === "MemberExpression") {
			if (data.completionKind === "member" &&
					((node.property && inRange(data.offset, node.property.range)) || 
					afterDot(data.offset, node, data.contents))) {
				// completion on a property of a member expression
				// currentType is the inferred type of the object expression
				data.computeInferredProposals(node.object.inferredType);
			}
			// node.propery will be null for mal-formed asts
			node.inferredType = node.property ? node.property.inferredType : node.object.inferredType;
			data.currentType = node.inferredType;
		} else if (type === "CallExpression") {
			node.inferredType = node.callee.inferredType;
			data.currentType = node.inferredType;
		} else if (type === "ObjectExpression") {
			data.popScope();
		} else if (type === "FunctionDeclaration" && 
				(inRange(data.offset, node.range) || isAfter(data.offset, node.range)) && 
				data.completionKind === "top") {
			// Add function proposal only if completion offset is inside or after this function declaration
			name = node.id.name;
			params = node.params;
			if (name.indexOf(data.prefix) === 0) {
				res = calculateFunctionProposal(node.id.name, params, data.replaceStart - 1);
				data.proposals.push({ 
					proposal: res.completion, 
					description: res.completion + " (function)", 
					positions: res.positions, 
					escapePosition: data.replaceStart + res.completion.length
				});
			}
			// only add parameters if we are completing inside the function
			if (params && params.length > 0 && inRange(data.offset, node.range)) {
				plen = params.length;
				for (i = 0; i < plen; i++) {
					name = params[i].name;
					if (name.indexOf(data.prefix) === 0) {
						data.proposals.push({ proposal: name, description: name + " (parameter of " + node.id.name + ")"});
					}
				}
			}
			// can we do better than function?			
			node.inferredType = "Function";
			data.currentType = "Function";
			
		} else if (type === "VariableDeclarator") {
			if (isAfter(data.offset, node.range) && data.completionKind === "top") {
				// although legal to reference before being declared, don't include in list
				name = node.id.name;
				if (name.indexOf(data.prefix) === 0) {
					data.proposals.push({ proposal: name, description: name + " (variable)"});
				}
			}
			if (node.init) {
				inferredType = node.init.inferredType;
			} else {
				inferredType = "Object";
			}
			node.inferredType = inferredType;
			data.addVariable(node.id.name, inferredType);
			data.currentType = inferredType;

		} else if (type === "AssignmentExpression" && node.left.type === 'Identifier') {
			// only handle simple assignements, eg- x = y; and not x.y = z;
			// we can do better by walking the tree
			inferredType = node.right.inferredType;
			node.inferredType = inferredType;
			data.addOrSetVariable(node.left.name, inferredType);
			data.currentType = inferredType;
		}
		
		if (!node.inferredType) {
			node.inferredType = "Object";
		}
	}

	function parse(contents) {
		var parsedProgram = esprima.parse(contents, {
			range: true,
			tolerant: true
		});
		return parsedProgram;
	}

	function EsprimaJavaScriptContentAssistProvider() {}
	
	/**
	 * Main entry point to provider
	 */
	EsprimaJavaScriptContentAssistProvider.prototype = {
		computeProposals: function(prefix, buffer, selection) {
			try {
				var root = parse(buffer);
				// note that if selection has length > 0, then just ignore everything past the start
				var completionKind = shouldVisit(root, selection.start, buffer);
				if (completionKind) {
					var data = {
						/** a counter used for creating unique names for object literals and scopes */
						typeCount : 0,
						/** an array of proposals generated */
						proposals: [], 
						/** the offset of content assist invocation */
						offset: selection.start, 
						/** 
						 * the location of the start of the area that will be replaced 
						 */
						replaceStart: selection.start - prefix.length, 
						/** the prefix of the invocation */
						prefix: prefix, 
						/** Each element is the type of the current scope, which is a key into the types array */
						typeStack: ["Object"],
						/** the type of the expression most recently evaluated */
						currentType: "Object",  // always points to the top of the type stack
						/** a map of all the types and their properties currently known */
						types:new Types(),
						/** the entire contents being completed on */
						contents:buffer,
						/** "member" or "top"  if Member, completion occurs after a dotted member expression.  if top, completion occurs as the start of a new expression */
						completionKind:completionKind,
						newName: function() {
							return "Object~"+ this.typeCount++;
						},
						/** Creates a new empty scope and returns the name */
						newScope: function() {
							var newScopeName = this.newName();
							this.types[newScopeName] = {
								$$prototype : this.currentType,
								$$args : {}
							};
							this.typeStack.push(newScopeName);
							this.currentType = newScopeName;
							// must add a new 'this' for use inside of the object
							this.addVariable("this", newScopeName);
							return newScopeName;
						},
						
						/** Creates a new empty object scope and returns the name */
						newObject: function() {
							var newObjectName = this.newName();
							this.types[newObjectName] = {
								$$prototype : "Object",
								$$args : {}
							};
							this.typeStack.push(newObjectName);
							this.currentType = newObjectName;
							// add a new 'this' for use inside of the object
							this.addVariable("this", newObjectName);
							return newObjectName;
						},
						
						/** removes the current scope */
						popScope: function() {
							// Can't delete old scope since it may have been assigned somewhere
							// but must remove "this" when outside of the scope
							this.addVariable("this", null);
							var oldScope = this.typeStack.pop();
							this.currentType = this.typeStack[this.typeStack.length -1];
							return oldScope;
						},
						
						resetCurrentType : function() {
							this.currentType = this.typeStack[this.typeStack.length -1];
							return this.currentType;
						},
						
						/** adds the name to the current type/scope */
						addVariable : function(name, type) {
							this.types[this.currentType][name] = type;
						},
						
						/** 
						 * like add variable, but first checks the prototype hierarchy
						 * if exists in prototype hierarchy, then replace the type
						 */
						addOrSetVariable : function(name, type) {
							var current = this.types[this.currentType], found = false;
							while (current) {
								if (current[name]) {
									// found it, just overwrite
									current[name] = type;
									found = true;
									break;
								} else {
									current = current.$$prototype;
								}
							}
							if (!found) {
								// not found, so just add to current scope
								this.types[this.currentType][name] = type;
							}
						},
						
						/** adds the name and args (array of strings) with the given return type to the current type */
						addFunction : function(name, args, type) {
							this.types[this.currentType][name] = type;
							this.types[this.currentType].$$args[name] = args;
						},
						
						/** looks up the name in the hierarchy */
						lookupName : function(name) {
							var innerLookup = function(name, type, types) {
								var res = type[name];
								if (res) {
									return res;
								} else {
									var proto = type.$$prototype;
									if (proto) {
										return innerLookup(name, types[proto], types);
									}
									return null;
								}
							};
							return innerLookup(name, this.types[this.currentType], this.types);
						},
						
						computeInferredProposals : function(currentType) {
							var prop, propName, proto, res, functionArgs, type = this.types[currentType];
							proto = type.$$prototype;
							
							for (prop in type) {
								if (type.hasOwnProperty(prop)) {
									if (prop === "$$prototype" || prop === "$$args") {
										continue;
									}
									if (!proto && prop.indexOf("$$") === 0) {
										// no prototype that means we must decode the property name
										propName = prop.substring(2);
									} else {
										propName = prop;
									}
									if (propName === "this" && this.completionKind === "member") {
										// don't show "this" proposals for non-top-level locations
										// (eg- this.this is wrong)
										continue;
									}
									if (propName.indexOf(this.prefix) === 0) {
										functionArgs = type.$$args[prop];
										if (functionArgs) {
											res = calculateFunctionProposal(propName, 
													functionArgs, data.replaceStart - 1);
											this.proposals.push({ 
												proposal: res.completion, 
												description: res.completion + " (function)", 
												positions: res.positions, 
												escapePosition: data.replaceStart + res.completion.length 
											});
										} else {
											this.proposals.push({ 
												proposal: propName,
												description: propName + " (property)"
											});
										}
									}
								}
							}
							// walk up the prototype hierarchy
							if (proto) {
								this.computeInferredProposals(proto);
							}
						}
					};
					// need to use a copy of types since we make changes to it.
					visit(root, data, proposalCollector, proposalCollectorPostOp);
					data.proposals.sort(function(l,r) {
						if (l.description < r.description) {
							return -1;
						} else if (r.description < l.description) {
							return 1;
						} else {
							return 0;
						}
					});
					return data.proposals;
				} else {
					// invalid completion location
					return {};
				}
			} catch (e) {
				if (console && console.log) {
					console.log(e.message);
					console.log(e.stack);
				}
				throw (e);
			}
		}
	};
	return {
		EsprimaJavaScriptContentAssistProvider : EsprimaJavaScriptContentAssistProvider
	};
});