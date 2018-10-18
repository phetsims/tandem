// Copyright 2016, University of Colorado Boulder

/**
 * IO type use to signify a function has no return value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );

  /**
   * @constructor
   */
  function VoidIO() {
    assert && assert( false, 'should never be called' );
  }

  phetioInherit( ObjectIO, 'VoidIO', VoidIO,

    // Instance methods
    {},

    // Static methods
    {
      documentation: 'Type for which there is no instance, usually to mark functions without a return value',

      toStateObject: function() {
        return undefined;
      }
    }
  );

  tandemNamespace.register( 'VoidIO', VoidIO );

  return VoidIO;
} );