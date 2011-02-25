/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse = eclipse || {};

eclipse.CompareRuler = (function() {
	function CompareRuler (rulerLocation, rulerOverview, rulerStyle) {
		this._location = rulerLocation || "left";
		this._overview = rulerOverview || "page";
		this._rulerStyle = rulerStyle;
		this._editor = null;
	}
	CompareRuler.prototype = {
		setEditor: function (editor) {
			if (this._onModelChanged && this._editor) {
				this._editor.removeEventListener("ModelChanged", this, this._onModelChanged); 
			}
			this._editor = editor;
			if (this._onModelChanged && this._editor) {
				this._editor.addEventListener("ModelChanged", this, this._onModelChanged);
			}
		},
		getLocation: function() {
			return this._location;
		},
		getOverview: function(editor) {
			return this._overview;
		}
	};
	return CompareRuler;
}());

eclipse.LineNumberDiffRuler = (function() {
	function LineNumberDiffRuler (forDiff , rulerLocation, rulerStyle, oddStyle, evenStyle) {
		eclipse.CompareRuler.call(this, rulerLocation, "page", rulerStyle);
		this._oddStyle = oddStyle || {style: {backgroundColor: "white"}};
		this._evenStyle = evenStyle || {style: {backgroundColor: "white"}};
		this._numOfDigits = 0;
		this._forDiff = forDiff;
	}
	LineNumberDiffRuler.prototype = new eclipse.CompareRuler(); 
	LineNumberDiffRuler.prototype.getStyle = function(lineIndex) {
		if (lineIndex === undefined) {
			return this._rulerStyle;
		} else {
			return false/*lineIndex & 1 */? this._oddStyle : this._evenStyle;
		}
	};
	LineNumberDiffRuler.prototype.getHTML = function(lineIndex) {
		var model = this._editor.getModel();
		if (lineIndex === -1) {
			return model.getLineCount();
		} else {
			if(model._lineFeeder.getLineNumber){
				var realIndex = model._lineFeeder.getLineNumber(lineIndex , this._forDiff ? 0:1);
				if(realIndex === -1){
					return "";
				}
				return  realIndex + 1;
			}
			return lineIndex + 1;;
		}
	};
	LineNumberDiffRuler.prototype._onModelChanged = function(e) {
		var start = e.start;
		var model = this._editor.getModel();
		var lineCount = model.getLineCount();
		var numOfDigits = (lineCount+"").length;
		if (this._numOfDigits !== numOfDigits) {
			this._numOfDigits = numOfDigits;
			var startLine = model.getLineAtOffset(start);
			this._editor.redrawLines(startLine, lineCount, this);
		}
	};
	return LineNumberDiffRuler;
}());