// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/api/TObject' );

  var TVoid = phetioInherit( TObject, 'TVoid', function( instance, phetioID ) {
      TObject.call( this, instance, phetioID );
    },

    // Instance methods
    {},

    // Static methods
    {
      documentation: 'Type for which there is no instance, usually to mark functions without a return value'
    }
  );

  phetioNamespace.register( 'TVoid', TVoid );

  return TVoid;
} );
