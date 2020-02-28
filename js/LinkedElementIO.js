// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO type for LinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import ObjectIO from './types/ObjectIO.js';

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

tandemNamespace.register( 'LinkedElementIO', LinkedElementIO );
export default LinkedElementIO;