// Copyright 2018-2019, University of Colorado Boulder

/**
 * IO type use to signify a function has no return value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  class VoidIO extends ObjectIO {
    constructor( instance, phetioID ) {
      assert && assert( false, 'should never be called' );
      super( instance, phetioID );
    }

    static toStateObject() {
      return undefined;
    }
  }

  VoidIO.documentation = 'Type for which there is no instance, usually to mark functions without a return value';

  /**
   * We sometimes use VoidIO as a workaround to indicate that an argument is passed in the simulation side, but
   * that it shouldn't be leaked to the PhET-iO client.
   *
   * @override
   * @public
   */
  VoidIO.validator = { isValidValue: () => true };
  VoidIO.typeName = 'VoidIO';
  ObjectIO.validateSubtype( VoidIO );

  return tandemNamespace.register( 'VoidIO', VoidIO );
} );