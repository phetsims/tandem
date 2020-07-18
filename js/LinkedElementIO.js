// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO type for LinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import ObjectIO from './types/ObjectIO.js';

class LinkedElementIO extends ObjectIO {

  /**
   * @param {LinkedElement} linkedElement
   * @returns {Object}
   * @override
   * @public
   */
  static toStateObject( linkedElement ) {
    assert && Tandem.VALIDATION && assert( linkedElement.element.isPhetioInstrumented(), 'Linked elements must be instrumented' );
    return { elementID: linkedElement.element.tandem.phetioID };
  }

  /**
   * @param {Object} stateObject
   * @returns {Object}
   * @override
   * @public
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