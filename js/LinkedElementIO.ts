// Copyright 2018-2022, University of Colorado Boulder

/**
 * IO Type for LinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';
import StringIO from './types/StringIO.js';

export type LinkedElementState = {
  elementID: string;
};

class LinkedElementIOType extends IOType {
  public override readonly applyState = () => {

    // Linked element state is one-way (written to state but not read back for deserialization).
    // Override this method to avoid crashes for missing linked element state in version migration
  };
}

const LinkedElementIO = new LinkedElementIOType( 'LinkedElementIO', {
  isValidValue: () => true,
  documentation: 'A LinkedElement',
  toStateObject: linkedElement => {
    assert && Tandem.VALIDATION && assert( linkedElement.element.isPhetioInstrumented(), 'Linked elements must be instrumented' );
    return { elementID: linkedElement.element.tandem.phetioID };
  },
  fromStateObject: stateObject => ( {} ),
  stateSchema: {
    elementID: StringIO
  }
} );

tandemNamespace.register( 'LinkedElementIO', LinkedElementIO );
export default LinkedElementIO;