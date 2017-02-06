// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioEvents = require( 'PHET_IO/phetioEvents' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TFont = require( 'PHET_IO/types/scenery/util/TFont' );
  var TNode = require( 'PHET_IO/types/scenery/nodes/TNode' );
  var TNumber = require( 'PHET_IO/types/TNumber' );
  var TString = require( 'PHET_IO/types/TString' );
  var TVoid = require( 'PHET_IO/types/TVoid' );
  var TFunctionWrapper = require( 'PHET_IO/types/TFunctionWrapper' );

  /**
   * Wrapper type for phet/tandem's Text class.
   * @param tandemText
   * @param phetioID
   * @constructor
   */
  function TTandemText( tandemText, phetioID ) {
    TNode.call( this, tandemText, phetioID );
    assertInstanceOf( tandemText, phet.tandem.Text );
    tandemText.on( 'text', function( oldText, newText ) {
      phetioEvents.trigger( 'model', phetioID, TTandemText, 'textChanged', {
        oldText: oldText,
        newText: newText
      } );
    } );
  }

  phetioInherit( TNode, 'TTandemText', TTandemText, {

    addTextChangedListener: {
      returnType: TVoid,
      parameterTypes: [ TFunctionWrapper( TVoid, [ TString ] ) ],
      implementation: function( listener ) {
        this.instance.on( 'text', function( oldText, newText ) {
          listener( newText );
        } );
      },
      documentation: 'Add a listener for when the text has changed.'
    },

    setText: {
      returnType: TVoid,
      parameterTypes: [ TString ],
      implementation: function( text ) {
        this.instance.text = text;
      },
      documentation: 'Set the text content'
    },

    getText: {
      returnType: TString,
      parameterTypes: [],
      implementation: function() {
        return this.instance.text;
      },
      documentation: 'Get the text content'
    },

    setFontOptions: {
      returnType: TVoid,
      parameterTypes: [ TFont ],
      implementation: function( font ) {
        this.instance.setFont( font );
      },
      documentation: 'Set font options for this TTandemText instance, e.g. {size: 16, weight: bold}'
    },

    getFontOptions: {
      returnType: TFont,
      parameterTypes: [],
      implementation: function() {
        return this.instance.getFont();
      },
      documentation: 'Get font options for this TTandemText instance as an object'
    },

    setMaxWidth: {
      returnType: TVoid,
      parameterTypes: [ TNumber() ],
      implementation: function( maxWidth ) {
        this.instance.setMaxWidth( maxWidth );
      },
      documentation: 'Set maximum width of text box in px. ' +
                     'If text is wider than maxWidth at its default font size, it is scaled down to fit.'
    },

    getMaxWidth: {
      returnType: TNumber(),
      parameterTypes: [],
      implementation: function() {
        return this.instance.maxWidth;
      },
      documentation: 'Get maximum width of text box in px'
    }

  }, {
    documentation: 'The tandem wrapper type for the scenery Text node',
    events: [ 'textChanged' ]
  } );

  phetioNamespace.register( 'TTandemText', TTandemText );

  return TTandemText;
} );
