// Copyright 2016, University of Colorado Boulder

/**
 * IO type for LinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );

  /**
   * @param {LinkedElement} linkedElement
   * @param {string} phetioID
   * @constructor
   */
  function LinkedElementIO( linkedElement, phetioID ) {
    ObjectIO.call( this, linkedElement, phetioID );
  }

  phetioInherit( ObjectIO, 'LinkedElementIO', LinkedElementIO, {}, {
    documentation: 'A LinkedElement',
    validator: { isValidValue: () => true },

    /**
     * @param {LinkedElement} linkedElement
     * @returns {Object}
     */
    toStateObject: function( linkedElement ) {
      return { elementID: linkedElement && linkedElement.element ? linkedElement.element.tandem.phetioID : 'null' };
    },

    /**
     * @param {Object} stateObject
     * @returns {Object}
     */
    fromStateObject: function( stateObject ) {
      return {};
    }
  } );

  tandemNamespace.register( 'LinkedElementIO', LinkedElementIO );

  return LinkedElementIO;
} );