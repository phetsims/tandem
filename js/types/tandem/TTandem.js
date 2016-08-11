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
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var TString = require( 'PHET_IO/types/TString' );

  var TTandem = function( arrayInstance, phetioID ) {
    TObject.call( this, arrayInstance, phetioID );
    assertInstanceOf( arrayInstance, phet.tandem.Tandem );
  };

  phetioInherit( TObject, 'TTandem', TTandem, {}, {
    documentation: 'Tandems give sim elements their phet-io identifiers',
    toStateObject: function( instance ) {
      return TString.toStateObject( instance.id );
    },
    fromStateObject: function( stateObject ) {
      return new phet.tandem.Tandem( TString.fromStateObject( stateObject ) );
    }
  } );

  phetioNamespace.register( 'TTandem', TTandem );

  return TTandem;
} );

