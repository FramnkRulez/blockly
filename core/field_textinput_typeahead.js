
/**
 * @fileoverview Text input type ahead field.
 * @author framnk@gmail.com
 */
'use strict';

goog.provide('Blockly.FieldTextInputTypeAhead');
goog.require('Blockly.FieldTextInput');

Blockly.FieldTextInputTypeAhead = function(opt_value, menuGenerator, opt_validator) {
    this.menuGenerator_ = menuGenerator;

    opt_value = this.doClassValidation_(opt_value);
    if (opt_value === null) {
      opt_value = Blockly.FieldTextInput.DEFAULT_VALUE;
    }  // Else the original value is fine.
    Blockly.FieldTextInputTypeAhead.superClass_.constructor.call(this, opt_value, opt_validator);
};
Blockly.utils.object.inherits(Blockly.FieldTextInputTypeAhead, Blockly.FieldTextInput);

Blockly.FieldTextInputTypeAhead.fromJson = function(options) {
    var value = Blockly.utils.replaceMessageReferences(options['value']);
    return new Blockly.FieldTextInputTypeAhead(value, options['options']);
  };

/**
 * Create the text input editor widget.
 * @return {!HTMLElement} The newly created text input editor.
 * @protected
 */
Blockly.FieldTextInputTypeAhead.prototype.widgetCreate_ = function() {
    var div = Blockly.WidgetDiv.DIV;
  
    Blockly.utils.dom.addClass(this.getClickTarget_(), 'editing');

    var htmlInput = /** @type {HTMLInputElement} */ (document.createElement('input'));
    htmlInput.className = 'blocklyHtmlInput';
    htmlInput.setAttribute('spellcheck', this.spellcheck_);
    var scale = this.workspace_.getScale();
    var fontSize =
        (this.getConstants().FIELD_TEXT_FONTSIZE * scale) + 'pt';
    div.style.fontSize = fontSize;
    htmlInput.style.fontSize = fontSize;
  
    var borderRadius =
        (Blockly.FieldTextInput.BORDERRADIUS * scale) + 'px';
  
    if (this.fullBlockClickTarget_) {
      var bBox = this.getScaledBBox();
  
      // Override border radius.
      borderRadius = (bBox.bottom - bBox.top) / 2 + 'px';
      // Pull stroke colour from the existing shadow block
      var strokeColour = this.sourceBlock_.getParent() ?
        this.sourceBlock_.getParent().style.colourTertiary :
        this.sourceBlock_.style.colourTertiary;
      htmlInput.style.border = (1 * scale) + 'px solid ' + strokeColour;
      div.style.borderRadius = borderRadius;
      div.style.transition = 'box-shadow 0.25s ease 0s';
      if (this.getConstants().FIELD_TEXTINPUT_BOX_SHADOW) {
        div.style.boxShadow = 'rgba(255, 255, 255, 0.3) 0px 0px 0px ' +
            4 * scale + 'px';
      }
    }
    htmlInput.style.borderRadius = borderRadius;
  
    div.appendChild(htmlInput);
  
    htmlInput.value = htmlInput.defaultValue = this.getEditorText_(this.value_);
    htmlInput.untypedDefaultValue_ = this.value_;
    htmlInput.oldValue_ = null;
    this.autocomplete_(htmlInput, this.menuGenerator_);
  
    this.resizeEditor_();
  
    this.bindInputEvents_(htmlInput);
  
    return htmlInput;
  };

Blockly.FieldTextInputTypeAhead.prototype.autocomplete_ = function(inp, menuGenerator) {
    var fieldInput = this;

    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);

        var generator;
        if(typeof menuGenerator == 'function') {
            generator = menuGenerator.call(this);
        } else {
            generator = menuGenerator;
        }

        Promise.resolve(generator).then(function(arr) {
            /*for each item in the array...*/
            for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function(e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                    fieldInput.onHtmlInputChange_(this);
                });
                a.appendChild(b);
            }
        }});
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          /*If the arrow DOWN key is pressed,
          increase the currentFocus variable:*/
          currentFocus++;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 38) { //up
          /*If the arrow UP key is pressed,
          decrease the currentFocus variable:*/
          currentFocus--;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 13) {
          /*If the ENTER key is pressed, prevent the form from being submitted,*/
          e.preventDefault();
          if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      /*a function to classify an item as "active":*/
      if (!x) return false;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
  };
  
Blockly.fieldRegistry.register('field_typeahead', Blockly.FieldTextInputTypeAhead);
