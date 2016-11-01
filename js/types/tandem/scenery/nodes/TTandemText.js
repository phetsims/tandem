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

  function TTandemText( tandemText, phetioID ) {
    TNode.call( this, tandemText, phetioID );
    assertInstanceOf( tandemText, phet.tandem.TandemText );
    tandemText.on( 'text', function( oldText, newText ) {
      phetioEvents.trigger( 'model', phetioID, TTandemText, 'textChanged', {
        oldText: oldText,
        newText: newText
      } );
    } );
  }

  phetioInherit( TNode, 'TTandemText', TTandemText, {

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
