// Copyright 2018-2019, University of Colorado Boulder

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

  class LinkedElementIO extends ObjectIO {

    /**
     * @param {LinkedElement} linkedElement
     * @returns {Object}
     */
    static toStateObject( linkedElement ) {
      assert && assert( linkedElement.element.isPhetioInstrumented(), 'Linked elements must be instrumented' );
      return { elementID: linkedElement.element.tandem.phetioID };
    }

    /**
     * @param {Object} stateObject
     * @returns {Object}
     */
    static fromStateObject( stateObject ) {
      return {};
    }
  }

  LinkedElementIO.documentation = 'A LinkedElement';
  LinkedElementIO.validator = { isValidValue: () => true };
  LinkedElementIO.typeName = 'LinkedElementIO';
  ObjectIO.validateSubtype( LinkedElementIO );

  return tandemNamespace.register( 'LinkedElementIO', LinkedElementIO );
} );