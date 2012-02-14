/*******************************************************************************
 * @license
 * Copyright (c) 2012 Contributors
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Andrew Eisenberg (vmware) - initial API and implementation
 *******************************************************************************/

/*global define console setTimeout esprimaContentAssistant*/
define(["./esprimaJsContentAssist", "orion/assert"], function(mEsprimaPlugin, assert) {
	
	//////////////////////////////////////////////////////////
	// helpers
	//////////////////////////////////////////////////////////
	var esprimaContentAssistant = new mEsprimaPlugin.EsprimaJavaScriptContentAssistProvider();
	
	function computeContentAssistAtEnd(contents, prefix) {
		if (!prefix) {
			prefix = "";
		}
		var offset = contents.indexOf("/**/");
		if (offset < 0) {
			offset = contents.length;
		}
		
		return esprimaContentAssistant.computeProposals(prefix, contents, {start: offset});
	}
	
	function testProposal(proposal, text, description) {
		assert.equal(proposal.proposal, text, "Invalid proposal text");
		if (description) {
			assert.equal(proposal.description, description, "Invalid proposal description");
		}
	}
	
	function testProposals(actualProposals, expectedProposals) {
//		console.log("Proposals:");
//		console.log(actualProposals);
		
		assert.equal(actualProposals.length, expectedProposals.length, 
			"Wrong number of proposals.  Expected:\n" + expectedProposals +"\nActual:\n"+actualProposals);
			
		for (var i = 0; i < actualProposals.length; i++) {
			testProposal(actualProposals[i], expectedProposals[i][0], expectedProposals[i][1]);
		}
	}

	function parse(contents) {
		return esprima.parse(contents,{
			range: false,
			loc: false,
			tolerant: true
		});
	}

	function assertNoErrors(ast) {
		assert.ok(ast.errors===null || ast.errors.length===0,
			'errors: '+ast.errors.length+'\n'+ast.errors);
	}

	function assertErrors(ast,expectedErrors) {
		var expectedErrorList = (expectedErrors instanceof Array ? expectedErrors: [expectedErrors]);
		var correctNumberOfErrors = ast.errors!==null && ast.errors.length===expectedErrorList.length;
		assert.ok(correctNumberOfErrors,'errors: '+ast.errors.length+'\n'+ast.errors);
		if (correctNumberOfErrors) {
			for (var e=0;e<expectedErrors.length;e++) {
				var expectedError = expectedErrorList[e];
				var actualError = ast.errors[e];
				assert.equal(actualError.lineNumber,expectedError.lineNumber,"checking line for message #"+(e+1)+": "+actualError);
				var actualMessage = actualError.message.replace(/Line [0-9]*: /,'');
				assert.equal(actualMessage,expectedError.message,"checking text for message #"+(e+1)+": "+actualError);
			}
		}
	}


	function stringify(parsedProgram) {
		var body = parsedProgram.body;
		if (body.length===1) {
			body=body[0];
		}
		var replacer = function(key,value) {
			if (key==='computed') {
				return;
			}
			return value;
		};
		return JSON.stringify(body,replacer).replace(/"/g,'');
	}

	function message(line, text) {
		return {
			lineNumber:line,
			message:text
		};
	}

	//////////////////////////////////////////////////////////
	// tests
	//////////////////////////////////////////////////////////

	var tests = {};

tests.testEmpty = function() {};

	tests["test recovery basic parse"] = function() {
		var parsedProgram = parse("foo.bar");
		assertNoErrors(parsedProgram);
		assert.equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:bar}}}");
	};

	tests["test recovery - dot followed by EOF"] = function() {
		var parsedProgram = parse("foo.");
		assertErrors(parsedProgram,message(1,'Unexpected end of input'));
		assert.equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo}}}");
	};

	tests["test Content Assist Setup"] = function() {
		assert.ok(esprimaContentAssistant, "Found Esprima content assistant");
		assert.ok(esprimaContentAssistant.computeProposals, "Found proposal computer");
	};
	
	tests["test Empty Content Assist"] = function() {
		var results = computeContentAssistAtEnd("");
		assert.equal(results.length, 0);
	};
	
	// non-inferencing content assist
	tests["test Single Var Content Assist"] = function() {
		var results = computeContentAssistAtEnd("var zzz;\n");
		assert.equal(results.length, 1, "Wrong number of proposals found");
		testProposal(results[0], "zzz", "zzz (variable)");
	};
	tests["test multi var content assist 1"] = function() {
		var results = computeContentAssistAtEnd("var zzz;\nvar xxx, yyy;\n");
		testProposals(results, [
			["xxx", "xxx (variable)"],
			["yyy", "yyy (variable)"],
			["zzz", "zzz (variable)"]
		]);
	};
	tests["test multi var content assist 2"] = function() {
		var results = computeContentAssistAtEnd("var zzz;\nvar zxxx, xxx, yyy;\nz","z");
		testProposals(results, [
			["zxxx", "zxxx (variable)"],
			["zzz", "zzz (variable)"]
		]);
	};
	tests["test single function content assist"] = function() {
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\n");
		testProposals(results, [
			["fun(a, b, c)", "fun(a, b, c) (function)"]
		]);
	};
	tests["test multi function content assist 1"] = function() {
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\nfunction other(a, b, c) {}\n");
		testProposals(results, [
			["fun(a, b, c)", "fun(a, b, c) (function)"],
			["other(a, b, c)", "other(a, b, c) (function)"]
		]);
	};
	tests["test multi function content assist 2"] = function() {
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\nfunction other(a, b, c) {}\nf", "f");
		testProposals(results, [
			["fun(a, b, c)", "fun(a, b, c) (function)"]
		]);
	};
	tests["test in function 1"] = function() {
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\nfunction other(a, b, c) {/**/}", "");
		testProposals(results, [
			["a", "a (parameter of other)"],
			["b", "b (parameter of other)"],
			["c", "c (parameter of other)"],
			["fun(a, b, c)", "fun(a, b, c) (function)"],
			["other(a, b, c)", "other(a, b, c) (function)"]
		]);
	};
	tests["test in function 2"] = function() {
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\nfunction other(a, b, c) {\n/**/nuthin}", "");
		testProposals(results, [
			["a", "a (parameter of other)"],
			["b", "b (parameter of other)"],
			["c", "c (parameter of other)"],
			["fun(a, b, c)", "fun(a, b, c) (function)"],
			["other(a, b, c)", "other(a, b, c) (function)"]
		]);
	};
	tests["test in function 3"] = function() {
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\nfunction other(a, b, c) {f/**/}", "f");
		testProposals(results, [
			["fun(a, b, c)", "fun(a, b, c) (function)"]
		]);
	};
	tests["test in function 4"] = function() {
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\nfunction other(aa, ab, c) {a/**/}", "a");
		testProposals(results, [
			["aa", "aa (parameter of other)"],
			["ab", "ab (parameter of other)"]
		]);
	};
	tests["test in function 5"] = function() {
		// should not see 'aaa' since that is declared later
		var results = computeContentAssistAtEnd("function fun(a, b, c) {}\nfunction other(aa, ab, c) {var abb;\na/**/\nvar aaa}", "a");
		testProposals(results, [
			["aa", "aa (parameter of other)"],
			["ab", "ab (parameter of other)"],
			["abb", "abb (variable)"]
		]);
	};
	tests["test in function 6"] = function() {
		// should not see 'aaa' since that is declared later
		var results = computeContentAssistAtEnd(
		"function fun(a, b, c) {\n" +
		"function other(aa, ab, c) {\n"+
		"var abb;\na/**/\nvar aaa\n}\n}", "a");
		testProposals(results, [
			["a", "a (parameter of fun)"],
			["aa", "aa (parameter of other)"],
			["ab", "ab (parameter of other)"],
			["abb", "abb (variable)"]
		]);
	};
	tests["test in function 7"] = function() {
		// should not see 'aaa' since that is declared later
		var results = computeContentAssistAtEnd(
		"function fun(a, b, c) {/**/\n" +
		"function other(aa, ab, ac) {\n"+
		"var abb;\na\nvar aaa\n}\n}");
		testProposals(results, [
			["a", "a (parameter of fun)"],
			["b", "b (parameter of fun)"],
			["c", "c (parameter of fun)"],
			["fun(a, b, c)", "fun(a, b, c) (function)"]
		]);
	};
	tests["test in function 8"] = function() {
		// should not see 'aaa' since that is declared later
		var results = computeContentAssistAtEnd(
		"function fun(a, b, c) {\n" +
		"function other(aa, ab, ac) {\n"+
		"var abb;\na\nvar aaa\n} /**/\n}");
		testProposals(results, [
			["a", "a (parameter of fun)"],
			["b", "b (parameter of fun)"],
			["c", "c (parameter of fun)"],
			["fun(a, b, c)", "fun(a, b, c) (function)"],
			["other(aa, ab, ac)", "other(aa, ab, ac) (function)"]
		]);
	};
	
	
	// all inferencing based content assist tests here
	tests["test Object inferencing with Variable"] = function() {
		var results = computeContentAssistAtEnd("var t = {}\nt.h", "h");
		testProposals(results, [
			["hasOwnProperty(property)", "hasOwnProperty(property) (function)"]
		]);
	};
	tests["test Object Literal inferencing"] = function() {
		var results = computeContentAssistAtEnd("var t = { hhh : 1, hh2 : 8}\nt.h", "h");
		testProposals(results, [
			["hasOwnProperty(property)", "hasOwnProperty(property) (function)"],
			["hh2", "hh2 (property)"],
			["hhh", "hhh (property)"]
		]);
	};
	tests["test Simple String inferencing"] = function() {
		var results = computeContentAssistAtEnd("''.char", "char");
		testProposals(results, [
			["charAt(index)", "charAt(index) (function)"],
			["charCodeAt(index)", "charCodeAt(index) (function)"]
		]);
	};
	tests["test Simple Date inferencing"] = function() {
		var results = computeContentAssistAtEnd("new Date().setD", "setD");
		testProposals(results, [
			["setDay(dayOfWeek)", "setDay(dayOfWeek) (function)"]
		]);
	};
	tests["test Number inferencing with Variable"] = function() {
		var results = computeContentAssistAtEnd("var t = 1\nt.to", "to");
		testProposals(results, [
			["toExponential(digits)", "toExponential(digits) (function)"],
			["toFixed(digits)", "toFixed(digits) (function)"],
			["toLocaleString()", "toLocaleString() (function)"],
			["toPrecision(digits)", "toPrecision(digits) (function)"],
			["toString()", "toString() (function)"]
		]);
	};
	
	tests["test Data flow Object Literal inferencing"] = function() {
		var results = computeContentAssistAtEnd("var s = { hhh : 1, hh2 : 8}\nvar t = s;\nt.h", "h");
		testProposals(results, [
			["hasOwnProperty(property)", "hasOwnProperty(property) (function)"],
			["hh2", "hh2 (property)"],
			["hhh", "hhh (property)"]
		]);
	};
	
	tests["test Simple this"] = function() {
		var results = computeContentAssistAtEnd("var ssss = 4;\nthis.ss", "ss");
		testProposals(results, [
			["ss", "ss (property)"],  // FIXADE see proposalCollector Identifier
			["ssss", "ssss (property)"]
		]);
	};
	
	
	tests["test Object Literal inside"] = function() {
		var results = computeContentAssistAtEnd("var x = { the : 1, far : this.th/**/ };", "th");
		testProposals(results, [
			["th", "th (property)"],  // FIXADE see proposalCollector Identifier
			["the", "the (property)"]
		]);
	};
	tests["test Object Literal outside"] = function() {
		var results = computeContentAssistAtEnd("var x = { the : 1, far : 2 };\nx.th", "th");
		testProposals(results, [
			["the", "the (property)"]
		]);
	};
	tests["test Object Literal none"] = function() {
		var results = computeContentAssistAtEnd("var x = { the : 1, far : 2 };\nthis.th", "th");
		testProposals(results, [
			["th", "th (property)"]
		]);
	};
	tests["test Object Literal outside 2"] = function() {
		var results = computeContentAssistAtEnd("var x = { the : 1, far : 2 };\nvar who = x.th", "th");
		testProposals(results, [
			["the", "the (property)"]
		]);
	};
	tests["test Object Literal outside 3"] = function() {
		var results = computeContentAssistAtEnd("var x = { the : 1, far : 2 };\nwho(x.th/**/)", "th");
		testProposals(results, [
			["the", "the (property)"]
		]);
	};
	tests["test Object Literal outside 4"] = function() {
		var results = computeContentAssistAtEnd("var x = { the : 1, far : 2 };\nwho(yyy. x.th/**/)", "th");
		testProposals(results, [
			["th", "th (property)"],
			["the", "the (property)"]
		]);
	};
	
	/*
	 yet to do:
	 1. with, catch, if, while, for (in), this, args in a call, inside object literal, function inside obj literal
	 2. better work on binary expressions
	 3. function/method return types vs functions themselves
	 4, parameterized types (eg- array of string, function that returns number)
	 5. foo.bar = 8
	 6. add new properties after being created
	 \
	 How to solve the "this" problem in object literals:
	 1. do shallow visit of keys
	 2. assign keys to a new type
	 3. create new scope for inside the literal
	 4. assign 'this' to the type created in step 2
	 5. visit internal
	 6. pop
	*/
	return tests;
});
