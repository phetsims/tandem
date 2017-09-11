// Copyright 2016, University of Colorado Boulder

/**
 * TObjectState is used for using the structured cloning algorithm for transmitting data across frames
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );

  function TObjectState() { }

  phetioInherit( window.Object, 'TObjectState', TObjectState, {}, {

    /**
     * Identity function for deserialization.
     * @param {Object} o
     * @returns {Object}
     */
    fromStateObject: function( o ) {
      return o;
    },

    /**
     * Identity function for serialization.
     * @param {Object} o
     * @returns {Object}
     */
    toStateObject: function( o ) {
      return o;
    }
  } );

  phetioNamespace.register( 'TObjectState', TObjectState );

  return TObjectState;
} );