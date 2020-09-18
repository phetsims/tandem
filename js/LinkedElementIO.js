// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for LinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';

const LinkedElementIO = new IOType( 'LinkedElementIO', {
  isValidValue: () => true,
  documentation: 'A LinkedElement',

  // TODO: https://github.com/phetsims/tandem/issues/211 Arrowify
  toStateObject( linkedElement ) {
    assert && Tandem.VALIDATION && assert( linkedElement.element.isPhetioInstrumented(), 'Linked elements must be instrumented' );
    return { elementID: linkedElement.element.tandem.phetioID };
  },
  fromStateObject( stateObject ) {
    return {};
  }
} );

tandemNamespace.register( 'LinkedElementIO', LinkedElementIO );
export default LinkedElementIO;