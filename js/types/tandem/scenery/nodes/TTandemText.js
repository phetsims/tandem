// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioEvents = require( 'PHET_IO/phetioEvents' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TNode = require( 'PHET_IO/types/scenery/nodes/TNode' );
  var TString = require( 'PHET_IO/types/TString' );
  var TVoid = require( 'PHET_IO/types/TVoid' );

  var TTandemText = phetioInherit( TNode, 'TTandemText', function( tandemText, phetioID ) {
    TNode.call( this, tandemText, phetioID );
    assertInstanceOf( tandemText, phet.tandem.TandemText );
    tandemText.on( 'text', function( oldText, newText ) {
      phetioEvents.trigger( 'model', phetioID, TTandemText, 'textChanged', {
        oldText: oldText,
        newText: newText
      } );
    } );
  }, {
    setText: {
      returnType: TVoid,
      parameterTypes: [ TString ],
      implementation: function( text ) {
        this.instance.text = text;
      },
      documentation: 'Set the text'
    },
    getText: {
      returnType: TString,
      parameterTypes: [],
      implementation: function() {
        return this.instance.text;
      },
      documentation: 'Get the text'
    }
  }, {
    documentation: 'The tandem wrapper type for the scenery Text node',
    events: [ 'textChanged' ]
  } );

  phetioNamespace.register( 'TTandemText', TTandemText );

  return TTandemText;
} );
