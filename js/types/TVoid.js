// Copyright 2016, University of Colorado Boulder

/**
 * Wrapper type that signifies a function has no return value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );

  /**
   * @constructor
   */
  function TVoid() {
    assert && assert( false, 'should never be called' );
  }

  phetioInherit( TObject, 'TVoid', TVoid,

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