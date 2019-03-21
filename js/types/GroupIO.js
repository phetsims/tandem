// Copyright 2019, University of Colorado Boulder

/**
 * IO type for Group
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  /**
   * @constructor
   */
  function GroupIO( instance, phetioID ) {
    ObjectIO.call( this, instance, phetioID );
  }

  phetioInherit( ObjectIO, 'GroupIO', GroupIO, {}, {

    documentation: 'Container for dynamic elements',

    /**
     * @override
     * @public
     */
    validator: { valueType: Object },

    /**
     * Encodes a string to a state (which also happens to be a string).
     * @param {Object} value
     * @returns {Object}
     */
    toStateObject: function( value ) {
      return {};
    },

    /**
     * Decode a string from a state, which is already a string.
     * @param {Object} stateObject
     * @returns {Object}
     */
    fromStateObject: function( stateObject ) {
      return stateObject;
    }
  } );

  tandemNamespace.register( 'GroupIO', GroupIO );

  return GroupIO;
} );